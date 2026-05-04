import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // Aggressive minification to stay under the 3MB limit
  minify: true,
});
