export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="mb-7 flex flex-col gap-5 sm:mb-8 lg:flex-row lg:items-end lg:justify-between">
      <div>
        {eyebrow ? <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-brand-600">{eyebrow}</p> : null}
        <h1 className="text-balance text-2xl font-bold tracking-tight text-navy-900 sm:text-3xl">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-500 sm:text-base">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  );
}
