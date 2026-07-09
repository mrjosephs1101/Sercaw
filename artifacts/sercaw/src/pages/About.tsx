import { PageShell } from '@/components/PageShell';
import iconUrl from '@assets/Sercaw_Icon_1783522244776.svg';

export default function About() {
  return (
    <PageShell title="About Sercaw">
      <div className="flex items-center gap-3 mb-6 not-prose">
        <img src={iconUrl} alt="" className="w-10 h-10 bird-flight" />
        <p className="text-lg text-muted-foreground">Search, at sunset speed.</p>
      </div>
      <p>
        Sercaw is a lightweight, AI-powered search engine built for people who want fast,
        honest answers without the clutter. Every search runs against the real, live web —
        never mocked or cached demo data — so what you see is what's actually out there right now.
      </p>
      <p>
        Alongside classic web results, Sercaw pairs every query with <strong>Featherpilot</strong>,
        our AI overview assistant, which reads the top results and summarizes them into a quick,
        cited answer. You can also search with a photo instead of words — snap or upload an image
        and Sercaw will figure out what you're looking for.
      </p>
      <p>
        We built Sercaw to feel like a single bird in flight: quick, direct, and a little bit
        beautiful. Thanks for trying it out.
      </p>
    </PageShell>
  );
}
