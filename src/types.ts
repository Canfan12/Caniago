export type RelayState = [boolean, boolean, boolean, boolean];

export interface SensorData {
  time: string;
  temp: number;
  hum: number;
}

export interface DeviceStatus {
  temp: number;
  hum: number;
  relays: RelayState;
  mode: number;
  error?: string;
}
