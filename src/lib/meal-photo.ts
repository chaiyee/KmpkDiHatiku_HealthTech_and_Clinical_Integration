import { analysisSchema, validateMealImage } from "./meals";
import { supabase } from "@/integrations/supabase/client";

export async function prepareMealPhoto(file: File): Promise<{ preview: string; image: string }> {
  const header = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (!validateMealImage(file, header)) throw new Error("image");
  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width * bitmap.height > 40000000) throw new Error("image");
    const ratio = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * ratio);
    canvas.height = Math.round(bitmap.height * ratio);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("image");
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const image = canvas.toDataURL("image/jpeg", 0.8);
    if (image.length > 2700000) throw new Error("image");
    return { preview: image, image };
  } finally {
    bitmap.close();
  }
}
export async function analyseMealPhoto(
  image: string,
  language: "en" | "ms" | "zh",
  context: string,
) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("signin");
  const response = await fetch("/api/meal-analysis", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ image, language, context, consent: true }),
    signal: AbortSignal.timeout(55000),
    cache: "no-store",
  });
  const result = await response.json();
  if (!response.ok) throw new Error(typeof result.error === "string" ? result.error : "analysis");
  return analysisSchema.parse(result.analysis);
}
