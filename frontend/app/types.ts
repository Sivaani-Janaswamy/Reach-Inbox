export type Tab = 'scheduled' | 'sent';

export type EmailRecord = {
  id: string;
  recipient_email: string;
  subject: string;
  scheduled_at: string;
  sent_at: string | null;
  status: string;
  error_message: string | null;
};

export type CurrentUser = {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
};

export type Sender = {
  id: string;
  name: string;
  smtpUser: string;
};

export type EmailListResponse = {
  data: EmailRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
};

export type SenderListResponse = { data: Sender[] };
