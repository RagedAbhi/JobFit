import { z } from 'zod';

const TailoredWorkExperienceEntrySchema = z.object({
  company: z.string().min(1).max(150),
  title: z.string().min(1).max(150),
  startDate: z.string().max(50).nullable(),
  endDate: z.string().max(50).nullable().describe('"Present" if this is a current role'),
  bullets: z
    .array(z.string().min(1).max(200))
    .max(5)
    .describe('Achievement-focused bullet points, rewritten to emphasize relevance to the target job'),
});

const TailoredEducationEntrySchema = z.object({
  institution: z.string().min(1).max(150),
  degree: z.string().max(150).nullable(),
  fieldOfStudy: z.string().max(150).nullable(),
  startDate: z.string().max(50).nullable(),
  endDate: z.string().max(50).nullable(),
});

/**
 * A resume rewritten/optimized for one specific job description, generated
 * from the candidate's full profile (see lib/groq-client.ts's
 * generateTailoredResume). Persisted on job_analyses.tailored_resume so it
 * doesn't need to be regenerated every time the job detail page is viewed.
 */
export const TailoredResumeSchema = z.object({
  fullName: z.string().min(1).max(150),
  headline: z.string().min(1).max(150).describe('A headline tailored to the target role'),
  email: z.string().max(150).nullable(),
  phone: z.string().max(50).nullable(),
  location: z.string().max(150).nullable(),
  links: z.array(z.string().max(300)).max(5),
  summary: z
    .string()
    .min(1)
    .max(500)
    .describe("A professional summary rewritten to target this specific job description"),
  skills: z
    .array(z.string().min(1).max(60))
    .max(20)
    .describe('Skills most relevant to the job description, most relevant first'),
  workExperience: z.array(TailoredWorkExperienceEntrySchema).max(8),
  education: z.array(TailoredEducationEntrySchema).max(4),
  certifications: z.array(z.string().min(1).max(150)).max(10),
});

export type TailoredResume = z.infer<typeof TailoredResumeSchema>;
export type TailoredWorkExperienceEntry = z.infer<typeof TailoredWorkExperienceEntrySchema>;
export type TailoredEducationEntry = z.infer<typeof TailoredEducationEntrySchema>;

/**
 * What a user can manually edit on the tailored-resume view (see
 * app/api/jobs/[jobId]/tailored-resume/route.ts's PATCH handler). Same
 * shape as TailoredResume, but a human editing the form always sends
 * concrete strings/arrays instead of null -- the route converts empty
 * strings back to null before saving.
 */
const EditableTailoredWorkExperienceEntrySchema = z.object({
  company: z.string().trim().min(1).max(150),
  title: z.string().trim().min(1).max(150),
  startDate: z.string().trim().max(50),
  endDate: z.string().trim().max(50),
  bullets: z.array(z.string().trim().min(1).max(200)).max(8),
});

const EditableTailoredEducationEntrySchema = z.object({
  institution: z.string().trim().min(1).max(150),
  degree: z.string().trim().max(150),
  fieldOfStudy: z.string().trim().max(150),
  startDate: z.string().trim().max(50),
  endDate: z.string().trim().max(50),
});

export const UpdateTailoredResumeRequestSchema = z.object({
  fullName: z.string().trim().min(1).max(150),
  headline: z.string().trim().min(1).max(150),
  email: z.string().trim().max(150),
  phone: z.string().trim().max(50),
  location: z.string().trim().max(150),
  links: z.array(z.string().trim().min(1).max(300)).max(5),
  summary: z.string().trim().min(1).max(500),
  skills: z.array(z.string().trim().min(1).max(60)).max(20),
  workExperience: z.array(EditableTailoredWorkExperienceEntrySchema).max(8),
  education: z.array(EditableTailoredEducationEntrySchema).max(4),
  certifications: z.array(z.string().trim().min(1).max(150)).max(10),
});

export type UpdateTailoredResumeRequest = z.infer<typeof UpdateTailoredResumeRequestSchema>;
