import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Mail,
  CheckCheck,
  CalendarCheck2,
  Trash2,
  Filter,
} from 'lucide-react';
import { useSession } from '../hooks/useSession';
import { mockRepository } from '../data/mockRepository';
import { Button } from '../components/ui/Button';

export function NotificationsPage() {
  const { session } = useSession();
  const [filterChannel, setFilterChannel] = useState('all'); // 'all' | 'unread' | 'in_app' | 'email'
  const [refreshKey, setRefreshKey] = useState(0);

  // Load notifications for this tenant
  const notifications = useMemo(() => {
    if (!session?.companyId) return [];
    return mockRepository
      .listNotifications(session.companyId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [session?.companyId, refreshKey]);

  // Filtered notifications
  const filteredList = useMemo(() => {
    return notifications.filter((item) => {
      if (filterChannel === 'unread' && item.readAt) return false;
      if (filterChannel === 'in_app' && item.channel !== 'in_app') return false;
      if (filterChannel === 'email' && item.channel !== 'email_request') return false;
      return true;
    });
  }, [notifications, filterChannel]);

  // Unread count
  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.readAt).length;
  }, [notifications]);

  // Mark all read
  const handleMarkAllRead = () => {
    mockRepository.markAllNotificationsRead(session.companyId, session.userId);
    setRefreshKey((k) => k + 1);
  };

  // Mark single read
  const handleMarkRead = (id) => {
    mockRepository.markNotificationRead(session.companyId, id);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sage-50 px-2.5 py-1 text-xs font-semibold text-sage-800 ring-1 ring-inset ring-sage-200">
              <Bell className="h-3.5 w-3.5 text-sage-600" />
              Notification Center
            </span>
            {unreadCount > 0 && (
              <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-700">
                {unreadCount} new
              </span>
            )}
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-navy-900 sm:text-3xl">
            Workspace Activity & Alerts
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Real-time notifications for booking confirmations, approval escalations, and priority overrides.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="secondary"
            onClick={handleMarkAllRead}
            className="gap-2 text-xs"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'all', label: `All Updates (${notifications.length})` },
          { id: 'unread', label: `Unread (${unreadCount})` },
          { id: 'in_app', label: 'In-App Alerts' },
          { id: 'email', label: 'Email Notifications' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterChannel(tab.id)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              filterChannel === tab.id
                ? 'bg-navy-900 text-white'
                : 'bg-white text-ink-600 hover:bg-mist-100 border border-line'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredList.map((item) => {
          const isUnread = !item.readAt;
          const isEmail = item.channel === 'email_request';
          const isOverride = item.message?.toLowerCase().includes('overridden');

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => isUnread && handleMarkRead(item.id)}
              className={`flex items-start justify-between gap-4 rounded-3xl border p-5 shadow-soft transition-all cursor-pointer ${
                isUnread
                  ? 'border-sage-200 bg-sage-50/30 hover:bg-sage-50/60'
                  : 'border-line bg-white hover:bg-mist-50/40'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${
                    isOverride
                      ? 'bg-rose-100 text-rose-700'
                      : isEmail
                      ? 'bg-mist-100 text-navy-700'
                      : 'bg-sage-100 text-sage-800'
                  }`}
                >
                  {isOverride ? (
                    <ShieldAlert className="h-5 w-5" />
                  ) : isEmail ? (
                    <Mail className="h-5 w-5" />
                  ) : (
                    <CalendarCheck2 className="h-5 w-5" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        isEmail ? 'text-ink-500' : 'text-sage-700'
                      }`}
                    >
                      {isEmail ? 'Automated Email Dispatch' : 'In-App Notification'}
                    </span>
                    {isUnread && (
                      <span className="h-2 w-2 rounded-full bg-sage-600" />
                    )}
                  </div>

                  <p className="mt-1 text-xs font-semibold text-navy-900 leading-relaxed">
                    {item.message}
                  </p>

                  <p className="mt-2 text-[10px] text-ink-400">
                    {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Just now'}
                  </p>
                </div>
              </div>

              {isUnread && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarkRead(item.id);
                  }}
                  className="shrink-0 text-xs text-sage-700 hover:text-sage-900 font-semibold"
                >
                  Mark read
                </button>
              )}
            </motion.div>
          );
        })}

        {filteredList.length === 0 && (
          <div className="rounded-3xl border border-line bg-white p-12 text-center shadow-soft">
            <Bell className="mx-auto h-12 w-12 text-ink-300" />
            <h3 className="mt-3 text-base font-bold text-navy-900">No notifications found</h3>
            <p className="mt-1 text-xs text-ink-500">
              You are completely caught up with your workspace alerts!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
