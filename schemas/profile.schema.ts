import { z } from 'zod';

export const SaveResumeRequestSchema = z.object({
  resumeText: z
    .string()
    .trim()
    .min(50, 'Resume text is too short — did the PDF parse correctly?')
    .max(20000, 'Resume text is too long (max 20,000 characters).'),
  fileName: z.string().min(1).max(255),
  pageCount: z.number().int().min(1),
  charCount: z.number().int().min(1),
});

export type SaveResumeRequest = z.infer<typeof SaveResumeRequestSchema>;
