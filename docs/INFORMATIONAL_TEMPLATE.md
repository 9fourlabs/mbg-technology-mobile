## Informational Template (v1)

This repository’s first “template-as-an-API” is the **Informational Template**: a tabbed app where each tab has:

- **Header**: title + short description
- **Cards**: a list of uniform, same-size cards
  - optional stock image
  - title + body text
  - optional CTA (open a URL)

The goal is uniformity: the **layout never changes**, only the **template data** (tabs/cards/text/images/actions) changes.

### Template API

The template is represented by `InformationalTemplate`:

- **brand**
  - `logoUri`
  - `primaryColor`, `backgroundColor`, `textColor`, `mutedTextColor`
- **tabs[]**
  - `id`, `label`
  - `headerTitle`, `headerBody`
  - `cards[]`
    - `id`
    - `imageUri?`
    - `title`
    - `body`
    - `action?`: open a URL with a label and a variant (`primary`/`secondary`)

Type definitions live in:
- `src/templates/types.ts`

### Where template content lives

Tenant templates live here:
- `src/templates/informational/mbg.ts`

The template loader is here:
- `src/templates/informational/index.ts` (`getInformationalTemplate(tenant)`)

### How the UI renders the template

The renderer is the app entry:
- `src/TemplateApp.tsx`

It:
- reads `tenant` from Expo config (`extra.tenant`)
- loads the template via `getInformationalTemplate(tenant)`
- renders:
  - logo in the header
  - active tab header (`PageHeader`)
  - tab cards (`TemplateCard`)
  - a bottom tab bar (`TabBar`)

### How to update content (no layout changes)

To update a page/tab:
- edit `src/templates/informational/mbg.ts`
  - change the tab header text
  - add/remove/reorder cards
  - change `imageUri` (stock images)
  - change CTA url/label/variant

If you follow the type shape, the UI stays uniform.

### Adding a new tenant (multi-client)

1. Create a new tenant template file:
   - `src/templates/informational/<tenant>.ts`
2. Update `getInformationalTemplate(tenant)` to return the correct one.
3. Run with:
   - `APP_TENANT=<tenant> npm run start`

