import { app } from './app.js';
import { config } from './config.js';
import { reconcileScheduledEmails } from './reconcile.js';

async function start() {
  const requeued = await reconcileScheduledEmails();
  app.listen(config.port, () => {
    console.log(`Backend listening on http://localhost:${config.port}`);
    console.log(`Reconciled ${requeued} scheduled email job(s)`);
  });
}

start().catch((error) => {
  console.error('Backend startup failed', error);
  process.exit(1);
});
