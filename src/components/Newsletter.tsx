import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMailingListSubscription } from '@/hooks/useMailingList';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface Article {
  id: string;
  title: string;
  summary: string;
  category: string;
  slug: string;
  published_at: string;
  author_name: string | null;
}

const Newsletter = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const subscriptionMutation = useMailingListSubscription();
  const { toast } = useToast();

  useEffect(() => {
    fetchRecentArticles();
  }, []);

  const fetchRecentArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('newsletter_articles')
        .select('id, title, summary, category, slug, published_at, author_name')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    try {
      await subscriptionMutation.mutateAsync({
        email,
        name: name || undefined,
        source: 'homepage_newsletter',
        status: 'pending',
      });
      setEmail('');
      setName('');
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <section id="newsletter" className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-light text-gray-900 mb-4">
            Stay <span className="text-sage-600 font-normal">Connected</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get the latest insights on mental health, social work practice, and professional development delivered to your inbox.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Newsletter Signup */}
          <div className="lg:order-2">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl text-gray-900">Join Our Mailing List</CardTitle>
                <CardDescription>
                  Be the first to know about new articles, resources, and professional insights.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubscribe} className="space-y-4">
                  <div>
                    <Label htmlFor="newsletter-name">Name (Optional)</Label>
                    <Input
                      id="newsletter-name"
                      type="text"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="newsletter-email">Email Address</Label>
                    <Input
                      id="newsletter-email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-sage-600 hover:bg-sage-700 text-white"
                    disabled={subscriptionMutation.isPending}
                  >
                    {subscriptionMutation.isPending ? 'Subscribing...' : 'Subscribe'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Recent Articles */}
          <div className="lg:order-1">
            <h3 className="text-2xl font-light text-gray-900 mb-6">Recent Articles</h3>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : articles.length > 0 ? (
              <div className="space-y-6">
                {articles.map((article) => (
                  <article key={article.id} className="group">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h4 className="text-lg font-medium text-gray-900 group-hover:text-sage-600 transition-colors leading-tight">
                        {article.title}
                      </h4>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-sage-600 border-sage-600 hover:bg-sage-50"
                        asChild
                      >
                        <Link to={`/article/${article.slug}`}>
                          Read More
                        </Link>
                      </Button>
                    </div>
                    <p className="text-gray-600 text-sm mb-3 leading-relaxed">
                      {article.summary}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <Badge variant="secondary" className="bg-sage-100 text-sage-700">
                        {article.category}
                      </Badge>
                      <span>{formatDate(article.published_at)}</span>
                      {article.author_name && (
                        <>
                          <span>•</span>
                          <span>{article.author_name}</span>
                        </>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No articles available at the moment.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;