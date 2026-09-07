import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// Reads the daily markdown logs from the repo's top-level `raw/` folder so that
// Pages CMS remains the single editor and source of truth.
const notes = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "../raw" }),
  schema: z
    .object({
      // Frontmatter `date` may be a YAML date or a string; coerce both.
      date: z.coerce.date().optional(),
      // `tags` is inconsistent in the source: sometimes a comma string
      // ("cybersecurity, problems, "), sometimes a list. Normalize to a
      // clean, lowercased, de-duplicated array.
      tags: z
        .union([z.string(), z.array(z.string())])
        .optional()
        .transform((value) => {
          if (!value) return [] as string[];
          const parts = Array.isArray(value) ? value : value.split(",");
          const cleaned = parts.map((t) => t.trim().toLowerCase()).filter(Boolean);
          return Array.from(new Set(cleaned));
        }),
      title: z.string().optional(),
    })
    .passthrough(),
});

export const collections = { notes };
