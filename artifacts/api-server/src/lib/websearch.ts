import * as cheerio from "cheerio";
import { logger } from "./logger";

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  displayUrl: string;
}

/**
 * Live web search backed by DuckDuckGo's HTML results endpoint. No API key
 * required — this is what lets Sercaw crawl the open web for every query.
 */
export async function searchTheWeb(
  query: string,
  limit = 8,
): Promise<WebSearchResult[]> {
  const response = await fetch("https://html.duckduckgo.com/html/", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    },
    body: new URLSearchParams({ q: query }).toString(),
  });

  if (!response.ok) {
    logger.error(
      { status: response.status },
      "Web search upstream request failed",
    );
    throw new Error(`Web search failed with status ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const results: WebSearchResult[] = [];

  $(".result").each((_, el) => {
    if (results.length >= limit) return;

    const titleEl = $(el).find(".result__a").first();
    const snippetEl = $(el).find(".result__snippet").first();
    const rawHref = titleEl.attr("href");
    if (!rawHref) return;

    const url = resolveDuckDuckGoUrl(rawHref);
    if (!url) return;

    const title = titleEl.text().trim();
    if (!title) return;

    let displayUrl: string;
    try {
      displayUrl = new URL(url).hostname.replace(/^www\./, "");
    } catch {
      displayUrl = url;
    }

    results.push({
      title,
      url,
      snippet: snippetEl.text().trim(),
      displayUrl,
    });
  });

  return results;
}

/** DuckDuckGo's HTML endpoint wraps result links in a redirect; unwrap it. */
function resolveDuckDuckGoUrl(href: string): string | null {
  try {
    const url = new URL(href, "https://duckduckgo.com");
    const uddg = url.searchParams.get("uddg");
    if (uddg) {
      return decodeURIComponent(uddg);
    }
    if (url.hostname.includes("duckduckgo.com")) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}
