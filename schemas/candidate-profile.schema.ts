import { z } from 'zod';

// Dates are kept as free-form strings ("Jan 2020", "2020", "Present") rather
// than parsed into real dates -- resumes use wildly inconsistent formats,
// and forcing a strict date format would make extraction far less reliable
// for little benefit (these are display-only, never computed on).
const WorkExperienceEntrySchema = z.object({
  company: z.string().min(1).max(150),
  title: z.string().min(1).max(150),
  startDate: z.string().max(50).nullable(),
  endDate: z.string().max(50).nullable().describe('"Present" if this is a current role'),
  description: z.string().max(400).nullable().describe('A brief summary of responsibilities/achievements'),
});

const EducationEntrySchema = z.object({
  institution: z.string().min(1).max(150),
  degree: z.string().max(150).nullable(),
  fieldOfStudy: z.string().max(150).nullable(),
  startDate: z.string().max(50).nullable(),
  endDate: z.string().max(50).nullable(),
});

const ProjectEntrySchema = z.object({
  name: z.string().min(1).max(150),
  description: z.string().max(300).nullable(),
});

/**
 * The structured profile fields extracted from a resume, and later editable
 * by the user (see app/api/profile/route.ts). Every scalar field is
 * nullable so the AI can honestly say "not present in this resume" instead
 * of fabricating a value -- this is the safety-net validator run against
 * Groq's parsed JSON output (schema itself derived via z.toJSONSchema() in
 * lib/groq-client.ts, so the two can't drift out of sync).
 */
export const CandidateProfileSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(150)
    .nullable()
    .describe("The candidate's full name as it appears on the resume, or null if none is present"),
  headline: z
    .string()
    .min(1)
    .max(150)
    .nullable()
    .describe('A short professional headline/title, e.g. "Full Stack Developer", or null if unclear'),
  email: z.string().max(150).nullable().describe('Contact email listed on the resume, or null'),
  phone: z.string().max(50).nullable().describe('Contact phone number listed on the resume, or null'),
  location: z.string().max(150).nullable().describe('City/region listed on the resume, or null'),
  links: z
    .array(z.string().max(300))
    .max(5)
    .describe('URLs listed on the resume, e.g. LinkedIn, GitHub, portfolio site'),
  summary: z
    .string()
    .min(1)
    .max(400)
    .nullable()
    .describe('A brief 1-2 sentence professional summary, or null if not enough information'),
  yearsExperience: z
    .number()
    .int()
    .min(0)
    .max(60)
    .nullable()
    .describe('Approximate total years of professional experience, or null if not determinable'),
  skills: z
    .array(z.string().min(1).max(60))
    .max(25)
    .describe('The most relevant technical/professional skills listed on the resume'),
  workExperience: z
    .array(WorkExperienceEntrySchema)
    .max(8)
    .describe('Work history, most recent first'),
  education: z.array(EducationEntrySchema).max(4),
  certifications: z.array(z.string().min(1).max(150)).max(10),
  projects: z.array(ProjectEntrySchema).max(6),
});

export type CandidateProfile = z.infer<typeof CandidateProfileSchema>;
export type WorkExperienceEntry = z.infer<typeof WorkExperienceEntrySchema>;
export type EducationEntry = z.infer<typeof EducationEntrySchema>;
export type ProjectEntry = z.infer<typeof ProjectEntrySchema>;

/**
 * What a user can manually edit on /profile. Same shape as CandidateProfile
 * minus nullability quirks specific to AI extraction -- a human editing the
 * form always sends concrete values (empty string/array instead of null).
 */
const EditableWorkExperienceEntrySchema = z.object({
  company: z.string().trim().min(1).max(150),
  title: z.string().trim().min(1).max(150),
  startDate: z.string().trim().max(50),
  endDate: z.string().trim().max(50),
  description: z.string().trim().max(400),
});

const EditableEducationEntrySchema = z.object({
  institution: z.string().trim().min(1).max(150),
  degree: z.string().trim().max(150),
  fieldOfStudy: z.string().trim().max(150),
  startDate: z.string().trim().max(50),
  endDate: z.string().trim().max(50),
});

const EditableProjectEntrySchema = z.object({
  name: z.string().trim().min(1).max(150),
  description: z.string().trim().max(300),
});

export const UpdateProfileRequestSchema = z.object({
  fullName: z.string().trim().max(150),
  headline: z.string().trim().max(150),
  email: z.string().trim().max(150),
  phone: z.string().trim().max(50),
  location: z.string().trim().max(150),
  links: z.array(z.string().trim().min(1).max(300)).max(5),
  summary: z.string().trim().max(400),
  yearsExperience: z.number().int().min(0).max(60).nullable(),
  skills: z.array(z.string().trim().min(1).max(60)).max(25),
  workExperience: z.array(EditableWorkExperienceEntrySchema).max(8),
  education: z.array(EditableEducationEntrySchema).max(4),
  certifications: z.array(z.string().trim().min(1).max(150)).max(10),
  projects: z.array(EditableProjectEntrySchema).max(6),
});

export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequestSchema>;
