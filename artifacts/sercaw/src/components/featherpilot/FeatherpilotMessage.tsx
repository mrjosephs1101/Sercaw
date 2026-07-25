import { ExternalLink } from 'lucide-react';
import iconUrl from '@assets/Sercaw_Icon_1783522244776.svg';
import type { ChatMessage, ChatSource } from '@/lib/chatApi';

function renderWithCitations(text: string, sources: ChatSource[] | null) {
  if (!sources || sources.length === 0) return text;

  const parts = text.split(/(\[\d+\])/g);
  return parts.map((part, i) => {
    const match = part.match(/^\[(\d+)\]$/);
    if (!match) return <span key={i}>{part}</span>;

    const idx = Number(match[1]) - 1;
    const source = sources[idx];
    if (!source) return <span key={i}>{part}</span>;

    return (
      <a
        key={i}
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        title={source.title}
        className="inline-flex items-center justify-center w-4 h-4 mx-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-semibold align-middle hover:bg-primary/25 transition-colors no-underline"
      >
        {match[1]}
      </a>
    );
  });
}

export function SourceChips({ sources }: { sources: ChatSource[] }) {
  if (sources.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mb-2">
      {sources.map((src, i) => (
        <a
          key={i}
          href={src.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary hover:bg-secondary/80 text-[11px] font-medium text-foreground/80 transition-colors max-w-[180px]"
        >
          <span className="w-3.5 h-3.5 rounded-full bg-background/80 flex items-center justify-center text-[9px] font-bold flex-shrink-0">
            {i + 1}
          </span>
          <span className="truncate">{src.title}</span>
          <ExternalLink size={9} className="opacity-50 flex-shrink-0" />
        </a>
      ))}
    </div>
  );
}

export function UserBubble({ message }: { message: Pick<ChatMessage, 'content' | 'imageDataUrl'> }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary text-primary-foreground px-4 py-2.5">
        {message.imageDataUrl && (
          <img
            src={message.imageDataUrl}
            alt="Attached"
            className="w-full max-w-[220px] rounded-lg mb-2 border border-white/20"
          />
        )}
        {message.content && (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        )}
      </div>
    </div>
  );
}

export function AssistantBubble({
  content,
  sources,
  isStreaming,
}: {
  content: string;
  sources: ChatSource[] | null;
  isStreaming?: boolean;
}) {
  return (
    <div className="flex gap-2.5">
      <img src={iconUrl} alt="" className={`w-6 h-6 flex-shrink-0 mt-1 ${isStreaming ? 'bird-flight' : ''}`} />
      <div className="max-w-[88%] rounded-2xl rounded-tl-md bg-card border border-border px-4 py-2.5">
        {sources && <SourceChips sources={sources} />}
        <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
          {renderWithCitations(content, sources)}
          {isStreaming && <span className="inline-block w-1.5 h-3.5 bg-primary/70 ml-0.5 animate-pulse align-middle" />}
        </p>
      </div>
    </div>
  );
}
