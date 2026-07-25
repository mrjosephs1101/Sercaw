import { PageShell } from '@/components/PageShell';
import iconUrl from '@assets/Sercaw_Icon_1783522244776.svg';
import { useFeatherpilotChatUi } from '@/components/featherpilot/FeatherpilotChatContext';

export default function Featherpilot() {
  const { open } = useFeatherpilotChatUi();

  return (
    <PageShell title="Featherpilot">
      <div className="flex items-center gap-3 mb-4 not-prose">
        <img src={iconUrl} alt="" className="w-10 h-10 bird-flight" />
        <p className="text-lg text-muted-foreground">Your AI co-pilot for the open web.</p>
      </div>
      <div className="mb-6 not-prose">
        <button
          type="button"
          onClick={open}
          className="px-5 py-2.5 rounded-full bg-sunset-gradient text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Chat with Featherpilot
        </button>
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
      <p>
        You can also chat with Featherpilot directly — ask follow-up questions, attach a photo for it
        to analyze, and it will search the live web for each turn and show its sources as it answers.
        Sign in to save your conversation history.
      </p>
    </PageShell>
  );
}
