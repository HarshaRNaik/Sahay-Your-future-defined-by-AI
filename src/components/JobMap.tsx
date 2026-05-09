import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Briefcase, ExternalLink, MapPin, Navigation } from 'lucide-react';
import { cn } from '../lib/utils';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  lat?: number;
  lng?: number;
}

const knownLocations: Record<string, { lat: number; lng: number }> = {
  peenya: { lat: 13.0285, lng: 77.5197 },
  anekal: { lat: 12.7105, lng: 77.6954 },
  belagavi: { lat: 15.8497, lng: 74.4977 },
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  bangalore: { lat: 12.9716, lng: 77.5946 },
  'silk board': { lat: 12.9177, lng: 77.6237 },
};

const defaultCenter = { lat: 12.9716, lng: 77.5946 };

function resolveJobLocation(job: Job, index: number) {
  if (typeof job.lat === 'number' && typeof job.lng === 'number') {
    return { lat: job.lat, lng: job.lng };
  }

  const normalizedLocation = job.location.toLowerCase();
  const match = Object.entries(knownLocations).find(([key]) => normalizedLocation.includes(key));
  if (match) return match[1];

  return {
    lat: defaultCenter.lat + (index - 1) * 0.035,
    lng: defaultCenter.lng + (index - 1) * 0.04,
  };
}

function buildOsmUrl(location: { lat: number; lng: number }) {
  const delta = 0.08;
  const bbox = [
    location.lng - delta,
    location.lat - delta,
    location.lng + delta,
    location.lat + delta,
  ].join(',');

  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${location.lat},${location.lng}`;
}

export default function JobMap({ jobs }: { jobs: Job[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedJobId, setSelectedJobId] = useState(jobs[0]?.id || '');

  const jobsWithLocations = useMemo(
    () => jobs.map((job, index) => ({ ...job, coordinates: resolveJobLocation(job, index) })),
    [jobs]
  );

  const selectedJob = jobsWithLocations.find((job) => job.id === selectedJobId) || jobsWithLocations[0];

  useEffect(() => {
    if (!jobs[0]) return;
    setSelectedJobId((current) => current || jobs[0].id);
  }, [jobs]);

  if (!jobsWithLocations.length) {
    return (
      <div className="h-[420px] rounded-[2rem] border border-white/5 bg-bg-card flex items-center justify-center text-text-muted text-sm font-bold">
        No mapped job locations yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] h-auto lg:h-[420px] overflow-hidden glass-card border-white/5">
      <div className="relative min-h-[360px] bg-black">
        <iframe
          key={selectedJob?.id}
          title="Sahay job map"
          src={buildOsmUrl(selectedJob.coordinates)}
          className="absolute inset-0 h-full w-full border-0 grayscale-[0.2] invert-0 opacity-80"
          loading="lazy"
        />
        <div className="absolute left-5 top-5 rounded-2xl border border-white/10 bg-bg-main/90 px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-brand-blue">
            <Navigation size={14} />
            Live Job Map
          </div>
          <p className="mt-1 text-xs font-bold text-white">{selectedJob.title}</p>
        </div>
        <a
          href={`https://www.openstreetmap.org/?mlat=${selectedJob.coordinates.lat}&mlon=${selectedJob.coordinates.lng}#map=13/${selectedJob.coordinates.lat}/${selectedJob.coordinates.lng}`}
          target="_blank"
          rel="noreferrer"
          className="absolute bottom-5 right-5 flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-black shadow-xl"
        >
          Open Official Map <ExternalLink size={14} />
        </a>
      </div>

      <div className="max-h-[420px] overflow-y-auto border-t lg:border-l lg:border-t-0 border-white/5 bg-bg-card/70 p-4">
        <p className="text-[10px] uppercase font-black tracking-widest text-text-muted mb-4 px-2">Industrial Hubs</p>
        {jobsWithLocations.map((job) => (
          <button
            key={job.id}
            onClick={() => setSelectedJobId(job.id)}
            className={cn(
              'mb-3 w-full rounded-2xl border p-4 text-left transition-all',
              selectedJob?.id === job.id
                ? 'border-brand-blue/40 bg-brand-blue/10'
                : 'border-white/5 bg-white/5 hover:bg-white/10'
            )}
          >
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue border border-brand-blue/20">
                <Briefcase size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-white truncate">{job.title}</p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-brand-blue truncate">{job.company}</p>
                <p className="mt-2 flex items-center gap-2 text-xs font-bold text-text-muted">
                  <MapPin size={14} />
                  {job.location}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
