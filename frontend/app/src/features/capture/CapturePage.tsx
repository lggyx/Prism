import { IconCamera, IconMapPin, IconPhotoSensor } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCaptureMutation, useCreateReadingMutation, useLensesQuery } from "../../api/hooks";
import { photoToFile, takePrismPhoto } from "../../capacitor/camera";
import { getCurrentDeviceLocation } from "../../capacitor/location";
import { impactLight } from "../../capacitor/system";
import { PhotoSurface } from "../../components/PhotoSurface";
import { StateBlock } from "../../components/StateBlock";
import { useAppStore } from "../../stores/appStore";
import type { Lens } from "../../schemas/domain";

type CaptureStep = "viewfinder" | "lenses" | "submitting";

export function CapturePage() {
  const navigate = useNavigate();
  const lenses = useLensesQuery();
  const captureMutation = useCaptureMutation();
  const readingMutation = useCreateReadingMutation();
  const setCapture = useAppStore((state) => state.setCapture);
  const setSelectedLens = useAppStore((state) => state.setSelectedLens);
  const setReading = useAppStore((state) => state.setReading);
  const [step, setStep] = useState<CaptureStep>("viewfinder");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const primaryLenses = useMemo(() => lenses.data?.items.slice(0, 6) ?? [], [lenses.data]);

  async function handleCapture() {
    setError(null);
    await impactLight();
    const photo = await takePrismPhoto();
    if (photo) {
      setPhotoFile(await photoToFile(photo));
    } else {
      setPhotoFile(new File([new Blob(["web fallback capture"], { type: "image/jpeg" })], "web-fallback.jpg", { type: "image/jpeg" }));
    }
    setStep("lenses");
  }

  async function handleLens(lens: Lens) {
    setStep("submitting");
    setError(null);
    try {
      const location = await getCurrentDeviceLocation();
      const form = new FormData();
      form.append("image", photoFile ?? new File([new Blob(["web fallback capture"], { type: "image/jpeg" })], "web-fallback.jpg", { type: "image/jpeg" }));
      form.append("capturedAt", new Date().toISOString());
      if (location.latitude) form.append("latitude", String(location.latitude));
      if (location.longitude) form.append("longitude", String(location.longitude));
      if (location.accuracyMeters) form.append("accuracyMeters", String(location.accuracyMeters));

      const capture = await captureMutation.mutateAsync(form);
      const reading = await readingMutation.mutateAsync({ captureId: capture.id, lensId: lens.id });
      setCapture(capture);
      setSelectedLens(lens);
      setReading({ ...reading, captureId: capture.id, lens });
      navigate("/result");
    } catch (event) {
      setError(event instanceof Error ? event.message : "Capture failed");
      setStep("lenses");
    }
  }

  return (
    <section className={`capture-flow step-${step}`}>
      <PhotoSurface />
      <header className="capture-hud">
        <span><IconMapPin size={14} /> GPS READY</span>
        <span>F1.8 / ISO AUTO</span>
      </header>

      {step === "viewfinder" ? (
        <div className="shutter-deck">
          <button className="shutter-button" onClick={handleCapture}>
            <IconCamera size={28} />
          </button>
          <p>按下快门，进入镜片选择。</p>
        </div>
      ) : null}

      {step === "lenses" ? (
        <div className="lens-sheet">
          <p className="eyebrow">SELECT LENS</p>
          <h1>选择一种观看方式</h1>
          {lenses.error ? <StateBlock tone="error" title="LENSES OFFLINE" body={lenses.error.message} /> : null}
          {error ? <p className="form-error">{error}</p> : null}
          <div className="lens-options">
            {primaryLenses.map((lens) => (
              <button key={lens.id} className="lens-option" onClick={() => handleLens(lens)} style={{ "--lens": lens.color } as React.CSSProperties}>
                <span className="lens-dot" />
                <strong>{lens.name}</strong>
                <small>{lens.englishName}</small>
                <p>{lens.description}</p>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {step === "submitting" ? (
        <div className="capture-overlay">
          <StateBlock title="OPENING READING" body="上传拍摄资产并创建 AI 重述任务。" />
        </div>
      ) : null}

      <div className="camera-preview-note"><IconPhotoSensor size={14} /> Camera Preview upgrade point reserved</div>
    </section>
  );
}
