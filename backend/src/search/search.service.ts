import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StationScopeService } from '../auth/station-scope.service';
import { JwtPayload } from '../auth/jwt-payload';
import { UserRole } from '../common/enums';
import { Cylinder } from '../cylinders/cylinder.entity';
import { Customer } from '../customers/customer.entity';
import { JournalEntry } from '../finance/journal-entry.entity';
import { MaintenanceWorkOrder } from '../maintenance/work-order.entity';
import { PurchaseOrder } from '../procurement/purchase-order.entity';
import { Sale } from '../sales/sale.entity';
import { Station } from '../stations/station.entity';
import { Supplier } from '../suppliers/supplier.entity';

export type SearchResultType =
  | 'customer'
  | 'sale'
  | 'cylinder'
  | 'purchase_order'
  | 'supplier'
  | 'journal'
  | 'work_order'
  | 'station';

export interface SearchResult {
  type: SearchResultType;
  id: string;
  label: string;
  subtitle: string;
  path: string;
}

const FINANCE_ROLES = new Set<UserRole>([
  UserRole.SYSTEM_ADMIN,
  UserRole.DIRECTOR,
  UserRole.FINANCE_MANAGER,
  UserRole.AUDITOR,
]);

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Customer)
    private readonly customersRepo: Repository<Customer>,
    @InjectRepository(Sale)
    private readonly salesRepo: Repository<Sale>,
    @InjectRepository(Cylinder)
    private readonly cylindersRepo: Repository<Cylinder>,
    @InjectRepository(PurchaseOrder)
    private readonly poRepo: Repository<PurchaseOrder>,
    @InjectRepository(Supplier)
    private readonly suppliersRepo: Repository<Supplier>,
    @InjectRepository(JournalEntry)
    private readonly journalsRepo: Repository<JournalEntry>,
    @InjectRepository(MaintenanceWorkOrder)
    private readonly woRepo: Repository<MaintenanceWorkOrder>,
    @InjectRepository(Station)
    private readonly stationsRepo: Repository<Station>,
    private readonly stationScope: StationScopeService,
  ) {}

  async search(
    user: JwtPayload,
    query: string,
    limit = 20,
  ): Promise<{ query: string; results: SearchResult[] }> {
    const q = query.trim();
    if (q.length < 2) {
      return { query: q, results: [] };
    }

    const term = `%${q}%`;
    const stationId = this.stationScope.resolveStationFilter(user);
    const perType = Math.max(3, Math.ceil(limit / 4));
    const results: SearchResult[] = [];

    const customers = await this.customersRepo
      .createQueryBuilder('c')
      .where(
        '(c.full_name ILIKE :term OR c.customer_code ILIKE :term OR c.phone ILIKE :term)',
        { term },
      )
      .andWhere(stationId ? 'c.station_id = :stationId' : '1=1', { stationId })
      .orderBy('c.full_name', 'ASC')
      .take(perType)
      .getMany();

    for (const c of customers) {
      results.push({
        type: 'customer',
        id: c.id,
        label: c.fullName,
        subtitle: `${c.customerCode}${c.phone ? ` · ${c.phone}` : ''}`,
        path: `/customers/${c.id}`,
      });
    }

    const sales = await this.salesRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.station', 'station')
      .leftJoinAndSelect('s.customer', 'customer')
      .where('s.receipt_number ILIKE :term', { term })
      .andWhere(stationId ? 's.station_id = :stationId' : '1=1', { stationId })
      .orderBy('s.sold_at', 'DESC')
      .take(perType)
      .getMany();

    for (const s of sales) {
      results.push({
        type: 'sale',
        id: s.id,
        label: s.receiptNumber,
        subtitle: `${s.station?.code ?? ''} · ${Number(s.totalAmount).toLocaleString()} MWK${s.customer ? ` · ${s.customer.fullName}` : ''}`,
        path: s.customerId ? `/customers/${s.customerId}` : '/finance',
      });
    }

    const cylinders = await this.cylindersRepo
      .createQueryBuilder('cyl')
      .leftJoinAndSelect('cyl.station', 'station')
      .where('(cyl.serial_number ILIKE :term OR cyl.barcode ILIKE :term)', {
        term,
      })
      .andWhere(stationId ? 'cyl.station_id = :stationId' : '1=1', {
        stationId,
      })
      .orderBy('cyl.serial_number', 'ASC')
      .take(perType)
      .getMany();

    for (const cyl of cylinders) {
      results.push({
        type: 'cylinder',
        id: cyl.id,
        label: cyl.serialNumber,
        subtitle: `${cyl.sizeKg} kg · ${cyl.status}${cyl.station ? ` · ${cyl.station.code}` : ''}`,
        path: `/cylinders?serial=${encodeURIComponent(cyl.serialNumber)}`,
      });
    }

    const pos = await this.poRepo
      .createQueryBuilder('po')
      .leftJoinAndSelect('po.supplier', 'supplier')
      .leftJoinAndSelect('po.destinationStation', 'station')
      .where('po.po_number ILIKE :term', { term })
      .andWhere(stationId ? 'po.destination_station_id = :stationId' : '1=1', {
        stationId,
      })
      .orderBy('po.created_at', 'DESC')
      .take(perType)
      .getMany();

    for (const po of pos) {
      results.push({
        type: 'purchase_order',
        id: po.id,
        label: po.poNumber,
        subtitle: `${po.status} · ${po.supplier?.name ?? 'Supplier'}${po.destinationStation ? ` · ${po.destinationStation.code}` : ''}`,
        path: '/procurement',
      });
    }

    const suppliers = await this.suppliersRepo
      .createQueryBuilder('sup')
      .where(
        '(sup.code ILIKE :term OR sup.name ILIKE :term OR sup.phone ILIKE :term)',
        {
          term,
        },
      )
      .andWhere('sup.is_active = true')
      .orderBy('sup.name', 'ASC')
      .take(perType)
      .getMany();

    for (const sup of suppliers) {
      results.push({
        type: 'supplier',
        id: sup.id,
        label: sup.name,
        subtitle: sup.code,
        path: '/procurement',
      });
    }

    if (FINANCE_ROLES.has(user.role)) {
      const journals = await this.journalsRepo
        .createQueryBuilder('j')
        .where('(j.entry_number ILIKE :term OR j.description ILIKE :term)', {
          term,
        })
        .orderBy('j.posted_at', 'DESC')
        .take(perType)
        .getMany();

      for (const j of journals) {
        results.push({
          type: 'journal',
          id: j.id,
          label: j.entryNumber,
          subtitle: `${j.eventType} · ${j.description.slice(0, 60)}`,
          path: '/finance',
        });
      }
    }

    const workOrders = await this.woRepo
      .createQueryBuilder('wo')
      .leftJoinAndSelect('wo.station', 'station')
      .where('(wo.wo_number ILIKE :term OR wo.title ILIKE :term)', { term })
      .andWhere(stationId ? 'wo.station_id = :stationId' : '1=1', { stationId })
      .orderBy('wo.created_at', 'DESC')
      .take(perType)
      .getMany();

    for (const wo of workOrders) {
      results.push({
        type: 'work_order',
        id: wo.id,
        label: wo.woNumber,
        subtitle: `${wo.title} · ${wo.status}${wo.station ? ` · ${wo.station.code}` : ''}`,
        path: '/maintenance',
      });
    }

    if (!stationId) {
      const stations = await this.stationsRepo
        .createQueryBuilder('st')
        .where(
          '(st.code ILIKE :term OR st.name ILIKE :term OR st.district ILIKE :term)',
          { term },
        )
        .orderBy('st.code', 'ASC')
        .take(perType)
        .getMany();

      for (const st of stations) {
        results.push({
          type: 'station',
          id: st.id,
          label: `${st.code} · ${st.name}`,
          subtitle: st.district,
          path: `/stations/${st.id}`,
        });
      }
    }

    return { query: q, results: results.slice(0, limit) };
  }
}
