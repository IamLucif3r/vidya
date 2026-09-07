// @ts-check
import { defineConfig } from "astro/config";
import pagefind from "astro-pagefind";

// Served from the custom domain root. For the *.github.io project URL instead,
// set `site` to "https://iamlucif3r.github.io" and `base` to "/vidya".
export default defineConfig({
  site: "https://vidya.anmolsinghyadav.com",
  base: "/",
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
