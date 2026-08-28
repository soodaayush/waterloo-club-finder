import type { MetadataRoute } from "next";
import { getAllOrgs } from "@/lib/getOrgs";
import { getLatestCycle } from "@/lib/orgUtils";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const orgs = getAllOrgs();

  const clubPages = orgs.map((org) => ({
    url: `${SITE_URL}/clubs/${org.slug}`,
    lastModified: getLatestCycle(org).lastVerified,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1,
    },
    {
      url: `${SITE_URL}/contribute`,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    },
    ...clubPages,
  ];
}
