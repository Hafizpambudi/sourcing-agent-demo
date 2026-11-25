# Autonomous Sourcing & Outreach — Interactive Demo

A static, interactive walkthrough of a dry-run-by-default agent pipeline that discovers
organisers, partners and speakers, scores them against a deterministic rubric, deduplicates
them against a live CRM, drafts the first outreach email, and stops before any write.

Open `index.html` directly, or serve the folder:

```bash
python -m http.server 8080
```

## What it shows

| Section | Interactive idea |
|---|---|
| Play the pipeline | Click any of eight stages to see what runs, where, and what it hands on |
| Three tracks | Events, Partners, Speakers on one engine |
| Scoring rubric | Move the inputs, watch the score recompute |
| Deduplication | Type two names, see the similarity class |
| Outreach | Pick a contact, watch eligibility, tier, copy, and the send step |
| Write gates | Flip the permissions, see the write blocked or allowed |
| Output | Sort, filter and search a review-ready table |

## Design notes

- No build step, no framework, no network calls. Three files plus fixtures.
- The rubric, the tier rule, and the write gate mirror the real pipeline's behaviour.
- The deduplication score is Jaro-Winkler over a normalised name, computed in the browser.

## Data

**Everything is synthetic.** Names, companies, emails and rows are invented. The `.example.com`
domain marks every address. The banner is deliberate and cannot be dismissed.

## Deploying

The repo ships a GitHub Pages workflow. Push to `main` (or `master`) and enable
Pages with **Source: GitHub Actions**. The whole folder is published as static files.

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

Keyboard-navigable tabs and steppers, visible focus rings, WCAG AA text contrast, and a
`prefers-reduced-motion` path that skips the animations.
