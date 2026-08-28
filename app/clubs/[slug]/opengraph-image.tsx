import { ImageResponse } from "next/og";
import { getAllOrgs, getOrgBySlug } from "@/lib/getOrgs";
import { STATUS_PHRASE, effectiveStatus, getLatestCycle } from "@/lib/orgUtils";
import { SITE_NAME } from "@/lib/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Keep the status phrase on the share card in sync with the page.
export const revalidate = 3600;

export function generateStaticParams() {
  return getAllOrgs().map((org) => ({ slug: org.slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const org = getOrgBySlug(slug);
  const name = org?.name ?? SITE_NAME;
  const phrase = org ? STATUS_PHRASE[effectiveStatus(getLatestCycle(org))] : "";
  const description = org?.description ?? "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0a0a0a",
          color: "#ededed",
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              background: "#facc15",
              color: "#171717",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "26px",
              fontWeight: 700,
            }}
          >
            W
          </div>
          <div style={{ display: "flex", fontSize: "26px", color: "#a1a1a1" }}>
            {SITE_NAME}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "flex", fontSize: "64px", fontWeight: 700 }}>
            {name}
          </div>
          {phrase ? (
            <div
              style={{ display: "flex", fontSize: "40px", color: "#facc15" }}
            >
              {phrase}
            </div>
          ) : null}
          {description ? (
            <div
              style={{
                display: "flex",
                fontSize: "26px",
                color: "#a1a1a1",
                lineHeight: 1.4,
              }}
            >
              {description.length > 160
                ? `${description.slice(0, 157)}…`
                : description}
            </div>
          ) : null}
        </div>
      </div>
    ),
    size
  );
}
