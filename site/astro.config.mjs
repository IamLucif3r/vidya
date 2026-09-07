// @ts-check
import { defineConfig } from "astro/config";

// Project pages URL: https://iamlucif3r.github.io/vidya/
// If you add a custom domain, change `base` to "/" and update `site`.
export default defineConfig({
  site: "https://iamlucif3r.github.io",
  base: "/vidya",
  trailingSlash: "ignore",
  markdown: {
    shikiConfig: {
      theme: "github-dark",
      wrap: true,
    },
  },
});
