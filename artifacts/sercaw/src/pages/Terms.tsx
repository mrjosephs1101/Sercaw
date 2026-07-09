import { PageShell } from '@/components/PageShell';

export default function Terms() {
  return (
    <PageShell title="Terms of Service">
      <p className="text-sm text-muted-foreground">Last updated: July 2026</p>

      <h2>Using Sercaw</h2>
      <p>
        Sercaw is a search engine that returns live results from the web and an AI-generated
        overview from Featherpilot. Results and overviews are provided "as is" — Sercaw does not
        control, and is not responsible for, the content of third-party websites returned in
        search results.
      </p>

      <h2>AI-generated content</h2>
      <p>
        Featherpilot's AI overviews are generated automatically and may occasionally be incomplete
        or inaccurate. Always verify important information against the linked sources before
        relying on it.
      </p>

      <h2>Accounts</h2>
      <p>
        Creating an account is optional. You are responsible for keeping your account credentials
        secure and for all activity under your account.
      </p>

      <h2>Acceptable use</h2>
      <p>
        Don't use Sercaw to search for, upload, or attempt to generate content that is illegal,
        infringing, or intended to harass or harm others.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms from time to time. Continued use of Sercaw after changes are
        posted means you accept the updated terms.
      </p>
    </PageShell>
  );
}
