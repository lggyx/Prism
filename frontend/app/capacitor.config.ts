import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.prism.worldviewlens",
  appName: "世界观透镜",
  webDir: "dist",
  server: {
    cleartext: true,
    androidScheme: "http"
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: "#09090b"
    },
    StatusBar: {
      backgroundColor: "#09090b",
      style: "DARK"
    }
  }
};

export default config;
