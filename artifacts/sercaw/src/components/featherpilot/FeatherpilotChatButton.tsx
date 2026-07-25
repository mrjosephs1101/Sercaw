import { Sparkles } from 'lucide-react';
import iconUrl from '@assets/Sercaw_Icon_1783522244776.svg';
import { useFeatherpilotChatUi } from './FeatherpilotChatContext';

export function FeatherpilotChatButton() {
  const { isOpen, toggle } = useFeatherpilotChatUi();

  if (isOpen) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      className="fixed bottom-5 right-5 z-40 flex items-center gap-2 pl-3 pr-4 py-3 rounded-full bg-sunset-gradient text-white shadow-lg hover:shadow-xl hover:opacity-95 transition-all"
      aria-label="Chat with Featherpilot"
    >
      <img src={iconUrl} alt="" className="w-5 h-5 bird-flight" />
      <span className="text-sm font-medium">Chat with Featherpilot</span>
      <Sparkles size={14} className="opacity-80" />
    </button>
  );
}
