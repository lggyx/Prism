import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Network } from "@capacitor/network";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";
import { isNativePlatform } from "./platform";

export async function setupNativeChrome(theme: "night" | "light") {
  if (!isNativePlatform()) return;
  await SplashScreen.hide().catch(() => undefined);
  await StatusBar.setStyle({ style: theme === "night" ? Style.Dark : Style.Light }).catch(() => undefined);
  await StatusBar.setBackgroundColor({ color: theme === "night" ? "#09090b" : "#f9f9ff" }).catch(() => undefined);
}

export async function impactLight() {
  if (!isNativePlatform()) return;
  await Haptics.impact({ style: ImpactStyle.Light }).catch(() => undefined);
}

export async function getNetworkStatus() {
  return Network.getStatus().catch(() => ({ connected: true, connectionType: "unknown" as const }));
}
