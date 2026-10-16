import { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, X } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export function MealPhotoEntry({
  calories,
  onCaloriesChange,
}: {
  calories: string;
  onCaloriesChange: (value: string) => void;
}) {
  const { t } = useLanguage();
  const [photo, setPhoto] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const upload = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!photo) {
      setUrl("");
      return;
    }
    const objectUrl = URL.createObjectURL(photo);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [photo]);
  function select(file?: File) {
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 10 * 1024 * 1024
    ) {
      setError(t("Choose a JPG, PNG or WebP image up to 10 MB."));
      return;
    }
    setError("");
    setPhoto(file);
  }
  return (
    <div className="space-y-3 rounded-xl border border-primary/25 bg-secondary/40 p-4">
      <p className="font-semibold text-navy">{t("Meal photo & calories")}</p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => upload.current?.click()}>
          <ImagePlus className="h-4 w-4" />
          {t("Upload meal photo")}
        </Button>
        <Button type="button" variant="outline" onClick={() => camera.current?.click()}>
          <Camera className="h-4 w-4" />
          {t("Take photo")}
        </Button>
      </div>
      <input
        ref={upload}
        className="hidden"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-label={t("Upload meal photo")}
        onChange={(e) => {
          select(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <input
        ref={camera}
        className="hidden"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        aria-label={t("Take photo")}
        onChange={(e) => {
          select(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {url && (
        <div className="relative">
          <img
            src={url}
            alt={t("Selected meal photo")}
            className="max-h-64 w-full rounded-lg object-contain bg-card"
            onError={() => {
              setPhoto(null);
              setError(t("This image could not be opened. Try a JPG or PNG."));
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="absolute right-2 top-2 bg-card"
            aria-label={t("Remove photo")}
            onClick={() => setPhoto(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div>
        <Label htmlFor="meal-calories">{t("Calories (kcal, optional)")}</Label>
        <Input
          id="meal-calories"
          type="number"
          min="0"
          max="10000"
          step="1"
          value={calories}
          onChange={(e) => onCaloriesChange(e.target.value)}
          className="mt-1.5 h-12"
          placeholder="450"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {t(
          "Enter calories manually from a food label or your own estimate. Photo analysis is not connected. Photos are previewed only and are not saved or uploaded.",
        )}
      </p>
    </div>
  );
}
