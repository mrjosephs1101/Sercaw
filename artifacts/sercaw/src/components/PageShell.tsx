import type { ReactNode } from 'react';
import { Link } from 'wouter';
import logoUrl from '@assets/Sercaw_Logo_1783522244797.svg';
import { AccountMenu } from '@/components/AccountMenu';
import { SiteFooter } from '@/components/SiteFooter';

export function PageShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <header className="flex justify-between items-center p-4 sm:p-6 gap-4 text-sm font-medium">
        <Link href="/" className="flex-shrink-0">
          <img src={logoUrl} alt="Sercaw" className="h-7 sm:h-8 w-auto" />
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">About</Link>
          <Link href="/featherpilot" className="text-muted-foreground hover:text-foreground transition-colors">Featherpilot</Link>
          <AccountMenu />
        </div>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-foreground mb-8">{title}</h1>
        <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-foreground/90 leading-relaxed">
          {children}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
