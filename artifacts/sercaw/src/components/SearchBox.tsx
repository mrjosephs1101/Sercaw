import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Camera, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchBoxProps {
  initialQuery?: string;
  autoFocus?: boolean;
  className?: string;
}

export function SearchBox({ initialQuery = '', autoFocus = false, className }: SearchBoxProps) {
  const [query, setQuery] = useState(initialQuery);
  const [image, setImage] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Check if there's a pending image
    const pendingImg = sessionStorage.getItem('sercaw_pending_image');
    if (pendingImg) {
      setImage(pendingImg);
    }
    
    // Update local query state when initialQuery changes (from URL)
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB — keeps the base64 payload comfortably under the API's body-size limit

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_IMAGE_BYTES) {
      window.alert('That image is too large. Please choose a photo under 5MB.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      setImage(dataUrl);
      sessionStorage.setItem('sercaw_pending_image', dataUrl);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImage(null);
    sessionStorage.removeItem('sercaw_pending_image');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() && !image) return;
    
    // Navigate to search results
    setLocation(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className={cn(
        "relative flex flex-col w-full max-w-2xl mx-auto rounded-3xl sm:rounded-full bg-card border border-border shadow-sm transition-all duration-300",
        isFocused ? "shadow-md ring-1 ring-primary/20 border-primary/30" : "hover:shadow-md hover:border-border/80",
        image ? "rounded-3xl sm:rounded-3xl p-2" : "p-1",
        className
      )}
    >
      {/* Image Preview Area */}
      {image && (
        <div className="flex items-center gap-3 mb-2 px-3 pt-2">
          <div className="relative group">
            <img 
              src={image} 
              alt="Search attachment" 
              className="w-16 h-16 object-cover rounded-xl border border-border/50"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute -top-2 -right-2 bg-foreground text-background rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-center w-full px-3 py-2">
        <Search className="w-5 h-5 text-muted-foreground ml-1 mr-3 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Search the web or ask Featherpilot..."
          className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-[15px] sm:text-base"
        />
        
        {/* Actions */}
        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted"
            >
              <X size={18} />
            </button>
          )}
          
          <div className="w-[1px] h-6 bg-border mx-1" />
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors group relative"
            title="Search by image"
          >
            <Camera size={20} className="group-hover:scale-110 transition-transform" />
            <input 
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </button>
        </div>
      </div>
    </form>
  );
}
