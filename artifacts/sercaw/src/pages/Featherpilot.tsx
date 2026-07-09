import { PageShell } from '@/components/PageShell';
import iconUrl from '@assets/Sercaw_Icon_1783522244776.svg';

export default function Featherpilot() {
  return (
    <PageShell title="Featherpilot">
      <div className="flex items-center gap-3 mb-6 not-prose">
        <img src={iconUrl} alt="" className="w-10 h-10 bird-flight" />
        <p className="text-lg text-muted-foreground">Your AI co-pilot for the open web.</p>
      </div>
      <p>
        Featherpilot is the AI that powers Sercaw's search overviews. When you search, Featherpilot
        reads through the live results Sercaw finds on the web, then writes a short, plain-language
        summary with links back to the sources it used — so you get a quick answer without losing
        the ability to verify it yourself.
      </p>
      <p>
        Featherpilot can also see. When you search with an image instead of text, Featherpilot looks
        at the photo, figures out what it's likely a picture of, and turns that into a search query
        so Sercaw can find relevant results for it.
      </p>
      <p>
        Featherpilot's summaries are generated automatically and are experimental — always check the
        linked sources for anything important. It never fabricates sources: every citation you see
        links to a real result that appeared for your search.
      </p>
    </PageShell>
  );
}
