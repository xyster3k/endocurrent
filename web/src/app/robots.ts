import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/sign-in", "/sign-up"],
      },
    ],
    sitemap: "https://endocurrent.com/sitemap.xml",
  };
}
