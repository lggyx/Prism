import { Geolocation } from "@capacitor/geolocation";

export type DeviceLocation = {
  latitude?: number;
  longitude?: number;
  accuracyMeters?: number;
};

export async function getCurrentDeviceLocation(): Promise<DeviceLocation> {
  try {
    const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 5000 });
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracyMeters: position.coords.accuracy
    };
  } catch {
    return {};
  }
}
