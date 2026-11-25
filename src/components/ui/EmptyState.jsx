import { Inbox } from 'lucide-react';

export function EmptyState({ title, description, icon: Icon = Inbox, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <div className="mb-4 rounded-2xl bg-brand-50 p-3 text-brand-600">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="font-semibold text-navy-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm leading-6 text-ink-500">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
