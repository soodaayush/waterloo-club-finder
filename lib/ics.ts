import type { Org } from "@/data/schema";
import { SITE_URL } from "@/lib/site";
import { effectiveStatus, getLatestCycle } from "@/lib/orgUtils";

/** Escapes text per RFC 5545 (comma, semicolon, backslash, newline). */
function escapeText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\n/g, "\\n");
}

/** "YYYY-MM-DD" -> "YYYYMMDD", the all-day VALUE=DATE form. */
function toIcsDate(iso: string): string {
  return iso.replace(/-/g, "");
}

/** The day after an ISO date, for DTEND on an all-day event (exclusive). */
function nextDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

const utf8Encoder = new TextEncoder();
const utf8Decoder = new TextDecoder();

// Folds a line to the 75-octet limit RFC 5545 requires, continuation lines
// starting with a single space. Counts UTF-8 bytes, not JS string length
// (UTF-16 code units) - a club name or note with accented characters or an
// emoji near the boundary would otherwise produce a line that's within the
// 75-*character* count but over the real 75-*octet* limit.
function foldLine(line: string): string {
  const bytes = utf8Encoder.encode(line);
  if (bytes.length <= 75) return line;

  const chunks: string[] = [];
  let offset = 0;
  let first = true;
  while (offset < bytes.length) {
    // Continuation lines lose 1 byte of budget to their leading space.
    let end = Math.min(offset + (first ? 75 : 74), bytes.length);
    // Don't split a multi-byte UTF-8 sequence: back off while the byte at
    // `end` is a continuation byte (10xxxxxx).
    while (end > offset && end < bytes.length && (bytes[end] & 0xc0) === 0x80) {
      end--;
    }
    chunks.push((first ? "" : " ") + utf8Decoder.decode(bytes.subarray(offset, end)));
    offset = end;
    first = false;
  }
  return chunks.join("\r\n");
}

type IcsEvent = {
  uid: string;
  date: string; // "YYYY-MM-DD"
  summary: string;
  description: string;
  url: string;
};

function eventsForOrg(org: Org): IcsEvent[] {
  const cycle = getLatestCycle(org);
  const status = effectiveStatus(cycle);
  const url = `${SITE_URL}/clubs/${org.slug}`;
  const term = cycle.term.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const events: IcsEvent[] = [];

  if (cycle.opensAt && status === "Upcoming") {
    events.push({
      uid: `${org.slug}-${term}-opens@waterloo-club-finder`,
      date: cycle.opensAt,
      summary: `${org.name} applications open`,
      description: `${org.name} (${cycle.term}) opens applications today.${
        cycle.notes ? " " + cycle.notes : ""
      }`,
      url,
    });
  }

  if (cycle.closesAt && (status === "Open" || status === "Upcoming")) {
    events.push({
      uid: `${org.slug}-${term}-closes@waterloo-club-finder`,
      date: cycle.closesAt,
      summary: `${org.name} applications close`,
      description: `${org.name} (${cycle.term}) applications close today.${
        cycle.notes ? " " + cycle.notes : ""
      }`,
      url,
    });
  }

  return events;
}

function renderEvent(e: IcsEvent): string {
  return [
    "BEGIN:VEVENT",
    `UID:${e.uid}`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
    `DTSTART;VALUE=DATE:${toIcsDate(e.date)}`,
    `DTEND;VALUE=DATE:${toIcsDate(nextDay(e.date))}`,
    `SUMMARY:${escapeText(e.summary)}`,
    `DESCRIPTION:${escapeText(e.description)}`,
    `URL:${e.url}`,
  ]
    .map(foldLine)
    .join("\r\n");
}

/** Builds an .ics calendar of application open/close dates for one or more orgs. */
export function buildCalendar(orgs: Org[], calendarName: string): string {
  const events = orgs.flatMap(eventsForOrg);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Waterloo Club Finder//Deadlines//EN",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${escapeText(calendarName)}`,
    "X-WR-TIMEZONE:America/Toronto",
    ...events.map(renderEvent),
    "END:VCALENDAR",
  ];

  return lines.join("\r\n") + "\r\n";
}
