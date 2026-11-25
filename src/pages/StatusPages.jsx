import { ArrowLeft, Compass, ShieldX } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { useSession } from '../hooks/useSession';

function StatusPage({ code, title, description, icon: Icon }) {
  const { session } = useSession();
  return (
    <main className="surface-grid relative flex min-h-screen items-center justify-center overflow-hidden bg-mist-50 px-5 py-12">
      <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-100/70 blur-3xl" aria-hidden="true" />
      <div className="relative w-full max-w-lg text-center">
        <Logo light to={session ? '/app/dashboard' : '/login'} className="mx-auto" />
        <div className="mt-12 rounded-3xl border border-white bg-white/90 p-8 shadow-lift sm:p-12">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand-600">
            <Icon className="h-8 w-8" aria-hidden="true" />
          </div>
          <p className="mt-6 text-sm font-bold uppercase tracking-[0.22em] text-brand-600">{code}</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-navy-900">{title}</h1>
          <p className="mt-4 leading-7 text-ink-600">{description}</p>
          <Link
            to={session ? '/app/dashboard' : '/login'}
            className="mt-8 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-800"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {session ? 'Return to dashboard' : 'Return to sign in'}
          </Link>
        </div>
      </div>
    </main>
  );
}

export function UnauthorizedPage() {
  return (
    <StatusPage
      code="403 · Access restricted"
      title="This area needs different permissions"
      description="Your current demo role does not include access to this module. Switch demo users to explore another role, or return to your dashboard."
      icon={ShieldX}
    />
  );
}

export function NotFoundPage() {
  return (
    <StatusPage
      code="404 · Page not found"
      title="This space is off the map"
      description="The page may have moved, or the address may be incorrect. Your reservations and workspace data are unaffected."
      icon={Compass}
    />
  );
}
