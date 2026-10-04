/** Shared client-side helpers for the owner's picture and video editors. */

export interface VideoEdits {
  trimStart: number;
  /** null means "play to the end". */
  trimEnd: number | null;
  muted: boolean;
}

export const DEFAULT_VIDEO_EDITS: VideoEdits = { trimStart: 0, trimEnd: null, muted: false };

export function formatClock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

export function clipLength(edits: VideoEdits, duration: number): number {
  const end = edits.trimEnd ?? duration;
  return Math.max(0, end - edits.trimStart);
}

export function hasVideoEdits(edits: VideoEdits, duration: number): boolean {
  return edits.trimStart > 0.05 || (edits.trimEnd !== null && edits.trimEnd < duration - 0.05) || edits.muted;
}

/** Canvas size for a crop frame, keeping the long edge at `longEdge`. */
export function frameSize(aspect: number, longEdge: number): { width: number; height: number } {
  if (aspect >= 1) return { width: longEdge, height: Math.round(longEdge / aspect) };
  return { width: Math.round(longEdge * aspect), height: longEdge };
}

/** Natural aspect-aware frame size for "original" cropping. */
export function naturalFrame(naturalWidth: number, naturalHeight: number, longEdge: number): { width: number; height: number } {
  const ratio = naturalWidth / naturalHeight;
  return frameSize(ratio, longEdge);
}

export function canvasToFile(canvas: HTMLCanvasElement, name: string, mime: string, quality = 0.92): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("The edited image could not be created."));
          return;
        }
        resolve(new File([blob], name, { type: blob.type || mime }));
      },
      mime,
      quality
    );
  });
}

export function editedFileName(original: string, mime: string): string {
  const extension = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
  const base = original.replace(/\.[a-z0-9]{1,8}$/i, "").replace(/[^\w\-. ]+/g, "").trim() || "image";
  return `${base}-edited.${extension}`;
}

export function posterFileName(original: string): string {
  const base = original.replace(/\.[a-z0-9]{1,8}$/i, "").replace(/[^\w\-. ]+/g, "").trim() || "video";
  return `${base}-poster.jpg`;
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

export function isVideoFile(file: File): boolean {
  return file.type.startsWith("video/");
}

export function isEditableImage(name: string, mime: string): boolean {
  return mime.startsWith("image/") || /\.(png|jpe?g|webp|gif|avif)$/i.test(name);
}

export function isEditableVideo(name: string, mime: string): boolean {
  return mime.startsWith("video/") || /\.(mp4|webm|mov|m4v|ogv)$/i.test(name);
}
