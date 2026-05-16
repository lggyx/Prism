import type { CSSProperties } from "react";
import type { Annotation } from "../schemas/domain";

type PhotoSurfaceProps = {
  annotations?: Annotation[];
  compact?: boolean;
  imageUrl?: string;
};

export function PhotoSurface({ annotations = [], compact = false, imageUrl }: PhotoSurfaceProps) {
  return (
    <div className={`photo-surface ${compact ? "compact" : ""}`}>
      {imageUrl ? <img src={imageUrl} alt="" /> : null}
      <div className="synthetic-scene" />
      <div className="reticle-lines" />
      {annotations.map((annotation, index) => (
        <div
          key={annotation.id || `${annotation.text}-${index}`}
          className="field-annotation"
          style={{
            "--x": `${annotation.target.x * 100}%`,
            "--y": `${annotation.target.y * 100}%`,
            "--delay": `${index * 120}ms`
          } as CSSProperties}
        >
          <span className="point" />
          <span className="line" />
          <span className="label">{annotation.text}</span>
        </div>
      ))}
    </div>
  );
}
