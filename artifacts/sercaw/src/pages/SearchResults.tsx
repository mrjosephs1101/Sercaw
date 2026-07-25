import { useEffect, useRef, useState } from 'react';
import { useLocation, Link } from 'wouter';
import { SearchBox } from '@/components/SearchBox';
import { useSearch } from '@workspace/api-client-react';
import iconUrl from '@assets/Sercaw_Icon_1783522244776.svg';
import logoUrl from '@assets/Sercaw_Logo_1783522244797.svg';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, ChevronLeft, ChevronRight, ExternalLink, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AccountMenu } from '@/components/AccountMenu';
import { useSettings } from '@/lib/settings';
import { useFeatherpilotChatUi } from '@/components/featherpilot/FeatherpilotChatContext';

const SNIPPET_CLAMP: Record<string, string> = {
  short: 'line-clamp-2',
  medium: 'line-clamp-4',
  full: '',
};

export default function SearchResults() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const q = searchParams.get('q') || '';
  
  const { settings } = useSettings();
  const { open: openChat } = useFeatherpilotChatUi();
  const linkTargetProps = settings.openResultsInNewTab
    ? { target: '_blank', rel: 'noopener noreferrer' }
    : {};

  const searchMutation = useSearch();
  const mutateRef = useRef(searchMutation.mutate);
  mutateRef.current = searchMutation.mutate;

  const [activeQuery, setActiveQuery] = useState(q);
  const [page, setPage] = useState(1);
  // Track which page number we last initiated a search for, to avoid double-firing.
  const searchedPageRef = useRef<number | null>(null);

  // Primary effect: fires when the URL query changes → always resets to page 1.
  useEffect(() => {
    const image = sessionStorage.getItem('sercaw_pending_image');
    if (!q && !image) return;

    setActiveQuery(q);
    setPage(1);
    searchedPageRef.current = 1;
    mutateRef.current({ data: { query: q, imageDataUrl: image || null, page: 1 } });
  }, [q, location]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pagination handler — called directly by prev/next buttons.
  function goToPage(newPage: number) {
    const image = sessionStorage.getItem('sercaw_pending_image');
    setPage(newPage);
    searchedPageRef.current = newPage;
    mutateRef.current({ data: { query: q, imageDataUrl: image || null, page: newPage } });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const isLoading = searchMutation.isPending;
  const isError = searchMutation.isError;
  const data = searchMutation.data;

  const displayQuery = data?.query || activeQuery;

  const snippetClass = SNIPPET_CLAMP[settings.snippetLength] ?? 'line-clamp-4';
  const resultGapClass = settings.compactResults ? 'space-y-4' : 'space-y-8';
  const headerClass = settings.stickyHeader
    ? 'sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border pt-4 pb-4 px-4 sm:px-6'
    : 'bg-background border-b border-border pt-4 pb-4 px-4 sm:px-6';

  // Infer whether there's a next page: if results came back at 10, assume more exist.
  const hasNextPage = !isLoading && data?.results && data.results.length >= 10;
  const hasPrevPage = page > 1;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      {/* Header / Pinned Search */}
      <header className={headerClass}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row gap-4 sm:items-center">
          <div className="flex items-center justify-between sm:contents">
            <Link href="/" className="flex-shrink-0 mr-4 mt-1 sm:mt-0 cursor-pointer">
              <img src={logoUrl} alt="Sercaw" className="h-8 sm:h-10 w-auto" />
            </Link>
            <div className="sm:hidden flex-shrink-0 flex items-center gap-2">
              <button
                type="button"
                onClick={openChat}
                title="Chat with Featherpilot"
                className="p-1.5 rounded-full hover:bg-muted transition-colors"
              >
                <img src={iconUrl} alt="Featherpilot" className="w-6 h-6" />
              </button>
              <AccountMenu />
            </div>
          </div>
          <div className="flex-1 w-full max-w-3xl">
            <SearchBox initialQuery={displayQuery} />
          </div>
          <div className="hidden sm:flex flex-shrink-0 ml-auto items-center gap-3">
            <button
              type="button"
              onClick={openChat}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              title="Chat with Featherpilot"
            >
              <img src={iconUrl} alt="" className="w-5 h-5" />
              <span>Featherpilot</span>
            </button>
            <AccountMenu />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 lg:ml-[160px]">
        
        {isLoading && (
          <div className="animate-in fade-in duration-500">
            {/* Thinking state for AI */}
            <div className="rounded-2xl border border-border bg-card p-6 mb-8 relative overflow-hidden">
              <div className="absolute inset-0 animate-thinking opacity-50"></div>
              <div className="relative z-10 flex items-center gap-3 text-sunset-gradient font-semibold mb-4">
                <img src={iconUrl} alt="" className="w-5 h-5 animate-pulse" />
                <span>Featherpilot is reading the web...</span>
              </div>
              <div className="space-y-3">
                <Skeleton className="h-4 w-full bg-muted/60" />
                <Skeleton className="h-4 w-[90%] bg-muted/60" />
                <Skeleton className="h-4 w-[75%] bg-muted/60" />
              </div>
            </div>

            {/* Skeleton for organic results */}
            <div className={cn('mt-8', resultGapClass)}>
              {[1, 2, 3].map(i => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-6 h-6 rounded-full" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                  <Skeleton className="h-6 w-[80%] max-w-xl" />
                  <Skeleton className="h-4 w-full max-w-2xl" />
                  <Skeleton className="h-4 w-[85%] max-w-2xl" />
                </div>
              ))}
            </div>
          </div>
        )}

        {isError && !isLoading && (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-destructive flex gap-4 animate-in slide-in-from-bottom-2">
            <AlertCircle className="w-6 h-6 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-lg mb-1">Search encountered an error</h3>
              <p className="text-destructive/80">
                Featherpilot couldn't complete the flight. Please try again later.
              </p>
            </div>
          </div>
        )}

        {!isLoading && !isError && data && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
            {/* Featherpilot AI Overview */}
            {data.overview && settings.showAiOverview && (
              <section className="rounded-2xl border border-orange-200/50 dark:border-orange-900/30 bg-card p-5 sm:p-6 mb-8 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <img src={iconUrl} alt="Featherpilot" className="w-6 h-6" />
                  <h2 className="font-display font-semibold text-lg text-foreground">AI Overview</h2>
                </div>
                
                <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-foreground leading-relaxed">
                  <p>{data.overview.summary}</p>
                </div>

                {/* Sources */}
                {data.overview.sources && data.overview.sources.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-border">
                    <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Sources</h3>
                    <div className="flex flex-wrap gap-2">
                      {data.overview.sources.map((src, i) => (
                        <a 
                          key={i} 
                          href={src.url}
                          {...linkTargetProps}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-xs font-medium text-foreground transition-colors"
                        >
                          {src.title}
                          <ExternalLink size={10} className="opacity-50" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground/60">
                  <span className="flex items-center gap-1">
                    <Sparkles size={10} />
                    Featherpilot · {data.overview.model}
                  </span>
                  <span>Generative AI is experimental</span>
                </div>
              </section>
            )}

            {/* Organic Results */}
            <div className={cn(resultGapClass, 'search-result-gap')}>
              {data.results && data.results.length > 0 ? (
                data.results.map((result, idx) => {
                  let hostname = result.displayUrl;
                  try {
                    hostname = new URL(result.url).hostname.replace(/^www\./, '');
                  } catch {
                    // Fall back to the server-provided displayUrl if the URL is malformed.
                  }
                  return (
                  <article
                    key={idx}
                    className={cn(
                      'search-result-article group flex flex-col max-w-3xl',
                      settings.compactResults ? 'gap-0.5' : 'gap-1',
                    )}
                  >
                    <a href={result.url} {...linkTargetProps} className="flex items-center gap-2 text-sm text-foreground mb-1">
                      <div className="w-6 h-6 bg-secondary rounded-full flex items-center justify-center flex-shrink-0 border border-border">
                        <span className="text-[10px] font-bold opacity-60">
                          {(hostname.charAt(0) || '?').toUpperCase()}
                        </span>
                      </div>
                      <div className="flex flex-col line-clamp-1">
                        <span className="font-medium text-foreground/90 text-sm truncate">{hostname}</span>
                        <span className="text-xs text-muted-foreground truncate">{result.displayUrl}</span>
                      </div>
                    </a>
                    <a href={result.url} {...linkTargetProps} className="block group-hover:underline decoration-primary/50 underline-offset-2">
                      <h3
                        className={cn(
                          'search-result-title font-display font-medium text-primary line-clamp-2',
                          settings.compactResults ? 'text-lg' : 'text-xl',
                        )}
                      >
                        {result.title}
                      </h3>
                    </a>
                    <p className={cn('text-sm text-foreground/80 mt-1 leading-relaxed', snippetClass)}>
                      {result.snippet}
                    </p>
                  </article>
                  );
                })
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  <p className="text-lg">No results found for your search.</p>
                  <p className="text-sm mt-2">Try different keywords or a different image.</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {(hasPrevPage || hasNextPage) && (
              <div className="flex items-center justify-center gap-4 mt-12 pb-4">
                <button
                  type="button"
                  onClick={() => goToPage(page - 1)}
                  disabled={!hasPrevPage}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>
                <span className="text-sm font-medium text-muted-foreground px-2">
                  Page {page}
                </span>
                <button
                  type="button"
                  onClick={() => goToPage(page + 1)}
                  disabled={!hasNextPage}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
