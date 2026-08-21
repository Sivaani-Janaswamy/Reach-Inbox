'use client';

import { Clock3, Plane, Star } from 'lucide-react';
import { AppShell } from './app-shell';
import type { Tab } from '../types';

export type MockEmail = {
  id: string;
  recipient: string;
  recipientName: string;
  subject: string;
  preview: string;
  time: string;
  status: 'scheduled' | 'sent' | 'failed';
};

export const mockEmails: MockEmail[] = [
  { id: '1', recipient: 'john.smith@domain.io', recipientName: 'John Smith', subject: 'Meeting follow-up - Scheduled', preview: 'Just wanted to follow up on our conversation and share the next steps.', time: 'Tue 9:15:12 AM', status: 'scheduled' },
  { id: '2', recipient: 'sarah.lee@domain.io', recipientName: 'Sarah Lee', subject: 'Product update for your team', preview: 'Here is the latest update we discussed in our last call.', time: 'Tue 10:30:00 AM', status: 'scheduled' },
  { id: '3', recipient: 'mike.jones@domain.io', recipientName: 'Mike Jones', subject: 'A quick introduction', preview: 'I thought it would be useful to connect you with our team.', time: 'Wed 8:45:21 AM', status: 'scheduled' },
  { id: '4', recipient: 'tame@jmail.com', recipientName: 'Tame Williams', subject: 'Thanks for your time', preview: 'Appreciate you making the time to chat with us yesterday.', time: 'Mon 3:12:08 PM', status: 'sent' },
  { id: '5', recipient: 'nina@domain.io', recipientName: 'Nina Patel', subject: 'Your onboarding notes', preview: 'Sharing the notes and resources from our onboarding session.', time: 'Mon 1:04:44 PM', status: 'sent' },
  { id: '6', recipient: 'lee@domain.io', recipientName: 'Lee Chen', subject: 'Delivery issue', preview: 'We were unable to deliver this message to the recipient.', time: 'Sun 11:22:19 AM', status: 'failed' },
];

export function EmailListRow({ email, onOpen }: { email: MockEmail; onOpen?: (email: MockEmail) => void }) {
  return <button onClick={() => onOpen?.(email)} className="group flex min-h-[56px] w-full items-center gap-3 border-b border-gray-200 px-5 text-left transition hover:bg-gray-50 sm:gap-5 sm:px-8">
    <span className="w-[145px] shrink-0 truncate text-sm font-bold text-gray-900">To: {email.recipientName}</span>
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${email.status === 'scheduled' ? 'bg-amber-light text-amber' : email.status === 'sent' ? 'bg-brand-green-light text-brand-green-text' : 'bg-red-50 text-red-600'}`}>
      {email.status === 'scheduled' ? <Clock3 className="h-3 w-3" /> : <Plane className="h-3 w-3" />}{email.time}
    </span>
    <span className="min-w-0 flex-1 truncate text-sm"><strong className="text-gray-900">{email.subject}</strong><span className="text-gray-400"> - {email.preview}</span></span>
    <Star className="h-4 w-4 shrink-0 text-gray-300 transition group-hover:text-gray-900" />
  </button>;
}

export function SkeletonRow() {
  return <div className="flex min-h-[56px] items-center gap-4 border-b border-gray-200 px-5 sm:px-8"><span className="h-3 w-32 animate-pulse rounded bg-gray-100" /><span className="h-5 w-28 animate-pulse rounded-full bg-gray-100" /><span className="h-3 max-w-sm flex-1 animate-pulse rounded bg-gray-100" /><span className="h-4 w-4 animate-pulse rounded-full bg-gray-100" /></div>;
}

export function EmptyListState({ tab }: { tab: Tab }) {
  return <div className="flex min-h-[330px] flex-col items-center justify-center gap-3 text-gray-400"><div className="grid h-12 w-12 place-items-center rounded-full bg-gray-50"><MailIcon /></div><strong className="text-base text-gray-900">No {tab === 'scheduled' ? 'scheduled' : 'sent'} emails yet</strong><span className="text-sm">Your email activity will appear here.</span></div>;
}

function MailIcon() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 6.5h16v11H4z" /><path d="m4 7 8 6 8-6" /></svg>;
}

export function EmailListScreen({ tab = 'scheduled', emails = mockEmails, onOpen }: { tab?: Tab; emails?: MockEmail[]; onOpen?: (email: MockEmail) => void }) {
  const visibleEmails = emails.filter((email) => tab === 'scheduled' ? email.status === 'scheduled' : email.status !== 'scheduled');
  return <AppShell active={tab}>
    <section className="mx-auto max-w-[1100px] px-5 py-8 sm:px-8 sm:py-12">
      <div className="mb-8 flex items-end justify-between"><div><p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-gray-400">Core / {tab === 'scheduled' ? 'Queue' : 'Archive'}</p><h1 className="text-3xl font-bold text-gray-900">{tab === 'scheduled' ? 'Scheduled' : 'Sent'}</h1></div><span className="rounded-full bg-gray-50 px-3 py-1 text-xs text-gray-500">{visibleEmails.length} emails</span></div>
      <div className="border-t border-gray-200">{visibleEmails.length ? visibleEmails.map((email) => <EmailListRow key={email.id} email={email} onOpen={onOpen} />) : <EmptyListState tab={tab} />}</div>
    </section>
  </AppShell>;
}
