# Distraction Guard — Architecture Map & Compatibility Assessment

## Existing infrastructure reused

| Area | Location | Reuse plan |
|---|---|---|
| Unlock detection | `mobile/modules/phone-unlock` | Keep as sole unlock source; extend with unlock event IDs for associations |
| Navigation | `app/more/*`, `MenuModal` | Add Distraction Guard entry under More |
| Theme | `constants/designTokens.ts` | Extend with Guard-specific tokens; keep dark theme |
| Tasks / Today | Zustand stores + API | Optional replacement-action source (P3) |
| AI | Spec’d separate AI service; mobile is display-only | Local deterministic coach fallbacks + optional API stubs |
| Notifications | Native `NotificationCompat` in unlock module | Same pattern in Distraction Guard module |

## Compatibility assessment

| Capability | Platform reality | Guard status |
|---|---|---|
| Observe native app foreground | `UsageStatsManager` + `PACKAGE_USAGE_STATS` | Implemented (requires user grant) |
| Live open interception | Overlay / Accessibility / limited APIs | Opening friction via overlay when permitted; honest degraded mode otherwise |
| Restrict native apps | Device-owner suspension not available | **Monitoring + cooldown UI + notifications**; not hard package suspension |
| Browser domain tracking | Accessibility / VPN / browser APIs | Tier 4 fallback: unavailable unless whole-browser counting enabled |
| Unlock patterns | Existing `ACTION_USER_PRESENT` service | Event log added; associations computed in Guard |
| Offline / local-first | SharedPreferences + JS repository | Authoritative cycle state native; settings sync local |

## Module split

- **`phone-unlock`** — unlock observation only (extended with event history).
- **`distraction-guard`** — UsageStats, cycle/cooldown state, capability reporting, cooldown notifications.
- **`mobile/features/distraction-guard`** — policy engine, RN screens, insights, intentional-use UI, AI stubs.

Do not merge UsageStats into UnlockPrompter.

## Authoritative timing

Native `FocusCycle` state uses:

- `SystemClock.elapsedRealtime()` for elapsed accounting within a boot
- Wall-clock timestamps for history / reboot recovery
- Boot identifier for reconciliation after reboot
- `getStatus` is read-only; `reconcile` mutates cycle / checkpoint / interventions
- Open UsageEvents intervals are provisional UI only until closed + verified

JS never owns the source-of-truth timer.

## Cycle recovery invariants

- `CYCLE_COMPLETE` → fresh `ALLOWANCE_AVAILABLE` when schedule+enabled again
- Reboot: rotate bootId (BOOT_COMPLETED + boot-count/elapsed regression); rewrite elapsed anchors from wall-clock remaining; fail open if cooldown wall expiry missing
- Temporary bypass does **not** extend cooldown; remaining cooldown resumes after bypass
- Intentional use: shared allowance (default) still counts; separate exception starts temporary bypass for planned duration
- Unlock→distraction log is Guard-owned (`USER_PRESENT`), independent of unlock-prompt feature

## Honest enforcement model

Observe → Warn → Interrupt → Restrict are separate capabilities.

Default shipped behavior: observe + warn + cooldown screen + temporary bypass. Hard app blocking is reported as unavailable for a standard personal install.
