'use client';

import * as Popover from '@radix-ui/react-popover';
import { Bold, CalendarClock, ChevronDown, Image, IndentDecrease, IndentIncrease, Italic, Link2, List, ListOrdered, Paperclip, Quote, Redo2, Send, Strikethrough, Underline, Undo2 } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useState } from 'react';

export function ComposeScreen() {
  const [laterOpen, setLaterOpen] = useState(false);
  return <div className="min-h-screen bg-white text-gray-900"><header className="flex items-center justify-between border-b border-gray-200 px-5 py-4 sm:px-10"><div className="flex items-center gap-3"><a href="/dashboard" className="icon-button" title="Back">←</a><h1 className="text-lg font-bold">Compose New Email</h1></div><div className="flex items-center gap-1"><button className="icon-button" title="Attach"><Paperclip className="h-4 w-4" /></button><Popover.Root open={laterOpen} onOpenChange={setLaterOpen}><Popover.Trigger asChild><button className="icon-button" title="Schedule"><CalendarClock className="h-4 w-4" /></button></Popover.Trigger><SendLaterPopover onDone={() => setLaterOpen(false)} /></Popover.Root><button className="rounded-full bg-brand-green px-5 py-2 text-sm font-bold text-white">Send</button></div></header><main className="mx-auto flex min-h-[calc(100vh-73px)] max-w-[1000px] flex-col px-5 py-6 sm:px-10"><div className="grid grid-cols-[120px_1fr] items-center gap-y-4 text-sm"><FieldLabel>From</FieldLabel><button className="flex w-fit items-center gap-2 rounded-full bg-gray-50 px-3 py-2 text-gray-500">oliver.brown@domain.io<ChevronDown className="h-3 w-3" /></button><FieldLabel>To</FieldLabel><div className="flex items-center gap-2"><RecipientChips /><button className="ml-auto flex items-center gap-1 text-xs font-bold text-brand-green"><Link2 className="h-3 w-3" />Upload List</button></div><FieldLabel>Subject</FieldLabel><input className="border-0 border-b border-gray-200 bg-transparent py-2 text-sm outline-none focus:border-brand-green" placeholder="Subject" /></div><div className="my-6 border-b border-gray-200" /><div className="grid grid-cols-[1fr_1fr] gap-5 sm:w-[400px]"><InlineNumberField label="Delay between 2 emails" /><InlineNumberField label="Hourly Limit" /></div><RichTextEditor /></main></div>;
}

function FieldLabel({ children }: { children: React.ReactNode }) { return <span className="text-sm text-gray-500">{children}</span>; }
function RecipientChips() { return <div className="flex min-w-0 flex-wrap gap-2"><Chip text="tame@jmail.com" /><Chip text="john@domain.io" /><Chip text="+4" muted /></div>; }
function Chip({ text, muted = false }: { text: string; muted?: boolean }) { return <span className={`rounded-full px-3 py-1 text-xs ${muted ? 'bg-gray-100 text-gray-500' : 'bg-brand-green-light text-brand-green-text'}`}>{text}</span>; }
function InlineNumberField({ label }: { label: string }) { return <label className="text-xs text-gray-500">{label}<input className="mt-2 block w-14 rounded-md bg-gray-50 px-2 py-2 text-center text-sm text-gray-900 outline-brand-green" placeholder="00" type="number" /></label>; }

function RichTextEditor() {
  const editor = useEditor({ extensions: [StarterKit], content: '', immediatelyRender: false });
  if (!editor) return <div className="mt-6 min-h-[360px] animate-pulse rounded-lg bg-gray-100" />;
  return <div className="relative mt-6 min-h-[360px] rounded-lg bg-gray-100 p-4"><div className="sticky top-0 z-[1] mb-5 flex w-fit flex-wrap gap-1 rounded-lg border border-gray-200 bg-white p-1 shadow-md">{[[Undo2, 'Undo'], [Redo2, 'Redo'], [Bold, 'Bold'], [Italic, 'Italic'], [Underline, 'Underline'], [ListOrdered, 'Ordered list'], [List, 'List'], [IndentDecrease, 'Outdent'], [IndentIncrease, 'Indent'], [Quote, 'Quote'], [Image, 'Image'], [Strikethrough, 'Strike']].map(([Icon, label]) => <button key={label as string} onClick={() => editor.chain().focus().toggleBold().run()} className="grid h-7 w-7 place-items-center rounded text-gray-400 hover:bg-gray-50 hover:text-gray-900" title={label as string}><Icon className="h-3.5 w-3.5" /></button>)}</div><EditorContent editor={editor} className="min-h-[270px] text-sm leading-7 outline-none" /></div>;
}

function SendLaterPopover({ onDone }: { onDone: () => void }) {
  const [dateTime, setDateTime] = useState('');
  const quickPicks = ['Tomorrow', 'Tomorrow, 10:00 AM', 'Tomorrow, 11:00 AM', 'Tomorrow, 3:00 PM'];
  return <Popover.Portal><Popover.Content sideOffset={8} align="end" className="z-20 w-[280px] rounded-lg border border-gray-200 bg-white p-4 shadow-md"><h2 className="mb-3 text-sm font-bold text-gray-900">Send Later</h2><label className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-400"><input value={dateTime} onChange={(event) => setDateTime(event.target.value)} className="min-w-0 bg-transparent text-sm text-gray-500 outline-none" type="datetime-local" placeholder="Pick date & time" /><CalendarClock className="h-4 w-4 shrink-0" /></label><div className="mt-3 border-t border-gray-200 pt-2">{quickPicks.map((option) => <button key={option} onClick={() => setDateTime(option)} className="block w-full rounded px-2 py-2 text-left text-sm text-gray-500 hover:bg-gray-50">{option}</button>)}</div><div className="mt-3 flex justify-end gap-3"><button onClick={onDone} className="text-sm text-gray-500">Cancel</button><button onClick={onDone} className="rounded-full border border-brand-green px-4 py-1.5 text-sm font-bold text-brand-green">Done</button></div></Popover.Content></Popover.Portal>;
}
