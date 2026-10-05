import { describe, it, expect } from 'vitest';
import { CandidateProfileSchema, UpdateProfileRequestSchema } from './candidate-profile.schema';

const minimalCandidateProfile = {
  name: null,
  headline: null,
  email: null,
  phone: null,
  location: null,
  links: [],
  summary: null,
  yearsExperience: null,
  skills: [],
  workExperience: [],
  education: [],
  certifications: [],
  projects: [],
};

describe('CandidateProfileSchema', () => {
  it('accepts nulls for every absent scalar field', () => {
    expect(CandidateProfileSchema.safeParse(minimalCandidateProfile).success).toBe(true);
  });

  it('accepts a fully populated profile', () => {
    const result = CandidateProfileSchema.safeParse({
      ...minimalCandidateProfile,
      name: 'Jordan Rivera',
      headline: 'Senior Frontend Engineer',
      skills: ['TypeScript', 'React'],
      yearsExperience: 8,
      workExperience: [
        { company: 'Acme', title: 'Engineer', startDate: '2020', endDate: 'Present', description: null },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects yearsExperience above 60', () => {
    const result = CandidateProfileSchema.safeParse({ ...minimalCandidateProfile, yearsExperience: 61 });
    expect(result.success).toBe(false);
  });

  it('rejects more than 25 skills', () => {
    const result = CandidateProfileSchema.safeParse({
      ...minimalCandidateProfile,
      skills: Array.from({ length: 26 }, (_, i) => `skill-${i}`),
    });
    expect(result.success).toBe(false);
  });
});

describe('UpdateProfileRequestSchema', () => {
  it('accepts the human-edited shape with concrete empty values instead of nulls', () => {
    const result = UpdateProfileRequestSchema.safeParse({
      fullName: '',
      headline: '',
      email: '',
      phone: '',
      location: '',
      links: [],
      summary: '',
      yearsExperience: null,
      skills: [],
      workExperience: [],
      education: [],
      certifications: [],
      projects: [],
    });
    expect(result.success).toBe(true);
  });

  it('rejects a work experience entry missing a required field', () => {
    const result = UpdateProfileRequestSchema.safeParse({
      fullName: '',
      headline: '',
      email: '',
      phone: '',
      location: '',
      links: [],
      summary: '',
      yearsExperience: null,
      skills: [],
      workExperience: [{ company: 'Acme', title: '', startDate: '', endDate: '', description: '' }],
      education: [],
      certifications: [],
      projects: [],
    });
    expect(result.success).toBe(false);
  });
});
