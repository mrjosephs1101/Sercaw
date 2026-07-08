import { logger } from "./logger";

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  displayUrl: string;
}

if (!process.env.SERPER_API_KEY) {
  throw new Error(
    "SERPER_API_KEY must be set. Did you forget to add your Serper.dev API key?",
  );
}

interface SerperOrganicResult {
  title?: string;
  link?: string;
  snippet?: string;
}

interface SerperResponse {
  organic?: SerperOrganicResult[];
}

/**
 * Live web search backed by Serper.dev's Google Search API. This is what
 * lets Sercaw crawl the real, entire internet for every query.
 */
export async function searchTheWeb(
  query: string,
  limit = 8,
): Promise<WebSearchResult[]> {
  const response = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": process.env.SERPER_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q: query, num: limit }),
  });

  if (!response.ok) {
    logger.error(
      { status: response.status },
      "Web search upstream request failed",
    );
    throw new Error(`Web search failed with status ${response.status}`);
  }

  const data = (await response.json()) as SerperResponse;

  const results: WebSearchResult[] = [];
  for (const item of data.organic ?? []) {
    if (results.length >= limit) break;
    if (!item.title || !item.link) continue;

    // Drop entries with malformed URLs rather than passing them through —
    // the frontend renders result.url with new URL(...) and would crash on garbage input.
    let displayUrl: string;
    try {
      displayUrl = new URL(item.link).hostname.replace(/^www\./, "");
    } catch {
      continue;
    }

    results.push({
      title: item.title,
      url: item.link,
      snippet: item.snippet ?? "",
      displayUrl,
    });
  }

  return results;
}
