import { Router, type IRouter } from "express";
import { SearchBody, SearchResponse } from "@workspace/api-zod";
import { openrouter, OVERVIEW_MODELS, VISION_MODEL } from "../lib/openrouter";
import { searchTheWeb, type WebSearchResult } from "../lib/websearch";

const router: IRouter = Router();

const FALLBACK_OVERVIEW =
  "Featherpilot couldn't put together an overview this time, but the web results below are still live.";

router.post("/search", async (req, res): Promise<void> => {
  const parsed = SearchBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid search request");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { query, imageDataUrl } = parsed.data;
  const typedQuery = (query ?? "").trim();

  if (!typedQuery && !imageDataUrl) {
    res.status(400).json({ error: "A query or an image is required." });
    return;
  }

  let resolvedQuery = typedQuery;

  if (imageDataUrl) {
    try {
      resolvedQuery = await resolveQueryFromImage(imageDataUrl, typedQuery);
    } catch (err) {
      req.log.error({ err }, "Featherpilot image understanding failed");
      if (!typedQuery) {
        res.status(400).json({
          error:
            "Featherpilot couldn't read that image. Try a different photo or add a few words.",
        });
        return;
      }
      // Fall back to whatever text the user typed alongside the image.
      resolvedQuery = typedQuery;
    }
  }

  let results: WebSearchResult[] = [];
  try {
    results = await searchTheWeb(resolvedQuery);
  } catch (err) {
    req.log.error({ err }, "Web search failed");
    res.status(502).json({ error: "The web search is temporarily unavailable. Please try again." });
    return;
  }

  const overview = await buildOverview(resolvedQuery, results, req.log);

  const data = SearchResponse.parse({
    query: resolvedQuery,
    results,
    overview,
  });

  res.json(data);
});

/** Uses a vision-capable OpenRouter model to turn an uploaded image into a search query. */
async function resolveQueryFromImage(
  imageDataUrl: string,
  userText: string,
): Promise<string> {
  const completion = await openrouter.chat.completions.create({
    model: VISION_MODEL,
    max_tokens: 200,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: userText
              ? `The user uploaded this image alongside the text "${userText}". In a few words, write the best possible web search query that captures what they're looking for. Reply with ONLY the query text, no punctuation around it.`
              : "In a few words, write the best possible web search query to identify or learn more about the main subject of this image. Reply with ONLY the query text, no punctuation around it.",
          },
          {
            type: "image_url",
            image_url: { url: imageDataUrl },
          },
        ],
      },
    ],
  });

  const text = completion.choices[0]?.message?.content?.trim();
  if (!text) {
    throw new Error("Vision model returned an empty query");
  }
  return text.replace(/^["']|["']$/g, "");
}

/** Summarizes the top web results into a Featherpilot AI overview, trying free OpenRouter models in order. */
async function buildOverview(
  query: string,
  results: WebSearchResult[],
  log: { error: (obj: unknown, msg: string) => void },
): Promise<{ summary: string; model: string; sources: { title: string; url: string }[] }> {
  const sources = results.slice(0, 6).map((r) => ({ title: r.title, url: r.url }));

  if (results.length === 0) {
    return {
      summary: `Featherpilot couldn't find any live results for "${query}" right now.`,
      model: OVERVIEW_MODELS[0],
      sources: [],
    };
  }

  const sourceList = results
    .slice(0, 6)
    .map(
      (r, i) => `[${i + 1}] ${r.title} (${r.url})\n${r.snippet}`,
    )
    .join("\n\n");

  const messages: Parameters<typeof openrouter.chat.completions.create>[0]["messages"] = [
    {
      role: "system",
      content:
        "You are Featherpilot, the AI overview assistant built into the Sercaw search engine. Write a concise, factual, neutral overview (2-5 sentences) answering the user's query using ONLY the provided web results. Cite sources inline using bracketed numbers like [1] that match the numbered list. Do not fabricate information beyond what the sources say. Do not use markdown headers.",
    },
    {
      role: "user",
      content: `Query: ${query}\n\nWeb results:\n${sourceList}`,
    },
  ];

  // Free OpenRouter models share a public rate-limit pool and can be
  // temporarily saturated — fall through the list until one responds.
  for (const model of OVERVIEW_MODELS) {
    try {
      const completion = await openrouter.chat.completions.create({
        model,
        max_tokens: 500,
        messages,
      });

      const summary = completion.choices[0]?.message?.content?.trim();
      if (summary) {
        return { summary, model, sources };
      }
    } catch (err) {
      log.error({ err, model }, "Featherpilot overview generation failed");
    }
  }

  return {
    summary: FALLBACK_OVERVIEW,
    model: OVERVIEW_MODELS[0],
    sources,
  };
}

export default router;
