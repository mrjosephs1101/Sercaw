import { PageShell } from '@/components/PageShell';

export default function Privacy() {
  return (
    <PageShell title="Privacy Policy">
      <p className="text-sm text-muted-foreground">Last updated: July 2026</p>

      <h2>What we collect</h2>
      <p>
        When you create an account, our authentication provider (Clerk) stores your account
        details, such as your email address. If you sign in with Google or another provider,
        it also stores basic profile information like your name and avatar.
      </p>
      <p>
        When you search, your query text or uploaded image is sent to Sercaw's servers to run
        the search and generate an AI overview. Search queries and uploaded images are used only
        to produce your search results and are not stored permanently or used to build a profile
        of you.
      </p>

      <h2>How we use it</h2>
      <p>
        We use your account information to let you sign in and manage your account, and your
        search input solely to return search results and an AI overview back to you.
      </p>

      <h2>Third parties</h2>
      <p>
        Sercaw sends search queries to a third-party search API to retrieve live web results, and
        to an AI provider to generate the Featherpilot overview and to interpret image-based
        searches. These providers process the request but are not used by Sercaw to identify you
        personally.
      </p>

      <h2>Your choices</h2>
      <p>
        You can view and manage your account details, or delete your account, from the Settings
        page at any time.
      </p>

      <h2>Contact</h2>
      <p>
        This is a demonstration application. If you have questions about this policy, please
        reach out through the app's support channel.
      </p>
    </PageShell>
  );
}
