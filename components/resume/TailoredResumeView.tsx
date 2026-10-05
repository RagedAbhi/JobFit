import type { TailoredResume } from '@/schemas/tailored-resume.schema';

// Always rendered light/black-on-white regardless of the app's own dark
// theme -- this is a document meant to be printed/saved as a PDF and
// eventually read by someone outside the app, not part of the product UI.
export function TailoredResumeView({ resume }: { resume: TailoredResume }) {
  const contactParts = [resume.email, resume.phone, resume.location, ...resume.links].filter(Boolean);

  return (
    <div className="mx-auto max-w-[8.5in] bg-white p-5 text-gray-900 shadow-sm sm:p-10 print:p-10 print:shadow-none">
      <header className="border-b border-gray-300 pb-4">
        <h1 className="text-xl font-bold sm:text-2xl">{resume.fullName}</h1>
        <p className="mt-0.5 text-sm font-medium text-gray-600">{resume.headline}</p>
        {contactParts.length > 0 && (
          <p className="mt-2 text-xs text-gray-500 break-words">{contactParts.join('  ·  ')}</p>
        )}
      </header>

      <section className="mt-5">
        <p className="text-sm leading-relaxed text-gray-800">{resume.summary}</p>
      </section>

      {resume.skills.length > 0 && (
        <section className="mt-5">
          <h2 className="text-xs font-bold uppercase tracking-wide text-gray-500">Skills</h2>
          <p className="mt-1.5 text-sm text-gray-800">{resume.skills.join(' · ')}</p>
        </section>
      )}

      {resume.workExperience.length > 0 && (
        <section className="mt-6">
          <h2 className="text-xs font-bold uppercase tracking-wide text-gray-500">Experience</h2>
          <div className="mt-2 space-y-4">
            {resume.workExperience.map((job, i) => (
              <div key={i}>
                <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
                  <p className="text-sm font-semibold text-gray-900">
                    {job.title} <span className="font-normal text-gray-600">— {job.company}</span>
                  </p>
                  <p className="shrink-0 text-xs text-gray-500">
                    {job.startDate ?? ''}
                    {job.startDate || job.endDate ? ' – ' : ''}
                    {job.endDate ?? ''}
                  </p>
                </div>
                {job.bullets.length > 0 && (
                  <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-gray-700">
                    {job.bullets.map((bullet, j) => (
                      <li key={j}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {resume.education.length > 0 && (
        <section className="mt-6">
          <h2 className="text-xs font-bold uppercase tracking-wide text-gray-500">Education</h2>
          <div className="mt-2 space-y-2">
            {resume.education.map((edu, i) => {
              const degreeLine = [edu.degree, edu.fieldOfStudy].filter(Boolean).join(', ');
              return (
                <div key={i} className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
                  <p className="text-sm text-gray-800">
                    <span className="font-semibold">{edu.institution}</span>
                    {degreeLine ? ` — ${degreeLine}` : ''}
                  </p>
                  <p className="shrink-0 text-xs text-gray-500">
                    {edu.startDate ?? ''}
                    {edu.startDate || edu.endDate ? ' – ' : ''}
                    {edu.endDate ?? ''}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {resume.certifications.length > 0 && (
        <section className="mt-6">
          <h2 className="text-xs font-bold uppercase tracking-wide text-gray-500">Certifications</h2>
          <p className="mt-1.5 text-sm text-gray-800">{resume.certifications.join(' · ')}</p>
        </section>
      )}
    </div>
  );
}
