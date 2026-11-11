# Distraction Guard — Capability & Completion Report

## Senior hardening pass

Fixed after review:

- `CYCLE_COMPLETE` recovers into a fresh allowance when schedule is active again
- Boot-aware cooldown (wall clock + bootId; rewrite elapsed anchors; fail open if ambiguous)
- Boot identity rotates via BOOT_COMPLETED **and** boot-count / elapsedRealtime regression detection
- Real temporary bypass lifecycle (suppress interventions, resume remaining cooldown, no punishment extension)
- Intentional-use persistence (`saveIntentionalUse`)
- Unlock→distraction recording owned by Guard monitor (independent of unlock-prompt being enabled)
- `getStatus` read-only vs `reconcile` mutation split
- Usage assembler seeds screen-interactive state; open intervals shown as provisional only
- Friction/cooldown presentation success tracked; rate caps only on presented prompts
- Cycle transitions use `SharedPreferences.commit()`
- Honest capabilities (notifications permission, no fake “live” observation)
- Sections G/H, Greek copy, custom durations, reset-settings-without-wiping-history
- Whole-browser counting wires browser packages when explicitly enabled
- Intentional use (separate exception) starts temporary bypass for planned duration
- Live 1s UI countdown derived from last native snapshot (native remains authoritative)
- StatusChip honors temporary-access / Greek labels

## Files added / changed (high level)

- Native module: `mobile/modules/distraction-guard/**`
- Unlock reuse: `mobile/modules/phone-unlock` event history (`getRecentUnlockEvents`)
- Feature JS: `mobile/features/distraction-guard/**`
- Screens: `app/more/distraction-guard.tsx`, `distraction-guard-insights.tsx`
- Store / UI: `store/useDistractionGuardStore.ts`, `components/distraction-guard/**`
- Navigation: Menu + More stack + Settings link
- Config: `package.json`, `app.json` (`PACKAGE_USAGE_STATS`), `.gitignore`

## Components implemented

- Settings / onboarding master screen (Greek + English labels per spec)
- Current protection card (allowance / cooldown remaining)
- Target apps (Instagram / YouTube discovery)
- Websites section with honest “cannot verify” status
- Schedule presets + pause
- Opening friction controls
- Bypass sheet + intentional-use sheet
- Insights (7-day) + weekly reflection proposal (approval required)
- Native opening-friction + cooldown activities
- Optional GuardMonitorService (specialUse FGS, 20s reconcile)

## Native Android APIs used

- `UsageStatsManager` / `UsageEvents` (`ACTIVITY_RESUMED/PAUSED/STOPPED`, screen interactive)
- `AppOpsManager` (`OPSTR_GET_USAGE_STATS`)
- `Settings.ACTION_USAGE_ACCESS_SETTINGS`
- `Settings.canDrawOverlays` / overlay settings
- `NotificationCompat` channels
- `SystemClock.elapsedRealtime` for cooldown survival
- Existing unlock: `ACTION_USER_PRESENT` (no second detector)

## Permissions added

- `PACKAGE_USAGE_STATS` (app-ops; user must grant Usage Access)
- Reuses notifications / overlay / FGS specialUse / boot

## Verified monitoring capabilities (code-level)

| Capability | Status |
|---|---|
| Observe selected native apps via UsageEvents | Implemented when Usage Access granted |
| Cumulative shared 5-minute allowance | Implemented (native PolicyEngine) |
| Single cooldown per threshold | Implemented (`thresholdCrossed`) |
| Exclude screen-off | Implemented via SCREEN_NON_INTERACTIVE flush |
| Do not invent open-interval ends | Implemented |
| Unlock event references | Implemented via unlock module history |
| Hard restrict packages | **Unavailable** (honestly reported) |
| Browser domain verification | **Unavailable** in this build |
| Domain VPN blocking | Not implemented |

## Actual intervention behavior

- 1-minute remaining notification
- Cooldown notification + `CooldownActivity` when presentation allowed
- Opening friction overlay activity when overlay + usage access + rate limits allow
- Bypass / end restriction from UI
- Immediate disable

Background activity launch limits may prevent presenting activities from the FGS; notifications remain the reliable path. Status never claims “blocked” when only a notification fired.

## Browser detection limitations

Site-level Instagram/YouTube-in-Chrome tracking is **not** claimed. UI shows “Site cannot be verified.” Optional whole-browser counting setting exists but is not auto-enabled and does not invent domain identity.

## Timing accuracy / latency

- Reconciliation every ~20s while monitor service runs, plus on screen focus
- Accounting reconstructed from UsageEvents with 15s overlap windows and dedupe keys
- Not second-perfect live tracking

## Battery

- Bounded polling (20s), not a JS busy loop
- Ongoing low-importance monitoring notification when FGS active
- Measure on device after `expo run:android` rebuild

## Automated tests

- `npm run test:guard` — pure policy engine cases (cumulative allowance, single cooldown, schedule, unlock association)

## Device tests still required on a physical Android build

- Usage Access grant flow
- Instagram / YouTube real sessions
- Lock mid-allowance
- Cooldown across screen-off / reboot
- Overlay friction presentation under background limits
- Battery observation over a normal day

## Remaining unsupported / P2–P4

- Accessibility / VPN domain restriction
- True package suspension
- Backend sync endpoints
- Live AI (currently predefined coach fallbacks)
- Per-app overrides UI polish
- Hourly heatmap
