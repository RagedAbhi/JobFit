import { z } from 'zod';

// resumeText is intentionally NOT part of the client request -- the resume
// is profile-scoped (uploaded once via /profile) and the route handler reads
// it server-side from the authenticated user's row, rather than trusting
// whatever text a client submits.
export const AnalyzeRequestSchema = z.object({
  jobDescriptionText: z
    .string()
    .trim()
    .min(30, 'Job description is too short.')
    .max(8000, 'Job description is too long (max 8,000 characters).'),
});

export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;
