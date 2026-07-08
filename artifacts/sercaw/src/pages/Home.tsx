import { Link } from 'wouter';
import { SearchBox } from '@/components/SearchBox';
import logoUrl from '@assets/Sercaw_Logo_1783522244797.svg';
import iconUrl from '@assets/Sercaw_Icon_1783522244776.svg';

export default function Home() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      {/* Top Nav (minimal) */}
      <header className="flex justify-end items-center p-4 sm:p-6 gap-4 text-sm font-medium">
        <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">About</a>
        <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Featherpilot</a>
        <div className="w-8 h-8 rounded-full bg-sunset-gradient text-white flex items-center justify-center font-bold">
          S
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 pb-32">
        <div className="w-full max-w-2xl flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          {/* Logo */}
          <div className="mb-10 relative">
            <img 
              src={logoUrl} 
              alt="Sercaw Logo" 
              className="h-20 sm:h-28 w-auto object-contain"
            />
            {/* Subtle decorative bird icon hovering nearby */}
            <img 
              src={iconUrl} 
              alt="" 
              className="absolute -top-6 -right-8 w-12 h-12 opacity-80 bird-flight" 
              aria-hidden="true"
            />
          </div>

          {/* Search Component */}
          <SearchBox autoFocus className="mb-8" />
          
          {/* Tagline / AI feature promo */}
          <div className="text-sm text-muted-foreground flex items-center gap-2 mt-4 opacity-80 hover:opacity-100 transition-opacity cursor-default">
            <span>Powered by</span>
            <span className="font-semibold text-sunset-gradient inline-flex items-center gap-1">
              <img src={iconUrl} alt="" className="w-4 h-4" />
              Featherpilot
            </span>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 px-6 border-t border-border bg-card/50 text-xs text-muted-foreground flex justify-between items-center">
        <div className="flex gap-4">
          <a href="#" className="hover:text-foreground">Privacy</a>
          <a href="#" className="hover:text-foreground">Terms</a>
        </div>
        <div className="flex gap-4">
          <a href="#" className="hover:text-foreground">Settings</a>
        </div>
      </footer>
    </div>
  );
}
