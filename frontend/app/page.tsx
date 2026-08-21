export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-md">
        <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-sky-600">
          ReachInbox
        </p>
        <h1 className="text-3xl font-bold text-slate-900">Email Scheduler Dashboard</h1>
        <p className="mt-4 text-slate-600">
          The app scaffold is ready. Next we’ll wire in the backend API, database schema,
          queue worker, and scheduling flow.
        </p>
      </div>
    </main>
  );
}
