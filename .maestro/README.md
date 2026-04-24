# Maestro Smoke Flows

Device-level smoke tests for MBG's preview build. Complements the Jest suite
in `__tests__/` (which covers config shape, theme math, template resolution,
CTA URL liveness — all CI-ready, no simulator needed).

## When to run

After any change to:

- `configs/tenants/mbg.json` or `configs/tenants-src/mbg.ts`
- `src/templates/informational/*`, `src/TemplateApp.tsx`, or shared
  rendering components (`src/components/{TabBar,TemplateCard,PageHeader}.tsx`)
- `src/utils/theme.ts` or the design presets
- Expo SDK / React Native upgrades

The Jest suite catches ~80% of regressions without a simulator; Maestro is
the final gate before shipping an OTA or a store build.

## How to run

### Local (macOS + iOS simulator)

```bash
brew install maestro
# In one terminal:
npm run ios
# Wait for the MBG app to open in the simulator, then in another terminal:
maestro test .maestro/mbg-smoke.yaml
```

### Against an Android emulator

```bash
npm run android
# Then:
maestro test .maestro/mbg-smoke.yaml
```

### Against the Appetize preview

Appetize has a paid Automation add-on; we haven't wired it up yet. When we do,
the flow runs unchanged:

```bash
APPETIZE_PUBLIC_KEY=<key> maestro cloud .maestro/mbg-smoke.yaml
```

## What the smoke flow covers

- App launches without crash
- All five tabs render their configured header text
- A representative card title appears on each tab
- A CTA (`Book a consultation`) dispatches to an external URL and the app
  recovers when the user returns

## Follow-ups

- Add flows for each tenant template type as they're built (booking,
  commerce, loyalty, etc. — each has different user-visible surface)
- Wire Maestro Cloud to CI once a flow stabilizes locally
- Capture screenshots during the flow for App Store / Play Store listings
