'use client';

import { FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, LockKeyhole, Mail } from 'lucide-react';

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    let active = true;
    fetch(`${apiBase}/api/me`, { credentials: 'include' })
      .then((response) => {
        if (response.ok && active) router.replace('/dashboard');
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [router]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <main className="login-screen flex min-h-screen items-center justify-center px-5 py-10">
      <LoginCard onSubmit={submit} />
    </main>
  );
}

function LoginCard({ onSubmit }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <section className="w-full max-w-[460px] rounded-[28px] border border-gray-200 bg-white p-8 shadow-[0_20px_70px_rgba(15,23,42,0.07)] sm:p-10">
      <div className="text-center">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-500">ReachInbox</p>
        <h1 className="text-[32px] font-semibold leading-tight tracking-[-0.04em] text-gray-900">Sign in</h1>
        <p className="mt-3 text-sm leading-6 text-gray-500">Open the dashboard first, then manage campaigns from a calm, white workspace.</p>
      </div>

      <a
        href={`${apiBase}/auth/google`}
        className="mt-8 flex h-12 w-full items-center justify-center gap-3 rounded-full border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-900 transition hover:border-gray-300 hover:bg-white"
      >
        <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-sm font-bold text-[#4285F4] shadow-sm" aria-hidden="true">G</span>
        Continue with Google
      </a>

      <div className="my-6 flex items-center gap-3 text-[11px] text-gray-400">
        <span className="h-px flex-1 bg-gray-200" />
        <span className="whitespace-nowrap">or sign in with email</span>
        <span className="h-px flex-1 bg-gray-200" />
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        <TextInput icon={<Mail className="h-4 w-4" />} name="email" placeholder="Email address" type="email" autoComplete="email" />
        <TextInput icon={<LockKeyhole className="h-4 w-4" />} name="password" placeholder="Password" type="password" autoComplete="current-password" />
        <button className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gray-900 text-sm font-semibold text-white transition hover:bg-black" type="submit">
          Open workspace
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
    <label className="flex h-12 items-center gap-3 rounded-full border border-gray-200 bg-white px-4 text-gray-400 transition focus-within:border-gray-400 focus-within:text-gray-900">
      {icon}
      <input className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400" name={name} placeholder={placeholder} type={type} autoComplete={autoComplete} required />
    </label>
  );
}
