"use client";

import { useRef, useState } from "react";
import { Link2, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AdminImageFieldProps {
  id: string;
  value: string;
  required?: boolean;
  bucket?: string;
  onChange: (url: string) => void;
}

export function AdminImageField({
  id,
  value,
  required,
  bucket = "gallery",
  onChange,
}: AdminImageFieldProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function onFileSelected(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file (JPG, PNG, WebP, GIF, SVG).");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image must be under 8 MB.");
      return;
    }

    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("bucket", bucket);
      const res = await fetch("/api/admin/upload/", { method: "POST", body });
      const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !json.url) {
        toast.error(json.error || "Upload failed");
        return;
      }
      onChange(json.url);
      toast.success("Image uploaded");
    } catch {
      toast.error("Network error while uploading");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          {uploading ? "Uploading…" : "Choose file"}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
          className="hidden"
          onChange={(event) => onFileSelected(event.target.files?.[0] || null)}
        />
      </div>

      <div className="relative">
        <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          type="url"
          required={required && !value}
          placeholder="Or paste an image link (https://…)"
          className="pl-9"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>

      {value ? (
        <div className="relative h-28 w-full max-w-xs overflow-hidden rounded-lg border border-border bg-slate-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Preview" className="h-full w-full object-contain p-2" />
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground">
          Upload a file or paste a public image URL. Preview appears after either option.
        </p>
      )}
    </div>
  );
}
