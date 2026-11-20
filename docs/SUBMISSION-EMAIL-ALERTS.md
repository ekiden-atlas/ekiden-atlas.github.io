# Administrator submission email alerts

A committed insert into either Atlas submission table queues a request to an Edge Function through pg_net. Updates and withdrawals do not queue email. The trigger sends only the submission ID, kind and creation timestamp to the function. The email contains the kind, timestamp and existing admin review URL. Recipient and sender addresses live in server-side configuration.

## Deployment and verification

- Verify a sending domain in Resend and create a sending-only key. Configure Edge Function secrets `ATLAS_RESEND_API_KEY`, `ATLAS_ALERT_FROM`, `ATLAS_ALERT_TO` and a randomly generated `ATLAS_SUBMISSION_WEBHOOK_TOKEN`. Set the recipient to the authorized administrator mailbox. Deploy `atlas-submission-alert` with gateway JWT verification disabled, since it authenticates requests with its own dedicated secret.
- Verify pg_net and Vault are available. In Vault set `atlas_submission_webhook_token` to the same dedicated token and `atlas_submission_alert_url` to the deployed function endpoint on the same project. Apply `sql/optional-submission-email-alerts.sql` only after the owner approves the production change.
- In a test environment verify unauthorized requests return 401, inserts into both tables each produce one email, rollbacks and updates produce none, and a simulated provider failure leaves the submission committed. In production verify delivery to the administrator mailbox using an authorized test submission.

This is best-effort notification. Email failures are visible in Edge Function logs and do not remove or block the review queue. Resend idempotency protects repeated deliveries within its supported time window. There is no automatic retry queue in this implementation.

## Impact and rollback

The migration adds a trigger to each submission table and one trigger function with access to its named Vault secrets. It changes no submission rows, table permissions or existing policies. To disable notifications, drop `atlas_result_submission_email` and `atlas_other_submission_email` from their respective tables and drop `public.wsd_atlas_queue_submission_alert()`. Remove the dedicated secrets from Vault and disable the Edge Function after queued requests have drained. Keep the existing review flow in service throughout.
