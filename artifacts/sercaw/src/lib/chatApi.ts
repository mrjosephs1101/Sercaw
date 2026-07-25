export interface ChatSource {
  title: string;
  url: string;
}

export interface ChatThread {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  role: 'user' | 'assistant';
  content: string;
  imageDataUrl: string | null;
  imageAnalysis: string | null;
  sources: ChatSource[] | null;
  model: string | null;
  createdAt: string;
}

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (data?.error) return data.error as string;
  } catch {
    // fall through to generic message
  }
  return `Request failed with status ${res.status}`;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res));
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function listThreads(): Promise<{ threads: ChatThread[] }> {
  return apiFetch('/chat/threads');
}

export function createThread(): Promise<{ thread: ChatThread }> {
  return apiFetch('/chat/threads', { method: 'POST' });
}

export function getThread(
  id: string,
): Promise<{ thread: ChatThread; messages: ChatMessage[] }> {
  return apiFetch(`/chat/threads/${id}`);
}

export function deleteThread(id: string): Promise<void> {
  return apiFetch(`/chat/threads/${id}`, { method: 'DELETE' });
}

export type ChatStreamEvent =
  | { type: 'sources'; sources: ChatSource[] }
  | { type: 'title'; title: string }
  | { type: 'delta'; text: string }
  | { type: 'done'; messageId: string; model: string }
  | { type: 'error'; error: string };

/**
 * Sends a message and streams Featherpilot's reply over SSE-formatted chunks.
 * Returns a function that aborts the in-flight request.
 */
export function streamChatMessage(
  threadId: string,
  body: { content: string; imageDataUrl?: string | null },
  onEvent: (event: ChatStreamEvent) => void,
): { abort: () => void } {
  const controller = new AbortController();

  (async () => {
    let res: Response;
    try {
      res = await fetch(`/api/chat/threads/${threadId}/messages`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (err) {
      if (controller.signal.aborted) return;
      onEvent({ type: 'error', error: 'Could not reach Featherpilot. Check your connection.' });
      return;
    }

    if (!res.ok || !res.body) {
      onEvent({ type: 'error', error: await parseErrorMessage(res) });
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let sepIndex: number;
        while ((sepIndex = buffer.indexOf('\n\n')) !== -1) {
          const rawEvent = buffer.slice(0, sepIndex);
          buffer = buffer.slice(sepIndex + 2);

          const line = rawEvent
            .split('\n')
            .find((l) => l.startsWith('data:'));
          if (!line) continue;

          const jsonText = line.slice(5).trim();
          if (!jsonText) continue;

          try {
            onEvent(JSON.parse(jsonText) as ChatStreamEvent);
          } catch {
            // Ignore malformed chunks rather than breaking the whole stream.
          }
        }
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        onEvent({ type: 'error', error: 'The connection to Featherpilot dropped.' });
      }
    }
  })();

  return { abort: () => controller.abort() };
}
