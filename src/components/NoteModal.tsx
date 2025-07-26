import React, { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { notesService, Note } from '@/services/notesService';

interface NoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note?: Note | null;
  onSave: (note: Note) => void;
}

const NoteModal: React.FC<NoteModalProps> = ({ open, onOpenChange, note, onSave }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content || '');
    } else {
      setTitle('');
      setContent('');
    }
  }, [note]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setTitle('');
      setContent('');
    }
  }, [open]);

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
      onOpenChange(false); // Close modal after successful save
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error('Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-sm sm:max-w-lg p-3 sm:p-6 space-y-2 sm:space-y-4 max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {note ? 'Edit Note' : 'Create New Note'}
          </DialogTitle>
        </DialogHeader>

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
            onClick={() => onOpenChange(false)}
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
      </DialogContent>
    </Dialog>
  );
};

export default NoteModal;