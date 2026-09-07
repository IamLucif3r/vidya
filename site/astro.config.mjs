// @ts-check
import { defineConfig } from "astro/config";
import pagefind from "astro-pagefind";

// Project pages URL: https://iamlucif3r.github.io/vidya/
// If you add a custom domain, change `base` to "/" and update `site`.
export default defineConfig({
  site: "https://iamlucif3r.github.io",
  base: "/vidya",
  trailingSlash: "ignore",
  devToolbar: { enabled: false },
  integrations: [pagefind()],
  markdown: {
    shikiConfig: {
      theme: "github-dark",
      wrap: true,
    },
  },
});
