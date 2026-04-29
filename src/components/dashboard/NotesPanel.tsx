import React, { useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import {
  ArrowDownAZ,
  Download,
  FileSpreadsheet,
  FileText,
  MessageCircle,
  Pin,
  PinOff,
  PlusCircle,
  Search,
  StickyNote,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Note, notesService, isAIConversationNote, isPinned } from '@/services/notesService';
import { exportNotesToCsv, exportNotesToPdf } from '@/lib/notesExport';
import NoteModal from '@/components/NoteModal';
import AIConversationViewModal from '@/components/AIConversationViewModal';

type Filter = 'all' | 'ai' | 'notes';
type Sort = 'newest' | 'oldest' | 'title';

const NotesPanel: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('newest');
  const [editNote, setEditNote] = useState<Note | null>(null);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [aiNote, setAiNote] = useState<Note | null>(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [pinningId, setPinningId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const data = await notesService.getNotes();
      setNotes(data);
    } catch (error) {
      console.error('Error loading notes:', error);
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matched = notes.filter((note) => {
      const isAI = isAIConversationNote(note);
      if (filter === 'ai' && !isAI) return false;
      if (filter === 'notes' && isAI) return false;
      if (!q) return true;
      const haystack = `${note.title} ${note.content ?? ''}`.toLowerCase();
      return haystack.includes(q);
    });

    const compare = (a: Note, b: Note) => {
      // Pinned items always at the top
      const ap = isPinned(a) ? 1 : 0;
      const bp = isPinned(b) ? 1 : 0;
      if (ap !== bp) return bp - ap;

      switch (sort) {
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'title':
          return (a.title ?? '').localeCompare(b.title ?? '', undefined, { sensitivity: 'base' });
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    };

    return [...matched].sort(compare);
  }, [notes, search, filter, sort]);

  // GSAP entrance for list items whenever the visible set changes
  useEffect(() => {
    if (!listRef.current) return;
    const cards = listRef.current.querySelectorAll('[data-note-card]');
    if (!cards.length) return;
    gsap.fromTo(
      cards,
      { opacity: 0, y: 8, scale: 0.985 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.32,
        stagger: 0.035,
        ease: 'power3.out',
        clearProps: 'transform',
      }
    );
  }, [filter, search, sort, loading]);

  // Hover lift micro-interaction on each card
  useEffect(() => {
    if (!listRef.current) return;
    const cards = Array.from(listRef.current.querySelectorAll<HTMLElement>('[data-note-card]'));
    const cleanups: Array<() => void> = [];

    cards.forEach((card) => {
      const enter = () => {
        gsap.to(card, { y: -2, duration: 0.2, ease: 'power2.out' });
      };
      const leave = () => {
        gsap.to(card, { y: 0, duration: 0.25, ease: 'power2.out' });
      };
      const down = () => {
        gsap.to(card, { scale: 0.985, duration: 0.1, ease: 'power2.out' });
      };
      const up = () => {
        gsap.to(card, { scale: 1, duration: 0.18, ease: 'back.out(2)' });
      };
      card.addEventListener('mouseenter', enter);
      card.addEventListener('mouseleave', leave);
      card.addEventListener('mousedown', down);
      card.addEventListener('mouseup', up);
      cleanups.push(() => {
        card.removeEventListener('mouseenter', enter);
        card.removeEventListener('mouseleave', leave);
        card.removeEventListener('mousedown', down);
        card.removeEventListener('mouseup', up);
      });
    });

    return () => cleanups.forEach((c) => c());
  }, [filtered]);

  const counts = useMemo(() => {
    let ai = 0;
    let plain = 0;
    let pinned = 0;
    notes.forEach((n) => {
      if (isAIConversationNote(n)) ai++;
      else plain++;
      if (isPinned(n)) pinned++;
    });
    return { all: notes.length, ai, notes: plain, pinned };
  }, [notes]);

  const openNote = (note: Note) => {
    if (isAIConversationNote(note)) {
      setAiNote(note);
      setAiModalOpen(true);
    } else {
      setEditNote(note);
      setNoteModalOpen(true);
    }
  };

  const handleSaved = (saved: Note) => {
    setNotes((prev) => {
      const exists = prev.some((n) => n.id === saved.id);
      return exists ? prev.map((n) => (n.id === saved.id ? saved : n)) : [saved, ...prev];
    });
  };

  const handleDelete = async (id: string) => {
    try {
      await notesService.deleteNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      toast.success('Deleted');
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete');
    }
  };

  const togglePin = async (note: Note, btn: HTMLElement | null) => {
    const next = !isPinned(note);
    setPinningId(note.id);
    try {
      const updated = await notesService.setPinned(note, next);
      setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      if (btn) {
        gsap.fromTo(
          btn,
          { scale: 0.6, rotate: next ? -25 : 25 },
          { scale: 1, rotate: 0, duration: 0.5, ease: 'elastic.out(1, 0.5)' }
        );
      }
      toast.success(next ? 'Pinned to top' : 'Unpinned');
    } catch (error) {
      console.error('Error toggling pin:', error);
      toast.error('Failed to update pin');
    } finally {
      setPinningId(null);
    }
  };

  const handleExportCsv = () => {
    if (filtered.length === 0) {
      toast.error('Nothing to export');
      return;
    }
    exportNotesToCsv(filtered);
    toast.success(`Exported ${filtered.length} item${filtered.length === 1 ? '' : 's'} as CSV`);
  };

  const handleExportPdf = () => {
    if (filtered.length === 0) {
      toast.error('Nothing to export');
      return;
    }
    exportNotesToPdf(filtered);
    toast.success(`Exported ${filtered.length} item${filtered.length === 1 ? '' : 's'} as PDF`);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-primary" />
              Your Notes & Activities
            </CardTitle>
            <CardDescription className="mt-1">
              {counts.all > 0
                ? `${counts.all} item${counts.all === 1 ? '' : 's'} · ${counts.ai} AI chat${counts.ai === 1 ? '' : 's'} · ${counts.notes} note${counts.notes === 1 ? '' : 's'}${counts.pinned ? ` · ${counts.pinned} pinned` : ''}`
                : 'Manage your professional notes and AI conversations'}
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                  <Download className="h-4 w-4 mr-1.5" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportCsv}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPdf}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground"
              size="sm"
              onClick={() => {
                setEditNote(null);
                setNoteModalOpen(true);
              }}
            >
              <PlusCircle className="h-4 w-4 mr-1.5" />
              New Note
            </Button>
          </div>
        </div>

        {/* Search + Filters + Sort */}
        <div className="mt-4 flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes and AI conversations..."
              className="pl-9 pr-9"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)} className="flex-1">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="all" className="text-xs">
                  All ({counts.all})
                </TabsTrigger>
                <TabsTrigger value="ai" className="text-xs">
                  <MessageCircle className="h-3 w-3 mr-1" />
                  AI Chats ({counts.ai})
                </TabsTrigger>
                <TabsTrigger value="notes" className="text-xs">
                  <StickyNote className="h-3 w-3 mr-1" />
                  My Notes ({counts.notes})
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
              <SelectTrigger className="w-full sm:w-[160px] text-xs">
                <ArrowDownAZ className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="title">Title (A–Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 rounded-lg border border-border">
                <Skeleton className="h-4 w-2/3 mb-2" />
                <Skeleton className="h-3 w-full mb-1" />
                <Skeleton className="h-3 w-1/4 mt-2" />
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div ref={listRef} className="space-y-2">
            {filtered.map((note) => {
              const isAI = isAIConversationNote(note);
              const pinned = isPinned(note);
              return (
                <div
                  key={note.id}
                  data-note-card
                  className={`group p-4 rounded-lg border cursor-pointer transition-colors ${
                    pinned
                      ? 'border-primary/40 bg-primary/[0.03] hover:border-primary/60'
                      : 'border-border hover:border-primary/40 hover:shadow-sm'
                  }`}
                  onClick={() => openNote(note)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {pinned && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary text-primary-foreground">
                            <Pin className="h-2.5 w-2.5" />
                            Pinned
                          </span>
                        )}
                        {isAI ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                            <MessageCircle className="h-2.5 w-2.5" />
                            AI Chat
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            <StickyNote className="h-2.5 w-2.5" />
                            Note
                          </span>
                        )}
                        <h4 className="font-medium text-sm group-hover:text-primary truncate">
                          {note.title}
                        </h4>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {note.content || 'No content'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] text-muted-foreground mt-0.5 mr-1">
                        {new Date(note.created_at).toLocaleDateString('en-AU', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                      <button
                        type="button"
                        disabled={pinningId === note.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          void togglePin(note, e.currentTarget);
                        }}
                        className={`p-1 rounded transition-opacity ${
                          pinned
                            ? 'text-primary opacity-100'
                            : 'opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary hover:bg-primary/10'
                        }`}
                        aria-label={pinned ? 'Unpin' : 'Pin to top'}
                        title={pinned ? 'Unpin' : 'Pin to top'}
                      >
                        {pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Delete this item?')) void handleDelete(note.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <StickyNote className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              {search || filter !== 'all' ? 'No results' : 'No notes yet'}
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1 max-w-xs mx-auto">
              {search || filter !== 'all'
                ? 'Try a different search term or filter.'
                : 'Create your first note or start an AI conversation to see it here.'}
            </p>
          </div>
        )}
      </CardContent>

      <NoteModal
        open={noteModalOpen}
        onOpenChange={setNoteModalOpen}
        note={editNote}
        onSave={handleSaved}
      />
      <AIConversationViewModal
        open={aiModalOpen}
        onOpenChange={setAiModalOpen}
        note={aiNote}
        onDelete={handleDelete}
      />
    </Card>
  );
};

export default NotesPanel;
