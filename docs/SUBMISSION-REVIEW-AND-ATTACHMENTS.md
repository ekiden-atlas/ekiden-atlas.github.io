# Submission review and attachments

The optional SQL change adds an admin-only edit-and-submit action for pending race submissions and a separate Google-authenticated form for other submissions. Race corrections retain the existing target and concurrency check. Accepting other material records an internal decision. Contributors can view their own items and attachments, and authorized reviewers can download attachments. Files remain in a private bucket.

The migration grants additional update columns on the existing submission table under its existing pending-only admin policy. It updates the existing publication trigger to publish the submitted values. It also creates one table, one private bucket, scoped Storage policies and a readiness RPC. No authentication settings or member lists change. The frontend preserves the existing review workflow until the readiness RPC is enabled.

Before applying, confirm the production function and policies match the repository baseline and validate in a separate database. Check that logged-out users and unrelated Google accounts cannot read attachments or review items. Check that a contributor can submit multiple allowed files and that an administrator can edit and submit or reject both kinds of submission. Check that an attachment remains private after review.

To disable the feature while retaining submissions and files, revoke authenticated execution on the readiness RPC, remove the new upload and review policies and revoke the added update privileges. Restore the prior publication function from optional-result-submissions.sql using CREATE OR REPLACE FUNCTION. Preserve the private bucket and existing permissions for retrieval until the owner decides how to retain the material.
