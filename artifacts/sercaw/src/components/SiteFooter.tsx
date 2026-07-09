import { Link } from 'wouter';

export function SiteFooter() {
  return (
    <footer className="py-4 px-6 border-t border-border bg-card/50 text-xs text-muted-foreground flex justify-between items-center">
      <div className="flex gap-4">
        <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
        <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
      </div>
      <div className="flex gap-4">
        <Link href="/settings" className="hover:text-foreground transition-colors">Settings</Link>
      </div>
    </footer>
  );
}
