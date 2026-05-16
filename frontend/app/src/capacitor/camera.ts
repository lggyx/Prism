import { Camera, CameraResultType, CameraSource, type Photo } from "@capacitor/camera";

export async function takePrismPhoto(): Promise<Photo | null> {
  try {
    return await Camera.getPhoto({
      quality: 88,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      saveToGallery: false,
      width: 1600
    });
  } catch {
    return null;
  }
}

export async function photoToFile(photo: Photo): Promise<File> {
  if (photo.webPath) {
    const response = await fetch(photo.webPath);
    const blob = await response.blob();
    return new File([blob], `prism-${Date.now()}.${photo.format || "jpeg"}`, { type: blob.type || "image/jpeg" });
  }
  return new File([new Blob(["prism-native-photo"], { type: "image/jpeg" })], `prism-${Date.now()}.jpg`, { type: "image/jpeg" });
}

export function cameraPreviewUpgradeNote() {
  return "Camera Preview upgrade point: replace takePrismPhoto with @capacitor-community/camera-preview while keeping capture upload contract unchanged.";
}
