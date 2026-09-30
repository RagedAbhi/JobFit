import type { TailoredResume } from '@/schemas/tailored-resume.schema';

/** Plain-text rendering for pasting into application portals that reject PDFs. */
export function formatTailoredResumeAsText(resume: TailoredResume): string {
  const lines: string[] = [];

  lines.push(resume.fullName);
  lines.push(resume.headline);

  const contactParts = [resume.email, resume.phone, resume.location, ...resume.links].filter(Boolean);
  if (contactParts.length > 0) lines.push(contactParts.join(' | '));

  lines.push('');
  lines.push(resume.summary);

  if (resume.skills.length > 0) {
    lines.push('');
    lines.push('SKILLS');
    lines.push(resume.skills.join(', '));
  }

  if (resume.workExperience.length > 0) {
    lines.push('');
    lines.push('EXPERIENCE');
    resume.workExperience.forEach((job, i) => {
      if (i > 0) lines.push('');
      const dateRange = [job.startDate, job.endDate].filter(Boolean).join(' - ');
      lines.push(`${job.title} - ${job.company}${dateRange ? ` (${dateRange})` : ''}`);
      job.bullets.forEach((bullet) => lines.push(`- ${bullet}`));
    });
  }

  if (resume.education.length > 0) {
    lines.push('');
    lines.push('EDUCATION');
    resume.education.forEach((edu) => {
      const degreeLine = [edu.degree, edu.fieldOfStudy].filter(Boolean).join(', ');
      const dateRange = [edu.startDate, edu.endDate].filter(Boolean).join(' - ');
      lines.push(`${edu.institution}${degreeLine ? ` - ${degreeLine}` : ''}${dateRange ? ` (${dateRange})` : ''}`);
    });
  }

  if (resume.certifications.length > 0) {
    lines.push('');
    lines.push('CERTIFICATIONS');
    lines.push(resume.certifications.join(', '));
  }

  return lines.join('\n');
}
