# Product Polish Checklist

This checklist defines the minimum quality bar for Nexus to feel like a paid product on web, and to be ready for mobile packaging (iOS/Android) later.

## How To Use

- Use this as a release gate for all customer-facing features.
- Every item should be marked complete only when validated on desktop and mobile web.
- Treat unchecked items as product risk, not optional cleanup.

## 1) Product Bar & Navigation

- [ ] Header/nav layout is stable across breakpoints (no overlap, no drift, no clipping).
- [ ] Desktop and mobile nav patterns are consistent and predictable.
- [ ] Active route states are always visible and clear.
- [ ] Search is reachable from desktop and mobile in one tap/click.
- [ ] Keyboard shortcuts are documented and discoverable in UI (`⌘K`/`Ctrl+K`).
- [ ] Breadcrumbs and long titles truncate cleanly without breaking layout.

Acceptance criteria:
- Resize from `320px` to `1920px` with no horizontal overflow or broken alignment.
- Route-switching does not cause top-bar layout shift.

## 2) Interaction Quality

- [ ] Every async load has an intentional loading state (skeleton or spinner with context).
- [ ] Every empty state has a clear primary action.
- [ ] Every failure state has a human-readable message + retry action.
- [ ] Save operations expose state (`Saving...`, `Saved`, `Failed`).
- [ ] Destructive actions have confirmation and reversible messaging where possible.

Acceptance criteria:
- No raw "Something went wrong" without actionable next step.
- No silent failures in console-only.

## 3) Visual System Consistency

- [ ] Typography follows a consistent scale and role usage.
- [ ] Spacing is token-based and consistent between pages.
- [ ] Border radius, shadows, and border contrast are consistent.
- [ ] Primary/secondary/destructive actions are visually distinct and consistent.
- [ ] Icons use consistent size/weight alignment in comparable contexts.

Acceptance criteria:
- Side-by-side screenshots of core pages look like one product family.

## 4) Trust, Transparency, and AI Reliability

- [ ] System health indicator is present and understandable.
- [ ] AI responses show meaningful context (sources, confidence, or status cues where available).
- [ ] Generated artifacts (documents/files) include clear downloadable links.
- [ ] User-facing timestamps are timezone-safe and readable.
- [ ] Critical actions are auditable in logs/metadata.

Acceptance criteria:
- User can answer: "What happened, when, and why?" for key AI actions.

## 5) Accessibility (WCAG-Oriented Baseline)

- [ ] Interactive controls meet touch target size (~44x44 on mobile).
- [ ] Full keyboard navigation works for nav, chat, forms, and modals.
- [ ] Focus-visible styles are consistent and obvious.
- [ ] Color contrast meets accessibility standards for text and controls.
- [ ] Live regions/status updates are announced where needed (streaming/loading).

Acceptance criteria:
- Basic keyboard-only path through primary workflows is fully operable.

## 6) Mobile Web Readiness (PWA First)

- [ ] Safe-area insets handled on iOS notched devices.
- [ ] Sticky composer/input remains usable with virtual keyboard open.
- [ ] No key workflow blocked by browser viewport changes.
- [ ] PWA manifest/icons are complete and branded.
- [ ] Install prompt and launched-PWA behavior are tested.

Acceptance criteria:
- Core journey (open app -> chat -> upload file -> get response) works on mobile Safari + Chrome.

## 7) Performance & Responsiveness

- [ ] Core routes are code-split and load quickly.
- [ ] Chat and navigation interactions feel responsive under typical network conditions.
- [ ] No avoidable layout shift in header, chat stream, or page transitions.
- [ ] Large lists and message views are render-efficient.
- [ ] Web vitals are tracked for production sessions.

Acceptance criteria:
- Performance is monitored with real user metrics, not just local dev assumptions.

## 8) QA Matrix Before Release

- [ ] Desktop Chrome (latest): pass
- [ ] Desktop Safari (latest): pass
- [ ] Desktop Edge (latest): pass
- [ ] iOS Safari (latest stable): pass
- [ ] Android Chrome (latest stable): pass
- [ ] PWA launched mode (mobile): pass

## 9) Execution Plan (Recommended Order)

1. Header/Nav stabilization and shortcuts.
2. Chat interaction states and error handling.
3. Accessibility pass (focus, keyboard, touch targets).
4. Mobile viewport + safe-area pass.
5. Performance pass (route split + vitals checks).
6. Cross-browser QA matrix and fixes.

## 10) Definition of Done (Polish)

Feature is "polished" only if:

- UX quality is consistent on desktop and mobile web.
- A11y baseline is met.
- Error/empty/loading states are complete.
- Performance and layout are stable.
- QA matrix is signed off.
