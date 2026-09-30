import { z } from 'zod';

// resumeText is intentionally NOT part of the client request -- the client
// only names which resume to use (resumeId); the route handler reads its
// text server-side after checking the resume belongs to the authenticated
// user, rather than trusting whatever text a client submits.
export const AnalyzeRequestSchema = z.object({
  jobDescriptionText: z
    .string()
    .trim()
    .min(30, 'Job description is too short.')
    .max(8000, 'Job description is too long (max 8,000 characters).'),
  resumeId: z.string().uuid('Pick which resume to analyze.'),
});

export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;
