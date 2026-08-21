'use client';

import { ChevronDown, Clock3, Filter, Plane, RefreshCw, Search } from 'lucide-react';

export type ShellUser = {
  name: string;
  email: string;
  avatarUrl?: string | null;
};

export function AppShell({
  children,
  user = { name: 'Oliver Brown', email: 'oliver.brown@domain.io' },
  active = 'scheduled',
  scheduledCount = 12,
  sentCount = 785,
  onCompose,
}: {
  children: React.ReactNode;
  user?: ShellUser;
  active?: 'scheduled' | 'sent';
  scheduledCount?: number;
  sentCount?: number;
  onCompose?: () => void;
}) {
  return (
    <div className="min-h-screen bg-white text-gray-900 lg:flex">
      <Sidebar user={user} active={active} scheduledCount={scheduledCount} sentCount={sentCount} onCompose={onCompose} />
      <div className="min-w-0 flex-1">
        <Topbar />
        <main>{children}</main>
      </div>
    </div>
  );
}

export function Sidebar({
  user,
  active,
  scheduledCount,
  sentCount,
  onCompose,
}: {
  user: ShellUser;
  active: 'scheduled' | 'sent';
  scheduledCount: number;
  sentCount: number;
  onCompose?: () => void;
}) {
  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-gray-200 bg-white lg:min-h-screen lg:w-[250px] lg:border-b-0 lg:border-r">
      <div className="flex items-center justify-between px-6 py-6 lg:block">
        <div className="text-[22px] font-bold leading-none tracking-[-0.06em]">ONB</div>
        <button className="flex items-center gap-2 rounded-lg text-left lg:mt-8 lg:w-full" title="Open account menu">
          <Avatar user={user} />
          <span className="min-w-0 flex-1 lg:block">
            <span className="block truncate text-sm font-bold text-gray-900">{user.name}</span>
            <span className="block truncate text-[11px] text-gray-500">{user.email}</span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
        </button>
      </div>
      <div className="px-6 pb-6">
        {onCompose ? <button onClick={onCompose} className="w-full rounded-full border border-brand-green py-2 text-sm font-bold text-brand-green transition hover:bg-brand-green-light">Compose</button> : <a href="/compose" className="block w-full rounded-full border border-brand-green py-2 text-center text-sm font-bold text-brand-green transition hover:bg-brand-green-light">Compose</a>}
        <div className="mt-9 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">Core</div>
        <nav className="mt-3 space-y-1" aria-label="Mailbox">
          <NavItem href="/dashboard" icon={<Clock3 className="h-4 w-4" />} label="Scheduled" count={scheduledCount} active={active === 'scheduled'} />
          <NavItem href="/sent" icon={<Plane className="h-4 w-4" />} label="Sent" count={sentCount} active={active === 'sent'} />
        </nav>
      </div>
    </aside>
  );
}

function NavItem({ href, icon, label, count, active }: { href: string; icon: React.ReactNode; label: string; count: number; active: boolean }) {
  return <a href={href} className={`flex h-9 w-full items-center gap-3 rounded-lg px-3 text-sm ${active ? 'bg-brand-green-light font-bold text-gray-900' : 'text-gray-500 hover:bg-gray-50'}`}>
    <span className={active ? 'text-gray-900' : 'text-gray-400'}>{icon}</span>
    <span>{label}</span>
    <span className="ml-auto text-xs text-gray-400">{count}</span>
  </a>;
}

export function Topbar() {
  return <header className="flex items-center gap-3 border-b border-gray-200 px-6 py-4 lg:px-8">
    <label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-full bg-gray-50 px-4 text-gray-400">
      <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
      <input className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400" placeholder="Search" aria-label="Search" />
    </label>
    <button className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-gray-400 hover:bg-gray-50 hover:text-gray-900" title="Filter"><Filter className="h-4 w-4" /></button>
    <button className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-gray-400 hover:bg-gray-50 hover:text-gray-900" title="Refresh"><RefreshCw className="h-4 w-4" /></button>
  </header>;
}

export function Avatar({ user }: { user: ShellUser }) {
  return user.avatarUrl ? <img className="h-9 w-9 rounded-full object-cover" src={user.avatarUrl} alt="" /> : <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-green text-sm font-bold text-white">{user.name.slice(0, 1)}</span>;
}

