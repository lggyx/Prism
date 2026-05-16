import { Device } from "@capacitor/device";

export async function resolveDeviceId() {
  try {
    const id = await Device.getId();
    return id.identifier;
  } catch {
    return null;
  }
}
