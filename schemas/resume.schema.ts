import { z } from 'zod';

// name is new to the multi-resume model; the file field bounds match the
// original single-resume upload's limits.
const nameField = z
  .string()
  .trim()
  .min(1, 'Give this resume a name.')
  .max(60, 'Resume name is too long (max 60 characters).');

const resumeTextField = z
  .string()
  .trim()
  .min(50, 'Resume text is too short — did the PDF parse correctly?')
  .max(20000, 'Resume text is too long (max 20,000 characters).');

export const CreateResumeRequestSchema = z.object({
  name: nameField,
  resumeText: resumeTextField,
  fileName: z.string().min(1).max(255),
  pageCount: z.number().int().min(1),
  charCount: z.number().int().min(1),
});

export type CreateResumeRequest = z.infer<typeof CreateResumeRequestSchema>;

// PATCH /api/resumes/[resumeId]: rename, replace the file, or both in one
// call. At least one of (name) or the file fields (always together) must be
// present.
export const UpdateResumeRequestSchema = z
  .object({
    name: nameField.optional(),
    resumeText: resumeTextField.optional(),
    fileName: z.string().min(1).max(255).optional(),
    pageCount: z.number().int().min(1).optional(),
    charCount: z.number().int().min(1).optional(),
  })
  .refine((data) => data.name !== undefined || data.resumeText !== undefined, {
    message: 'Provide a new name, a new resume file, or both.',
  })
  .refine(
    (data) =>
      (data.resumeText === undefined) === (data.fileName === undefined) &&
      (data.resumeText === undefined) === (data.pageCount === undefined) &&
      (data.resumeText === undefined) === (data.charCount === undefined),
    { message: 'resumeText, fileName, pageCount, and charCount must all be provided together.' }
  );

export type UpdateResumeRequest = z.infer<typeof UpdateResumeRequestSchema>;
