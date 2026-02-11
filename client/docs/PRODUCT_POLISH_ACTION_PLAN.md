# Product Polish Action Plan

This plan documents the concrete polish work still required to meet the release-quality bar for a paid product experience.

Date: 2026-02-11  
Scope: Web app first, mobile packaging readiness (iOS/Android) next

## Current Status Snapshot

1. Product Bar & Navigation: Partial (layout and search behavior improved, still needs cross-device QA sign-off).
2. Interaction Quality: Partial (good loading/empty/error patterns in core chat, but inconsistencies remain).
3. Visual System Consistency: Partial (token foundation is strong, active-code lint quality is still below gate).
4. Trust/Transparency/AI Reliability: Pass (health indicator, streaming status, attachment context + generated links).
5. Accessibility: Fail (touch target + live-region + keyboard-flow gaps).
6. Mobile Web/PWA Readiness: Partial (safe-area and manifest present, install/runtime wiring incomplete).
7. Performance/Responsiveness: Fail (limited route-level code splitting, no web-vitals instrumentation).
8. QA Matrix: Fail (cross-browser/device pass not yet executed and recorded).

## P0 (Must Fix Before Paid Launch Positioning)

1. Accessibility touch targets to mobile standard.
Item: Raise primary interactive controls to at least ~44px.
Targets: Header controls, chat composer actions, mobile nav chips.

2. Add live status announcements for streaming and async states.
Item: Introduce `aria-live`/status regions for chat streaming progress and search results.
Targets: `ModernChatInterface`, `GlobalSearch`, key error/success surfaces.

3. Keyboard-only usability path for primary workflows.
Item: Validate and patch keyboard interactions for nav, search dialog, chat composer, profile menu, and modal close behaviors.
Targets: Header, GlobalSearch, chat input, profile dropdown.

4. Replace console-only failure handling in customer flows.
Item: Convert important client-side catches to user-visible error states/toasts + retry where applicable.
Targets: Search, chat send/upload, settings saves.

5. Restore lint gate credibility on active code.
Item: Keep archive excluded and reduce active warnings/errors to sustainable baseline.
Targets: `src/**` warnings that impact accessibility, hooks correctness, and runtime safety.

## P1 (High Priority After P0)

1. PWA runtime readiness.
Item: Register service worker in app bootstrap with safe update strategy.
Item: Add install prompt UX (`beforeinstallprompt`) and launched-mode verification path.

2. Mobile viewport + keyboard hardening.
Item: Validate sticky input/composer behavior with iOS Safari and Android Chrome virtual keyboards.
Item: Ensure no blocked workflow due to viewport resize or safe-area edge cases.

3. Route-level code splitting for main app routes.
Item: Convert primary route imports to `React.lazy` boundaries with targeted fallbacks.
Targets: Core pages imported eagerly in `App.tsx`.

## P2 (Optimization and Scale Polish)

1. Web vitals instrumentation.
Item: Capture and forward LCP/INP/CLS metrics for production sessions.

2. Bundle and chunk refinement.
Item: Reduce large vendor/index chunk pressure and validate chunk strategy warnings.

3. QA matrix execution + sign-off.
Item: Run and record pass/fail for:
- Desktop Chrome latest
- Desktop Safari latest
- Desktop Edge latest
- iOS Safari latest stable
- Android Chrome latest stable
- PWA launched mode

## Acceptance Gate For This Plan

Polish milestone is complete when:

1. All P0 items are closed and verified on desktop + mobile web.
2. P1 items are closed with documented validation evidence.
3. QA matrix has explicit pass records.
4. Checklist status is updated in `PRODUCT_POLISH_CHECKLIST.md` with completed items marked.

