import { z } from 'zod';

/**
 * Auto-converted to a real JSON Schema via z.toJSONSchema() for Groq's
 * strict structured-output mode (see lib/groq-client.ts) -- the two can
 * never drift out of sync. This schema is also the safety-net validator run
 * against the model's parsed JSON output.
 */
export const AIAnalysisResponseSchema = z.object({
  jobTitle: z
    .string()
    .min(1)
    .max(150)
    .describe('A short, concise job title inferred from the job description (e.g. "React Frontend Developer")'),
  matchScore: z.number().min(0).max(100),
  summary: z.string().min(1).max(1000),
  matchingSkills: z.array(z.string().min(1).max(80)).max(50),
  missingSkills: z.array(z.string().min(1).max(80)).max(50),
  optionalMissingSkills: z.array(z.string().min(1).max(80)).max(50).default([]),
  improvementSuggestions: z
    .array(
      z.object({
        category: z.enum(['Skills', 'Experience', 'Formatting', 'Keywords', 'Other']),
        suggestion: z.string().min(1).max(400),
      })
    )
    .max(20),
});

export type AIAnalysisResponse = z.infer<typeof AIAnalysisResponseSchema>;
export type ImprovementSuggestion = AIAnalysisResponse['improvementSuggestions'][number];
