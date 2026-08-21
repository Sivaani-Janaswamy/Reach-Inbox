# ONB Email Scheduler — Frontend Design Brief

This describes the exact UI from the Figma screens (Login, Inbox/Scheduled
list, Email detail, Compose, Compose "Send Later" popover) in enough detail
to build without seeing the images. Follow this literally — spacing,
colors, and copy are described as observed, not approximated.

Paste this whole file into Copilot chat (or `@workspace` reference it) as
the design source of truth before generating components.

---

## 0. Global Design Tokens

Add these to `tailwind.config.js` under `theme.extend` so every component
pulls from the same values.

```js
colors: {
  brand: {
    green: '#1DB954',        // primary CTA green (Login button, Compose border, active nav)
    'green-light': '#E7F6EC',// Google login button bg, chip bg, active nav bg
    'green-text': '#15803D', // text on green-light backgrounds
  },
  amber: {
    DEFAULT: '#F59E0B',      // scheduled-time badge text
    light: '#FEF3E2',        // scheduled-time badge bg
  },
  gray: {
    50: '#F9FAFB',   // input backgrounds
    100: '#F3F4F6',  // textarea / list hover bg
    200: '#E5E7EB',  // borders, dividers
    400: '#9CA3AF',  // placeholder text, icons
    500: '#6B7280',  // secondary text (timestamps, email addresses)
    900: '#111827',  // primary text
  }
}
```

- **Font:** system sans-serif stack (Inter or similar) throughout.
- **Radius scale:** inputs/buttons/cards use `rounded-lg` (8–10px);
  pill-shaped elements (chips, badges, nav pill, buttons) use `rounded-full`.
- **Shadows:** cards/popovers use a soft shadow (`shadow-md`), not heavy —
  everything reads as flat/light, borders do most of the separation work.
- Icons throughout are outline-style (Lucide/Feather), gray-400 by default,
  gray-900 on hover/active.

---

## 1. Login Page

**Layout:** full-viewport centered white card, ~420px wide, `border
border-gray-200 rounded-2xl`, generous padding (~40px), no shadow or very
subtle.

Top to bottom, centered:
1. `Login` — bold, ~32px, gray-900.
2. **Google login button** — full width, `bg-green-light`, `text-gray-900`,
   `rounded-lg`, Google "G" logo icon + `Login with Google` text, centered,
   ~44px tall. No border.
3. **Divider** — thin `border-gray-200` line, with centered small gray text
   `or sign up through email` interrupting it (flex row: line, text, line).
4. **Email ID input** — full width, `bg-gray-50`, no visible border,
   `rounded-lg`, placeholder `Email ID`, ~44px tall.
5. **Password input** — same styling, placeholder `Password`.
6. **Login button** — full width, solid `bg-brand-green`, white bold text
   `Login`, `rounded-lg`, ~44px tall.

Spacing: ~16px vertical gap between each element in the stack.

Component: `<LoginCard>` composed of `<GoogleButton>`, `<DividerWithText>`,
`<TextInput>` (reused everywhere), `<PrimaryButton>`.

---

## 2. App Shell (Sidebar + Topbar) — used on every screen after login

### 2.1 Sidebar (~250px fixed width, white bg, right border `border-gray-200`)

Top to bottom:
1. **Logo** — `ONB`, bold, tight letter-spacing, ~22px, gray-900. Top-left,
   ~24px padding.
2. **User row** — avatar (circular photo, ~36px) + stacked text: name bold
   `Oliver Brown` (gray-900, 14px), email below in gray-500 11px
   `oliver.brown@domain.io`, chevron-down icon right-aligned. Whole row is
   a dropdown trigger.
3. **Compose button** — full width (minus side padding), `rounded-full`,
   `border border-brand-green`, `text-brand-green` bold, transparent bg,
   text `Compose`, centered, ~36px tall.
4. **Section label** — `CORE`, uppercase, 10px, letter-spaced, gray-400,
   small margin-top before nav items.
5. **Nav item — Scheduled** — clock icon + `Scheduled` label + count badge
   (`12`) right-aligned. **Active state**: `bg-green-light`, `rounded-lg`,
   `text-gray-900` bold, full-width row, ~36px tall, small horizontal
   padding.
6. **Nav item — Sent** — paper-plane icon + `Sent` label + count (`785`)
   right-aligned, gray-500 text, no background (inactive state).

### 2.2 Topbar (inside main content area, not full width — starts after sidebar)

- **Search input** — pill-shaped, `bg-gray-50`, `rounded-full`, search icon
  left, placeholder `Search`, flexible width (fills available space minus
  icon buttons).
- **Icon buttons** (right-aligned, after search): filter icon, refresh
  icon — both gray-400, ~36px touch targets, no background.

Build this as `<AppShell>` wrapping `<Sidebar>` + `<Topbar>` + `{children}`,
since it's shared across the Scheduled list, Sent list, and Email detail
screens.

---

## 3. Email List (Scheduled / Sent tab content)

Plain rows, no card wrapper, separated by a thin `border-b border-gray-200`.
Each row (~56px tall, full width, hover: `bg-gray-50`):

- `To: John Smith` — gray-900, bold, fixed-ish left column.
- **Scheduled-time badge** — pill, `bg-amber-light`, `text-amber`, clock
  icon, text like `Tue 9:15:12 AM`, `rounded-full`, small padding, 11px.
- Subject — bold gray-900, e.g. `Meeting follow-up - Scheduled`.
- ` - ` separator then preview text — gray-400, truncated with ellipsis,
  fills remaining width (`flex-1 truncate`).
- **Star icon** — outline, gray-300, right-aligned, click target ~24px.

For the **Sent** tab, same row shape but the badge likely shows sent
time/status instead of scheduled (reuse the same `<EmailListRow>` component
with a `status: 'scheduled' | 'sent' | 'failed'` prop that swaps badge
color: amber for scheduled, green for sent, red for failed).

Include:
- Loading state: skeleton rows (gray-100 pulsing bars matching row layout).
- Empty state: centered icon + text ("No scheduled emails yet" / "No sent
  emails yet"), no row list.

---

## 4. Email Detail View

- **Top bar**: back-arrow icon (left) + subject/title text bold gray-900
  (`Oliver, hello there! | MJWYT44 BM#52W01`) — left-aligned next to arrow.
  Right-aligned icon group: star outline, archive/box icon, trash icon,
  then a small circular avatar last.
- **Sender row**: circular avatar with colored bg + initial letter (e.g.
  green circle, white bold `A` for Amanda Clark) ~36px. Next to it: sender
  name bold gray-900 + `<sender@example.com>` in gray-500 smaller text on
  the same line. Below that, smaller gray-400 line `to me` with a chevron
  (expandable header, can be static for now). Date/time (`Nov 3, 10:23 AM`)
  gray-500, right-aligned on the sender row.
- **Body**: plain paragraph text, gray-900, normal line-height, standard
  reading width (don't stretch full container — cap ~700px or let it flow
  naturally under the header).
- **Callout box**: light amber/yellow background (`bg-amber-light` or a
  dedicated lighter yellow), `rounded-lg`, padding ~16px, containing 1–2
  bold lines each prefixed with a ⚡ emoji/icon.
- **Attachments row**: horizontal flex of attachment cards — each card:
  rounded-lg image thumbnail (~120px), filename bold small text below,
  file size gray-400 smaller text below that, whole card has a subtle
  border and light bg.

---

## 5. Compose New Email

- **Top bar**: back arrow + `Compose New Email` bold title (left).
  Right-aligned icon group: paperclip (attach), clock (opens Send Later
  popover), and a pill button — `Send Later` (outline green) when the
  clock/schedule option is active, or `Send` (solid green) as the primary
  action. Both pill buttons ~36px tall.
- **Form rows**, each a horizontal flex row with a fixed-width gray-500
  label on the left and the field taking the rest of the width. Rows are
  NOT boxed individually — only a single thin divider line sits below the
  Subject row to separate header fields from the body.
  1. **From** — pill dropdown showing `oliver.brown@domain.io` with a
     chevron, light gray bg, rounded-full.
  2. **To** — recipient chips: `rounded-full`, `bg-green-light`,
     `text-green-text`, small (e.g. `tame@jmail.com`), each in a row with
     a gray `+4` overflow chip when there are more than N recipients.
     Right-aligned on this same row: `Upload List` link in brand-green
     text with an upload icon.
  3. **Subject** — plain underlined-on-focus text input, placeholder
     `Subject`.
  4. **Delay between 2 emails** + **Hourly Limit** — two small inline
     numeric inputs (`bg-gray-50`, `rounded-md`, ~50px wide, placeholder
     `00`), each preceded by its own gray-500 label, sitting side by side
     in one row.
- **Body / rich text editor**: large `bg-gray-100 rounded-lg` textarea
  area filling remaining vertical space, placeholder `Type Your Reply...`.
  A floating toolbar pill sits near the top inside the editor area (white
  bg, border, rounded, small shadow) containing, left to right: undo,
  redo, font-size dropdown, bold, italic, underline, align, line-height,
  ordered list, unordered list, indent, outdent, blockquote, attach/image,
  strikethrough — all as small gray-400 icon buttons.
- **Inline image attachment preview** (if a file was attached) rendered as
  a small thumbnail card below the toolbar, top-left of the editor body.

Component breakdown: `<ComposeHeader>`, `<RecipientChips>`,
`<InlineNumberField>` (for delay/hourly limit), `<RichTextEditor>`
(wrap a library like TipTap — don't hand-roll contentEditable),
`<AttachmentThumb>`.

---

## 6. "Send Later" Popover

Triggered by the clock icon in the Compose top bar. Anchored bottom-left of
that icon (appears top-right of the compose screen).

- White card, `border border-gray-200`, `rounded-lg`, `shadow-md`,
  ~280px wide.
- Header: `Send Later` bold gray-900, small padding.
- **Date/time input**: `Pick date & time` placeholder, gray-400 text,
  calendar icon right-aligned, full width of the popover, `bg-gray-50`
  rounded.
- **Quick-pick list**: plain rows, gray-500 text, hover `bg-gray-50`:
  `Tomorrow`, `Tomorrow, 10:00 AM`, `Tomorrow, 11:00 AM`,
  `Tomorrow, 3:00 PM`. Clicking one fills the date/time input above.
- **Footer**: right-aligned button pair — `Cancel` (plain text button,
  gray-500) and `Done` (outline green pill button, same style as
  `Send Later` in the top bar).

Use a floating/positioning library (e.g. Radix Popover or Headless UI) —
don't absolute-position by hand, since it needs to stay anchored and
dismiss on outside click.

---

## 7. Shared Component Inventory

Build these once, reuse everywhere — don't duplicate styles per screen:

| Component | Used in |
|---|---|
| `<PrimaryButton>` (solid green) | Login, Compose "Send" |
| `<OutlineButton>` (green outline pill) | Compose button (sidebar), "Send Later", "Done" |
| `<TextInput>` (gray-50 bg, rounded) | Login fields, Subject, date/time input |
| `<InlineNumberField>` | Delay / Hourly Limit |
| `<Chip>` (rounded-full, green-light) | Recipient chips |
| `<Badge>` (amber/green/red variants) | Scheduled-time badge, sent status |
| `<Avatar>` (photo or initial-letter circle) | Sidebar user, email sender |
| `<EmailListRow>` | Scheduled tab, Sent tab |
| `<EmptyState>` / `<SkeletonRow>` | Both list tabs |
| `<Sidebar>` / `<Topbar>` / `<AppShell>` | Every post-login screen |

## 8. Notes for Copilot

- This brief is transcribed directly from Figma screenshots — colors are
  close approximations (hex values above), not pixel-sampled. If exact
  hex/spacing matters, flag it and we'll get the real Figma Dev Mode
  values via the Figma MCP connector instead of guessing further.
- Build mobile-responsiveness as a secondary pass — the reference screens
  are desktop-only; don't over-invest in breakpoints until the desktop
  layout matches.
- Keep the rich-text editor toolbar functional but it doesn't need every
  icon to be wired up for the assignment — visual match matters more than
  every formatting option working.
