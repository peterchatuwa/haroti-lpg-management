import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface ZhongyiResponse<T = unknown> {
  errcode: string;
  errmsg: string;
  value?: T;
  values?: T[];
  data?: T;
  pageInfo?: {
    pageTotal: number;
    pageNumber: number;
    pageSize: number;
  };
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
}

@Injectable()
export class ZhongyiMeterClient {
  private readonly logger = new Logger(ZhongyiMeterClient.name);
  private readonly baseUrl: string;
  private readonly username: string;
  private readonly password: string;
  private readonly areaId: string;
  private readonly equipmentModelId: string;
  private apiToken?: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl =
      config.get('ZHONGYI_API_URL') ||
      'http://en.energy.zhongyismart.com/api/commonInternal.jsp';
    this.username = config.get('ZHONGYI_USERNAME') || '';
    this.password = config.get('ZHONGYI_PASSWORD') || '';
    this.areaId = config.get('ZHONGYI_AREA_ID') || '';
    this.equipmentModelId = config.get('ZHONGYI_EQUIPMENT_MODEL_ID') || '';
  }

  get enabled(): boolean {
    return Boolean(this.username && this.password);
  }

  async login(): Promise<string> {
    const response = await this.call<{ apiToken: string }>(
      'zlMeter',
      'toLogin',
      {
        username: this.username,
        password: this.password,
      },
      false,
    );
    const token = response.value?.apiToken;
    if (!token) {
      throw new Error('Zhongyi login failed: no apiToken returned');
    }
    this.apiToken = token;
    return token;
  }

  private async ensureToken(): Promise<string> {
    if (this.apiToken) return this.apiToken;
    return this.login();
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

  async getAreaArchives(pageNumber = 1, pageSize = 100): Promise<ZhongyiArchiveRow[]> {
    const response = await this.call<ZhongyiArchiveRow>(
      'zlMeter',
      'getAreaArchives',
      {
        energyType: 'GAS',
        pageNumber: String(pageNumber),
        pageSize: String(pageSize),
        areaId: this.areaId,
        searchContent: '',
        sysconfigEquipmentId: this.equipmentModelId,
      },
      true,
      'params',
    );
    return response.values ?? [];
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
