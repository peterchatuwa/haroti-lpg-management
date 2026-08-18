import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface ZhongyiResponse<T = unknown> {
  errcode: string;
  errmsg: string;
  value?: T;
  values?: T[];
  data?: T;
  valueId?: string;
  pageInfo?: {
    pageTotal: number;
    pageNumber: number;
    pageSize: number;
  };
}

export interface ZhongyiLoginValue {
  apiToken: string;
  username?: string;
  name?: string;
  manageArea?: Array<{
    areaId: number;
    areaName?: string;
    areaSerialnumber?: string;
  }>;
  equipmentModel?: Array<{
    sysconfigEquipmentId: number;
    equipmentModelName?: string;
  }>;
}

export interface ZhongyiRealtimeData {
  balance: number;
  battery?: string;
  nbonetNetImei: string;
  readTime?: string;
  cumulantFlow?: string;
  valve?: number;
  customerName?: string;
  customerPhone?: string;
}

export interface ZhongyiArchiveRow {
  id: number;
  customerName: string;
  serialnumber: string;
  IMEI: string;
  readings: string;
  valveStatus: number;
  balance: number;
  phone?: string;
  areaOrgName?: string;
  areaOrgId?: number;
}

export interface ZhongyiValveRecord {
  id: number;
  imei?: string;
  dateTime?: string;
  resultInfo?: string;
  status?: string;
  valueId?: number;
}

export interface ZhongyiCommandInfo {
  state?: number;
  errmsg?: string;
  baseObject?: Record<string, unknown>;
  jsonParse?: Record<string, unknown>;
}

export interface ZhongyiHistoryReading {
  readTime?: string;
  consumption?: number;
  reading?: string;
  deveui?: string;
}

export interface ZhongyiArchiveDetail {
  id?: number;
  customerName?: string;
  serialnumber?: string;
  IMEI?: string;
  readings?: string;
  valveStatus?: number;
  balance?: number;
  phone?: string;
  areaOrgName?: string;
}

export interface ZhongyiVendorConfig {
  areaId: string;
  areaName?: string;
  equipmentModelId: string;
  equipmentModelName?: string;
}

@Injectable()
export class ZhongyiMeterClient {
  private readonly logger = new Logger(ZhongyiMeterClient.name);
  private readonly baseUrl: string;
  private readonly username: string;
  private readonly password: string;
  private apiToken?: string;
  private vendorConfig?: ZhongyiVendorConfig;

  constructor(private readonly config: ConfigService) {
    this.baseUrl =
      config.get('ZHONGYI_API_URL') ||
      'http://en.energy.zhongyismart.com/api/commonInternal.jsp';
    this.username = config.get('ZHONGYI_USERNAME') || '';
    this.password = config.get('ZHONGYI_PASSWORD') || '';
  }

  get enabled(): boolean {
    return Boolean(this.username && this.password);
  }

  async login(): Promise<ZhongyiLoginValue> {
    const response = await this.call<ZhongyiLoginValue>(
      'zlMeter',
      'toLogin',
      {
        username: this.username,
        password: this.password,
      },
      false,
    );
    const value = response.value;
    if (!value?.apiToken) {
      throw new Error('Zhongyi login failed: no apiToken returned');
    }
    this.apiToken = value.apiToken;
    this.vendorConfig = this.resolveVendorConfig(value);
    return value;
  }

  private resolveVendorConfig(login: ZhongyiLoginValue): ZhongyiVendorConfig {
    const envAreaId = this.config.get('ZHONGYI_AREA_ID')?.trim();
    const envEquipmentId = this.config.get('ZHONGYI_EQUIPMENT_MODEL_ID')?.trim();

    const area =
      login.manageArea?.find((a) => String(a.areaId) === envAreaId) ??
      login.manageArea?.[0];
    const equipment =
      login.equipmentModel?.find(
        (e) => String(e.sysconfigEquipmentId) === envEquipmentId,
      ) ?? login.equipmentModel?.[0];

    if (!area?.areaId) {
      throw new Error(
        'Zhongyi login returned no manageable area — check ZHONGYI_AREA_ID or account permissions',
      );
    }
    if (!equipment?.sysconfigEquipmentId) {
      throw new Error(
        'Zhongyi login returned no equipment model — check ZHONGYI_EQUIPMENT_MODEL_ID',
      );
    }

    return {
      areaId: envAreaId || String(area.areaId),
      areaName: area.areaName,
      equipmentModelId:
        envEquipmentId || String(equipment.sysconfigEquipmentId),
      equipmentModelName: equipment.equipmentModelName,
    };
  }

  async getVendorConfig(): Promise<ZhongyiVendorConfig> {
    if (this.vendorConfig) return this.vendorConfig;
    await this.login();
    return this.vendorConfig!;
  }

  private async ensureToken(): Promise<string> {
    if (this.apiToken) return this.apiToken;
    const login = await this.login();
    return login.apiToken;
  }

  async queryRealTimeData(imei: string): Promise<ZhongyiRealtimeData> {
    const response = await this.call<ZhongyiRealtimeData>(
      'zlMeter',
      'queryRealTimeData',
      { nbonetNetImei: imei },
      true,
      'param',
    );
    if (!response.data) {
      throw new Error(`Zhongyi realtime data missing for IMEI ${imei}`);
    }
    return response.data;
  }

  async getAreaArchives(
    pageNumber = 1,
    pageSize = 100,
    energyType = 'LIQUEFIEDGAS',
  ): Promise<{ rows: ZhongyiArchiveRow[]; pageTotal: number }> {
    const cfg = await this.getVendorConfig();
    const response = await this.call<ZhongyiArchiveRow>(
      'zlMeter',
      'getAreaArchives',
      {
        energyType,
        pageNumber: String(pageNumber),
        pageSize: String(pageSize),
        areaId: cfg.areaId,
        searchContent: '',
        sysconfigEquipmentId: cfg.equipmentModelId,
      },
      true,
      'params',
    );
    return {
      rows: response.values ?? [],
      pageTotal: response.pageInfo?.pageTotal ?? 1,
    };
  }

  async getAllAreaArchives(): Promise<ZhongyiArchiveRow[]> {
    const pageSize = 100;
    const byImei = new Map<string, ZhongyiArchiveRow>();

    for (const energyType of ['LIQUEFIEDGAS', 'GAS'] as const) {
      const first = await this.getAreaArchives(1, pageSize, energyType);
      for (const row of first.rows) {
        const key = row.IMEI?.trim() || row.serialnumber?.trim();
        if (key) byImei.set(key, row);
      }
      for (let page = 2; page <= first.pageTotal; page++) {
        const next = await this.getAreaArchives(page, pageSize, energyType);
        for (const row of next.rows) {
          const key = row.IMEI?.trim() || row.serialnumber?.trim();
          if (key) byImei.set(key, row);
        }
      }
    }

    return [...byImei.values()];
  }

  async remotelyTopUp(
    imei: string,
    amountMwk: number,
  ): Promise<{ orderId?: string; errmsg: string }> {
    const response = await this.call<{ orderId?: string }>(
      'zlMeter',
      'remotelyTopUp',
      {
        nbonetNetImei: imei,
        topUpAmount: String(amountMwk),
        topUpToDeviceAmount: String(amountMwk),
      },
      true,
      'param',
    );
    return { orderId: response.value?.orderId, errmsg: response.errmsg };
  }

  async setValveState(
    imei: string,
    valveState: 0 | 1,
  ): Promise<{ valueId?: string; errmsg: string }> {
    const response = await this.call<unknown>(
      'zlMeter',
      'setValveState',
      {
        nbonetNetImei: imei,
        valveState: String(valveState),
      },
      true,
      'param',
    );
    return { valueId: response.valueId, errmsg: response.errmsg };
  }

  async readValveStatus(
    imei: string,
  ): Promise<{ valveStatus?: string; nbonetNetImei?: string }> {
    const response = await this.call<{ valveStatus?: string; nbonetNetImei?: string }>(
      'zlMeter',
      'readValveStatus',
      { nbonetNetImei: imei },
      true,
      'param',
    );
    return response.data ?? {};
  }

  async getAreaArchiveInfo(imei: string): Promise<ZhongyiArchiveDetail> {
    const response = await this.call<ZhongyiArchiveDetail>(
      'zlMeter',
      'getAreaArchiveInfo',
      { nbonetNetImei: imei },
      true,
      'param',
    );
    if (!response.value) {
      throw new Error(`Zhongyi archive info missing for IMEI ${imei}`);
    }
    return response.value;
  }

  async getValveRecords(
    imei: string,
    pageNumber = 1,
    pageSize = 20,
  ): Promise<{ rows: ZhongyiValveRecord[]; pageTotal: number }> {
    const response = await this.call<ZhongyiValveRecord>(
      'zlMeter',
      'getValverecord',
      {
        pageNumber: String(pageNumber),
        pageSize: String(pageSize),
        nbonetNetImei: imei,
        startDate: '',
        endDate: '',
      },
      true,
      'param',
    );
    return {
      rows: response.values ?? [],
      pageTotal: response.pageInfo?.pageTotal ?? 1,
    };
  }

  async sendCommand(
    imei: string,
    commandStr: 'queryFlowAndStatus' | 'queryBattery',
  ): Promise<{ valueId?: string; errmsg: string }> {
    const response = await this.call<unknown>(
      'zlMeter',
      'sendCommand',
      {
        nbonetNetImei: imei,
        commandStr,
        commandParams: {},
      },
      true,
      'param',
    );
    return { valueId: response.valueId, errmsg: response.errmsg };
  }

  async queryCommandInfo(valueId: string): Promise<ZhongyiCommandInfo> {
    const response = (await this.call<unknown>(
      'zlMeter',
      'queryCommandInfo',
      { valueId },
      true,
      'param',
    )) as ZhongyiResponse<unknown> & ZhongyiCommandInfo;
    return {
      state: response.state,
      errmsg: response.errmsg,
      baseObject: response.baseObject,
      jsonParse: response.jsonParse,
    };
  }

  async queryHistoryMeterReading(
    imei: string,
    startDate?: string,
    endDate?: string,
  ): Promise<ZhongyiHistoryReading[]> {
    const response = await this.call<ZhongyiHistoryReading[]>(
      'zlMeter',
      'queryHistoryMeterReading',
      {
        nbonetNetImei: imei,
        startDate: startDate ?? '',
        endDate: endDate ?? '',
      },
      true,
      'param',
    );
    return Array.isArray(response.data) ? response.data : [];
  }

  async queryAllMeterCurrentReading(imeis: string[]): Promise<
    Array<{
      imei?: string;
      customerName?: string;
      reading?: string;
      valveState?: number;
    }>
  > {
    if (!imeis.length) return [];
    const response = await this.call<
      Array<{
        imei?: string;
        customerName?: string;
        reading?: string;
        valveState?: number;
      }>
    >(
      'zlMeter',
      'queryAllMeterCurrentReading',
      { nbonetNetImeis: imeis.join(',') },
      true,
      'param',
    );
    return response.data ?? [];
  }

  async queryDailyConsumption(
    imeis: string[],
    date?: string,
  ): Promise<Array<{ nbonetNetImei: string; consumption: number; readTime: string }>> {
    const response = await this.call<
      Array<{ nbonetNetImei: string; consumption: number; readTime: string }>
    >(
      'zlMeter',
      'queryAllDailyConsumption',
      {
        nbonetNetImeis: imeis.join(','),
        date: date ?? '',
      },
      true,
      'param',
    );
    return response.data ?? [];
  }

  async ping(): Promise<{ ok: boolean; areaName?: string; meterCount?: number }> {
    if (!this.enabled) return { ok: false };
    try {
      const cfg = await this.getVendorConfig();
      const archives = await this.getAllAreaArchives();
      return {
        ok: true,
        areaName: cfg.areaName,
        meterCount: archives.length,
      };
    } catch (err) {
      this.logger.warn(
        `Zhongyi ping failed: ${err instanceof Error ? err.message : 'unknown'}`,
      );
      return { ok: false };
    }
  }

  private async call<T>(
    action: string,
    method: string,
    payload: Record<string, unknown>,
    withToken: boolean,
    bodyKey: 'param' | 'params' = 'params',
  ): Promise<ZhongyiResponse<T>> {
    const apiToken = withToken ? await this.ensureToken() : undefined;
    const requestParams: Record<string, unknown> = { action, method };
    if (apiToken) requestParams.apiToken = apiToken;
    requestParams[bodyKey] = payload;

    const body = new URLSearchParams({
      requestParams: JSON.stringify(requestParams),
    });

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!response.ok) {
      throw new Error(`Zhongyi HTTP ${response.status}`);
    }

    const json = (await response.json()) as ZhongyiResponse<T>;
    if (json.errcode !== '0') {
      this.logger.warn(`Zhongyi ${method} failed: ${json.errmsg}`);
      throw new Error(`Zhongyi API error: ${json.errmsg}`);
    }
    return json;
  }
}
