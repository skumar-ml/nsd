# NSD Scripts

This folder contains utilities scripts used by NSD, including checkout customizations, abandoned cart modals, attendance tracking helpers.

## Used File and Description
- `abandoned-cart-modal.js` – Client-side modal logic that detects stale checkout data and nudges members to recover their cart.
- `add_family.js` – Loader for the family member grid that fetches household profiles, sorts them, and wires edit actions.
- `attendance-leaderboard.js` – Renders the attendance leaderboard grid showing lab names and their current scores.
- `attendance_new.js` – Student self check-in UI that filters sessions, shows lab availability, and submits attendance.
- `briefs-events-checkout.js` – Multi-step checkout wizard for briefs/events that pulls inventory, handles accordions, and updates totals.
- `check-member.js` – Lightweight membership verifier that hits the checkMemberExist API and fills status fields.
- `checkout_with_abandoned.js` – Full checkout experience with abandoned-cart recovery plus briefs upsell modal management.
- `coach-portal.js` – Coach resource loader that maps camp IDs to schedules and injects uploaded materials for the instructor portal.
- `competition.js` – Builds accordion views of competition standings, sorting events and team point totals.
- `google_review_modal.js` – Eligibility checker and modal that invites recent students to leave a Google review after completing a program.
- `instructor-attendance_new.js` – Instructor-facing check-in dashboard with filters, pagination, and session management controls.
- `leaderboard_v1.js` – Comprehensive competition leaderboard that fetches member data, builds tabs, and tracks progress bars.
- `new_portal.js` – Primary NSD portal experience that aggregates forms, invoices, briefs, and supplementary data for the current season.
- `new_registration_form.js` – Historical registration portal that lists every completed form and toggles paid/free resources.
- `notification-count.js` – Fetches unread notifications and injects the badge count beside the bell icon.
- `notification.js` – Full notification center with filtering, pagination, and read/unread tracking.
- `nsd_global.css` – Shared styling for modals, navigation, and various responsive tweaks across the NSD portal.
- `nsd_progessbar.css` – Dedicated CSS for the onboarding progress bar widget.
- `payment_confirmation_v2.js` – Success-page logic that reads query params, shows supplementary upsells, and resets checkout UI states.
- `polling-count.js` – Fetches polling assignments and updates the unread polling counter badge.
- `polling.js` – Poll center UI that filters polls, paginates submissions, and highlights outstanding responses.
- `portal-supp-program.js` – Supplementary program carousel/slider that fetches offerings, handles payments, and updates legacy student pricing.
- `portal_briefs_events.js` – Portal component for managing brief downloads, previews, and subscription upsells from API data.
- `signInActivity.js` – Simple logger that posts member sign-in activity to the backend.
- `supplementary-programs.js` – Legacy supplementary form accordion that tracks completion icons and links per category.
- `supplementary.css` – Styling for the supplementary accordion, labels, and expanded content states.
- `update_profile.js` – Update-profile modal handler that loads member details, pre-fills the form, and submits changes.
- `utility.js` – Tiny helper exposing `setupAdminViewListener` to toggle admin-only views via ID allowlists or query params.
