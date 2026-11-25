# Autonomous Sourcing & Outreach · Interactive Demo

A static walkthrough of an agent pipeline that finds organisers, partners and speakers,
scores them against a fixed rubric, checks them against a live CRM, writes a first email,
and stops before any write.

Open `index.html` directly, or serve the folder:

```bash
python -m http.server 8080
```

## What it shows

| Section | What you can do |
|---|---|
| Eight stages | Click a stage to see what runs, where it runs, and what it passes on |
| Three tracks | Events, Partners and Speakers share one engine |
| Scoring | Move the inputs and watch the score recompute |
| Deduplication | Type two names and see the similarity class |
| Outreach | Pick a contact, read the gate checks, the tier and the drafted email |
| Write gates | Flip the permissions and watch the write stay blocked |
| Output | Sort, filter and search the review table |

## Design notes

- No build step, no framework, no network calls. Four files plus fixtures.
- The rubric, the tier rule and the write gates run the same logic as the original pipeline.
- Deduplication is Jaro-Winkler over a normalised name, computed in the browser.

## Data

**Everything is synthetic.** Names, companies, emails and rows are invented. Every address
uses the `.example.com` domain. The banner cannot be dismissed.

## Deploying

The repo ships a GitHub Pages workflow. Push to `main` (or `master`) and set
**Source: GitHub Actions** in the Pages settings. The folder is published as static files.

```bash
git add .
git commit -m "Add interactive sourcing pipeline demo"
git push origin main
```

## Files

```
index.html    structure and copy
styles.css    design system
data.js       synthetic fixtures
app.js        all interactivity
.github/      Pages workflow
```

## Accessibility

Keyboard-navigable tabs, visible focus rings, WCAG AA text contrast, and a
`prefers-reduced-motion` path that skips the animations.
