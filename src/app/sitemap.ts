import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return [
    {
      url: `${baseUrl}/en`,
      priority: 1,
      changeFrequency: "weekly",
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/ru`,
      priority: 0.9,
      changeFrequency: "weekly",
      lastModified: new Date(),
    },
  ];
}
