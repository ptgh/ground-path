import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  PlusCircle, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Loader2,
  FileText,
  Calendar,
  Star,
  ExternalLink
} from 'lucide-react';

interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  slug: string;
  status: string;
  featured: boolean;
  author_name: string | null;
  source_url: string | null;
  source_name: string | null;
  published_at: string;
  created_at: string;
  updated_at: string;
}

interface ArticleFormData {
  title: string;
  summary: string;
  content: string;
  category: string;
  slug: string;
  status: string;
  featured: boolean;
  author_name: string;
  source_url: string;
  source_name: string;
}

const CATEGORIES = [
  'Best Practices',
  'NDIS Updates',
  'Mental Health',
  'Professional Development',
  'Policy & News',
  'Self-Care',
  'Ethics & Standards'
];

const initialFormData: ArticleFormData = {
  title: '',
  summary: '',
  content: '',
  category: 'Best Practices',
  slug: '',
  status: 'draft',
  featured: false,
  author_name: '',
  source_url: '',
  source_name: ''
};

export const ArticleManager = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [formData, setFormData] = useState<ArticleFormData>(initialFormData);

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('newsletter_articles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error('Error loading articles:', error);
      toast.error('Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim() + '-' + Date.now();
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title)
    }));
  };

  const openCreateDialog = () => {
    setEditingArticle(null);
    setFormData(initialFormData);
    setIsDialogOpen(true);
  };

  const openEditDialog = (article: Article) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      summary: article.summary,
      content: article.content,
      category: article.category,
      slug: article.slug,
      status: article.status || 'draft',
      featured: article.featured || false,
      author_name: article.author_name || '',
      source_url: article.source_url || '',
      source_name: article.source_name || ''
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.summary.trim() || !formData.content.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);

      const articleData = {
        title: formData.title.trim(),
        summary: formData.summary.trim(),
        content: formData.content.trim(),
        category: formData.category,
        slug: formData.slug || generateSlug(formData.title),
        status: formData.status,
        featured: formData.featured,
        author_name: formData.author_name.trim() || null,
        source_url: formData.source_url.trim() || null,
        source_name: formData.source_name.trim() || null,
        published_at: formData.status === 'published' ? new Date().toISOString() : (editingArticle?.published_at || new Date().toISOString())
      };

      if (editingArticle) {
        const { error } = await supabase
          .from('newsletter_articles')
          .update(articleData)
          .eq('id', editingArticle.id);

        if (error) throw error;
        toast.success('Article updated successfully');
      } else {
        const { error } = await supabase
          .from('newsletter_articles')
          .insert(articleData);

        if (error) throw error;
        toast.success('Article created successfully');
      }

      setIsDialogOpen(false);
      loadArticles();
    } catch (error) {
      console.error('Error saving article:', error);
      toast.error(error.message || 'Failed to save article');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (articleId: string) => {
    try {
      const { error } = await supabase
        .from('newsletter_articles')
        .delete()
        .eq('id', articleId);

      if (error) throw error;
      toast.success('Article deleted successfully');
      loadArticles();
    } catch (error) {
      console.error('Error deleting article:', error);
      toast.error('Failed to delete article');
    }
  };

  const togglePublishStatus = async (article: Article) => {
    const newStatus = article.status === 'published' ? 'draft' : 'published';
    try {
      const { error } = await supabase
        .from('newsletter_articles')
        .update({ 
          status: newStatus,
          published_at: newStatus === 'published' ? new Date().toISOString() : article.published_at
        })
        .eq('id', article.id);

      if (error) throw error;
      toast.success(`Article ${newStatus === 'published' ? 'published' : 'unpublished'} successfully`);
      loadArticles();
    } catch (error) {
      console.error('Error updating article status:', error);
      toast.error('Failed to update article status');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800">Published</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Article Management
              </CardTitle>
              <CardDescription>
                Create, edit, and publish articles for the newsletter
              </CardDescription>
            </div>
            <Button 
              onClick={openCreateDialog}
              className="bg-sage-600 hover:bg-sage-700 text-white"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              New Article
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {articles.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No articles yet. Create your first article to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {articles.map((article) => (
                <Card key={article.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {getStatusBadge(article.status || 'draft')}
                          <Badge variant="outline" className="text-xs">
                            {article.category}
                          </Badge>
                          {article.featured && (
                            <Badge className="bg-amber-100 text-amber-800">
                              <Star className="h-3 w-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-lg truncate">{article.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {article.summary}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(article.created_at).toLocaleDateString()}
                          </span>
                          {article.author_name && (
                            <span>By {article.author_name}</span>
                          )}
                          {article.source_url && (
                            <a 
                              href={article.source_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 hover:text-sage-600"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Source
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => togglePublishStatus(article)}
                          title={article.status === 'published' ? 'Unpublish' : 'Publish'}
                        >
                          {article.status === 'published' ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(article)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Article</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{article.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(article.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Article Editor Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingArticle ? 'Edit Article' : 'Create New Article'}
            </DialogTitle>
            <DialogDescription>
              {editingArticle 
                ? 'Update the article details below.' 
                : 'Fill in the details to create a new article.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Article title"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">Summary *</Label>
              <Textarea
                id="summary"
                value={formData.summary}
                onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                placeholder="Brief summary of the article (2-3 sentences)"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content * (HTML supported)</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Full article content. HTML tags are supported for formatting."
                rows={10}
                className="font-mono text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="author_name">Author Name</Label>
                <Input
                  id="author_name"
                  value={formData.author_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, author_name: e.target.value }))}
                  placeholder="Article author"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="article-url-slug"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="source_url">Source URL</Label>
                <Input
                  id="source_url"
                  type="url"
                  value={formData.source_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, source_url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="source_name">Source Name</Label>
                <Input
                  id="source_name"
                  value={formData.source_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, source_name: e.target.value }))}
                  placeholder="Source publication name"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="featured"
                checked={formData.featured}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featured: checked }))}
              />
              <Label htmlFor="featured">Featured Article</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="bg-sage-600 hover:bg-sage-700 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                editingArticle ? 'Update Article' : 'Create Article'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ArticleManager;