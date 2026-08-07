import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import {
  AssetCategory,
  CommercialStream,
  CustomerType,
  CylinderOwnership,
  CylinderStatus,
  ProductCategory,
  ProjectStatus,
  ProjectType,
  SalesChannel,
  StationStatus,
  UserRole,
  WarehouseType,
  WorkflowEntityType,
  IoTDeviceType,
  IoTDeviceStatus,
} from '../common/enums';
import { AccessoryStock } from '../accessories/accessory-stock.entity';
import { ChannelPrice } from '../accessories/channel-price.entity';
import { ProductBundleItem } from '../accessories/product-bundle-item.entity';
import { ProductBundle } from '../accessories/product-bundle.entity';
import { BudgetLine } from '../finance/budget-line.entity';
import { FranchiseAgreement } from '../franchise/franchise-agreement.entity';
import { Asset } from '../maintenance/asset.entity';
import { PaycCreditTransaction } from '../payc/payc-credit-transaction.entity';
import { PaycMeter } from '../payc/payc-meter.entity';
import { PaycTelemetry } from '../payc/payc-telemetry.entity';
import { CapitalProject } from '../projects/capital-project.entity';
import { ProjectMilestone } from '../projects/project-milestone.entity';
import { Customer } from '../customers/customer.entity';
import { Cylinder } from '../cylinders/cylinder.entity';
import { Tank } from '../tanks/tank.entity';
import { asDecimal, toNumber } from '../common/decimal';
import { PriceList } from '../pricing/price-list.entity';
import { Product } from '../products/product.entity';
import { Station } from '../stations/station.entity';
import { Supplier } from '../suppliers/supplier.entity';
import { User } from '../users/user.entity';
import { WorkflowDefinition } from '../workflows/workflow-definition.entity';
import { WorkflowStep } from '../workflows/workflow-step.entity';
import { IoTDevice } from '../iot/iot-device.entity';

const STATIONS = [
  {
    code: 'SAL-01',
    name: 'Salima Central',
    district: 'Salima',
    tankCapacityKg: 10000,
    currentStockKg: 4200,
  },
  {
    code: 'LLW-01',
    name: 'Lilongwe Area 25',
    district: 'Lilongwe',
    tankCapacityKg: 15000,
    currentStockKg: 7800,
  },
  {
    code: 'LLW-02',
    name: 'Lilongwe Kawale',
    district: 'Lilongwe',
    tankCapacityKg: 12000,
    currentStockKg: 6100,
  },
  {
    code: 'LLW-03',
    name: 'Lilongwe Area 3',
    district: 'Lilongwe',
    tankCapacityKg: 12000,
    currentStockKg: 5400,
  },
  {
    code: 'BT-01',
    name: 'Blantyre Chichiri',
    district: 'Blantyre',
    tankCapacityKg: 18000,
    currentStockKg: 9200,
  },
  {
    code: 'BT-02',
    name: 'Blantyre Limbe',
    district: 'Blantyre',
    tankCapacityKg: 15000,
    currentStockKg: 7100,
  },
  {
    code: 'BT-03',
    name: 'Blantyre Ndirande',
    district: 'Blantyre',
    tankCapacityKg: 10000,
    currentStockKg: 3900,
  },
  {
    code: 'BT-04',
    name: 'Blantyre Zingwangwa',
    district: 'Blantyre',
    tankCapacityKg: 10000,
    currentStockKg: 4500,
  },
];

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Station) private readonly stationsRepo: Repository<Station>,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(Supplier) private readonly suppliersRepo: Repository<Supplier>,
    @InjectRepository(Product) private readonly productsRepo: Repository<Product>,
    @InjectRepository(Customer) private readonly customersRepo: Repository<Customer>,
    @InjectRepository(Cylinder) private readonly cylindersRepo: Repository<Cylinder>,
    @InjectRepository(Tank) private readonly tanksRepo: Repository<Tank>,
    @InjectRepository(PriceList) private readonly pricesRepo: Repository<PriceList>,
    @InjectRepository(ProductBundle)
    private readonly bundlesRepo: Repository<ProductBundle>,
    @InjectRepository(ProductBundleItem)
    private readonly bundleItemsRepo: Repository<ProductBundleItem>,
    @InjectRepository(ChannelPrice)
    private readonly channelPricesRepo: Repository<ChannelPrice>,
    @InjectRepository(AccessoryStock)
    private readonly accessoryStockRepo: Repository<AccessoryStock>,
    @InjectRepository(PaycMeter)
    private readonly paycRepo: Repository<PaycMeter>,
    @InjectRepository(PaycTelemetry)
    private readonly paycTelemetryRepo: Repository<PaycTelemetry>,
    @InjectRepository(PaycCreditTransaction)
    private readonly paycCreditRepo: Repository<PaycCreditTransaction>,
    @InjectRepository(BudgetLine)
    private readonly budgetRepo: Repository<BudgetLine>,
    @InjectRepository(Asset)
    private readonly assetsRepo: Repository<Asset>,
    @InjectRepository(CapitalProject)
    private readonly projectsRepo: Repository<CapitalProject>,
    @InjectRepository(ProjectMilestone)
    private readonly milestonesRepo: Repository<ProjectMilestone>,
    @InjectRepository(FranchiseAgreement)
    private readonly franchiseRepo: Repository<FranchiseAgreement>,
    @InjectRepository(WorkflowDefinition)
    private readonly workflowDefsRepo: Repository<WorkflowDefinition>,
    @InjectRepository(WorkflowStep)
    private readonly workflowStepsRepo: Repository<WorkflowStep>,
    @InjectRepository(IoTDevice)
    private readonly iotDevicesRepo: Repository<IoTDevice>,
  ) {}

  async onModuleInit() {
    const count = await this.stationsRepo.count();
    if (count === 0) {
      await this.seed();
      return;
    }
    const bundleCount = await this.bundlesRepo.count();
    const stations = await this.stationsRepo.find();
    if (bundleCount === 0) {
      await this.seedCharterExtensions(stations);
    } else {
      this.logger.log('Database already seeded');
    }
    await this.seedPhase23Extensions(stations);
    await this.seedPhase3Automation(stations);
    await this.ensureTierBTanks(stations);
  }

  async seed() {
    this.logger.log('Seeding Haroti Holdings demo data...');

    const stations = await this.stationsRepo.save(
      STATIONS.map((s) =>
        this.stationsRepo.create({
          code: s.code,
          name: s.name,
          district: s.district,
          address: `${s.name}, ${s.district}, Malawi`,
          managerName: `${s.district} Manager`,
          tankCapacityKg: s.tankCapacityKg.toFixed(3),
          currentStockKg: s.currentStockKg.toFixed(3),
          status: StationStatus.ACTIVE,
          openingTime: '07:00:00',
          closingTime: '18:00:00',
          lastSyncedAt: new Date(),
        }),
      ),
    );

    const passwordHash = await bcrypt.hash('Password123!', 10);

    const users = [
      {
        username: 'admin',
        fullName: 'System Administrator',
        role: UserRole.SYSTEM_ADMIN,
        stationId: null as string | null,
        canOverridePrice: true,
        discountLimitPercent: '100',
      },
      {
        username: 'director',
        fullName: 'Haroti Director',
        role: UserRole.DIRECTOR,
        stationId: null,
        canOverridePrice: true,
        discountLimitPercent: '50',
      },
      {
        username: 'ops.manager',
        fullName: 'Operations Manager',
        role: UserRole.OPERATIONS_MANAGER,
        stationId: null,
        canOverridePrice: true,
        discountLimitPercent: '20',
      },
      {
        username: 'finance',
        fullName: 'Finance Manager',
        role: UserRole.FINANCE_MANAGER,
        stationId: null,
        canOverridePrice: false,
        discountLimitPercent: '0',
      },
      {
        username: 'llw01.manager',
        fullName: 'LLW-01 Station Manager',
        role: UserRole.STATION_MANAGER,
        stationId: stations.find((s) => s.code === 'LLW-01')!.id,
        canOverridePrice: false,
        discountLimitPercent: '5',
      },
      {
        username: 'llw01.attendant',
        fullName: 'LLW-01 Attendant',
        role: UserRole.ATTENDANT,
        stationId: stations.find((s) => s.code === 'LLW-01')!.id,
        canOverridePrice: false,
        discountLimitPercent: '0',
      },
      {
        username: 'bt01.manager',
        fullName: 'BT-01 Station Manager',
        role: UserRole.STATION_MANAGER,
        stationId: stations.find((s) => s.code === 'BT-01')!.id,
        canOverridePrice: false,
        discountLimitPercent: '5',
      },
      {
        username: 'bt01.attendant',
        fullName: 'BT-01 Attendant',
        role: UserRole.ATTENDANT,
        stationId: stations.find((s) => s.code === 'BT-01')!.id,
        canOverridePrice: false,
        discountLimitPercent: '0',
      },
      {
        username: 'sal01.attendant',
        fullName: 'SAL-01 Attendant',
        role: UserRole.ATTENDANT,
        stationId: stations.find((s) => s.code === 'SAL-01')!.id,
        canOverridePrice: false,
        discountLimitPercent: '0',
      },
      {
        username: 'storekeeper',
        fullName: 'Central Storekeeper',
        role: UserRole.STOREKEEPER,
        stationId: stations.find((s) => s.code === 'LLW-01')!.id,
        canOverridePrice: false,
        discountLimitPercent: '0',
      },
      {
        username: 'safety',
        fullName: 'Safety Officer',
        role: UserRole.SAFETY_OFFICER,
        stationId: null,
        canOverridePrice: false,
        discountLimitPercent: '0',
      },
      {
        username: 'auditor',
        fullName: 'Internal Auditor',
        role: UserRole.AUDITOR,
        stationId: null,
        canOverridePrice: false,
        discountLimitPercent: '0',
      },
    ];

    await this.usersRepo.save(
      users.map((u) =>
        this.usersRepo.create({
          ...u,
          username: u.username.toLowerCase(),
          email: `${u.username}@haroti.mw`,
          phone: '+265999000000',
          passwordHash,
          isActive: true,
        }),
      ),
    );

    await this.suppliersRepo.save([
      this.suppliersRepo.create({
        code: 'SUP-001',
        name: 'National Petroleum LPG',
        phone: '+265991111111',
        depotName: 'Lilongwe Depot',
        address: 'Kanengo Industrial Area',
      }),
      this.suppliersRepo.create({
        code: 'SUP-002',
        name: 'Southern Gas Distributors',
        phone: '+265992222222',
        depotName: 'Blantyre Depot',
        address: 'Makata Industrial Area',
      }),
    ]);

    const cylinderSizes = [3, 5, 6, 9, 12, 14, 19, 45];
    await this.productsRepo.save([
      this.productsRepo.create({
        sku: 'LPG-KG',
        name: 'LPG Refill (per kg)',
        category: ProductCategory.LPG_REFILL,
        unitPrice: '0',
        pricePerKg: '1850.00',
      }),
      ...cylinderSizes.map((size) =>
        this.productsRepo.create({
          sku: `CYL-${size}KG`,
          name: `${size} kg Cylinder Refill`,
          category: ProductCategory.LPG_REFILL,
          unitPrice: (size * 1850).toFixed(2),
          pricePerKg: '1850.00',
          nominalKg: size.toFixed(3),
        }),
      ),
      this.productsRepo.create({
        sku: 'REG-STD',
        name: 'Standard Regulator',
        category: ProductCategory.ACCESSORY,
        unitPrice: '8500.00',
      }),
      this.productsRepo.create({
        sku: 'HOSE-1.5M',
        name: 'LPG Hose 1.5m',
        category: ProductCategory.ACCESSORY,
        unitPrice: '4500.00',
      }),
      this.productsRepo.create({
        sku: 'BURNER-STD',
        name: 'Single Burner Stove',
        category: ProductCategory.ACCESSORY,
        unitPrice: '22000.00',
      }),
      this.productsRepo.create({
        sku: 'VALVE-STD',
        name: 'Cylinder Valve',
        category: ProductCategory.ACCESSORY,
        unitPrice: '12000.00',
      }),
    ]);

    await this.pricesRepo.save(
      this.pricesRepo.create({
        stationId: null,
        pricePerKg: '1850.00',
        effectiveFrom: new Date('2026-01-01'),
        isActive: true,
        notes: 'National standard LPG price',
      }),
    );

    const walkIn = await this.customersRepo.save(
      this.customersRepo.create({
        customerCode: 'WALK-IN',
        fullName: 'Walk-in Customer',
        type: CustomerType.HOUSEHOLD,
        phone: 'N/A',
      }),
    );

    await this.customersRepo.save([
      this.customersRepo.create({
        customerCode: 'COM-001',
        fullName: 'Capital Hotel Restaurant',
        type: CustomerType.COMMERCIAL,
        phone: '+265993333333',
        location: 'Lilongwe City Centre',
        creditLimit: '500000.00',
        paymentTermsDays: 30,
        contractPricePerKg: '1750.00',
        stationId: stations.find((s) => s.code === 'LLW-01')!.id,
      }),
      this.customersRepo.create({
        customerCode: 'COM-002',
        fullName: 'Queen Elizabeth Hospital',
        type: CustomerType.INSTITUTIONAL,
        phone: '+265994444444',
        location: 'Blantyre',
        creditLimit: '1000000.00',
        paymentTermsDays: 45,
        contractPricePerKg: '1700.00',
        stationId: stations.find((s) => s.code === 'BT-01')!.id,
      }),
      this.customersRepo.create({
        customerCode: 'HH-001',
        fullName: 'Grace Phiri',
        type: CustomerType.HOUSEHOLD,
        phone: '+265995555555',
        location: 'Area 25, Lilongwe',
        stationId: stations.find((s) => s.code === 'LLW-01')!.id,
      }),
    ]);

    let cylIndex = 1;
    for (const station of stations) {
      for (const size of [6, 9, 12, 19]) {
        for (let i = 0; i < 3; i++) {
          await this.cylindersRepo.save(
            this.cylindersRepo.create({
              serialNumber: `HH-${station.code}-${String(cylIndex).padStart(4, '0')}`,
              barcode: `QR${String(cylIndex).padStart(8, '0')}`,
              sizeKg: size.toFixed(3),
              manufacturer: 'Haroti Cylinders',
              manufacturingDate: '2023-06-01',
              lastInspectionDate: '2025-12-01',
              nextInspectionDate: '2026-12-01',
              ownership: CylinderOwnership.COMPANY,
              status: i % 2 === 0 ? CylinderStatus.AVAILABLE : CylinderStatus.EMPTY,
              depositValue: (size * 5000).toFixed(2),
              stationId: station.id,
            }),
          );
          cylIndex += 1;
        }
      }
    }

    this.logger.log(
      `Seed complete: ${stations.length} stations, walk-in customer ${walkIn.customerCode}`,
    );
    this.logger.log('Default password for all users: Password123!');
    await this.seedCharterExtensions(stations);
    await this.seedPhase23Extensions(stations);
    await this.seedPhase3Automation(stations);
    await this.ensureTierBTanks(stations);
  }

  async ensureTierBTanks(stations: Station[]) {
    for (const station of stations) {
      const exists = await this.tanksRepo.findOne({
        where: { stationId: station.id },
      });
      if (exists) continue;

      await this.tanksRepo.save(
        this.tanksRepo.create({
          tankCode: `${station.code}-TK1`,
          name: `${station.name} Bulk Tank`,
          stationId: station.id,
          capacityKg: asDecimal(toNumber(station.tankCapacityKg)),
          safeWorkingCapacityKg: asDecimal(toNumber(station.tankCapacityKg) * 0.9),
          currentStockKg: station.currentStockKg,
        }),
      );
    }
  }

  async seedCharterExtensions(stations: Station[]) {
    this.logger.log('Seeding Haroti Gas ERP charter extensions...');

    const central = stations.find((s) => s.code === 'LLW-01')!;
    await this.stationsRepo.update(central.id, {
      warehouseType: WarehouseType.CENTRAL_DEPOT,
      commercialStream: CommercialStream.ACCESSORIES,
    });
    const franchise = stations.find((s) => s.code === 'BT-02');
    if (franchise) {
      await this.stationsRepo.update(franchise.id, {
        isFranchise: true,
        warehouseType: WarehouseType.FRANCHISE_OUTLET,
        commercialStream: CommercialStream.FRANCHISE,
      });
    }

    const accessories = await this.productsRepo.find({
      where: { category: ProductCategory.ACCESSORY },
    });
    const accessoryUpdates: Record<string, Partial<Product>> = {
      'REG-STD': { barcode: '8901000010001', costPrice: '6200.00', serialTracked: false, batchTracked: true },
      'HOSE-1.5M': { barcode: '8901000010002', costPrice: '3100.00', batchTracked: true },
      'BURNER-STD': { barcode: '8901000010003', costPrice: '16500.00', serialTracked: true },
      'VALVE-STD': { barcode: '8901000010004', costPrice: '8900.00', batchTracked: true },
    };
    for (const p of accessories) {
      const patch = accessoryUpdates[p.sku];
      if (patch) await this.productsRepo.update(p.id, patch);
    }

    const extraProducts = [
      { sku: 'REG-HP', name: 'High-Pressure Regulator', price: 12500, cost: 9200, barcode: '8901000010005' },
      { sku: 'LEAK-DET', name: 'Gas Leak Detector', price: 18500, cost: 14000, barcode: '8901000010006', serial: true },
      { sku: 'METER-PAYC', name: 'PAYC Smart Meter', price: 85000, cost: 62000, barcode: '8901000010007', serial: true },
      { sku: 'BURNER-DBL', name: 'Double Burner Stove', price: 32000, cost: 24000, barcode: '8901000010008' },
      { sku: 'CLAMP-PR', name: 'Hose Clamps (pair)', price: 1500, cost: 800, barcode: '8901000010009', batch: true },
    ];
    for (const ep of extraProducts) {
      const exists = await this.productsRepo.findOne({ where: { sku: ep.sku } });
      if (!exists) {
        await this.productsRepo.save(
          this.productsRepo.create({
            sku: ep.sku,
            name: ep.name,
            category: ProductCategory.ACCESSORY,
            unitPrice: ep.price.toFixed(2),
            costPrice: ep.cost.toFixed(2),
            barcode: ep.barcode,
            serialTracked: ep.serial ?? false,
            batchTracked: ep.batch ?? false,
          }),
        );
      }
    }

    const allAccessories = await this.productsRepo.find({
      where: { category: ProductCategory.ACCESSORY },
    });

    for (const product of allAccessories) {
      for (const [channel, factor] of [
        [SalesChannel.RETAIL_LIST, 1],
        [SalesChannel.WHOLESALE, 0.85],
        [SalesChannel.FRANCHISE_PURCHASE, 0.9],
        [SalesChannel.AGENT_COMMISSION, 1],
      ] as const) {
        const exists = await this.channelPricesRepo.findOne({
          where: { productId: product.id, channel },
        });
        if (!exists) {
          await this.channelPricesRepo.save(
            this.channelPricesRepo.create({
              productId: product.id,
              channel,
              unitPrice: (Number(product.unitPrice) * factor).toFixed(2),
              commissionPercent: channel === SalesChannel.AGENT_COMMISSION ? '8.00' : '0',
            }),
          );
        }
      }
    }

    for (const station of stations.slice(0, 4)) {
      for (const product of allAccessories.slice(0, 6)) {
        const exists = await this.accessoryStockRepo.findOne({
          where: { stationId: station.id, productId: product.id },
        });
        if (!exists) {
          await this.accessoryStockRepo.save(
            this.accessoryStockRepo.create({
              stationId: station.id,
              productId: product.id,
              quantity: 15 + Math.floor(Math.random() * 20),
              reorderLevel: 5,
            }),
          );
        }
      }
    }

    const reg = allAccessories.find((p) => p.sku === 'REG-STD');
    const hose = allAccessories.find((p) => p.sku === 'HOSE-1.5M');
    const burner = allAccessories.find((p) => p.sku === 'BURNER-DBL') ?? allAccessories.find((p) => p.sku === 'BURNER-STD');
    const clamp = allAccessories.find((p) => p.sku === 'CLAMP-PR');

    if (reg && hose && burner && clamp) {
      const bundleExists = await this.bundlesRepo.findOne({ where: { sku: 'KIT-HOME-STD' } });
      if (!bundleExists) {
        const bundle = await this.bundlesRepo.save(
          this.bundlesRepo.create({
            sku: 'KIT-HOME-STD',
            name: 'Standard Home Starter Kit',
            description: '6kg cylinder refill + regulator + hose + clamps + double burner',
            bundlePrice: '89500.00',
          }),
        );
        await this.bundleItemsRepo.save([
          { bundleId: bundle.id, productId: reg.id, quantity: 1 },
          { bundleId: bundle.id, productId: hose.id, quantity: 1 },
          { bundleId: bundle.id, productId: burner.id, quantity: 1 },
          { bundleId: bundle.id, productId: clamp.id, quantity: 1 },
        ].map((i) => this.bundleItemsRepo.create(i)));
      }
    }

    const paycCount = await this.paycRepo.count();
    if (paycCount === 0) {
      const households = await this.customersRepo.find({ take: 3 });
      await this.paycRepo.save([
        this.paycRepo.create({
          meterSerial: 'PAYC-LLW-001',
          imei: '359012345678901',
          customerId: households[0]?.id,
          stationId: central.id,
          creditBalanceKg: '2.500',
          deferredRevenue: '4625.00',
          dailyBurnKg: '0.350',
          location: 'Area 25, Lilongwe',
          cylinderSerial: 'HH-LLW-01-0001',
        }),
        this.paycRepo.create({
          meterSerial: 'PAYC-LLW-002',
          imei: '359012345678902',
          customerId: households[1]?.id,
          stationId: central.id,
          creditBalanceKg: '0.400',
          deferredRevenue: '740.00',
          dailyBurnKg: '0.280',
          location: 'Kawale, Lilongwe',
        }),
        this.paycRepo.create({
          meterSerial: 'PAYC-BT-001',
          imei: '359012345678903',
          stationId: stations.find((s) => s.code === 'BT-01')!.id,
          creditBalanceKg: '5.100',
          deferredRevenue: '9435.00',
          dailyBurnKg: '0.420',
          location: 'Chichiri, Blantyre',
        }),
      ]);
    }

    const budgetCount = await this.budgetRepo.count();
    if (budgetCount === 0) {
      const year = new Date().getFullYear();
      const month = new Date().getMonth() + 1;
      await this.budgetRepo.save([
        { category: 'Retail LPG Sales', commercialStream: CommercialStream.RETAIL_FORECOURT, fiscalYear: year, fiscalMonth: month, budgetAmount: '15000000.00' },
        { category: 'Accessory Merchandising', commercialStream: CommercialStream.ACCESSORIES, fiscalYear: year, fiscalMonth: month, budgetAmount: '3500000.00' },
        { category: 'PAYC Revenue', commercialStream: CommercialStream.PAYC, fiscalYear: year, fiscalMonth: month, budgetAmount: '2000000.00' },
        { category: 'Wholesale Bulk', commercialStream: CommercialStream.BULK_WHOLESALE, fiscalYear: year, fiscalMonth: month, budgetAmount: '8000000.00' },
      ].map((b) => this.budgetRepo.create(b)));
    }

    this.logger.log('Charter ERP extensions seeded');
  }

  async seedPhase23Extensions(stations: Station[]) {
    this.logger.log('Seeding Phase 2/3 (PAYC telemetry, CMMS assets, projects, franchise)...');

    const central = stations.find((s) => s.code === 'LLW-01')!;
    const franchiseStation = stations.find((s) => s.code === 'BT-02');
    const bt03 = stations.find((s) => s.code === 'BT-03');

    const assetCount = await this.assetsRepo.count();
    if (assetCount === 0) {
      await this.assetsRepo.save([
        {
          assetCode: 'TK-LLW-01',
          name: 'Bulk LPG Storage Tank 15T',
          category: AssetCategory.STATION_EQUIPMENT,
          stationId: central.id,
          acquisitionCost: '45000000.00',
          commissionedAt: '2022-06-01',
          nextServiceDate: '2026-12-01',
        },
        {
          assetCode: 'COMP-LLW-01',
          name: 'LPG Compressor Unit',
          category: AssetCategory.STATION_EQUIPMENT,
          stationId: central.id,
          acquisitionCost: '8200000.00',
          commissionedAt: '2023-01-15',
        },
        {
          assetCode: 'DISP-BT-02',
          name: 'Forecourt Dispenser #1',
          category: AssetCategory.STATION_EQUIPMENT,
          stationId: franchiseStation?.id,
          acquisitionCost: '3500000.00',
          commissionedAt: '2024-03-01',
        },
      ].map((a) => this.assetsRepo.create(a)));
    }

    const meters = await this.paycRepo.find();
    const telemetryCount = await this.paycTelemetryRepo.count();
    if (telemetryCount === 0 && meters.length) {
      const now = new Date();
      for (const meter of meters.slice(0, 2)) {
        for (let d = 6; d >= 0; d--) {
          const ts = new Date(now);
          ts.setDate(ts.getDate() - d);
          await this.paycTelemetryRepo.save(
            this.paycTelemetryRepo.create({
              meterId: meter.id,
              recordedAt: ts,
              creditRemainingKg: (Number(meter.creditBalanceKg) + d * 0.05).toFixed(3),
              burnKg: meter.dailyBurnKg,
              valveOpen: true,
            }),
          );
        }
      }
    }

    const projectCount = await this.projectsRepo.count();
    if (projectCount === 0 && bt03) {
      const project = await this.projectsRepo.save(
        this.projectsRepo.create({
          projectCode: 'CAP-BT03-2026',
          name: 'Ndirande Depot Tank Upgrade',
          type: ProjectType.CAPEX_STATION,
          status: ProjectStatus.IN_PROGRESS,
          commercialStream: CommercialStream.RETAIL_FORECOURT,
          stationId: bt03.id,
          approvedBudget: '28000000.00',
          spentToDate: '8450000.00',
          grantReference: 'AFDB-LPG-2025-04',
          startDate: '2026-01-15',
          targetEndDate: '2026-09-30',
        }),
      );
      await this.milestonesRepo.save([
        {
          projectId: project.id,
          name: 'Civil works & foundation',
          dueDate: '2026-03-31',
          budgetAllocation: '6000000.00',
          isCompleted: true,
        },
        {
          projectId: project.id,
          name: 'Tank installation & piping',
          dueDate: '2026-06-30',
          budgetAllocation: '15000000.00',
        },
        {
          projectId: project.id,
          name: 'Commissioning & safety sign-off',
          dueDate: '2026-09-15',
          budgetAllocation: '7000000.00',
        },
      ].map((m) => this.milestonesRepo.create(m)));
    }

    if (franchiseStation) {
      const agreementExists = await this.franchiseRepo.findOne({
        where: { agreementCode: 'FA-BT02-LIMBE' },
      });
      if (!agreementExists) {
        await this.franchiseRepo.save(
          this.franchiseRepo.create({
            agreementCode: 'FA-BT02-LIMBE',
            franchiseName: 'Limbe Gas Partners Ltd',
            stationId: franchiseStation.id,
            royaltyPercent: '5.00',
            agentCommissionPercent: '8.00',
            consignmentEnabled: true,
            contactPhone: '+265991234567',
            effectiveFrom: '2025-01-01',
          }),
        );
      }
    }

    const agentExists = await this.customersRepo.findOne({
      where: { customerCode: 'AGT-001' },
    });
    if (!agentExists && franchiseStation) {
      await this.customersRepo.save(
        this.customersRepo.create({
          customerCode: 'AGT-001',
          fullName: 'James Phiri (Field Agent)',
          type: CustomerType.AGENT,
          phone: '+265888123456',
          stationId: franchiseStation.id,
          creditLimit: '0.00',
          outstandingBalance: '0.00',
        }),
      );
    }

    this.logger.log('Phase 2/3 extensions seeded');
  }

  async seedPhase3Automation(stations: Station[]) {
    const wfCount = await this.workflowDefsRepo.count();
    if (wfCount === 0) {
      this.logger.log('Seeding Phase 3 automation (workflows, IoT devices)...');
      const expenseWf = await this.workflowDefsRepo.save(
        this.workflowDefsRepo.create({
          name: 'Expense approval chain',
          entityType: WorkflowEntityType.EXPENSE,
          minAmount: '50000',
          isActive: true,
        }),
      );
      await this.workflowStepsRepo.save([
        this.workflowStepsRepo.create({
          definitionId: expenseWf.id,
          stepOrder: 1,
          approverRole: UserRole.STATION_MANAGER,
          escalationHours: 24,
          fallbackRole: UserRole.FINANCE_MANAGER,
        }),
        this.workflowStepsRepo.create({
          definitionId: expenseWf.id,
          stepOrder: 2,
          approverRole: UserRole.FINANCE_MANAGER,
          escalationHours: 48,
          fallbackRole: UserRole.DIRECTOR,
        }),
      ]);
    }

    const iotCount = await this.iotDevicesRepo.count();
    if (iotCount === 0 && stations.length) {
      const tanks = await this.tanksRepo.find({ take: 3 });
      for (let i = 0; i < Math.min(stations.length, 3); i++) {
        const station = stations[i];
        const tank = tanks.find((t) => t.stationId === station.id) ?? tanks[0];
        await this.iotDevicesRepo.save(
          this.iotDevicesRepo.create({
            deviceKey: `TANK-${station.code}`,
            name: `${station.code} level sensor`,
            type: IoTDeviceType.TANK_LEVEL,
            status: IoTDeviceStatus.ACTIVE,
            stationId: station.id,
            tankId: tank?.id,
          }),
        );
      }
      this.logger.log('Phase 3 IoT devices seeded');
    }
  }
}
