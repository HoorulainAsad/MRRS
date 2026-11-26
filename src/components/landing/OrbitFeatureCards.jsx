import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Building2, CalendarDays, ChevronLeft, ChevronRight, ClipboardCheck, MapPin } from 'lucide-react';

const CAPABILITIES = [
  {
    id: 'org-resources',
    eyebrow: '01 · Resource Catalog',
    title: 'Organization-Owned Spaces',
    description:
      'Local administrators configure and maintain their own meeting rooms, shared desks, and bookable assets within their organization.',
    detail: 'Structured by floor, capacity, and resource type.',
    icon: Building2,
  },
  {
    id: 'role-approvals',
    eyebrow: '02 · Governance',
    title: 'Role-Scoped Approvals',
    description:
      'Route reservation requests through authorized department heads, managers, and local administrators with clear audit visibility.',
    detail: 'Supports instant booking or multi-step review.',
    icon: ClipboardCheck,
  },
  {
    id: 'live-availability',
    eyebrow: '03 · Scheduling',
    title: 'Conflict-Free Availability',
    description:
      'Check live room calendars, seat capacities, and time windows before submitting a reservation across your organization.',
    detail: 'Prevents overlapping bookings automatically.',
    icon: CalendarDays,
  },
  {
    id: 'arrival-checkin',
    eyebrow: '04 · Occupancy',
    title: 'Arrival & Check-In Tracking',
    description:
      'Confirm room arrival when a session begins so local teams keep workspace occupancy and schedules accurate throughout the day.',
    detail: 'Built-in check-in status for active reservations.',
    icon: MapPin,
  },
];

const EASE = [0.22, 1, 0.36, 1];

export function OrbitFeatureCards() {
  const reduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);

  const selectPrev = () => setActiveIndex((prev) => (prev - 1 + CAPABILITIES.length) % CAPABILITIES.length);
  const selectNext = () => setActiveIndex((prev) => (prev + 1) % CAPABILITIES.length);

  return (
    <section
      id="capabilities"
      aria-labelledby="capabilities-heading"
      className="relative overflow-hidden py-20 sm:py-28"
      style={{
        background: 'linear-gradient(180deg, var(--sf-canvas) 0%, var(--sf-sage-soft) 52%, var(--sf-plaster) 100%)',
        color: 'var(--sf-ink)',
      }}
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center">
          <span
            className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em]"
            style={{
              background: 'rgba(255, 255, 255, 0.72)',
              borderColor: 'var(--sf-sage-line)',
              color: 'var(--sf-forest)',
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--sf-forest)' }} />
            Built for Organizations
          </span>
          <h2
            id="capabilities-heading"
            className="mt-4 text-balance text-3xl font-bold tracking-[-0.035em] sm:text-4xl lg:text-[42px]"
            style={{ color: 'var(--sf-navy)' }}
          >
            One calm system for your rooms, desks, and approvals.
          </h2>
          <p className="mt-4 text-sm leading-6 sm:text-base sm:leading-7" style={{ color: 'var(--sf-ink-muted)' }}>
            SpaceFlow gives organizations and their authorized local administrators complete control over how their own
            meeting rooms and shared workspace assets are scheduled.
          </p>
        </div>

        {/* Desktop / Tablet Orbit-Style Interactive Carousel */}
        <div className="mt-12 hidden md:block">
          <div className="relative mx-auto h-[370px] max-w-5xl" style={{ perspective: 1400 }}>
            {/* Subtle architectural orbit arc */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 h-[310px] w-[780px] -translate-x-1/2 -translate-y-1/2 rounded-[999px] border border-dashed"
              style={{ borderColor: 'rgba(32, 61, 48, 0.14)' }}
            />

            {CAPABILITIES.map((item, index) => {
              const Icon = item.icon;
              // Compute circular offset: -1 (left), 0 (center), 1 (right), 2 (back)
              let offset = index - activeIndex;
              if (offset > 2) offset -= CAPABILITIES.length;
              if (offset < -1) offset += CAPABILITIES.length;

              const isCenter = offset === 0;
              const isBack = offset === 2 || offset === -2;

              const xTranslate = offset === 0 ? 0 : offset === -1 ? -345 : offset === 1 ? 345 : 0;
              const yTranslate = isCenter ? 0 : isBack ? -26 : 22;
              const scale = isCenter ? 1 : isBack ? 0.82 : 0.88;
              const rotateY = offset === -1 ? 10 : offset === 1 ? -10 : 0;
              const opacity = isCenter ? 1 : isBack ? 0.35 : 0.84;
              const zIndex = isCenter ? 30 : isBack ? 10 : 20;

              return (
                <motion.button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-pressed={isCenter}
                  aria-label={`${item.title}: ${item.description}`}
                  initial={false}
                  animate={
                    reduceMotion
                      ? { x: xTranslate, y: yTranslate, scale, opacity }
                      : { x: xTranslate, y: yTranslate, scale, rotateY, opacity }
                  }
                  transition={{ duration: reduceMotion ? 0 : 0.55, ease: EASE }}
                  style={{
                    zIndex,
                    left: '50%',
                    top: '50%',
                    marginLeft: -175,
                    marginTop: -155,
                    width: 350,
                    height: 310,
                    background: isCenter
                      ? 'linear-gradient(155deg, rgba(255,255,255,0.96) 0%, rgba(247,248,244,0.92) 100%)'
                      : 'rgba(247, 248, 244, 0.78)',
                    borderColor: isCenter ? 'rgba(32, 61, 48, 0.22)' : 'rgba(255, 255, 255, 0.85)',
                    boxShadow: isCenter
                      ? '0 28px 60px -14px rgba(22, 43, 34, 0.18), 0 4px 16px -4px rgba(22, 43, 34, 0.08)'
                      : '0 14px 32px -10px rgba(22, 43, 34, 0.1)',
                  }}
                  className="absolute flex flex-col justify-between rounded-3xl border p-7 text-left backdrop-blur-md focus-visible:outline-offset-4"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <span
                        className="text-[11px] font-bold uppercase tracking-[0.16em]"
                        style={{ color: isCenter ? 'var(--sf-forest)' : 'var(--sf-ink-muted)' }}
                      >
                        {item.eyebrow}
                      </span>
                      <span
                        className="grid h-10 w-10 place-items-center rounded-2xl"
                        style={{
                          background: isCenter ? 'var(--sf-forest)' : 'var(--sf-sage-soft)',
                          color: isCenter ? 'var(--sf-surface)' : 'var(--sf-forest)',
                        }}
                      >
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                    </div>

                    <h3 className="mt-5 text-xl font-bold tracking-[-0.02em]" style={{ color: 'var(--sf-navy)' }}>
                      {item.title}
                    </h3>
                    <p className="mt-2.5 text-sm leading-6" style={{ color: 'var(--sf-ink-muted)' }}>
                      {item.description}
                    </p>
                  </div>

                  <div
                    className="flex items-center justify-between border-t pt-4 text-xs font-semibold"
                    style={{ borderColor: 'rgba(32, 61, 48, 0.1)', color: 'var(--sf-forest)' }}
                  >
                    <span>{item.detail}</span>
                    {!isCenter ? <span className="text-[11px] opacity-75">Focus</span> : null}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Orbit controls */}
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={selectPrev}
              aria-label="Previous capability card"
              className="grid h-10 w-10 place-items-center rounded-full border bg-white/80 transition-colors hover:bg-white"
              style={{ borderColor: 'var(--sf-sage-line)', color: 'var(--sf-forest)' }}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>

            <div className="flex items-center gap-2" role="tablist" aria-label="Capability cards">
              {CAPABILITIES.map((item, idx) => {
                const active = idx === activeIndex;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    aria-label={item.title}
                    onClick={() => setActiveIndex(idx)}
                    className="h-2.5 rounded-full transition-all"
                    style={{
                      width: active ? 28 : 10,
                      background: active ? 'var(--sf-forest)' : 'rgba(32, 61, 48, 0.22)',
                    }}
                  />
                );
              })}
            </div>

            <button
              type="button"
              onClick={selectNext}
              aria-label="Next capability card"
              className="grid h-10 w-10 place-items-center rounded-full border bg-white/80 transition-colors hover:bg-white"
              style={{ borderColor: 'var(--sf-sage-line)', color: 'var(--sf-forest)' }}
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Mobile / Compact Card Stack */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 md:hidden">
          {CAPABILITIES.map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.id}
                className="flex flex-col justify-between rounded-3xl border p-6"
                style={{
                  background: 'rgba(255, 255, 255, 0.86)',
                  borderColor: 'var(--sf-sage-line)',
                  boxShadow: '0 12px 28px -10px rgba(22, 43, 34, 0.12)',
                }}
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--sf-forest)' }}>
                      {item.eyebrow}
                    </span>
                    <span
                      className="grid h-9 w-9 place-items-center rounded-xl"
                      style={{ background: 'var(--sf-sage-soft)', color: 'var(--sf-forest)' }}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-bold tracking-[-0.02em]" style={{ color: 'var(--sf-navy)' }}>
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6" style={{ color: 'var(--sf-ink-muted)' }}>
                    {item.description}
                  </p>
                </div>
                <p className="mt-4 border-t pt-3 text-xs font-semibold" style={{ borderColor: 'rgba(32, 61, 48, 0.08)', color: 'var(--sf-forest)' }}>
                  {item.detail}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
