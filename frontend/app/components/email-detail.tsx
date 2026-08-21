'use client';

import { Archive, ArrowLeft, Download, MoreHorizontal, Star, Trash2 } from 'lucide-react';
import { AppShell, Avatar } from './app-shell';
import type { MockEmail } from './email-list';

export function EmailDetailScreen({ email, onBack }: { email: MockEmail; onBack?: () => void }) {
  const sender = { name: 'Amanda Clark', email: 'amanda@example.com' };
  return <AppShell active="sent">
    <article className="mx-auto max-w-[980px] px-5 py-7 sm:px-10 sm:py-10">
      <header className="flex items-center justify-between gap-4 border-b border-gray-200 pb-6"><div className="flex min-w-0 items-center gap-3"><button onClick={onBack} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-gray-400 hover:bg-gray-50 hover:text-gray-900" title="Back"><ArrowLeft className="h-4 w-4" /></button><h1 className="truncate text-lg font-bold text-gray-900">Oliver, hello there! | MJWYT44 BM#52W01</h1></div><div className="flex items-center gap-1 text-gray-400"><button className="icon-button" title="Star"><Star className="h-4 w-4" /></button><button className="icon-button" title="Archive"><Archive className="h-4 w-4" /></button><button className="icon-button" title="Delete"><Trash2 className="h-4 w-4" /></button><button className="icon-button" title="More"><MoreHorizontal className="h-4 w-4" /></button></div></header>
      <div className="flex items-start justify-between gap-5 py-7"><div className="flex items-start gap-3"><Avatar user={{ name: sender.name, email: sender.email }} /><div><p className="text-sm font-bold text-gray-900">{sender.name} <span className="font-normal text-gray-500">&lt;{sender.email}&gt;</span></p><button className="mt-1 text-xs text-gray-400">to me⌄</button></div></div><time className="shrink-0 text-xs text-gray-500">Nov 3, 10:23 AM</time></div>
      <div className="max-w-[700px] space-y-5 text-sm leading-7 text-gray-900"><p>Hi Oliver,</p><p>Thanks again for taking the time to connect. It was great learning more about your team and the work you are doing.</p><p>I have included a few helpful notes below. Let me know what you think and whether it would be useful to continue the conversation next week.</p><div className="space-y-2 rounded-lg bg-amber-light p-4 text-sm font-bold leading-6 text-gray-900"><p>⚡ Your follow-up is ready to send.</p><p>⚡ The next available meeting window is Tuesday at 9:00 AM.</p></div><p>Best,<br />Amanda</p></div>
      <div className="mt-9 flex flex-wrap gap-3"><AttachmentCard name="Project-notes.pdf" size="2.4 MB" /><AttachmentCard name="Meeting-summary.png" size="846 KB" /></div>
    </article>
  </AppShell>;
}

function AttachmentCard({ name, size }: { name: string; size: string }) {
  return <div className="w-[140px] rounded-lg border border-gray-200 bg-gray-50 p-2"><div className="grid h-[86px] place-items-center rounded-md bg-white text-gray-400"><Download className="h-5 w-5" /></div><p className="mt-2 truncate text-xs font-bold text-gray-900">{name}</p><p className="mt-1 text-[11px] text-gray-400">{size}</p></div>;
}
