"use client";

import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  description?: string;
}

export function ImageUpload({ value, onChange, label, description }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const data = await res.json();
      onChange(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
          {label}
        </label>
      )}
      {description && (
        <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
      )}

      {value ? (
        <div className="relative group">
          <div className="relative aspect-square w-full max-w-xs overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
            <Image
              src={value}
              alt="Cover image"
              fill
              className="object-cover"
              sizes="384px"
            />
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="absolute right-2 top-2 rounded-full bg-rose-600 p-2 text-white opacity-0 transition group-hover:opacity-100 hover:bg-rose-700"
            title="Remove image"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 transition hover:border-blue-400 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-blue-600 dark:hover:bg-slate-700",
            uploading && "pointer-events-none opacity-50"
          )}
        >
          {uploading ? (
            <>
              <Upload className="h-8 w-8 animate-pulse text-blue-600 dark:text-blue-400" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Uploading...</p>
            </>
          ) : (
            <>
              <ImageIcon className="h-8 w-8 text-slate-400 dark:text-slate-500" />
              <div className="text-center">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  Click to upload cover image
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  PNG, JPG, WebP up to 5MB
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Recommended: 400x400px square
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
