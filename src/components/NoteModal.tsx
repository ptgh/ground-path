import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { notesService, Note } from '@/services/notesService';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  note?: Note | null;
  onSave: (note: Note) => void;
}

const NoteModal: React.FC<NoteModalProps> = ({ isOpen, onClose, note, onSave }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  console.log('NoteModal render - isOpen:', isOpen);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content || '');
    } else {
      setTitle('');
      setContent('');
    }
  }, [note]);

  useEffect(() => {
    if (isOpen) {
      // Enhanced GSAP show animation with elegant effects
      gsap.set([overlayRef.current, modalRef.current], { 
        display: 'flex',
        opacity: 0 
      });
      gsap.set(modalRef.current, { 
        scale: 0.7, 
        y: 60, 
        rotationX: -15,
        transformPerspective: 1000
      });
      
      const tl = gsap.timeline();
      
      // Backdrop fade in with blur effect
      tl.to(overlayRef.current, { 
        opacity: 1, 
        duration: 0.4,
        ease: "power2.out"
      })
      // Modal entrance with elegant 3D effect
      .to(modalRef.current, { 
        opacity: 1, 
        scale: 1, 
        y: 0,
        rotationX: 0,
        duration: 0.6, 
        ease: "elastic.out(1, 0.8)" 
      }, 0.15)
      // Subtle glow effect
      .to(modalRef.current, {
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)",
        duration: 0.3,
        ease: "power2.out"
      }, 0.3);
      
    } else {
      // Enhanced GSAP hide animation
      const tl = gsap.timeline();
      
      tl.to(modalRef.current, { 
        opacity: 0, 
        scale: 0.8, 
        y: -30,
        rotationX: 15,
        duration: 0.3,
        ease: "power2.in"
      })
      .to(overlayRef.current, { 
        opacity: 0, 
        duration: 0.2,
        ease: "power2.in",
        onComplete: () => {
          gsap.set([overlayRef.current, modalRef.current], { 
            display: 'none',
            clearProps: "all" 
          });
        }
      }, 0.1);
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    try {
      setSaving(true);
      let savedNote: Note;

      if (note) {
        // Update existing note
        savedNote = await notesService.updateNote(note.id, {
          title: title.trim(),
          content: content.trim()
        });
        toast.success('Note updated successfully');
      } else {
        // Create new note
        savedNote = await notesService.createNote({
          title: title.trim(),
          content: content.trim()
        });
        toast.success('Note created successfully');
      }

      onSave(savedNote);
      handleClose();
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error('Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    console.log('NoteModal handleClose called, saving:', saving);
    if (saving) return;
    
    // Kill any running GSAP animations to prevent conflicts
    gsap.killTweensOf([modalRef.current, overlayRef.current]);
    
    // Reset form state
    setTitle('');
    setContent('');
    
    // Force close animation
    const tl = gsap.timeline();
    tl.to(modalRef.current, { 
      opacity: 0, 
      scale: 0.8, 
      y: -30,
      rotationX: 15,
      duration: 0.3,
      ease: "power2.in"
    })
    .to(overlayRef.current, { 
      opacity: 0, 
      duration: 0.2,
      ease: "power2.in",
      onComplete: () => {
        gsap.set([overlayRef.current, modalRef.current], { 
          display: 'none',
          clearProps: "all" 
        });
        onClose();
      }
    }, 0.1);
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-1 sm:p-4"
      style={{ display: 'none' }}
      onClick={(e) => e.target === overlayRef.current && handleClose()}
    >
      <div
        ref={modalRef}
        className="w-full max-w-sm sm:max-w-lg bg-background rounded-lg shadow-lg border p-3 sm:p-6 space-y-2 sm:space-y-4 max-h-[85vh] sm:max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {note ? 'Edit Note' : 'Create New Note'}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={saving}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 sm:mb-2 block">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter note title..."
              disabled={saving}
              className="text-base sm:text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 sm:mb-2 block">Content</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start writing your note here..."
              rows={4}
              disabled={saving}
              className="text-base sm:text-sm min-h-[120px] sm:min-h-[140px] resize-none"
            />
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:space-x-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={saving}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="w-full sm:w-auto"
          >
            {saving ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {note ? 'Update' : 'Create'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NoteModal;