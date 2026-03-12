import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Loader2, Calendar, User, ArrowLeft, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import gsap from 'gsap';

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
  source_url: string | null;
  source_name: string | null;
}

// Format plain text content into proper HTML paragraphs
const formatArticleContent = (content: string): string => {
  // If content already has HTML tags, return as-is
  if (/<[a-z][\s\S]*>/i.test(content) && (content.includes('<p>') || content.includes('<h') || content.includes('<ul>'))) {
    return content;
  }
  
  // Split by double newlines or sentence boundaries for paragraphing
  const paragraphs = content
    .split(/\n\n+/)
    .filter(p => p.trim());
  
  if (paragraphs.length <= 1 && content.length > 500) {
    // Single block of text - split into paragraphs by sentences
    const sentences = content.match(/[^.!?]+[.!?]+/g) || [content];
    const chunks: string[] = [];
    let current = '';
    
    sentences.forEach((sentence, i) => {
      current += sentence;
      // Create paragraph every 3-4 sentences
      if ((i + 1) % 3 === 0 || i === sentences.length - 1) {
        chunks.push(current.trim());
        current = '';
      }
    });
    
    return chunks
      .filter(c => c.trim())
      .map(chunk => `<p>${chunk.trim()}</p>`)
      .join('');
  }
  
  return paragraphs
    .map(p => `<p>${p.trim()}</p>`)
    .join('');
};

const Article = () => {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const articleRef = useRef<HTMLDivElement>(null);

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

  // Subtle entrance animation
  useEffect(() => {
    if (!loading && article && articleRef.current) {
      gsap.fromTo(
        articleRef.current,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
      );
    }
  }, [loading, article]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
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

  const formattedContent = formatArticleContent(article.content);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div ref={articleRef} className="max-w-3xl mx-auto opacity-0">
          {/* Back button */}
          <Button variant="ghost" asChild className="mb-6">
            <Link to="/resources">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Resources
            </Link>
          </Button>

          {/* Article header */}
          <header className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {article.category}
              </Badge>
              {article.featured && (
                <Badge variant="default" className="bg-primary text-primary-foreground">
                  Featured
                </Badge>
              )}
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
              {article.title}
            </h1>
            
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed italic">
              {article.summary}
            </p>
            
            <div className="flex items-center gap-6 text-sm text-muted-foreground border-t border-border pt-4">
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

          {/* Separator */}
          <div className="w-16 h-0.5 bg-primary/30 mb-10" />

          {/* Article content */}
          <article 
            className="prose prose-lg max-w-none 
              prose-headings:text-foreground prose-headings:font-semibold prose-headings:mt-10 prose-headings:mb-5
              prose-p:text-foreground prose-p:leading-[1.85] prose-p:mb-6 prose-p:text-base
              prose-li:text-foreground prose-li:leading-relaxed
              prose-strong:text-foreground 
              prose-a:text-primary hover:prose-a:text-primary/80
              prose-blockquote:border-primary/30 prose-blockquote:text-muted-foreground prose-blockquote:italic
              prose-ul:my-6 prose-ol:my-6
              [&_p+p]:mt-6"
            dangerouslySetInnerHTML={{ __html: formattedContent }}
          />

          {/* Source Citation */}
          {article.source_url && (
            <div className="mt-10 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground font-medium">Source:</span>
                <a 
                  href={article.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 hover:underline inline-flex items-center gap-1"
                >
                  {article.source_name || 'Read more at source'}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}

          {/* Continue Reading Section */}
          {relatedArticles.length > 0 && (
            <div className="mt-14 border-t border-border pt-8">
              <h3 className="text-xl font-semibold text-foreground mb-6">Continue Reading</h3>
              <div className="grid gap-4">
                {relatedArticles.map((related) => (
                  <Link 
                    key={related.id}
                    to={`/article/${related.slug}`}
                    className="group block p-5 bg-muted/30 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <Badge variant="secondary" className="bg-primary/10 text-primary mb-2">
                          {related.category}
                        </Badge>
                        <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {related.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {related.summary}
                        </p>
                      </div>
                      <ArrowLeft className="h-5 w-5 text-primary rotate-180 shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Footer CTA */}
          <div className="mt-14 p-6 bg-primary/5 rounded-lg border border-primary/20">
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Stay Updated with Professional Resources
            </h3>
            <p className="text-muted-foreground mb-4">
              Get the latest articles, assessment tools, and professional development opportunities delivered to your inbox.
            </p>
            <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
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
