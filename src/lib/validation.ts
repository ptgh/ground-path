import { z } from 'zod';

// Security-focused validation utilities

// XSS prevention - sanitize HTML content
export const sanitizeHtml = (input: string): string => {
  if (!input) return '';
  
  // Remove potential XSS vectors - more specific patterns to avoid breaking valid content
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/\bon\w+\s*=/gi, '') // More specific - only match HTML event handlers
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*>/gi, '')
    .trim();
};

// Rate limiting storage
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting check
export const checkRateLimit = (identifier: string, maxRequests: number = 5, windowMs: number = 60000): boolean => {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
};

// Input validation schemas
export const contactFormSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .regex(/^[a-zA-Z\s\-'.]+$/, 'Name contains invalid characters')
    .transform(sanitizeHtml),
  email: z.string()
    .email('Please enter a valid email address')
    .max(254, 'Email address is too long')
    .toLowerCase(), // Remove sanitizeHtml transform from email
  subject: z.string()
    .min(1, 'Subject is required')
    .max(200, 'Subject must not exceed 200 characters')
    .transform(sanitizeHtml),
  message: z.string()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message must not exceed 2000 characters')
    .transform(sanitizeHtml),
  intake_type: z.enum(['client', 'practitioner', 'other'], {
    required_error: 'Please tell us why you are reaching out',
    invalid_type_error: 'Please tell us why you are reaching out',
  })
});

export const mailingListSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(254, 'Email address is too long')
    .toLowerCase(), // Remove sanitizeHtml transform from email
  name: z.string()
    .optional()
    .nullable()
    .transform(val => val ? sanitizeHtml(val.trim()) : undefined)
    .refine(val => !val || (val.length >= 1 && val.length <= 100), {
      message: 'Name must be between 1 and 100 characters'
    })
    .refine(val => !val || /^[a-zA-Z\s\-'.]+$/.test(val), {
      message: 'Name contains invalid characters'
    }),
  source: z.string().default('website'),
  status: z.enum(['pending', 'confirmed', 'unsubscribed']).default('pending')
});

export const aiChatSchema = z.object({
  message: z.string()
    .min(1, 'Message cannot be empty')
    .max(4000, 'Message is too long (max 4000 characters)')
    .transform(sanitizeHtml)
    .refine(val => {
      // Check for potential prompt injection attempts
      const suspiciousPatterns = [
        /ignore\s+previous\s+instructions/i,
        /forget\s+everything/i,
        /you\s+are\s+now/i,
        /system\s*:?\s*ignore/i,
        /override\s+your\s+instructions/i
      ];
      return !suspiciousPatterns.some(pattern => pattern.test(val));
    }, 'Message contains prohibited content')
});

// Professional profile validation
export const profileUpdateSchema = z.object({
  display_name: z.string()
    .min(2, 'Display name must be at least 2 characters')
    .max(100, 'Display name must not exceed 100 characters')
    .transform(sanitizeHtml)
    .optional(),
  bio: z.string()
    .max(1000, 'Bio must not exceed 1000 characters')
    .transform(sanitizeHtml)
    .optional(),
  profession: z.string()
    .max(100, 'Profession must not exceed 100 characters')
    .transform(sanitizeHtml)
    .optional(),
  license_number: z.string()
    .max(50, 'License number must not exceed 50 characters')
    .regex(/^[a-zA-Z0-9\-\s]*$/, 'License number contains invalid characters')
    .transform(sanitizeHtml)
    .optional(),
  website_url: z.string()
    .url('Please enter a valid URL')
    .max(500, 'URL is too long')
    .optional()
    .or(z.literal(''))
});

export type ContactFormData = z.infer<typeof contactFormSchema>;
export type MailingListData = z.infer<typeof mailingListSchema>;
export type AiChatData = z.infer<typeof aiChatSchema>;
export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;