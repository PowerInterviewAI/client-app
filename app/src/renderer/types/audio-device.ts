export interface AudioDevice {
  name: string;
  index: number;
  /**
   * Underlying MediaDeviceInfo.deviceId.
   * Optional for backward compatibility with existing code.
   */
  deviceId?: string;
}
