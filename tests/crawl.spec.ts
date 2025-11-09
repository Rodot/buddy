import { test, expect } from "@playwright/test";

test.describe("Site crawl", () => {
  test("should successfully crawl all pages and links", async ({
    page,
    request,
  }) => {
    const baseURL = "http://localhost:4321";
    const visited = new Set<string>();
    const queue: string[] = ["/"];
    const errors: { url: string; error: string }[] = [];
    const resourcesChecked = new Set<string>();

    const isResourceFile = (path: string): boolean => {
      return !!path.match(
        /\.(png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot|pdf)$/i,
      );
    };

    const normalizeURL = (url: string): string | null => {
      try {
        const urlObj = new URL(url, baseURL);
        if (urlObj.origin !== baseURL) {
          return null;
        }
        const path = urlObj.pathname.replace(/\/$/, "") || "/";
        if (path.includes("/@/")) {
          return null;
        }
        return path;
      } catch {
        return null;
      }
    };

    const extractURLs = async (): Promise<string[]> => {
      return await page.evaluate(() => {
        const urls: string[] = [];
        // Extract from <a href>
        document.querySelectorAll("a[href]").forEach((el) => {
          urls.push((el as HTMLAnchorElement).href);
        });
        // Extract from <img src>
        document.querySelectorAll("img[src]").forEach((el) => {
          urls.push((el as HTMLImageElement).src);
        });
        return urls;
      });
    };

    while (queue.length > 0) {
      const path = queue.shift()!;

      if (visited.has(path)) {
        continue;
      }

      visited.add(path);
      const url = `${baseURL}${path}`;

      try {
        console.log(`- ${path}`);
        const response = await page.goto(url, {
          waitUntil: "load",
          timeout: 30000,
        });

        if (!response || !response.ok()) {
          errors.push({
            url: path,
            error: `HTTP ${response?.status() || "unknown"}`,
          });
          continue;
        }

        const urls = await extractURLs();

        for (const url of urls) {
          const normalizedPath = normalizeURL(url);
          if (!normalizedPath) continue;

          // Single decision point: resource or page?
          if (isResourceFile(normalizedPath)) {
            // Resource: check with HEAD request
            if (!resourcesChecked.has(normalizedPath)) {
              resourcesChecked.add(normalizedPath);
              try {
                const resourceURL = `${baseURL}${normalizedPath}`;
                const response = await request.head(resourceURL);
                if (!response.ok()) {
                  errors.push({
                    url: normalizedPath,
                    error: `Resource not available: HTTP ${response.status()}`,
                  });
                }
              } catch (error) {
                errors.push({
                  url: normalizedPath,
                  error: `Resource check failed: ${error instanceof Error ? error.message : String(error)}`,
                });
              }
            }
          } else if (!visited.has(normalizedPath)) {
            // Page: add to crawl queue
            queue.push(normalizedPath);
          }
        }
      } catch (error) {
        errors.push({
          url: path,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (errors.length > 0) {
      errors.forEach(({ url, error }) => {
        console.error(`❌️[ERROR] ${url}: ${error}`);
      });
    } else {
      console.log("✅ Crawl completed with no errors.");
    }

    expect(visited.size).toBeGreaterThan(0);
    expect(errors).toHaveLength(0);
  });
});
