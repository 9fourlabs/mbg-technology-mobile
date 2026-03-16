## Prompt examples (Template-as-API)

### Example 1: Build the MBG Technology informational app (the app in this repo)

Copy/paste and edit as needed:

```text
You are an AI coding agent in Cursor. Use the existing “Informational Template” API in this repo.

Goals:
- Keep layout uniform: every tab has a header section + a list of same-size cards.
- Only change template data (tabs/cards/images/text/actions). Do not redesign layout components unless required.

Template:
- templateId: informational
- tenant: mbg

Brand:
- logoUri: https://images.squarespace-cdn.com/content/v1/62a77a4d742c1a5b64a31e56/574e082c-9002-4249-a525-13f72c69f51d/Untitled+%28125+×+125+px%29.png?format=1500w
- primaryColor: #d4af37
- backgroundColor: #000000

Tabs:
- Home
  - headerTitle: Home
  - headerBody: A quick look at how we support your business with modern web, smart systems, and ongoing help.
  - cards:
    - { id: hero, imageUri: <stock>, title: "Innovate. Integrate. Elevate.", body: "...", action: { type: open_url, label: "Book a consultation", url: https://mbgtechnology.com/appointment, variant: primary } }
    - { id: pillars, imageUri: <stock>, title: "What we do", body: "Modern web: ...\nSmart systems: ...\nOngoing support: ..." }

- Services
  - headerTitle: Services
  - headerBody: Explore what we do...
  - cards: (one per service)

- Plans
  - headerTitle: Plans
  - headerBody: Simple options...
  - cards:
    - Website Management (cta to https://www.mbgtechnology.com/subscriptions)
    - Business Systems (cta to https://mbgtechnology.com/appointment)

- Contact
  - headerTitle: Contact
  - headerBody: Choose the option...
  - cards:
    - Book a consultation (cta to https://mbgtechnology.com/appointment)
    - Send us a message (cta to https://www.mbgtechnology.com/contact-us)
    - Leave a review (cta to https://g.page/r/CYoriLeElnaXEAI/review)

Deliverables:
- Update `src/templates/informational/mbg.ts` to match the above.
- Ensure app runs on iOS simulator and Android emulator via Expo.
```

### Example 2: Update only text + images (no code changes outside template)

```text
Update the Informational Template tenant `mbg`:
- In the Contact tab, change the 2nd card title to "Request a quote"
- Update its body text to: "Tell us about your project and we’ll respond within 1 business day."
- Change its action label to "Request a quote"
- Change its action URL to: https://mbgtechnology.com/quote
- Change its stock image to a modern office image (Unsplash URL).

Do not change any layout components. Only edit `src/templates/informational/mbg.ts`.
```

### Example 3: Add a new card section

```text
Add a new card to the Home tab (tenant `mbg`):
- id: "case-studies"
- title: "Recent work"
- body: "A few examples of the websites and systems we’ve delivered."
- imageUri: choose an appropriate stock image (Unsplash)
- action: { type: open_url, label: "View case studies", url: https://mbgtechnology.com/work, variant: secondary }

Only edit the template data file.
```

