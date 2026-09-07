import { getCollection, type CollectionEntry } from "astro:content";

export type Note = CollectionEntry<"notes">;

export interface EnrichedNote {
  entry: Note;
  slug: string;
  date: Date | null;
  isoDate: string | null;
  displayDate: string;
  tags: string[];
  title: string;
}

// Pull the YYYY-MM-DD out of an id like "2026/09/2026-09-07".
function dateFromId(id: string): Date | null {
  const match = id.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const [, y, m, d] = match;
  const parsed = new Date(Number(y), Number(m) - 1, Number(d));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(date: Date | null): string {
  if (!date) return "Undated";
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function enrich(entry: Note): EnrichedNote {
  const date = entry.data.date ?? dateFromId(entry.id);
  const tags = entry.data.tags ?? [];
  const title =
    (typeof entry.data.title === "string" && entry.data.title) ||
    (date ? formatDate(date) : entry.id);
  return {
    entry,
    slug: entry.id,
    date,
    isoDate: date ? date.toISOString().slice(0, 10) : null,
    displayDate: formatDate(date),
    tags,
    title,
  };
}

// All notes, newest first (undated pushed to the end).
export async function getNotes(): Promise<EnrichedNote[]> {
  const entries = await getCollection("notes");
  return entries
    .map(enrich)
    .sort((a, b) => {
      const at = a.date ? a.date.getTime() : -Infinity;
      const bt = b.date ? b.date.getTime() : -Infinity;
      return bt - at;
    });
}

// Map of tag -> notes, sorted by frequency.
export async function getTagMap(): Promise<Map<string, EnrichedNote[]>> {
  const notes = await getNotes();
  const map = new Map<string, EnrichedNote[]>();
  for (const note of notes) {
    for (const tag of note.tags) {
      const list = map.get(tag) ?? [];
      list.push(note);
      map.set(tag, list);
    }
  }
  return map;
}
