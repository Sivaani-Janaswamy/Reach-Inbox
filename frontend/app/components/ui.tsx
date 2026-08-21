'use client';

export function Button({
  children,
  variant = 'primary',
  type = 'button',
  disabled = false,
  onClick,
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'quiet';
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  onClick?: () => void;
}) {
  return <button className={`${variant}-button`} type={type} disabled={disabled} onClick={onClick}>{children}</button>;
}

export function StatusBadge({ status }: { status: string }) {
  return <span className={`status ${status}`}>{status}</span>;
}

export function EmptyState({ title, detail, loading = false }: { title: string; detail: string; loading?: boolean }) {
  if (loading) return <div className="empty-state"><span className="loader" />Loading activity</div>;
  return <div className="empty-state"><div className="empty-icon">--</div><strong>{title}</strong><span>{detail}</span></div>;
}
