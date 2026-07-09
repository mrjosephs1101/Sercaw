import { useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import { Show, useClerk, useUser } from '@clerk/react';
import { LogOut, Settings as SettingsIcon } from 'lucide-react';

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

function SignedInMenu() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickAway = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickAway);
    return () => document.removeEventListener('mousedown', handleClickAway);
  }, [open]);

  const initial = (user?.firstName?.[0] ?? user?.primaryEmailAddress?.emailAddress?.[0] ?? 'S').toUpperCase();

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-8 h-8 rounded-full bg-sunset-gradient text-white flex items-center justify-center font-bold overflow-hidden flex-shrink-0"
        aria-label="Account menu"
      >
        {user?.imageUrl ? (
          <img src={user.imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          initial
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-card shadow-lg overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.fullName || user?.username || 'Signed in'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.primaryEmailAddress?.emailAddress}
            </p>
          </div>
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
          >
            <SettingsIcon size={16} className="text-muted-foreground" />
            Settings
          </Link>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              signOut({ redirectUrl: basePath || '/' });
            }}
            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-destructive hover:bg-destructive/5 transition-colors text-left"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function AccountMenu() {
  return (
    <>
      <Show when="signed-in">
        <SignedInMenu />
      </Show>
      <Show when="signed-out">
        <Link
          href="/sign-in"
          className="px-4 py-1.5 rounded-full bg-sunset-gradient text-white text-sm font-medium hover:opacity-90 transition-opacity flex-shrink-0"
        >
          Sign in
        </Link>
      </Show>
    </>
  );
}
