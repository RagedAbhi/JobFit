'use client';

import { useState } from 'react';
import { JobCard } from '@/components/dashboard/JobCard';
import type { JobAnalysisRow } from '@/types/db';

export function JobGrid({ jobs: initialJobs }: { jobs: JobAnalysisRow[] }) {
  const [jobs, setJobs] = useState(initialJobs);

  const handleDeleted = (jobId: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
  };

  if (jobs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--color-border)] p-10 text-center text-sm text-[var(--color-text-faint)]">
        No job analyses yet. Run your first one from &quot;New Analysis&quot;.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {jobs.map((job, i) => (
        <JobCard
          key={job.id}
          job={job}
          style={{ animationDelay: `${120 + Math.min(i, 8) * 50}ms` }}
          className="animate-fade-in-up"
          onDeleted={handleDeleted}
        />
      ))}
    </div>
  );
}
