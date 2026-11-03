# Arda Kurucu — Visual Creative portfolio

Responsive React/Vite portfolio for video production, photography, video editing, and disclosed AI/generative media. The implementation follows the confirmed minimal-editorial direction, uses GSAP for restrained page motion, and introduces a scroll-driven WebGL Work journey on capable desktop layouts. The complete project interface remains available without WebGL.

## Run locally

```bash
npm install
npm run dev
```

Production check:

```bash
npm run build
npm run preview
```

With the preview running on port 4173, capture and verify the interactive journey plus the three required fallback viewports:

```bash
npm run capture
```

Pass another preview URL when Vite selects a different port:

```bash
npm run capture -- http://localhost:5174/
```

## Interactive Work journey

`src/WorkJourney.jsx` contains the desktop journey. A single shader-driven point cloud forms the grain valley; normal page scroll controls project depth and the pointer locally changes particle position and color. Project cards and controls remain HTML for keyboard access, semantics, crisp imagery, and reliable dialog behavior.

Quality starts at High or Balanced based on available device information, then can downgrade to Balanced or Lite when measured frame rate falls below the target. DPR is capped, the canvas pauses away from the Work section, and mobile/reduced-motion/WebGL-unavailable visitors receive the complete editorial grid. No autoplay media, audio, bloom, depth-of-field, or heavy post-processing is used.

The short loading curtain preloads/decodes the hero and first three project covers. It appears only when that work lasts longer than 120 ms and releases after at most 1.8 seconds; it is not a fake minimum-duration intro.

## Content model

Project metadata lives in `src/data/projects.js`. The selected images and sampled video frames under `public/media/portfolio` were derived from Arda's four supplied source folders. A machine-local selection record is intentionally excluded from Git because it contains absolute source paths and is not required by the website. Six separately supplied AI-generated poster studies are stored as `generative-01.jpg` through `generative-06.jpg` and are explicitly labeled as AI-generated. The original multi-gigabyte files remain untouched outside the website.

Public portfolio permission for the supplied media was confirmed on 02 November 2026. Before launch, verify each project's final title, role, year, collaborators, and client/artist wording. Keep raw footage and private client deliverables outside Git.

## Launch gate

Target domain: `ardakurucu.com`, replacing the current site. The final hosting provider is not yet selected; GitHub Pages remains a possible fallback.

The page intentionally includes `noindex, nofollow`. Remove it only after:

- project names, exact roles, years, collaborators, and descriptions are approved;
- the 02 November 2026 public-use confirmation is retained in the project records;
- AI workflow/tool details and Arda's exact contribution are confirmed;
- email, Instagram, English/Turkish choice, and the domain deployment are confirmed;
- release-review labels and content notes have been deliberately removed;
- the final social-sharing image is added and referenced in `index.html`;
- the adaptive WebGL experience receives a final physical-device check on at least one integrated-GPU laptop and one current phone.

See `CONTENT_REPLACEMENT_CHECKLIST.md` and `IMPLEMENTATION_REPORT.md` for the handoff.

For Arda's editing handoff, begin with `ARDA_START_HERE.md`; `ARDA_CLAUDE_HANDOFF.md` contains the ready-to-paste Claude project prompt and regression rules.
