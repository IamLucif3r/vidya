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

// Local (non-UTC) YYYY-MM-DD so heatmap/activity keys never shift a day.
export function toLocalISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
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
    isoDate: date ? toLocalISO(date) : null,
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

// First readable paragraph of a note, stripped of Markdown syntax.
export function excerpt(note: EnrichedNote, maxLen = 200): string {
  const text = (note.entry.body ?? "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_`#>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).replace(/\s+\S*$/, "") + "\u2026";
}

// Consecutive days with an entry, counting back from the most recent entry.
export function getStreak(notes: EnrichedNote[]): number {
  const set = new Set(notes.map((n) => n.isoDate).filter(Boolean) as string[]);
  if (set.size === 0) return 0;
  const newest = [...set].sort().reverse()[0];
  const cursor = new Date(`${newest}T00:00:00`);
  let streak = 0;
  while (set.has(toLocalISO(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

// Map of YYYY-MM-DD -> number of entries that day.
export function getActivity(notes: EnrichedNote[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const note of notes) {
    if (!note.isoDate) continue;
    map.set(note.isoDate, (map.get(note.isoDate) ?? 0) + 1);
  }
  return map;
}
