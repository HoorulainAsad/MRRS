import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Building2, Layers, MapPin, Plus, Search, Users, Wrench, X } from 'lucide-react';
import { mockRepository } from '../data/mockRepository';
import { useSession } from '../hooks/useSession';

function AvailBadge({ status }) {
  const map = {
    available:   { label: 'Available',   bg: '#E8F5EC', text: '#1f7a3c' },
    occupied:    { label: 'Occupied',    bg: '#FDE8E8', text: '#b04040' },
    maintenance: { label: 'Maintenance', bg: '#FDF3E0', text: '#b07d20' },
    unavailable: { label: 'Unavailable', bg: '#F5F5F5', text: '#637068' },
  };
  const cfg = map[status] || { label: status, bg: '#F5F5F5', text: '#637068' };
  return (
    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold" style={{ background: cfg.bg, color: cfg.text }}>
      {cfg.label}
    </span>
  );
}

function AddRoomModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ name: '', location: '', capacity: '', facilities: '', category: 'meeting_room' });
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Room name is required.'); return; }
    onAdd({
      ...form,
      capacity: form.capacity ? Number(form.capacity) : undefined,
      facilities: form.facilities ? form.facilities.split(',').map((s) => s.trim()).filter(Boolean) : [],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md rounded-2xl border border-[#e4e8f0] bg-white shadow-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#e4e8f0] px-5 py-4">
          <h2 className="text-base font-bold text-[#26364A]">Add Room</h2>
          <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-[#637068] hover:bg-[#F7F8F4]">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4 px-5 py-5">
          {error && <p className="rounded-lg bg-[#FDE8E8] px-3 py-2 text-sm text-[#b04040]">{error}</p>}
          {[
            { label: 'Room Name', key: 'name', placeholder: 'The Boardroom' },
            { label: 'Location / Floor', key: 'location', placeholder: 'Floor 2, North Wing' },
            { label: 'Capacity', key: 'capacity', placeholder: '10', type: 'number' },
            { label: 'Facilities (comma-separated)', key: 'facilities', placeholder: 'Projector, Whiteboard, Video call' },
          ].map(({ label, key, placeholder, type = 'text' }) => (
            <div key={key}>
              <label className="mb-1 block text-xs font-semibold text-[#26364A]">{label}</label>
              <input
                type={type}
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="h-10 w-full rounded-lg border border-[#e4e8f0] px-3 text-sm text-[#1e2a24] outline-none focus:border-[#203D30] focus:ring-2 focus:ring-[#203D30]/10"
              />
            </div>
          ))}
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#26364A]">Type</label>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="h-10 w-full rounded-lg border border-[#e4e8f0] px-3 text-sm text-[#1e2a24] outline-none focus:border-[#203D30]"
            >
              <option value="meeting_room">Meeting Room</option>
              <option value="conference_room">Conference Room</option>
              <option value="hot_desk">Hot Desk</option>
              <option value="lab">Lab</option>
              <option value="event_space">Event Space</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-[#e4e8f0] py-2.5 text-sm font-semibold text-[#637068] hover:bg-[#F7F8F4]">Cancel</button>
            <button type="submit" className="flex-1 rounded-lg bg-[#203D30] py-2.5 text-sm font-semibold text-white hover:bg-[#162b22]">Add Room</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export function ResourcesPage() {
  const { session } = useSession();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [localExtras, setLocalExtras] = useState([]);

  const baseResources = useMemo(
    () => mockRepository.listResources(session.companyId).filter((r) => r.kind === 'reusable'),
    [session.companyId],
  );

  const allResources = useMemo(() => [...localExtras, ...baseResources], [localExtras, baseResources]);

  const categories = useMemo(() => ['all', ...new Set(allResources.map((r) => r.category).filter(Boolean))], [allResources]);

  const displayed = useMemo(() => allResources.filter((r) => {
    if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return r.name?.toLowerCase().includes(q) || r.location?.toLowerCase().includes(q);
    }
    return true;
  }), [allResources, categoryFilter, search]);

  const handleAdd = (form) => {
    setLocalExtras((prev) => [{
      id: `local-${Date.now()}`,
      kind: 'reusable',
      status: 'available',
      ...form,
    }, ...prev]);
  };

  const toggleStatus = (id) => {
    setLocalExtras((prev) => prev.map((r) => r.id === id
      ? { ...r, status: r.status === 'available' ? 'unavailable' : 'available' }
      : r,
    ));
    // For base resources, mutate in mock repo
    try {
      const res = baseResources.find((r) => r.id === id);
      if (res) {
        mockRepository.updateResource?.(session.companyId, id, {
          status: res.status === 'available' ? 'unavailable' : 'available',
        });
      }
    } catch { /* noop */ }
  };

  function categoryLabel(cat) {
    if (!cat) return '—';
    return cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#26364A]">Spaces & Rooms</h1>
          <p className="mt-1 text-sm text-[#637068]">{displayed.length} space{displayed.length !== 1 ? 's' : ''} found</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[#203D30] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#162b22]"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Room
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-[#e4e8f0] bg-white px-4 py-3 shadow-soft">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#637068]" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search rooms…"
            className="h-9 w-full rounded-lg border border-[#e4e8f0] bg-[#F7F8F4] pl-9 pr-3 text-sm text-[#1e2a24] outline-none focus:border-[#203D30] focus:bg-white"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                categoryFilter === cat
                  ? 'bg-[#203D30] text-white'
                  : 'border border-[#e4e8f0] bg-white text-[#637068] hover:bg-[#F7F8F4]'
              }`}
            >
              {cat === 'all' ? 'All Types' : categoryLabel(cat)}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of room cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {displayed.length === 0 && (
          <div className="col-span-full rounded-xl border border-[#e4e8f0] bg-white px-4 py-10 text-center shadow-soft">
            <Building2 className="mx-auto h-8 w-8 text-[#c4cacc]" aria-hidden="true" />
            <p className="mt-3 text-sm text-[#637068]">No rooms match your filters.</p>
          </div>
        )}
        {displayed.map((room) => (
          <article key={room.id} className="overflow-hidden rounded-xl border border-[#e4e8f0] bg-white shadow-soft transition-shadow hover:shadow-card">
            {/* Image placeholder */}
            <div className="relative h-36 bg-gradient-to-br from-[#E8EEE4] to-[#D0DACE]">
              {room.imageUrl ? (
                <img src={room.imageUrl} alt={room.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Building2 className="h-10 w-10 text-[#9aafc0]/60" aria-hidden="true" />
                </div>
              )}
              <div className="absolute right-2 top-2">
                <AvailBadge status={room.status} />
              </div>
            </div>

            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-[#26364A]">{room.name}</h3>
                  <p className="mt-0.5 text-xs text-[#637068]">{categoryLabel(room.category)}</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-3 text-xs text-[#637068]">
                {room.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    {room.location}
                  </span>
                )}
                {room.capacity && (
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" aria-hidden="true" />
                    {room.capacity} seats
                  </span>
                )}
              </div>

              {/* Facilities */}
              {Array.isArray(room.facilities) && room.facilities.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1">
                  {room.facilities.slice(0, 4).map((f) => (
                    <span key={f} className="rounded-md bg-[#F7F8F4] px-2 py-0.5 text-[10px] font-medium text-[#637068]">
                      {f}
                    </span>
                  ))}
                  {room.facilities.length > 4 && (
                    <span className="rounded-md bg-[#F7F8F4] px-2 py-0.5 text-[10px] font-medium text-[#637068]">
                      +{room.facilities.length - 4}
                    </span>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="mt-4 flex gap-2">
                <button className="flex-1 rounded-lg border border-[#e4e8f0] py-1.5 text-xs font-semibold text-[#26364A] hover:bg-[#F7F8F4]">
                  Edit
                </button>
                <button
                  onClick={() => toggleStatus(room.id)}
                  className={`flex-1 rounded-lg border py-1.5 text-xs font-semibold transition-colors ${
                    room.status === 'available'
                      ? 'border-[#e4e8f0] text-[#b04040] hover:bg-[#FDE8E8]'
                      : 'border-[#e4e8f0] text-[#1f7a3c] hover:bg-[#E8F5EC]'
                  }`}
                >
                  {room.status === 'available' ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Add room modal */}
      <AnimatePresence>
        {showAdd && <AddRoomModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
      </AnimatePresence>
    </div>
  );
}
