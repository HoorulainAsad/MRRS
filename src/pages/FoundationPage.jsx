import { ArrowLeft, ArrowRight, Layers3, LockKeyhole } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export function FoundationPage({ route, publicMode = false }) {
  const title = publicMode ? 'Register your organization' : route.label;
  const description = publicMode
    ? 'A guided organization onboarding experience is planned for a future phase.'
    : route.description;
  const Icon = route?.icon || Layers3;

  return (
    <div className={publicMode ? 'mx-auto flex min-h-screen max-w-4xl items-center px-4 py-8' : 'mx-auto flex min-h-[70vh] max-w-4xl items-center py-6'}>
      <Card className="relative w-full overflow-hidden p-7 sm:p-12">
        <div className="surface-grid absolute inset-y-0 right-0 w-1/2 opacity-70 [mask-image:linear-gradient(to_left,black,transparent)]" aria-hidden="true" />
        <div className="relative max-w-2xl">
          <div className="mb-6 flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-navy-900 text-white shadow-lg shadow-navy-900/20">
              <Icon className="h-7 w-7" aria-hidden="true" />
            </div>
            <Badge tone="blue">Phase 1 foundation</Badge>
          </div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-brand-600">Built for what comes next</p>
          <h1 className="text-balance text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">{title}</h1>
          <p className="mt-4 text-lg leading-8 text-ink-600">{description}</p>
          <div className="mt-6 rounded-2xl border border-brand-100 bg-brand-50/70 p-5">
            <h2 className="font-semibold text-navy-900">A clear boundary for this demo</h2>
            <p className="mt-2 text-sm leading-6 text-ink-600">
              Navigation and permission-aware access are ready. Full module workflows and live data management are intentionally deferred; no changes will be submitted from this preview.
            </p>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to={publicMode ? '/login' : '/app/dashboard'}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-navy-800"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {publicMode ? 'Back to demo sign in' : 'Back to dashboard'}
            </Link>
            {!publicMode && route.path !== '/app/availability' ? (
              <Link
                to="/app/availability"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-mist-200 bg-white px-4 py-2.5 text-sm font-semibold text-navy-900 shadow-sm transition-colors hover:border-brand-500 hover:bg-brand-50"
              >
                Explore availability
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            ) : null}
            <Button variant="secondary" disabled className="sm:ml-auto">
              <LockKeyhole className="h-4 w-4" aria-hidden="true" />
              Editing available later
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
