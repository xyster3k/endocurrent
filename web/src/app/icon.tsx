import { ImageResponse } from "next/og";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Force dynamic rendering so the icon updates when settings change
export const dynamic = "force-dynamic";
export const contentType = "image/png";
export const size = { width: 180, height: 180 };

// Default icon URL (EndoCurrent icon from Supabase)
const DEFAULT_ICON =
  "https://nrirqijyayrwhckmjltn.supabase.co/storage/v1/object/public/site-assets/endocurrent%20icon.png";

async function getSiteIconUrl(): Promise<string> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return DEFAULT_ICON;
  }

  try {
    const supabase = await createSupabaseServerClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from("site_settings")
      .select("value")
      .eq("key", "site_icon_url")
      .maybeSingle();

    const iconUrl = data?.value;

    if (iconUrl && typeof iconUrl === "string" && iconUrl.trim()) {
      return iconUrl;
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
