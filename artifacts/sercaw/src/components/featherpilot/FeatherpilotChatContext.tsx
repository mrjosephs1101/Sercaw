import { createContext, useContext, useState, type ReactNode } from 'react';

interface FeatherpilotChatContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const FeatherpilotChatContext = createContext<FeatherpilotChatContextValue | null>(null);

export function FeatherpilotChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <FeatherpilotChatContext.Provider
      value={{
        isOpen,
        open: () => setIsOpen(true),
        close: () => setIsOpen(false),
        toggle: () => setIsOpen((v) => !v),
      }}
    >
      {children}
    </FeatherpilotChatContext.Provider>
  );
}

export function useFeatherpilotChatUi() {
  const ctx = useContext(FeatherpilotChatContext);
  if (!ctx) {
    throw new Error('useFeatherpilotChatUi must be used within a FeatherpilotChatProvider');
  }
  return ctx;
}
