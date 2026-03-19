import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Link2, X } from 'lucide-react';

interface ResourceShareFormProps {
  onSubmit: (resource: { url: string; title: string; description: string }) => void;
  onCancel: () => void;
}

export const ResourceShareForm = ({ onSubmit, onCancel }: ResourceShareFormProps) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return;
    // Basic URL validation
    try {
      new URL(trimmedUrl.startsWith('http') ? trimmedUrl : `https://${trimmedUrl}`);
    } catch {
      return;
    }
    onSubmit({
      url: trimmedUrl.startsWith('http') ? trimmedUrl : `https://${trimmedUrl}`,
      title: title.trim() || trimmedUrl,
      description: description.trim(),
    });
  };

  return (
    <div className="p-3 bg-muted/50 border-b border-border space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
          <Link2 className="h-3.5 w-3.5" />
          Share a Resource
        </span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCancel}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      <Input
        placeholder="Resource URL *"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="h-8 text-sm"
      />
      <Input
        placeholder="Title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="h-8 text-sm"
      />
      <Textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="text-sm min-h-[48px] resize-none"
        rows={2}
      />
      <Button
        size="sm"
        className="h-8 bg-sage-600 hover:bg-sage-700 text-white"
        onClick={handleSubmit}
        disabled={!url.trim()}
      >
        Share Resource
      </Button>
    </div>
  );
};
