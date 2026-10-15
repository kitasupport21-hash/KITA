# KITA Control App separation

The admin moderation UI has been removed from the public KITA app:
- Admin navigation items are no longer shown in the desktop navbar or mobile bottom navigation.
- Signing in with an admin account in this app lands on the public home screen, not an admin dashboard.
- The old `AdminModerationView` frontend component has been removed.
- Public registration continues to allow only `seeker` and `employer` roles.
- Admin API endpoints remain in the KITA backend for a separate, independently deployed KITA Control app. They continue to require an authenticated admin role; do not make them public.

## Admin account provisioning

Create the first administrator only on a trusted server using environment variables:
- `KITA_BOOTSTRAP_ADMIN_EMAIL`
- `KITA_BOOTSTRAP_ADMIN_PASSWORD` (minimum 14 characters)
- optional `KITA_BOOTSTRAP_ADMIN_NAME`

Do not put admin credentials in the browser bundle or source control. The app seeds sample non-admin data only; it no longer inserts a hard-coded admin account.

## API endpoints currently retained for the separate control app

- `GET /api/admin/stats`
- `GET /api/admin/reports`
- `PATCH /api/admin/reports/:id/status`

All calls must use the existing authenticated API flow with a valid admin session/token. Before hosting the control app on a different origin, configure a strict CORS allowlist and secure token/session handling for that origin; do not use wildcard CORS for an authenticated admin console.
