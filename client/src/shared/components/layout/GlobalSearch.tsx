import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MessageSquare, Clock, X, Command, Sparkles } from 'lucide-react';
import { useAIChatStore } from '@/shared/stores/useAIChatStore';
import { Dialog, DialogContent } from '@/shared/components/ui/Dialog';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { cn } from '@/lib/utils';
import type { SearchResult } from '@/shared/types/chat';

interface GlobalSearchProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const navigate = useNavigate();
    const { searchConversations, setCurrentConversationById } = useAIChatStore();

    const handleSearch = useCallback(async (q: string) => {
        if (q.trim().length < 2) {
            setResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const data = await searchConversations(q);
            setResults(data);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setIsSearching(false);
        }
    }, [searchConversations]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            handleSearch(query);
        }, 300);
        return () => clearTimeout(timer);
    }, [query, handleSearch]);

    const handleSelect = async (id: string) => {
        await setCurrentConversationById(id);
        navigate('/chat');
        onOpenChange(false);
        setQuery('');
    };

    // Handle keyboard shortcuts
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                onOpenChange(true);
            }
        };
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, [onOpenChange]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl p-0 overflow-hidden border-none shadow-2xl">
                <div className="flex flex-col h-[500px] bg-background">
                    {/* Search Input Area */}
                    <div className="flex items-center px-4 py-3 border-b border-border/40 gap-3">
                        <Search className="w-5 h-5 text-muted-foreground" />
                        <input
                            autoFocus
                            className="flex-1 bg-transparent border-none outline-none text-base placeholder:text-muted-foreground/60"
                            placeholder="Search conversations and messages..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        {query && (
                            <button
                                onClick={() => setQuery('')}
                                className="p-1 hover:bg-muted rounded-full transition-colors"
                            >
                                <X className="w-4 h-4 text-muted-foreground" />
                            </button>
                        )}
                        <div className="flex items-center gap-1 border rounded px-1.5 py-0.5 bg-muted/50 text-[10px] font-medium text-muted-foreground">
                            <span className="text-[12px]">ESC</span>
                        </div>
                    </div>

                    {/* Results Area */}
                    <div className="flex-1 overflow-y-auto min-h-0 p-2 space-y-1 custom-scrollbar">
                        {isSearching ? (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2 opacity-60">
                                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                <span className="text-sm">Searching your history...</span>
                            </div>
                        ) : query.length > 0 && results.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-10">
                                <Search className="w-10 h-10 mb-3 opacity-20" />
                                <p className="text-sm">No matches found for "{query}"</p>
                                <p className="text-xs opacity-60 mt-1">Try a different keyword</p>
                            </div>
                        ) : query.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-10 space-y-4">
                                <div className="p-3 rounded-2xl bg-primary/5">
                                    <Command className="w-8 h-8 text-primary/40" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-medium">Search Everything</p>
                                    <p className="text-xs opacity-60 mt-1">Search through your chats and message history</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                                    Chat Matches ({results.length})
                                </p>
                                {results.map((result) => (
                                    <button
                                        key={result.id}
                                        onClick={() => handleSelect(result.id)}
                                        className="w-full flex flex-col items-start p-3 rounded-lg hover:bg-muted/80 transition-all group text-left border border-transparent hover:border-border/40"
                                    >
                                        <div className="flex items-center w-full gap-2 mb-1">
                                            <MessageSquare className="w-4 h-4 text-primary opacity-60 group-hover:opacity-100 transition-opacity" />
                                            <span className="text-sm font-medium truncate flex-1">
                                                {result.title}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground whitespace-nowrap bg-muted px-1.5 py-0.5 rounded leading-none">
                                                {new Date(result.updated_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        {result.snippet && (
                                            <p className="text-xs text-muted-foreground line-clamp-2 pl-6 opacity-80 group-hover:opacity-100 transition-opacity italic">
                                                "...{result.snippet}..."
                                            </p>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer Area */}
                    <div className="px-4 py-2 border-t border-border/40 bg-muted/20 flex items-center justify-between text-[11px] text-muted-foreground">
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                                <kbd className="px-1 border rounded bg-background shadow-xs">ENTER</kbd> to open
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="px-1 border rounded bg-background shadow-xs">↑↓</kbd> to navigate
                            </span>
                        </div>
                        <div className="flex items-center gap-1 opacity-60">
                            <Sparkles className="w-3 h-3" />
                            <span>Semantic search coming soon</span>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
