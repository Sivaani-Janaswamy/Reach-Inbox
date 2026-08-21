import { EmailDetailScreen } from '../../components/email-detail';
import { mockEmails } from '../../components/email-list';

export default function EmailPage() {
  return <EmailDetailScreen email={mockEmails[3]} />;
}