import { DeviceStatus } from "./types";

export class DeviceApi {
  private baseUrl: string;

  constructor(ipAddress: string) {
    // Strip trailing slash and ensure http://
    let cleanIp = ipAddress.replace(/\/$/, "");
    if (!cleanIp.startsWith("http://") && !cleanIp.startsWith("https://")) {
      cleanIp = `http://${cleanIp}`;
    }
    this.baseUrl = cleanIp;
  }

  private async fetchApi(path: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
        // timeout could be added here in a typical app
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`DeviceApi error on ${path}:`, error);
      throw error;
    }
  }

  async getStatus(): Promise<DeviceStatus> {
    return this.fetchApi("/api/status");
  }

  async setRelay(index: number, state: boolean): Promise<void> {
    await this.fetchApi(`/api/relay?id=${index}&state=${state ? 1 : 0}`);
  }

  async setAllRelays(state: boolean): Promise<void> {
    await this.fetchApi(`/api/all?state=${state ? 1 : 0}`);
  }

  async setVariasi(mode: number): Promise<void> {
    await this.fetchApi(`/api/variasi?mode=${mode}`);
  }
}
