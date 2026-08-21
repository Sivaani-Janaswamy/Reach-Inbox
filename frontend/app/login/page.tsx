'use client';

import { FormEvent } from 'react';
import { ArrowRight, LockKeyhole, Mail } from 'lucide-react';

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function LoginPage() {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-5 py-10">
      <LoginCard onSubmit={submit} />
    </main>
  );
}

function LoginCard({ onSubmit }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <section className="w-full max-w-[420px] rounded-2xl border border-gray-200 bg-white p-8 sm:p-10">
      <div className="text-center">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-brand-green">ONB</p>
        <h1 className="text-[32px] font-bold leading-tight text-gray-900">Login</h1>
      </div>

      <a
        href={`${apiBase}/auth/google`}
        className="mt-8 flex h-11 w-full items-center justify-center gap-3 rounded-lg bg-brand-green-light text-sm font-semibold text-gray-900 transition hover:bg-[#d5f0dc]"
      >
        <span className="text-lg font-bold text-[#4285F4]" aria-hidden="true">G</span>
        Login with Google
      </a>

      <div className="my-6 flex items-center gap-3 text-[11px] text-gray-400">
        <span className="h-px flex-1 bg-gray-200" />
        <span className="whitespace-nowrap">or sign up through email</span>
        <span className="h-px flex-1 bg-gray-200" />
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        <TextInput icon={<Mail className="h-4 w-4" />} name="email" placeholder="Email ID" type="email" autoComplete="email" />
        <TextInput icon={<LockKeyhole className="h-4 w-4" />} name="password" placeholder="Password" type="password" autoComplete="current-password" />
        <button className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand-green text-sm font-bold text-white transition hover:bg-[#18a84c]" type="submit">
          Login
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </form>
    </section>
  );
}

function TextInput({
  icon,
  name,
  placeholder,
  type,
  autoComplete,
}: {
  icon: React.ReactNode;
  name: string;
  placeholder: string;
  type: string;
  autoComplete: string;
}) {
  return (
    <label className="flex h-11 items-center gap-3 rounded-lg bg-gray-50 px-3 text-gray-400 focus-within:text-gray-900">
      {icon}
      <input className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400" name={name} placeholder={placeholder} type={type} autoComplete={autoComplete} required />
    </label>
  );
}
