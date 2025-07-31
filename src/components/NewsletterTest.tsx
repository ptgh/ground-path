import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface NewsletterTestProps {
  isOpen: boolean;
  onClose: () => void;
}

const NewsletterTest = ({ isOpen, onClose }: NewsletterTestProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('');

  const sampleNewsletter = {
    subject: "Weekly Social Work Professional Update",
    previewText: "This week: New NDIS compliance guidelines, mental health assessment updates, and professional development opportunities",
    articles: [
      {
        title: "New NDIS Practice Standards: What Social Workers Need to Know",
        summary: "The NDIS Quality and Safeguards Commission has released updated practice standards affecting support coordination and psychosocial disability services. Learn about the key changes and compliance requirements.",
        link: "https://groundpath.com.au/article/ndis-practice-standards-2024",
        category: "NDIS COMPLIANCE"
      },
      {
        title: "Evidence-Based Approaches to Trauma-Informed Care",
        summary: "Recent research highlights effective trauma-informed care strategies for working with vulnerable populations. Discover practical techniques and assessment tools for your practice.",
        link: "https://groundpath.com.au/article/trauma-informed-care-approaches",
        category: "BEST PRACTICES"
      },
      {
        title: "Mental Health Assessment Tools: PHQ-9 and GAD-7 Updates",
        summary: "Updated guidelines for using PHQ-9 and GAD-7 assessments in clinical practice, including scoring interpretations and follow-up recommendations.",
        link: "https://groundpath.com.au/professional-forms",
        category: "ASSESSMENT TOOLS"
      },
      {
        title: "Professional Development: Upcoming CPD Opportunities",
        summary: "Explore upcoming workshops, webinars, and certification programs designed specifically for social workers and mental health professionals.",
        link: "https://groundpath.com.au/article/professional-development-opportunities",
        category: "PROFESSIONAL DEVELOPMENT"
      }
    ]
  };

  const sendTestNewsletter = async () => {
    if (!testEmail.trim()) {
      toast({
        title: "Email required",
        description: "Please enter an email address to send the test newsletter.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-newsletter', {
        body: {
          ...sampleNewsletter,
          testEmail: testEmail.trim()
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Test newsletter sent! 📧",
        description: `Sample newsletter sent successfully to ${testEmail}`,
      });
      
      setTestEmail('');
      onClose();
    } catch (error: any) {
      console.error('Error sending test newsletter:', error);
      toast({
        title: "Failed to send newsletter",
        description: error.message || "An error occurred while sending the test newsletter.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-sage-600" />
            Test Newsletter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              This will send a sample newsletter to test the email functionality. 
              The newsletter includes current social work topics and professional resources.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div>
              <Label htmlFor="test-email">Test Email Address</Label>
              <Input
                id="test-email"
                type="email"
                placeholder="Enter email to receive test newsletter"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Sample Newsletter Preview</Label>
              <div className="mt-2 p-4 bg-gray-50 rounded-lg space-y-3">
                <div>
                  <p className="font-semibold text-sm">Subject:</p>
                  <p className="text-sm text-gray-700">{sampleNewsletter.subject}</p>
                </div>
                <div>
                  <p className="font-semibold text-sm">Articles included:</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {sampleNewsletter.articles.map((article, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-sage-600 font-medium text-xs bg-sage-100 px-2 py-0.5 rounded">
                          {article.category}
                        </span>
                        <span>{article.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={sendTestNewsletter}
              disabled={isLoading || !testEmail.trim()}
              className="bg-sage-600 hover:bg-sage-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Test Newsletter
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewsletterTest;