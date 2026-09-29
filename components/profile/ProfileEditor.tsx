'use client';

import { useState } from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import {
  inputClass,
  labelClass,
  sectionHeadingClass,
  ChipListEditor,
  AddEntryButton,
  RemoveEntryButton,
} from '@/components/forms/FormPrimitives';
import type { ApiResponse } from '@/types/analysis';
import type { WorkExperienceEntry, EducationEntry, ProjectEntry } from '@/schemas/candidate-profile.schema';

export interface EditableWorkExperienceEntry {
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  description: string;
}
export interface EditableEducationEntry {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
}
export interface EditableProjectEntry {
  name: string;
  description: string;
}

export interface EditableProfileFields {
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  links: string[];
  summary: string;
  yearsExperience: number | null;
  skills: string[];
  workExperience: EditableWorkExperienceEntry[];
  education: EditableEducationEntry[];
  certifications: string[];
  projects: EditableProjectEntry[];
}

const toEditable = (v: string | null) => v ?? '';
const toEditableEntries = <T, U>(entries: T[], map: (e: T) => U): U[] => entries.map(map);

export function toEditableFields(profile: {
  full_name: string | null;
  headline: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  links: string[];
  summary: string | null;
  years_experience: number | null;
  skills: string[];
  work_experience: WorkExperienceEntry[];
  education: EducationEntry[];
  certifications: string[];
  projects: ProjectEntry[];
} | null): EditableProfileFields {
  return {
    fullName: toEditable(profile?.full_name ?? null),
    headline: toEditable(profile?.headline ?? null),
    email: toEditable(profile?.email ?? null),
    phone: toEditable(profile?.phone ?? null),
    location: toEditable(profile?.location ?? null),
    links: profile?.links ?? [],
    summary: toEditable(profile?.summary ?? null),
    yearsExperience: profile?.years_experience ?? null,
    skills: profile?.skills ?? [],
    workExperience: toEditableEntries(profile?.work_experience ?? [], (e) => ({
      company: e.company,
      title: e.title,
      startDate: toEditable(e.startDate),
      endDate: toEditable(e.endDate),
      description: toEditable(e.description),
    })),
    education: toEditableEntries(profile?.education ?? [], (e) => ({
      institution: e.institution,
      degree: toEditable(e.degree),
      fieldOfStudy: toEditable(e.fieldOfStudy),
      startDate: toEditable(e.startDate),
      endDate: toEditable(e.endDate),
    })),
    certifications: profile?.certifications ?? [],
    projects: toEditableEntries(profile?.projects ?? [], (e) => ({
      name: e.name,
      description: toEditable(e.description),
    })),
  };
}

export function fromCandidateProfile(extracted: {
  name: string | null;
  headline: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  links: string[];
  summary: string | null;
  yearsExperience: number | null;
  skills: string[];
  workExperience: WorkExperienceEntry[];
  education: EducationEntry[];
  certifications: string[];
  projects: ProjectEntry[];
}): EditableProfileFields {
  return toEditableFields({
    full_name: extracted.name,
    headline: extracted.headline,
    email: extracted.email,
    phone: extracted.phone,
    location: extracted.location,
    links: extracted.links,
    summary: extracted.summary,
    years_experience: extracted.yearsExperience,
    skills: extracted.skills,
    work_experience: extracted.workExperience,
    education: extracted.education,
    certifications: extracted.certifications,
    projects: extracted.projects,
  });
}

function WorkExperienceList({
  entries,
  onChange,
}: {
  entries: EditableWorkExperienceEntry[];
  onChange: (entries: EditableWorkExperienceEntry[]) => void;
}) {
  const update = (i: number, patch: Partial<EditableWorkExperienceEntry>) =>
    onChange(entries.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  const remove = (i: number) => onChange(entries.filter((_, idx) => idx !== i));
  const add = () =>
    onChange([...entries, { company: '', title: '', startDate: '', endDate: '', description: '' }]);

  return (
    <div>
      <h3 className={sectionHeadingClass}>Work Experience</h3>
      <div className="space-y-3">
        {entries.map((entry, i) => (
          <div key={i} className="space-y-2 rounded-lg border border-[var(--color-border-subtle)] p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="grid flex-1 grid-cols-2 gap-2">
                <input
                  value={entry.title}
                  onChange={(e) => update(i, { title: e.target.value })}
                  placeholder="Title"
                  className={inputClass}
                />
                <input
                  value={entry.company}
                  onChange={(e) => update(i, { company: e.target.value })}
                  placeholder="Company"
                  className={inputClass}
                />
              </div>
              <RemoveEntryButton onClick={() => remove(i)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                value={entry.startDate}
                onChange={(e) => update(i, { startDate: e.target.value })}
                placeholder="Start (e.g. Jan 2022)"
                className={inputClass}
              />
              <input
                value={entry.endDate}
                onChange={(e) => update(i, { endDate: e.target.value })}
                placeholder="End (e.g. Present)"
                className={inputClass}
              />
            </div>
            <textarea
              value={entry.description}
              onChange={(e) => update(i, { description: e.target.value })}
              placeholder="Brief description"
              rows={2}
              className={`${inputClass} resize-y`}
            />
          </div>
        ))}
      </div>
      <div className="mt-3">
        <AddEntryButton onClick={add} label="Add role" />
      </div>
    </div>
  );
}

function EducationList({
  entries,
  onChange,
}: {
  entries: EditableEducationEntry[];
  onChange: (entries: EditableEducationEntry[]) => void;
}) {
  const update = (i: number, patch: Partial<EditableEducationEntry>) =>
    onChange(entries.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  const remove = (i: number) => onChange(entries.filter((_, idx) => idx !== i));
  const add = () =>
    onChange([
      ...entries,
      { institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '' },
    ]);

  return (
    <div>
      <h3 className={sectionHeadingClass}>Education</h3>
      <div className="space-y-3">
        {entries.map((entry, i) => (
          <div key={i} className="space-y-2 rounded-lg border border-[var(--color-border-subtle)] p-3">
            <div className="flex items-start justify-between gap-2">
              <input
                value={entry.institution}
                onChange={(e) => update(i, { institution: e.target.value })}
                placeholder="Institution"
                className={`${inputClass} flex-1`}
              />
              <RemoveEntryButton onClick={() => remove(i)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                value={entry.degree}
                onChange={(e) => update(i, { degree: e.target.value })}
                placeholder="Degree"
                className={inputClass}
              />
              <input
                value={entry.fieldOfStudy}
                onChange={(e) => update(i, { fieldOfStudy: e.target.value })}
                placeholder="Field of study"
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                value={entry.startDate}
                onChange={(e) => update(i, { startDate: e.target.value })}
                placeholder="Start"
                className={inputClass}
              />
              <input
                value={entry.endDate}
                onChange={(e) => update(i, { endDate: e.target.value })}
                placeholder="End"
                className={inputClass}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3">
        <AddEntryButton onClick={add} label="Add education" />
      </div>
    </div>
  );
}

function ProjectList({
  entries,
  onChange,
}: {
  entries: EditableProjectEntry[];
  onChange: (entries: EditableProjectEntry[]) => void;
}) {
  const update = (i: number, patch: Partial<EditableProjectEntry>) =>
    onChange(entries.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  const remove = (i: number) => onChange(entries.filter((_, idx) => idx !== i));
  const add = () => onChange([...entries, { name: '', description: '' }]);

  return (
    <div>
      <h3 className={sectionHeadingClass}>Projects</h3>
      <div className="space-y-3">
        {entries.map((entry, i) => (
          <div key={i} className="space-y-2 rounded-lg border border-[var(--color-border-subtle)] p-3">
            <div className="flex items-start justify-between gap-2">
              <input
                value={entry.name}
                onChange={(e) => update(i, { name: e.target.value })}
                placeholder="Project name"
                className={`${inputClass} flex-1`}
              />
              <RemoveEntryButton onClick={() => remove(i)} />
            </div>
            <textarea
              value={entry.description}
              onChange={(e) => update(i, { description: e.target.value })}
              placeholder="Brief description"
              rows={2}
              className={`${inputClass} resize-y`}
            />
          </div>
        ))}
      </div>
      <div className="mt-3">
        <AddEntryButton onClick={add} label="Add project" />
      </div>
    </div>
  );
}

export function ProfileEditor({ initialFields }: { initialFields: EditableProfileFields }) {
  const [fullName, setFullName] = useState(initialFields.fullName);
  const [headline, setHeadline] = useState(initialFields.headline);
  const [email, setEmail] = useState(initialFields.email);
  const [phone, setPhone] = useState(initialFields.phone);
  const [location, setLocation] = useState(initialFields.location);
  const [links, setLinks] = useState(initialFields.links);
  const [summary, setSummary] = useState(initialFields.summary);
  const [yearsExperience, setYearsExperience] = useState(initialFields.yearsExperience);
  const [skills, setSkills] = useState(initialFields.skills);
  const [workExperience, setWorkExperience] = useState(initialFields.workExperience);
  const [education, setEducation] = useState(initialFields.education);
  const [certifications, setCertifications] = useState(initialFields.certifications);
  const [projects, setProjects] = useState(initialFields.projects);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const dirty = () => setSaved(false);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          headline,
          email,
          phone,
          location,
          links,
          summary,
          yearsExperience,
          skills,
          workExperience,
          education,
          certifications,
          projects,
        }),
      });
      const json = (await res.json()) as ApiResponse<{ saved: true }>;

      if (!json.success) {
        setError(json.error.message);
        return;
      }
      setSaved(true);
    } catch {
      setError('Network error — please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className={sectionHeadingClass}>Basics</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="fullName" className={labelClass}>
              Name
            </label>
            <input
              id="fullName"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                dirty();
              }}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="headline" className={labelClass}>
              Headline
            </label>
            <input
              id="headline"
              value={headline}
              onChange={(e) => {
                setHeadline(e.target.value);
                dirty();
              }}
              placeholder="e.g. Full Stack Developer"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="email" className={labelClass}>
              Email
            </label>
            <input
              id="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                dirty();
              }}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="phone" className={labelClass}>
              Phone
            </label>
            <input
              id="phone"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                dirty();
              }}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="location" className={labelClass}>
              Location
            </label>
            <input
              id="location"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                dirty();
              }}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="yearsExperience" className={labelClass}>
              Years of experience
            </label>
            <input
              id="yearsExperience"
              type="number"
              min={0}
              max={60}
              value={yearsExperience ?? ''}
              onChange={(e) => {
                setYearsExperience(e.target.value === '' ? null : Number(e.target.value));
                dirty();
              }}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <ChipListEditor
        label="Links"
        values={links}
        onChange={(v) => {
          setLinks(v);
          dirty();
        }}
        placeholder="Paste a URL and press Enter"
        max={5}
      />

      <div>
        <label htmlFor="summary" className={labelClass}>
          Summary
        </label>
        <textarea
          id="summary"
          value={summary}
          onChange={(e) => {
            setSummary(e.target.value);
            dirty();
          }}
          rows={3}
          className={`${inputClass} resize-y`}
        />
      </div>

      <ChipListEditor
        label="Skills"
        values={skills}
        onChange={(v) => {
          setSkills(v);
          dirty();
        }}
        placeholder="Type a skill and press Enter"
        max={25}
      />

      <WorkExperienceList
        entries={workExperience}
        onChange={(v) => {
          setWorkExperience(v);
          dirty();
        }}
      />

      <EducationList
        entries={education}
        onChange={(v) => {
          setEducation(v);
          dirty();
        }}
      />

      <ChipListEditor
        label="Certifications"
        values={certifications}
        onChange={(v) => {
          setCertifications(v);
          dirty();
        }}
        placeholder="Type a certification and press Enter"
        max={10}
      />

      <ProjectList
        entries={projects}
        onChange={(v) => {
          setProjects(v);
          dirty();
        }}
      />

      <div className="flex items-center gap-3 border-t border-[var(--color-border-subtle)] pt-5">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-strong)] px-4 py-2 text-sm font-semibold text-[var(--color-canvas)] transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save profile'}
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--color-success)' }}>
            <CheckCircle2 className="h-4 w-4" />
            Saved
          </span>
        )}
        {error && (
          <span className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--color-danger)' }}>
            <AlertTriangle className="h-4 w-4" />
            {error}
          </span>
        )}
      </div>
    </div>
  );
}
