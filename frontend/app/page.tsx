'use client';

import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { EmptyState, StatusBadge } from './components/ui';
import type { CurrentUser, EmailListResponse, EmailRecord, Sender, SenderListResponse, Tab } from './types';

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function formatDate(value: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export default function HomePage() {
  const [tab, setTab] = useState<Tab>('scheduled');
  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [senders, setSenders] = useState<Sender[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [notice, setNotice] = useState('');
  const [user, setUser] = useState<CurrentUser | null>(null);

  async function loadEmails(activeTab = tab) {
    setLoading(true);
    try {
      const response = await fetch(`${apiBase}/api/emails?status=${activeTab}&limit=50`, { credentials: 'include' });
      if (!response.ok) throw new Error('Could not load email activity');
      const result: EmailListResponse = await response.json();
      setEmails(result.data);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not load email activity');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEmails(tab);
    fetch(`${apiBase}/api/me`, { credentials: 'include' })
      .then((response) => response.ok ? response.json() as Promise<CurrentUser> : null)
      .then((currentUser) => setUser(currentUser))
      .catch(() => setUser(null));
    fetch(`${apiBase}/api/senders`, { credentials: 'include' })
      .then((response) => response.json())
      .then((result: SenderListResponse) => setSenders(result.data || []))
      .catch(() => setSenders([]));
  }, [tab]);

  async function logout() {
    await fetch(`${apiBase}/auth/logout`, { method: 'POST', credentials: 'include' });
    setNotice('You have been logged out');
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/">
          <span className="brand-mark">R</span>
          <span>ReachInbox</span>
        </a>
        <div className="topbar-actions">
          <a className="login-link" href={`${apiBase}/auth/google`}>Sign in with Google</a>
          {user ? <button className="avatar-button" onClick={logout} title={`Log out ${user.name || user.email}`}>
            {user.avatar_url ? <img src={user.avatar_url} alt="" /> : (user.name || user.email).slice(0, 2).toUpperCase()}
          </button> : <a className="avatar-button demo-avatar" href={`${apiBase}/auth/google`} title="Sign in with Google">?</a>}
        </div>
      </header>

      <section className="content-wrap">
        <div className="page-heading">
          <div>
            <p className="eyebrow">Workspace / Outbound</p>
            <h1>Campaign activity</h1>
            <p className="heading-copy">Schedule thoughtful follow-ups and keep every send in view.</p>
          </div>
          <button className="primary-button" onClick={() => setShowCompose(true)}><span>+</span> Compose email</button>
        </div>

        <div className="metric-strip">
          <div><span className="metric-label">View</span><strong>{tab === 'scheduled' ? 'Queued sends' : 'Delivery history'}</strong></div>
          <div><span className="metric-label">Showing</span><strong>{loading ? '...' : `${emails.length} emails`}</strong></div>
          <div><span className="metric-label">Transport</span><strong>Ethereal SMTP</strong></div>
        </div>

        <section className="activity-panel">
          <div className="panel-header">
            <div className="tabs" role="tablist" aria-label="Email activity">
              <button className={tab === 'scheduled' ? 'tab active' : 'tab'} onClick={() => setTab('scheduled')}>Scheduled</button>
              <button className={tab === 'sent' ? 'tab active' : 'tab'} onClick={() => setTab('sent')}>Sent & failed</button>
            </div>
            <button className="refresh-button" onClick={() => loadEmails()} title="Refresh activity">Refresh</button>
          </div>

          {notice && <div className="notice">{notice}<button onClick={() => setNotice('')}>Dismiss</button></div>}
          {loading ? <EmptyState loading title="" detail="" /> : emails.length === 0 ? (
            <EmptyState title={`No ${tab} emails yet`} detail="Your campaign activity will appear here." />
          ) : (
            <div className="table-scroll"><table><thead><tr><th>Recipient</th><th>Subject</th><th>{tab === 'scheduled' ? 'Scheduled for' : 'Sent at'}</th><th>Status</th></tr></thead><tbody>
              {emails.map((email) => <tr key={email.id}><td className="recipient">{email.recipient_email}</td><td>{email.subject}</td><td>{formatDate(tab === 'scheduled' ? email.scheduled_at : email.sent_at)}</td><td><StatusBadge status={email.status} /></td></tr>)}
            </tbody></table></div>
          )}
        </section>
      </section>

      {showCompose && <ComposeModal senders={senders} onClose={() => setShowCompose(false)} onCreated={() => { setShowCompose(false); setTab('scheduled'); loadEmails('scheduled'); setNotice('Campaign scheduled successfully'); }} />}
    </main>
  );
}

function ComposeModal({ senders, onClose, onCreated }: { senders: Sender[]; onClose: () => void; onCreated: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [leadCount, setLeadCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] || null;
    setFile(selected);
    if (!selected) return;
    const reader = new FileReader();
    reader.onload = () => setLeadCount(String(reader.result).split(/\r?\n/).filter((line) => line.trim()).length - 1);
    reader.readAsText(selected);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (!file) { setError('Choose a CSV file with an email column'); return; }
    form.set('leads', file);
    setSubmitting(true);
    try {
      const response = await fetch(`${apiBase}/api/campaigns`, { method: 'POST', body: form, credentials: 'include' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not schedule campaign');
      onCreated();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Could not schedule campaign');
    } finally { setSubmitting(false); }
  }

  return <div className="modal-backdrop" role="dialog" aria-modal="true"><div className="compose-modal"><div className="modal-heading"><div><p className="eyebrow">New outbound</p><h2>Compose campaign</h2></div><button className="close-button" onClick={onClose} aria-label="Close">x</button></div>
    <form onSubmit={submit}><label>Subject<input name="subject" required placeholder="A useful note for your leads" /></label><label>Message<textarea name="body" required rows={5} placeholder="Write the message your recipients will receive." /></label>
      <div className="form-grid"><label>Start time<input name="start_time" type="datetime-local" required defaultValue={new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16)} /></label><label>Delay (ms)<input name="delay_ms" type="number" min="0" defaultValue="1000" /></label><label>Hourly limit<input name="hourly_limit" type="number" min="1" defaultValue="100" /></label><label>Sender<select name="sender_id" defaultValue={senders[0]?.id || ''} disabled={!senders.length}>{senders.length ? senders.map((sender) => <option key={sender.id} value={sender.id}>{sender.name}</option>) : <option>No sender configured</option>}</select></label></div>
      <label className="file-drop">Lead CSV<input type="file" accept=".csv,text/csv" onChange={chooseFile} required /><span>{file ? `${file.name} · ${Math.max(0, leadCount)} leads detected` : 'Choose a CSV with an email column'}</span></label>
      {error && <p className="form-error">{error}</p>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={submitting || !senders.length}>{submitting ? 'Scheduling...' : 'Schedule campaign'}</button></div>
    </form></div></div>;
}
