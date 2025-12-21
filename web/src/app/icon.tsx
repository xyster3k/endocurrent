import { ImageResponse } from "next/og";

export const runtime = "edge";
export const contentType = "image/png";
export const size = { width: 180, height: 180 };

// Default icon URL (EndoCurrent icon from Supabase)
const DEFAULT_ICON = "https://nrirqijyayrwhckmjltn.supabase.co/storage/v1/object/public/site-assets/endocurrent%20icon.png";

async function getSiteIconUrl(): Promise<string> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/settings/icon`, {
      next: { revalidate: 60 }, // Cache for 60 seconds
    });
    if (res.ok) {
      const data = await res.json();
      if (data.url) return data.url;
    }
  } catch {
    // Fall back to default
  }
  return DEFAULT_ICON;
}

export default async function Icon() {
  const iconUrl = await getSiteIconUrl();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={iconUrl}
          alt="Site Icon"
          width={180}
          height={180}
          style={{ objectFit: "contain" }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
