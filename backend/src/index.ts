import { app } from './app.js';
import { config } from './config.js';
import { reconcileScheduledEmails } from './reconcile.js';

async function start() {
  app.listen(config.port, () => {
    console.log(`Backend listening on http://localhost:${config.port}`);
  });

  try {
    const requeued = await reconcileScheduledEmails();
    console.log(`Reconciled ${requeued} scheduled email job(s)`);
  } catch (error) {
    console.error('Scheduled email reconciliation failed', error);
  }
}

start().catch((error) => {
  console.error('Backend startup failed', error);
  process.exit(1);
});
