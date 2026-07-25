import { useEffect, useRef, useState } from 'react';
import { Show, useUser } from '@clerk/react';
import { Link } from 'wouter';
import {
  Camera,
  Loader2,
  Plus,
  Send,
  Trash2,
  X,
  PanelLeftOpen,
  PanelLeftClose,
} from 'lucide-react';
import iconUrl from '@assets/Sercaw_Icon_1783522244776.svg';
import { cn } from '@/lib/utils';
import { useFeatherpilotChatUi } from './FeatherpilotChatContext';
import { UserBubble, AssistantBubble } from './FeatherpilotMessage';
import {
  listThreads,
  createThread,
  getThread,
  deleteThread,
  streamChatMessage,
  type ChatThread,
  type ChatMessage,
  type ChatSource,
} from '@/lib/chatApi';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

interface StreamingState {
  content: string;
  sources: ChatSource[] | null;
}

function ThreadSidebar({
  threads,
  activeId,
  loading,
  onSelect,
  onNew,
  onDelete,
}: {
  threads: ChatThread[];
  activeId: string | null;
  loading: boolean;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="w-56 flex-shrink-0 border-r border-border flex flex-col bg-muted/30">
      <div className="p-2 border-b border-border">
        <button
          type="button"
          onClick={onNew}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-sunset-gradient text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={14} />
          New chat
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="p-1.5 space-y-0.5">
          {loading && (
            <p className="text-xs text-muted-foreground px-2 py-2">Loading chats…</p>
          )}
          {!loading && threads.length === 0 && (
            <p className="text-xs text-muted-foreground px-2 py-2">No chats yet.</p>
          )}
          {threads.map((t) => (
            <div
              key={t.id}
              className={cn(
                'group flex items-center gap-1 rounded-lg px-2 py-2 cursor-pointer text-sm transition-colors',
                t.id === activeId ? 'bg-secondary text-foreground' : 'hover:bg-secondary/60 text-foreground/80',
              )}
              onClick={() => onSelect(t.id)}
            >
              <span className="flex-1 truncate">{t.title}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(t.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                aria-label="Delete chat"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SignedOutPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
      <img src={iconUrl} alt="" className="w-12 h-12 bird-flight" />
      <div>
        <p className="font-medium text-foreground mb-1">Sign in to chat with Featherpilot</p>
        <p className="text-sm text-muted-foreground">
          Your conversations are saved to your account so you can pick up where you left off.
        </p>
      </div>
      <Link
        href="/sign-in"
        onClick={onClose}
        className="px-5 py-2 rounded-full bg-sunset-gradient text-white text-sm font-medium hover:opacity-90 transition-opacity"
      >
        Sign in
      </Link>
    </div>
  );
}

function ChatBody() {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  const [input, setInput] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [streaming, setStreaming] = useState<StreamingState | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<{ abort: () => void } | null>(null);

  useEffect(() => {
    let cancelled = false;
    listThreads()
      .then(({ threads }) => {
        if (cancelled) return;
        setThreads(threads);
        if (threads.length > 0) {
          void selectThread(threads[0].id);
        }
      })
      .catch(() => {
        if (!cancelled) setError('Could not load your chats.');
      })
      .finally(() => {
        if (!cancelled) setThreadsLoading(false);
      });
    return () => {
      cancelled = true;
      abortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, streaming]);

  async function selectThread(id: string) {
    abortRef.current?.abort();
    setStreaming(null);
    setActiveId(id);
    setMessagesLoading(true);
    setShowSidebar(false);
    try {
      const { messages } = await getThread(id);
      setMessages(messages);
    } catch {
      setError('Could not load that chat.');
    } finally {
      setMessagesLoading(false);
    }
  }

  async function handleNewThread() {
    abortRef.current?.abort();
    setStreaming(null);
    try {
      const { thread } = await createThread();
      setThreads((prev) => [thread, ...prev]);
      setActiveId(thread.id);
      setMessages([]);
      setShowSidebar(false);
    } catch {
      setError('Could not start a new chat.');
    }
  }

  async function handleDeleteThread(id: string) {
    try {
      await deleteThread(id);
      setThreads((prev) => prev.filter((t) => t.id !== id));
      if (id === activeId) {
        setActiveId(null);
        setMessages([]);
      }
    } catch {
      setError('Could not delete that chat.');
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) {
      window.alert('That image is too large. Please choose a photo under 5MB.');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => setImage(evt.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSend() {
    if (sending) return;
    if (!input.trim() && !image) return;

    setError(null);
    let threadId = activeId;
    if (!threadId) {
      try {
        const { thread } = await createThread();
        setThreads((prev) => [thread, ...prev]);
        threadId = thread.id;
        setActiveId(thread.id);
      } catch {
        setError('Could not start a new chat.');
        return;
      }
    }

    const userMessage: ChatMessage = {
      id: `pending-${Date.now()}`,
      threadId,
      role: 'user',
      content: input.trim(),
      imageDataUrl: image,
      imageAnalysis: null,
      sources: null,
      model: null,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setSending(true);
    setStreaming({ content: '', sources: null });
    const bodyContent = input.trim();
    const bodyImage = image;
    setInput('');
    setImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    abortRef.current = streamChatMessage(
      threadId,
      { content: bodyContent, imageDataUrl: bodyImage },
      (event) => {
        if (event.type === 'sources') {
          setStreaming((prev) => ({ content: prev?.content ?? '', sources: event.sources }));
        } else if (event.type === 'title') {
          setThreads((prev) =>
            prev.map((t) => (t.id === threadId ? { ...t, title: event.title } : t)),
          );
        } else if (event.type === 'delta') {
          setStreaming((prev) => ({
            content: (prev?.content ?? '') + event.text,
            sources: prev?.sources ?? null,
          }));
        } else if (event.type === 'done') {
          setStreaming((current) => {
            setMessages((prev) => [
              ...prev,
              {
                id: event.messageId,
                threadId: threadId!,
                role: 'assistant',
                content: current?.content ?? '',
                imageDataUrl: null,
                imageAnalysis: null,
                sources: current?.sources ?? [],
                model: event.model,
                createdAt: new Date().toISOString(),
              },
            ]);
            return null;
          });
          setSending(false);
          setThreads((prev) => {
            const updated = prev.find((t) => t.id === threadId);
            if (!updated) return prev;
            return [updated, ...prev.filter((t) => t.id !== threadId)];
          });
        } else if (event.type === 'error') {
          setError(event.error);
          setStreaming(null);
          setSending(false);
        }
      },
    );
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  return (
    <div className="flex flex-1 min-h-0">
      <div className={cn('sm:block', showSidebar ? 'block absolute inset-0 z-10 bg-background' : 'hidden')}>
        <ThreadSidebar
          threads={threads}
          activeId={activeId}
          loading={threadsLoading}
          onSelect={selectThread}
          onNew={handleNewThread}
          onDelete={handleDeleteThread}
        />
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="sm:hidden flex items-center gap-2 px-3 py-2 border-b border-border">
          <button
            type="button"
            onClick={() => setShowSidebar((v) => !v)}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"
            aria-label="Toggle chat list"
          >
            {showSidebar ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
          </button>
          <span className="text-sm font-medium text-foreground truncate">
            {threads.find((t) => t.id === activeId)?.title ?? 'New chat'}
          </span>
        </div>

        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-4 space-y-4">
            {messagesLoading && (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-muted-foreground" size={20} />
              </div>
            )}

            {!messagesLoading && messages.length === 0 && !streaming && (
              <div className="flex flex-col items-center text-center gap-3 py-10">
                <img src={iconUrl} alt="" className="w-10 h-10 bird-flight" />
                <p className="text-sm text-muted-foreground max-w-xs">
                  Ask Featherpilot anything — it'll search the live web, show its sources, and
                  remember this conversation.
                </p>
              </div>
            )}

            {messages.map((m) =>
              m.role === 'user' ? (
                <UserBubble key={m.id} message={m} />
              ) : (
                <AssistantBubble key={m.id} content={m.content} sources={m.sources} />
              ),
            )}

            {streaming && (
              <AssistantBubble
                content={streaming.content || (streaming.sources ? '' : 'Reading the web…')}
                sources={streaming.sources}
                isStreaming
              />
            )}

            {error && (
              <p className="text-xs text-destructive text-center">{error}</p>
            )}
          </div>
        </div>

        <div className="border-t border-border p-3">
          {image && (
            <div className="relative inline-block mb-2">
              <img src={image} alt="Attachment" className="w-16 h-16 object-cover rounded-lg border border-border" />
              <button
                type="button"
                onClick={() => {
                  setImage(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="absolute -top-1.5 -right-1.5 bg-foreground text-background rounded-full p-0.5"
              >
                <X size={10} />
              </button>
            </div>
          )}
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 text-primary hover:bg-primary/10 rounded-full transition-colors flex-shrink-0"
              title="Attach an image"
            >
              <Camera size={18} />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Featherpilot..."
              rows={1}
              className="flex-1 resize-none bg-muted rounded-2xl px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary/30 max-h-32"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || (!input.trim() && !image)}
              className="p-2.5 rounded-full bg-sunset-gradient text-white disabled:opacity-40 transition-opacity flex-shrink-0"
              aria-label="Send"
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FeatherpilotChatPanel() {
  const { isOpen, close } = useFeatherpilotChatUi();
  const { user } = useUser();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 sm:inset-auto sm:bottom-5 sm:right-5 sm:w-[420px] sm:h-[640px] flex flex-col bg-background sm:rounded-2xl sm:border sm:border-border sm:shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <img src={iconUrl} alt="" className="w-6 h-6" />
          <span className="font-display font-semibold text-foreground">Featherpilot</span>
        </div>
        <button
          type="button"
          onClick={close}
          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors"
          aria-label="Close chat"
        >
          <X size={18} />
        </button>
      </div>

      <Show when="signed-in">
        {user && <ChatBody key={user.id} />}
      </Show>
      <Show when="signed-out">
        <SignedOutPanel onClose={close} />
      </Show>
    </div>
  );
}
