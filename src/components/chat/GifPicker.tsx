import { useState, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';

const GIPHY_API_KEY = 'a3s3zsZgqGuGV0J90m4syOKhD4XsT8Pl';

interface Gif {
  id: string;
  url: string;
  preview: string;
  title: string;
}

interface GifPickerProps {
  onSelect: (gifUrl: string) => void;
  onClose: () => void;
}

export function GifPicker({ onSelect, onClose }: GifPickerProps) {
  const [query, setQuery] = useState('');
  const [gifs, setGifs] = useState<Gif[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchGifs = useCallback(async (searchQuery: string) => {
    setLoading(true);
    try {
      const endpoint = searchQuery.trim()
        ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(searchQuery)}&limit=20&rating=g&lang=pt`
        : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=20&rating=g`;

      const res = await fetch(endpoint);
      const data = await res.json();
      const mapped: Gif[] = (data.data || []).map((g: Record<string, unknown>) => ({
        id: g.id as string,
        url: (g as Record<string, Record<string, Record<string, Record<string, string>>>>).images.original.url,
        preview: (g as Record<string, Record<string, Record<string, Record<string, string>>>>).images.fixed_width_small.url,
        title: g.title as string,
      }));
      setGifs(mapped);
    } catch {
      setGifs([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchGifs('');
  }, [fetchGifs]);

  useEffect(() => {
    const timer = setTimeout(() => fetchGifs(query), 400);
    return () => clearTimeout(timer);
  }, [query, fetchGifs]);

  return (
    <div className="absolute bottom-full left-0 right-0 mb-1 mx-3 glass-strong rounded-2xl p-3 max-h-80 flex flex-col animate-fade-in z-50">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar GIFs…"
            className="w-full bg-muted/50 rounded-lg pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/50"
            autoFocus
          />
        </div>
        <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : gifs.length === 0 ? (
          <p className="text-center text-muted-foreground text-xs py-4">Nenhum GIF encontrado</p>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {gifs.map((gif) => (
              <button
                key={gif.id}
                onClick={() => onSelect(gif.url)}
                className="rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition-all aspect-square"
              >
                <img src={gif.preview} alt={gif.title} className="w-full h-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="text-center text-[10px] text-muted-foreground mt-1">Powered by GIPHY</p>
    </div>
  );
}
