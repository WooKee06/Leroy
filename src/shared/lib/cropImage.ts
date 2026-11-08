export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () =>
      reject(new Error("Не удалось загрузить изображение")),
    );
    image.src = src;
  });
}

export async function cropImageToFile(
  src: string,
  area: CropArea,
  outputWidth: number,
  quality = 0.92,
): Promise<File> {
  if (area.width <= 0 || area.height <= 0) {
    throw new Error("Область обрезки пустая");
  }

  const image = await loadImage(src);

  const scale = outputWidth / area.width;
  const width = Math.max(1, Math.round(area.width * scale));
  const height = Math.max(1, Math.round(area.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas не поддерживается браузером");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    image,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    width,
    height,
  );

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/webp", quality);
  });

  if (!blob) throw new Error("Не удалось обработать изображение");

  const extension = blob.type === "image/png" ? "png" : "webp";
  return new File([blob], `image-${Date.now()}.${extension}`, {
    type: blob.type,
  });
}
