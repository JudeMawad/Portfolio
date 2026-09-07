# Portfolio styles

Home, Cube, Ignite and Server share document defaults and navigation tokens. All three
project detail pages use the complete typography scale in `project-type.css`.
Project compositions and content remain in their existing stylesheets and HTML.

## Where to make changes

| Change | Source |
| --- | --- |
| Font families | `tokens.css`: `--sans`, `--serif`, `--mono` |
| All project typography | `project-type.css`: `--project-*` |
| Homepage body text | `tokens.css`: `--text-body`, `--leading-body` |
| Case-study paragraphs | `project-type.css`: `--project-text-body`, `--project-leading-body` |
| Homepage introductory text | `tokens.css`: `--text-intro`, `--text-lead` |
| Homepage section labels | `tokens.css`: `--text-label` |
| Project headings | `project-type.css`: `--project-text-section`, `--project-text-section-display` |
| Navigation text and height | `tokens.css`: `--nav-*` |
| Page gutters and maximum width | `tokens.css`: `--page-gutter`, `--page-width` |
| Repeated section padding | `tokens.css`: `--section-space`, `--section-space-display` |
| Homepage navigation layout and states | `home/styles/navigation.css` |
| Project navigation layout and states | `shared/styles/project-navigation.css` |
| Document defaults and focus styles | `foundation.css` |
| Homepage section utilities and reveals | `home/styles/base.css` |
| Homepage/Cube grid, progress, cursor, motion defaults | `shared/styles/effects.css` |
| Cube section layout and spacing | `Cube/styles/sections.css` |
| Cube hardware, physical design, system map | Corresponding files in `Cube/styles/` |
| Cube hero and callouts | `Cube/styles/page.css` and `callouts.css` |
| Ignite and Server compositions | Each page's `style.css` |

For example, changing `--nav-text` updates both homepage desktop links and project
navigation. Compact project identity and return-link sizes have their own tokens.
For project content, change the roles below in `project-type.css`; the original
`--text-*` values in `tokens.css` continue to serve homepage styles.

## Project typography roles

| Token | Text role on every project |
| --- | --- |
| `--project-font-body` | Prose, regular headings, navigation |
| `--project-font-display` | Hero titles, including outline words |
| `--project-font-mono` | Metadata, terminals, diagrams, annotations |
| `--project-text-hero` | Main project title; identical size at the same viewport width |
| `--project-text-display` | Closing and next-project titles |
| `--project-text-section`, `--project-text-section-display` | All chapter headings; display is an alias of section |
| `--project-text-subheading`, `--project-text-card-title` | Subheadings and card titles |
| `--project-text-lead`, `--project-text-body` | Introductions and ordinary prose |
| `--project-text-small` | Compact explanatory text and facts |
| `--project-text-label` | Eyebrows, indexes, captions, footer metadata |
| `--project-text-technical`, `--project-text-technical-small` | Terminal and diagram text |
| `--project-text-annotation` | Small overlay annotations |
| `--project-text-icon`, `--project-text-display-icon` | Text arrows and other decorative glyphs |

Shared `--project-weight-*`, `--project-leading-*`, and `--project-tracking-*`
variables control weight, line height, and letter spacing. Each role has one
responsive definition. Project CSS assigns roles; it contains no local numeric
font sizes or responsive typography overrides.

## Stylesheet order

Paths in this guide are relative to the repository root unless only a filename
is given; shared token and typography files live alongside this guide.
Keep ordinary `<link>` elements in the template or full project document. There
are no CSS import chains. Preserve these orders, including typography overrides:

- Home: shared tokens, foundation, effects; home base, navigation, hero; shared
  display type; home about, stack, projects, journey, contact.
- Cube: shared tokens, foundation, effects, project navigation; Cube page,
  callouts, sections, hardware, physical design, system map; shared display type,
  project type.
- Ignite: shared tokens, foundation, project navigation; Ignite style; shared
  project type, project reveal.
- Server: shared tokens, foundation, project navigation; Server style; shared
  display type, project type, project reveal.

Responsive and reduced-motion rules live with their feature. Common Cube section
spacing, including hardware and physical-design base padding, stays in `sections.css`
so its mobile overrides retain their precedence. Ignite and Server reveals use
`shared/scripts/project-reveal.js`; homepage reveals use
`home/scripts/page-effects.js`, and Cube uses `Cube/scripts/system-map.js`.

Ignite and Server define their existing project palette at the top of their
stylesheets and map it to shared `--bg`, `--fg`, `--accent`, etc. Their existing
`--ignite-pad`/`--server-pad` and width variables resolve to shared layout tokens.
Cube uses the default palette. Keep these aliases one-directional to avoid CSS
variable cycles.

## Navigation variants

- `.site-header` and `.site-menu` retain the homepage terminal identity, contact
  link, and mobile overlay. The menu appears at 1050px and below.
- `.project-header` retains project section links and the return link. Section
  links hide at 900px and below, matching existing behavior.
- Project header scroll effects and scroll restoration live in
  `shared/scripts/project-page.js`, imported by each project entrypoint. Homepage
  keyboard handling lives in `home/scripts/navigation.js`; project interactions
  stay local.

## Preserve project compositions

Project content order, color, outline strokes, diagrams, imagery, and animation
hooks stay local. Typography always uses a shared role, including large titles
and tiny diagram annotations. Add a new shared role only for a distinct text
purpose; do not add page-specific size variables or mobile font overrides.

Hero titles use one viewport-based scale, with a shared breakpoint for the
single-column layout. Do not use container-relative sizing for these roles:
different column widths would make equivalent titles render at different sizes.
All chapter headings share the section size, including introductory and
reflection chapters. Narrative paragraphs use body text; compact facts and
diagram descriptions use small text.

## Editing the homepage

Edit `home/index.template.html` for document metadata, stylesheets, and scripts.
Edit `home/sections/*.html` for section content. The template controls the current section
order: hero, projects, about, stack, journey, contact.

Run `npm run build:html` to regenerate `index.html`, then `npm run check:html` to
verify it matches its sources. The generator checks for missing, duplicated, or
malformed includes before writing. Do not edit generated `index.html` directly.

## Verify shared changes

Check the homepage and all three project details at 1440px, 900px, 390px, and 320px, plus immediately around
the 1050px and 900px navigation breakpoints. Check text wrapping, heading widths,
section alignment, scrolled headers, anchor destinations, keyboard focus, the
homepage menu, and reduced-motion behavior. Also inspect title text against its
clipping mask and text inside fixed-size diagram cards. Test custom project
interactions whenever changes can affect their containers.

Compare computed font sizes, families, weights, line heights, and letter spacing
across corresponding roles at the same viewport width. Sharing a variable alone
does not guarantee matching rendered typography.
