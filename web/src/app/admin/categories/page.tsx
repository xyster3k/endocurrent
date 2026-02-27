"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/hooks/use-auth";
import { Upload, X, GripVertical, ImageIcon } from "lucide-react";

type Category = {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  order_index: number;
};

export default function AdminCategoriesPage() {
  const { user, profile, loading } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((r) => r.data && setCategories(r.data))
      .catch(() => setError("Failed to load categories"));
  }, [user]);

  if (loading) return <div className="mx-auto max-w-4xl px-6 py-12">Loading...</div>;
  if (!user || !["editor", "admin"].includes(profile?.role ?? "")) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-3xl font-semibold">Unauthorized</h1>
        <p className="mt-2 text-foreground/60">You need editor or admin access.</p>
      </div>
    );
  }

  async function handleImageUpload(categoryId: string, file: File) {
    setUploading(categoryId);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/upload/image", { method: "POST", body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || "Upload failed");

      const patchRes = await fetch("/api/admin/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: categoryId, image_url: uploadData.url }),
      });
      const patchData = await patchRes.json();
      if (!patchRes.ok) throw new Error(patchData.error || "Save failed");

      setCategories((prev) =>
        prev.map((c) => (c.id === categoryId ? { ...c, image_url: uploadData.url } : c))
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(null);
    }
  }

  async function handleRemoveImage(categoryId: string) {
    setSaving(categoryId);
    setError("");
    try {
      const res = await fetch("/api/admin/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: categoryId, image_url: null }),
      });
      if (!res.ok) throw new Error("Failed to remove image");
      setCategories((prev) =>
        prev.map((c) => (c.id === categoryId ? { ...c, image_url: null } : c))
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-foreground/40">
            Admin / Categories
          </p>
          <h1 className="text-3xl font-semibold">Category backgrounds</h1>
          <p className="mt-1 text-foreground/60">
            Upload background images for homepage category sections.
          </p>
        </div>
        <Link href="/admin" className="nav-link">
          &larr; Back
        </Link>
      </div>

      {error && (
        <div className="border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {categories.map((cat) => (
          <CategoryRow
            key={cat.id}
            category={cat}
            uploading={uploading === cat.id}
            saving={saving === cat.id}
            onUpload={(file) => handleImageUpload(cat.id, file)}
            onRemove={() => handleRemoveImage(cat.id)}
          />
        ))}

        {categories.length === 0 && !error && (
          <p className="py-8 text-center text-foreground/40">
            No categories found. Run the migration SQL first.
          </p>
        )}
      </div>
    </div>
  );
}

function CategoryRow({
  category,
  uploading,
  saving,
  onUpload,
  onRemove,
}: {
  category: Category;
  uploading: boolean;
  saving: boolean;
  onUpload: (file: File) => void;
  onRemove: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-4 border border-border bg-card p-4">
      <GripVertical className="h-4 w-4 flex-shrink-0 text-foreground/20" />

      {/* Preview */}
      <div className="relative h-16 w-24 flex-shrink-0 overflow-hidden border border-border bg-background">
        {category.image_url ? (
          <Image
            src={category.image_url}
            alt={category.name}
            fill
            className="object-cover"
            sizes="96px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon className="h-6 w-6 text-foreground/20" />
          </div>
        )}
      </div>

      {/* Name */}
      <div className="flex-1">
        <p className="font-semibold">{category.name}</p>
        <p className="font-mono text-xs text-foreground/40">{category.slug}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {category.image_url && (
          <button
            onClick={onRemove}
            disabled={saving}
            className="border border-border px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-foreground/60 transition hover:bg-foreground/5 disabled:opacity-50"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
            e.target.value = "";
          }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 border border-foreground px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition hover:bg-foreground hover:text-background disabled:opacity-50"
        >
          <Upload className="h-3.5 w-3.5" />
          {uploading ? "Uploading..." : category.image_url ? "Replace" : "Upload"}
        </button>
      </div>
    </div>
  );
}
