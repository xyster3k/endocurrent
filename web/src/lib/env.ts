import { z } from "zod";

const clientSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  NEXT_PUBLIC_ADSENSE_CLIENT: z.string().optional(),
});

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_JWT_SECRET: z.string().optional(),
  AI_DRAFT_API_URL: z.string().optional(),
  AI_DRAFT_API_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  ADS_DISABLED: z.string().optional(),
});

const parsedClient = clientSchema.safeParse(process.env);
const parsedServer = serverSchema.safeParse(process.env);

if (!parsedClient.success && process.env.NODE_ENV !== "production") {
  console.warn("Missing/invalid public env vars", parsedClient.error.flatten());
}

if (!parsedServer.success && process.env.NODE_ENV !== "production") {
  console.warn("Missing/invalid server env vars", parsedServer.error.flatten());
}

const client = parsedClient.success
  ? parsedClient.data
  : {
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
    };

export const env = {
  ...client,
  ...((parsedServer.success && parsedServer.data) || {}),
  adsDisabled:
    ((parsedServer.success && parsedServer.data.ADS_DISABLED) || "").toLowerCase() ===
    "true",
  siteUrl: new URL(client.NEXT_PUBLIC_SITE_URL),
};
