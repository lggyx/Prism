import { Capacitor } from "@capacitor/core";

export function isNativePlatform() {
  return Capacitor.isNativePlatform();
}

export function getPlatformName() {
  return Capacitor.getPlatform();
}
