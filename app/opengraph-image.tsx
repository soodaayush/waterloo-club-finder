import { ImageResponse } from "next/og";
import { getAllOrgs } from "@/lib/getOrgs";
import { effectiveStatus, getLatestCycle } from "@/lib/orgUtils";
import { SITE_NAME } from "@/lib/site";

export const alt = SITE_NAME;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The card shows a live "N open right now" count.
export const revalidate = 3600;

export default async function Image() {
  const orgs = getAllOrgs();
  const openCount = orgs.filter(
    (o) => effectiveStatus(getLatestCycle(o)) === "Open"
  ).length;

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
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: "#facc15",
              color: "#171717",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
              fontWeight: 700,
            }}
          >
            W
          </div>
          <div style={{ display: "flex", fontSize: "28px", color: "#a1a1a1" }}>
            waterloo-club-finder
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "flex", fontSize: "66px", fontWeight: 700 }}>
            Find your club or design team,
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "66px",
              fontWeight: 700,
              color: "#facc15",
            }}
          >
            before the deadline passes.
          </div>
          <div style={{ display: "flex", fontSize: "30px", color: "#a1a1a1" }}>
            Application status for {orgs.length} UWaterloo clubs and design teams
            {openCount > 0 ? `, ${openCount} open right now` : ""}
          </div>
        </div>
      </div>
    ),
    size
  );
}
