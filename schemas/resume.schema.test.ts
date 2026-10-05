import { describe, it, expect } from 'vitest';
import { CreateResumeRequestSchema, UpdateResumeRequestSchema } from './resume.schema';

const validCreate = {
  name: 'Frontend',
  resumeText: 'x'.repeat(100),
  fileName: 'resume.pdf',
  pageCount: 1,
  charCount: 100,
};

describe('CreateResumeRequestSchema', () => {
  it('accepts valid input', () => {
    expect(CreateResumeRequestSchema.safeParse(validCreate).success).toBe(true);
  });

  it('rejects an empty name', () => {
    const result = CreateResumeRequestSchema.safeParse({ ...validCreate, name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects a name over 60 characters', () => {
    const result = CreateResumeRequestSchema.safeParse({ ...validCreate, name: 'x'.repeat(61) });
    expect(result.success).toBe(false);
  });

  it('rejects resume text under 50 characters', () => {
    const result = CreateResumeRequestSchema.safeParse({ ...validCreate, resumeText: 'too short' });
    expect(result.success).toBe(false);
  });

  it('rejects resume text over 20,000 characters', () => {
    const result = CreateResumeRequestSchema.safeParse({ ...validCreate, resumeText: 'x'.repeat(20001) });
    expect(result.success).toBe(false);
  });
});

describe('UpdateResumeRequestSchema', () => {
  it('accepts a rename-only update', () => {
    expect(UpdateResumeRequestSchema.safeParse({ name: 'Backend' }).success).toBe(true);
  });

  it('accepts a full file replace', () => {
    const result = UpdateResumeRequestSchema.safeParse({
      resumeText: 'x'.repeat(100),
      fileName: 'resume.pdf',
      pageCount: 1,
      charCount: 100,
    });
    expect(result.success).toBe(true);
  });

  it('rejects an update with neither name nor file fields', () => {
    expect(UpdateResumeRequestSchema.safeParse({}).success).toBe(false);
  });

  it('rejects a partial file replace (missing fileName)', () => {
    const result = UpdateResumeRequestSchema.safeParse({
      resumeText: 'x'.repeat(100),
      pageCount: 1,
      charCount: 100,
    });
    expect(result.success).toBe(false);
  });
});
