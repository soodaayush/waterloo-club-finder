import { notFound } from "next/navigation";
import { getAllOrgs, getOrgBySlug } from "@/lib/getOrgs";
import { buildCalendar } from "@/lib/ics";

export function generateStaticParams() {
  return getAllOrgs().map((org) => ({ slug: org.slug }));
}

export const revalidate = 3600;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const org = getOrgBySlug(slug);
  if (!org) notFound();

  const body = buildCalendar([org], `${org.name} deadlines`);

  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${org.slug}.ics"`,
    },
  });
}
