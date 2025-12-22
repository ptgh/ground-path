import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Loader2, Calendar, User, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  slug: string;
  published_at: string;
  author_name: string;
  featured: boolean;
}

const Article = () => {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchArticle = async () => {
      if (!slug) {
        setError('Article not found');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('newsletter_articles')
          .select('*')
          .eq('slug', slug)
          .eq('status', 'published')
          .single();

        if (error) throw error;
        setArticle(data);

        // Fetch related articles (same category, excluding current)
        if (data) {
          const { data: related } = await supabase
            .from('newsletter_articles')
            .select('*')
            .eq('status', 'published')
            .eq('category', data.category)
            .neq('slug', slug)
            .order('published_at', { ascending: false })
            .limit(2);
          
          setRelatedArticles(related || []);
        }
      } catch (err: any) {
        console.error('Error fetching article:', err);
        setError('Article not found');
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-sage-600" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center min-h-[400px] flex flex-col items-center justify-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Article Not Found</h1>
            <p className="text-muted-foreground mb-8">The article you're looking for doesn't exist or has been removed.</p>
            <Button asChild>
              <Link to="/resources">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Resources
              </Link>
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back button */}
          <Button variant="ghost" asChild className="mb-6">
            <Link to="/resources">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Resources
            </Link>
          </Button>

          {/* Article header */}
          <header className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary" className="bg-sage-100 text-sage-700">
                {article.category}
              </Badge>
              {article.featured && (
                <Badge variant="default" className="bg-sage-600 text-white">
                  Featured
                </Badge>
              )}
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {article.title}
            </h1>
            
            <p className="text-lg text-muted-foreground mb-6">
              {article.summary}
            </p>
            
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              {article.author_name && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{article.author_name}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{new Date(article.published_at).toLocaleDateString()}</span>
              </div>
            </div>
          </header>

          {/* Article content */}
          <article 
            className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground prose-a:text-sage-600 hover:prose-a:text-sage-700"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          {/* Continue Reading Section */}
          {relatedArticles.length > 0 && (
            <div className="mt-12 border-t border-sage-200 pt-8">
              <h3 className="text-xl font-semibold text-foreground mb-6">Continue Reading</h3>
              <div className="grid gap-4">
                {relatedArticles.map((related) => (
                  <Link 
                    key={related.id}
                    to={`/article/${related.slug}`}
                    className="group block p-4 bg-sage-50 rounded-lg border border-sage-200 hover:border-sage-400 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <Badge variant="secondary" className="bg-sage-100 text-sage-700 mb-2">
                          {related.category}
                        </Badge>
                        <h4 className="font-medium text-foreground group-hover:text-sage-600 transition-colors">
                          {related.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {related.summary}
                        </p>
                      </div>
                      <ArrowLeft className="h-5 w-5 text-sage-600 rotate-180 shrink-0 mt-1" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Footer CTA */}
          <div className="mt-12 p-6 bg-sage-50 rounded-lg border border-sage-200">
            <h3 className="text-xl font-semibold text-sage-800 mb-2">
              Stay Updated with Professional Resources
            </h3>
            <p className="text-sage-700 mb-4">
              Get the latest articles, assessment tools, and professional development opportunities delivered to your inbox.
            </p>
            <Button asChild className="bg-sage-600 hover:bg-sage-700 text-white">
              <Link to="/#newsletter">Subscribe to Newsletter</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Article;