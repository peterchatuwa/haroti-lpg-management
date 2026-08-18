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
  ): Promise<{ rows: ZhongyiArchiveRow[]; pageTotal: number }> {
    const cfg = await this.getVendorConfig();
    const response = await this.call<ZhongyiArchiveRow>(
      'zlMeter',
      'getAreaArchives',
      {
        energyType: 'GAS',
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
    const first = await this.getAreaArchives(1, pageSize);
    const all = [...first.rows];
    for (let page = 2; page <= first.pageTotal; page++) {
      const next = await this.getAreaArchives(page, pageSize);
      all.push(...next.rows);
    }
    return all;
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
      const first = await this.getAreaArchives(1, 1);
      return {
        ok: true,
        areaName: cfg.areaName,
        meterCount: first.pageTotal,
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
    payload: Record<string, string | number>,
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
