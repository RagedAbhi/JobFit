'use client';

import { useState } from 'react';
import { AlertTriangle, Plus, X } from 'lucide-react';
import type { ApiResponse } from '@/types/analysis';
import type { TailoredResume } from '@/schemas/tailored-resume.schema';

interface EditableWorkEntry {
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  bullets: string[];
}
interface EditableEduEntry {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
}

// Inline fields blend into the document -- no visible border until you
// hover/focus them -- so editing feels like marking up the resume itself
// rather than filling out a separate settings form.
const lineInput =
  'w-full min-w-0 bg-transparent focus:outline-none border-b border-dashed border-transparent hover:border-gray-300 focus:border-gray-400';
const smallRemove =
  'shrink-0 text-gray-300 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-500';

const toEditable = (v: string | null) => v ?? '';

function fromResume(resume: TailoredResume) {
  return {
    fullName: resume.fullName,
    headline: resume.headline,
    email: toEditable(resume.email),
    phone: toEditable(resume.phone),
    location: toEditable(resume.location),
    links: resume.links,
    summary: resume.summary,
    skills: resume.skills,
    workExperience: resume.workExperience.map((e) => ({
      company: e.company,
      title: e.title,
      startDate: toEditable(e.startDate),
      endDate: toEditable(e.endDate),
      bullets: e.bullets,
    })),
    education: resume.education.map((e) => ({
      institution: e.institution,
      degree: toEditable(e.degree),
      fieldOfStudy: toEditable(e.fieldOfStudy),
      startDate: toEditable(e.startDate),
      endDate: toEditable(e.endDate),
    })),
    certifications: resume.certifications,
  };
}

/** A comma-separated inline list (skills, certifications) edited as small removable tags. */
function InlineTagList({
  values,
  onChange,
  placeholder,
  max,
}: {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  max: number;
}) {
  const [draft, setDraft] = useState('');

  const update = (i: number, value: string) => onChange(values.map((v, idx) => (idx === i ? value : v)));
  const remove = (i: number) => onChange(values.filter((_, idx) => idx !== i));
  const addDraft = () => {
    const value = draft.trim();
    if (!value || values.length >= max) {
      setDraft('');
      return;
    }
    onChange([...values, value]);
    setDraft('');
  };

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-gray-800">
      {values.map((value, i) => (
        <span key={i} className="group flex items-center gap-1">
          <input
            value={value}
            onChange={(e) => update(i, e.target.value)}
            className="min-w-[3ch] bg-transparent focus:outline-none border-b border-dashed border-transparent hover:border-gray-300 focus:border-gray-400"
            style={{ width: `${Math.max(value.length, 3)}ch` }}
          />
          <button type="button" onClick={() => remove(i)} aria-label="Remove" className={smallRemove}>
            <X className="h-3 w-3" />
          </button>
          {i < values.length - 1 && <span className="text-gray-300">·</span>}
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addDraft();
          }
        }}
        onBlur={addDraft}
        placeholder={values.length >= max ? '' : placeholder}
        disabled={values.length >= max}
        className="min-w-[6ch] flex-1 bg-transparent text-gray-400 focus:text-gray-800 focus:outline-none border-b border-dashed border-transparent hover:border-gray-300 focus:border-gray-400"
      />
    </div>
  );
}

function WorkExperienceEditor({
  entries,
  onChange,
}: {
  entries: EditableWorkEntry[];
  onChange: (entries: EditableWorkEntry[]) => void;
}) {
  const update = (i: number, patch: Partial<EditableWorkEntry>) =>
    onChange(entries.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  const remove = (i: number) => onChange(entries.filter((_, idx) => idx !== i));
  const add = () =>
    onChange([...entries, { company: '', title: '', startDate: '', endDate: '', bullets: [''] }]);

  const updateBullet = (i: number, j: number, value: string) =>
    update(i, { bullets: entries[i].bullets.map((b, idx) => (idx === j ? value : b)) });
  const removeBullet = (i: number, j: number) =>
    update(i, { bullets: entries[i].bullets.filter((_, idx) => idx !== j) });
  const addBullet = (i: number) => {
    if (entries[i].bullets.length >= 8) return;
    update(i, { bullets: [...entries[i].bullets, ''] });
  };

  return (
    <section className="mt-6">
      <h2 className="text-xs font-bold uppercase tracking-wide text-gray-500">Experience</h2>
      <div className="mt-2 space-y-4">
        {entries.map((job, i) => (
          <div key={i} className="group/entry relative rounded border border-transparent p-1.5 hover:border-gray-200">
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label="Remove role"
              className="absolute right-1 top-1 text-gray-300 opacity-0 transition-opacity hover:text-red-500 group-hover/entry:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <div className="flex items-baseline justify-between gap-3 pr-5">
              <p className="flex flex-wrap items-baseline gap-1 text-sm font-semibold text-gray-900">
                <input
                  value={job.title}
                  onChange={(e) => update(i, { title: e.target.value })}
                  placeholder="Title"
                  className={`${lineInput} w-auto min-w-[8ch] font-semibold`}
                  style={{ width: `${Math.max(job.title.length, 8)}ch` }}
                />
                <span className="font-normal text-gray-600">
                  {' '}
                  —{' '}
                  <input
                    value={job.company}
                    onChange={(e) => update(i, { company: e.target.value })}
                    placeholder="Company"
                    className={`${lineInput} inline w-auto min-w-[8ch] font-normal`}
                    style={{ width: `${Math.max(job.company.length, 8)}ch` }}
                  />
                </span>
              </p>
              <p className="flex shrink-0 items-center gap-1 text-xs text-gray-500">
                <input
                  value={job.startDate}
                  onChange={(e) => update(i, { startDate: e.target.value })}
                  placeholder="Start"
                  className={`${lineInput} w-14 text-right`}
                />
                –
                <input
                  value={job.endDate}
                  onChange={(e) => update(i, { endDate: e.target.value })}
                  placeholder="End"
                  className={`${lineInput} w-14`}
                />
              </p>
            </div>
            <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-gray-700">
              {job.bullets.map((bullet, j) => (
                <li key={j} className="group flex items-center gap-2">
                  <input
                    value={bullet}
                    onChange={(e) => updateBullet(i, j, e.target.value)}
                    placeholder="Describe an achievement…"
                    className={lineInput}
                  />
                  <button
                    type="button"
                    onClick={() => removeBullet(i, j)}
                    aria-label="Remove bullet"
                    className={smallRemove}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
            {job.bullets.length < 8 && (
              <button
                type="button"
                onClick={() => addBullet(i)}
                className="mt-1 flex items-center gap-1 pl-5 text-xs font-medium text-gray-400 hover:text-gray-700"
              >
                <Plus className="h-3 w-3" />
                Add bullet
              </button>
            )}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={add}
        className="mt-3 flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800"
      >
        <Plus className="h-3.5 w-3.5" />
        Add role
      </button>
    </section>
  );
}

function EducationEditor({
  entries,
  onChange,
}: {
  entries: EditableEduEntry[];
  onChange: (entries: EditableEduEntry[]) => void;
}) {
  const update = (i: number, patch: Partial<EditableEduEntry>) =>
    onChange(entries.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  const remove = (i: number) => onChange(entries.filter((_, idx) => idx !== i));
  const add = () =>
    onChange([...entries, { institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '' }]);

  return (
    <section className="mt-6">
      <h2 className="text-xs font-bold uppercase tracking-wide text-gray-500">Education</h2>
      <div className="mt-2 space-y-2">
        {entries.map((edu, i) => (
          <div
            key={i}
            className="group/entry relative flex items-baseline justify-between gap-3 rounded border border-transparent p-1.5 hover:border-gray-200"
          >
            <p className="flex flex-wrap items-baseline gap-1 pr-5 text-sm text-gray-800">
              <input
                value={edu.institution}
                onChange={(e) => update(i, { institution: e.target.value })}
                placeholder="Institution"
                className={`${lineInput} w-auto min-w-[10ch] font-semibold`}
                style={{ width: `${Math.max(edu.institution.length, 10)}ch` }}
              />
              <span>
                {' — '}
                <input
                  value={edu.degree}
                  onChange={(e) => update(i, { degree: e.target.value })}
                  placeholder="Degree"
                  className={`${lineInput} inline w-auto min-w-[6ch]`}
                  style={{ width: `${Math.max(edu.degree.length, 6)}ch` }}
                />
                {', '}
                <input
                  value={edu.fieldOfStudy}
                  onChange={(e) => update(i, { fieldOfStudy: e.target.value })}
                  placeholder="Field of study"
                  className={`${lineInput} inline w-auto min-w-[6ch]`}
                  style={{ width: `${Math.max(edu.fieldOfStudy.length, 6)}ch` }}
                />
              </span>
            </p>
            <p className="flex shrink-0 items-center gap-1 text-xs text-gray-500">
              <input
                value={edu.startDate}
                onChange={(e) => update(i, { startDate: e.target.value })}
                placeholder="Start"
                className={`${lineInput} w-14 text-right`}
              />
              –
              <input
                value={edu.endDate}
                onChange={(e) => update(i, { endDate: e.target.value })}
                placeholder="End"
                className={`${lineInput} w-14`}
              />
            </p>
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label="Remove education"
              className="absolute right-1 top-1 text-gray-300 opacity-0 transition-opacity hover:text-red-500 group-hover/entry:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={add}
        className="mt-3 flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800"
      >
        <Plus className="h-3.5 w-3.5" />
        Add education
      </button>
    </section>
  );
}

export function TailoredResumeEditor({
  jobId,
  initialResume,
  onSaved,
  onCancel,
}: {
  jobId: string;
  initialResume: TailoredResume;
  onSaved: (resume: TailoredResume) => void;
  onCancel: () => void;
}) {
  const initial = fromResume(initialResume);

  const [fullName, setFullName] = useState(initial.fullName);
  const [headline, setHeadline] = useState(initial.headline);
  const [email, setEmail] = useState(initial.email);
  const [phone, setPhone] = useState(initial.phone);
  const [location, setLocation] = useState(initial.location);
  const [links, setLinks] = useState(initial.links);
  const [summary, setSummary] = useState(initial.summary);
  const [skills, setSkills] = useState(initial.skills);
  const [workExperience, setWorkExperience] = useState(initial.workExperience);
  const [education, setEducation] = useState(initial.education);
  const [certifications, setCertifications] = useState(initial.certifications);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateLink = (i: number, value: string) => setLinks(links.map((l, idx) => (idx === i ? value : l)));
  const removeLink = (i: number) => setLinks(links.filter((_, idx) => idx !== i));
  const addLink = () => {
    if (links.length >= 5) return;
    setLinks([...links, '']);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/jobs/${jobId}/tailored-resume`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          headline,
          email,
          phone,
          location,
          links: links.map((l) => l.trim()).filter(Boolean),
          summary,
          skills,
          workExperience,
          education,
          certifications,
        }),
      });
      const json = (await res.json()) as ApiResponse<TailoredResume>;

      if (!json.success) {
        setError(json.error.message);
        return;
      }
      onSaved(json.data);
    } catch {
      setError('Network error — please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-[8.5in] bg-white p-10 text-gray-900 shadow-sm">
      <header className="border-b border-gray-300 pb-4">
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Full name"
          className={`${lineInput} text-2xl font-bold`}
        />
        <input
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="Headline"
          className={`${lineInput} mt-0.5 text-sm font-medium text-gray-600`}
        />
        <div className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-gray-500">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className={`${lineInput} w-auto min-w-[10ch] flex-initial`}
            style={{ width: `${Math.max(email.length, 10)}ch` }}
          />
          <span className="text-gray-300">·</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone"
            className={`${lineInput} w-auto min-w-[8ch] flex-initial`}
            style={{ width: `${Math.max(phone.length, 8)}ch` }}
          />
          <span className="text-gray-300">·</span>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location"
            className={`${lineInput} w-auto min-w-[8ch] flex-initial`}
            style={{ width: `${Math.max(location.length, 8)}ch` }}
          />
          {links.map((link, i) => (
            <span key={i} className="group flex items-center gap-1">
              <span className="text-gray-300">·</span>
              <input
                value={link}
                onChange={(e) => updateLink(i, e.target.value)}
                placeholder="Link URL"
                className={`${lineInput} w-auto min-w-[10ch] flex-initial`}
                style={{ width: `${Math.max(link.length, 10)}ch` }}
              />
              <button type="button" onClick={() => removeLink(i)} aria-label="Remove link" className={smallRemove}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {links.length < 5 && (
            <button type="button" onClick={addLink} className="text-gray-300 hover:text-gray-700">
              <Plus className="h-3 w-3" />
            </button>
          )}
        </div>
      </header>

      <section className="mt-5">
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Professional summary…"
          rows={3}
          className={`${lineInput} resize-y text-sm leading-relaxed text-gray-800`}
        />
      </section>

      <section className="mt-5">
        <h2 className="text-xs font-bold uppercase tracking-wide text-gray-500">Skills</h2>
        <InlineTagList values={skills} onChange={setSkills} placeholder="Add a skill…" max={20} />
      </section>

      <WorkExperienceEditor entries={workExperience} onChange={setWorkExperience} />

      <EducationEditor entries={education} onChange={setEducation} />

      <section className="mt-6">
        <h2 className="text-xs font-bold uppercase tracking-wide text-gray-500">Certifications</h2>
        <InlineTagList
          values={certifications}
          onChange={setCertifications}
          placeholder="Add a certification…"
          max={10}
        />
      </section>

      <div className="no-print mt-8 flex items-center gap-3 border-t border-gray-200 pt-5">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-strong)] px-4 py-2 text-sm font-semibold text-[var(--color-canvas)] transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-red-400 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <X className="h-4 w-4" />
          Cancel
        </button>
        {error && (
          <span className="flex items-center gap-1.5 text-sm text-red-600">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </span>
        )}
      </div>
    </div>
  );
}
