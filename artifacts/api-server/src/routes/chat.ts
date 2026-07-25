import { Router, type IRouter, type Request, type Response } from "express";
import { getAuth } from "@clerk/express";
import { eq, asc, desc, and } from "drizzle-orm";
import { db, chatThreadsTable, chatMessagesTable, type ChatSource } from "@workspace/db";
import { openrouter, OVERVIEW_MODELS, VISION_MODEL } from "../lib/openrouter";
import { searchTheWeb, type WebSearchResult } from "../lib/websearch";

const router: IRouter = Router();

const MAX_HISTORY_MESSAGES = 16;

function requireUserId(req: Request, res: Response): string | null {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Sign in to use Featherpilot chat." });
    return null;
  }
  return userId;
}

/** List the signed-in user's chat threads, most recently updated first. */
router.get("/chat/threads", async (req, res): Promise<void> => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const threads = await db.query.chatThreadsTable.findMany({
    where: eq(chatThreadsTable.userId, userId),
    orderBy: [desc(chatThreadsTable.updatedAt)],
  });

  res.json({ threads });
});

/** Create a new, empty chat thread. */
router.post("/chat/threads", async (req, res): Promise<void> => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const [thread] = await db
    .insert(chatThreadsTable)
    .values({ userId, title: "New chat" })
    .returning();

  res.status(201).json({ thread });
});

/** Fetch a single thread with its full message history. */
router.get("/chat/threads/:id", async (req, res): Promise<void> => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const thread = await db.query.chatThreadsTable.findFirst({
    where: and(eq(chatThreadsTable.id, req.params.id), eq(chatThreadsTable.userId, userId)),
  });
  if (!thread) {
    res.status(404).json({ error: "Chat not found." });
    return;
  }

  const messages = await db.query.chatMessagesTable.findMany({
    where: eq(chatMessagesTable.threadId, thread.id),
    orderBy: [asc(chatMessagesTable.createdAt)],
  });

  res.json({ thread, messages });
});

/** Delete a thread and all of its messages. */
router.delete("/chat/threads/:id", async (req, res): Promise<void> => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const thread = await db.query.chatThreadsTable.findFirst({
    where: and(eq(chatThreadsTable.id, req.params.id), eq(chatThreadsTable.userId, userId)),
  });
  if (!thread) {
    res.status(404).json({ error: "Chat not found." });
    return;
  }

  await db.delete(chatThreadsTable).where(eq(chatThreadsTable.id, thread.id));
  res.status(204).end();
});

interface SseWriter {
  send: (payload: Record<string, unknown>) => void;
  end: () => void;
}

function openSse(res: Response): SseWriter {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  return {
    send: (payload) => {
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    },
    end: () => res.end(),
  };
}

/**
 * Send a message in a thread. Streams the reply as it's generated over
 * Server-Sent Events: first the sources Featherpilot found for this turn,
 * then text deltas as the model writes its answer, then a final "done".
 */
router.post("/chat/threads/:id/messages", async (req, res): Promise<void> => {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const thread = await db.query.chatThreadsTable.findFirst({
    where: and(eq(chatThreadsTable.id, req.params.id), eq(chatThreadsTable.userId, userId)),
  });
  if (!thread) {
    res.status(404).json({ error: "Chat not found." });
    return;
  }

  const rawBody = req.body as { content?: unknown; imageDataUrl?: unknown };
  const content = typeof rawBody.content === "string" ? rawBody.content.trim() : "";
  const imageDataUrl =
    typeof rawBody.imageDataUrl === "string" && rawBody.imageDataUrl.length > 0
      ? rawBody.imageDataUrl
      : null;

  if (!content && !imageDataUrl) {
    res.status(400).json({ error: "A message or an image is required." });
    return;
  }

  const priorMessages = await db.query.chatMessagesTable.findMany({
    where: eq(chatMessagesTable.threadId, thread.id),
    orderBy: [asc(chatMessagesTable.createdAt)],
  });

  let imageAnalysis: string | null = null;
  if (imageDataUrl) {
    try {
      imageAnalysis = await analyzeImage(imageDataUrl, content);
    } catch (err) {
      req.log.error({ err }, "Featherpilot image analysis failed");
      imageAnalysis = null;
    }
  }

  await db.insert(chatMessagesTable).values({
    threadId: thread.id,
    role: "user",
    content,
    imageDataUrl,
    imageAnalysis,
  });

  const isFirstMessage = priorMessages.length === 0;
  let updatedTitle: string | null = null;
  if (isFirstMessage) {
    updatedTitle = deriveTitle(content, Boolean(imageDataUrl));
  }

  const sse = openSse(res);
  req.on("close", () => sse.end());

  try {
    const searchQuery = imageAnalysis
      ? await deriveSearchQueryFromAnalysis(imageAnalysis, content)
      : content;

    let results: WebSearchResult[] = [];
    try {
      results = searchQuery ? await searchTheWeb(searchQuery, 6) : [];
    } catch (err) {
      req.log.error({ err }, "Featherpilot chat web search failed");
      results = [];
    }

    const sources: ChatSource[] = results.map((r) => ({ title: r.title, url: r.url }));
    sse.send({ type: "sources", sources });

    if (updatedTitle) {
      await db
        .update(chatThreadsTable)
        .set({ title: updatedTitle, updatedAt: new Date() })
        .where(eq(chatThreadsTable.id, thread.id));
      sse.send({ type: "title", title: updatedTitle });
    } else {
      await db
        .update(chatThreadsTable)
        .set({ updatedAt: new Date() })
        .where(eq(chatThreadsTable.id, thread.id));
    }

    const history = [
      ...priorMessages.map((m: (typeof priorMessages)[number]) => toModelMessage(m)),
      toModelMessage({
        role: "user",
        content,
        imageAnalysis,
      }),
    ].slice(-MAX_HISTORY_MESSAGES);

    const { text: fullText, model } = await streamChatReply({
      history,
      results,
      onDelta: (delta) => sse.send({ type: "delta", text: delta }),
    });

    const [saved] = await db
      .insert(chatMessagesTable)
      .values({
        threadId: thread.id,
        role: "assistant",
        content: fullText,
        sources,
        model,
      })
      .returning();

    sse.send({ type: "done", messageId: saved.id, model });
  } catch (err) {
    req.log.error({ err }, "Featherpilot chat reply failed");
    sse.send({
      type: "error",
      error: "Featherpilot couldn't finish that reply. Please try again.",
    });
  } finally {
    sse.end();
  }
});

function deriveTitle(content: string, hasImage: boolean): string {
  const trimmed = content.trim();
  if (trimmed) {
    return trimmed.length > 60 ? `${trimmed.slice(0, 57)}...` : trimmed;
  }
  return hasImage ? "Chat about an image" : "New chat";
}

/** Uses a vision-capable model to describe an uploaded image for chat context. */
async function analyzeImage(imageDataUrl: string, userText: string): Promise<string> {
  const completion = await openrouter.chat.completions.create({
    model: VISION_MODEL,
    max_tokens: 400,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: userText
              ? `Describe this image in detail, focusing on anything relevant to the user's message: "${userText}". Be specific and factual.`
              : "Describe this image in detail: what it shows, any text visible, and anything notable. Be specific and factual.",
          },
          { type: "image_url", image_url: { url: imageDataUrl } },
        ],
      },
    ],
  });

  const text = completion.choices[0]?.message?.content?.trim();
  if (!text) throw new Error("Vision model returned an empty analysis");
  return text;
}

/** Turns an image analysis (+ optional user text) into a short web search query. */
async function deriveSearchQueryFromAnalysis(
  analysis: string,
  userText: string,
): Promise<string> {
  try {
    const completion = await openrouter.chat.completions.create({
      model: VISION_MODEL,
      max_tokens: 60,
      messages: [
        {
          role: "user",
          content: `Image description: ${analysis}\n\nUser's message: "${userText || "(none)"}"\n\nWrite the single best web search query to help answer the user, based on the image and their message. Reply with ONLY the query text.`,
        },
      ],
    });
    const text = completion.choices[0]?.message?.content?.trim();
    return text ? text.replace(/^["']|["']$/g, "") : userText;
  } catch {
    return userText;
  }
}

interface ModelMessage {
  role: "user" | "assistant";
  content: string;
}

function toModelMessage(m: {
  role: "user" | "assistant";
  content: string;
  imageAnalysis?: string | null;
}): ModelMessage {
  if (m.role === "user" && m.imageAnalysis) {
    return {
      role: "user",
      content: m.content
        ? `${m.content}\n\n[Attached image — Featherpilot's analysis: ${m.imageAnalysis}]`
        : `[Attached image — Featherpilot's analysis: ${m.imageAnalysis}]`,
    };
  }
  return { role: m.role, content: m.content };
}

/**
 * Streams a chat reply from OpenRouter, trying free models in order until
 * one successfully starts streaming. Once a model produces its first chunk,
 * we commit to it for the rest of the response.
 */
async function streamChatReply({
  history,
  results,
  onDelta,
}: {
  history: ModelMessage[];
  results: WebSearchResult[];
  onDelta: (delta: string) => void;
}): Promise<{ text: string; model: string }> {
  const sourceList = results
    .slice(0, 6)
    .map((r, i) => `[${i + 1}] ${r.title} (${r.url})\n${r.snippet}`)
    .join("\n\n");

  const systemPrompt = results.length
    ? `You are Featherpilot, the conversational AI assistant built into the Sercaw search engine. For this turn, you were given fresh live web results below — use them and cite sources inline with bracketed numbers like [1] matching the list. Stay conversational and remember earlier turns in this chat. Do not fabricate facts beyond the sources. Do not use markdown headers.\n\nWeb results for this turn:\n${sourceList}`
    : `You are Featherpilot, the conversational AI assistant built into the Sercaw search engine. No fresh web results were found for this turn, so answer from the conversation context and general knowledge, and say so if you're not sure. Stay conversational and remember earlier turns in this chat. Do not use markdown headers.`;

  const messages: Parameters<typeof openrouter.chat.completions.create>[0]["messages"] = [
    { role: "system", content: systemPrompt },
    ...history,
  ];

  let lastErr: unknown;
  for (const model of OVERVIEW_MODELS) {
    try {
      const stream = await openrouter.chat.completions.create({
        model,
        max_tokens: 700,
        messages,
        stream: true,
      });

      let text = "";
      let gotFirstChunk = false;
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) {
          gotFirstChunk = true;
          text += delta;
          onDelta(delta);
        }
      }

      if (gotFirstChunk && text.trim()) {
        return { text: text.trim(), model };
      }
      lastErr = new Error(`Model ${model} produced no output`);
    } catch (err) {
      lastErr = err;
    }
  }

  throw lastErr instanceof Error ? lastErr : new Error("All Featherpilot models failed");
}

export default router;
