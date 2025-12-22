import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface GeneratedArticle {
  title: string;
  summary: string;
  content: string;
  category: string;
  slug: string;
}

async function generateArticles(): Promise<GeneratedArticle[]> {
  console.log('Starting article generation with OpenAI...');
  
  const categories = [
    'Mental Health',
    'Social Work Practice', 
    'Self-Care',
    'Professional Development',
    'Community Resources'
  ];
  
  const randomCategory = categories[Math.floor(Math.random() * categories.length)];
  
  const prompt = `You are an expert content writer for Australian social workers and mental health professionals. 
Generate 2 unique, high-quality articles that would be valuable for this audience.

Focus on the category: ${randomCategory}

For each article, provide:
1. A compelling title (max 80 characters)
2. A brief summary (max 200 characters)
3. Full article content (500-800 words, formatted with proper paragraphs)
4. Category (use: ${randomCategory})
5. A URL-friendly slug (lowercase, hyphens, no special characters)

Topics should be relevant to Australian social work practice, mental health support, NDIS, aged care, child protection, or professional development.

Return the response as a JSON array with exactly 2 articles in this format:
[
  {
    "title": "Article Title",
    "summary": "Brief summary of the article",
    "content": "Full article content with multiple paragraphs...",
    "category": "${randomCategory}",
    "slug": "url-friendly-slug"
  }
]

Only return valid JSON, no additional text.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a professional content writer specializing in social work and mental health topics for Australian professionals. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse the JSON response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('Failed to extract JSON from response:', content);
      throw new Error('Failed to parse article JSON');
    }
    
    const articles: GeneratedArticle[] = JSON.parse(jsonMatch[0]);
    console.log(`Successfully generated ${articles.length} articles`);
    
    return articles;
  } catch (error) {
    console.error('Error generating articles:', error);
    throw error;
  }
}

async function saveArticlesToDatabase(articles: GeneratedArticle[]): Promise<number> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  let savedCount = 0;
  const now = new Date().toISOString();
  
  for (const article of articles) {
    // Generate unique slug with timestamp to avoid conflicts
    const uniqueSlug = `${article.slug}-${Date.now()}`;
    
    const { error } = await supabase
      .from('newsletter_articles')
      .insert({
        title: article.title,
        summary: article.summary,
        content: article.content,
        category: article.category,
        slug: uniqueSlug,
        status: 'published',
        featured: false,
        published_at: now,
        author_name: 'Social Work Hub Team'
      });
    
    if (error) {
      console.error('Error saving article:', error);
    } else {
      console.log(`Saved article: ${article.title}`);
      savedCount++;
    }
  }
  
  return savedCount;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Generate articles function called');
    
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    
    // Generate articles using OpenAI
    const articles = await generateArticles();
    
    // Save to database
    const savedCount = await saveArticlesToDatabase(articles);
    
    const result = {
      success: true,
      message: `Generated and saved ${savedCount} new articles`,
      articlesGenerated: articles.length,
      articlesSaved: savedCount,
      timestamp: new Date().toISOString()
    };
    
    console.log('Article generation complete:', result);
    
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-articles function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
