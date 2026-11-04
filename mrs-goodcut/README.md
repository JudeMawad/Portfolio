# Mrs.Goodcut

Standalone salon website concept at <https://judemawad.com/mrs-goodcut/>. GitHub Pages serves this folder directly; no build step or runtime service is required. The portfolio homepage and navigation are independent.

## Maintenance

- Edit `index.html` for German content, prices, opening hours and external links; `styles.css` for presentation; `app.js` for the menu, gallery and scroll animations.
- Keep local asset URLs and salon home/legal links under `/mrs-goodcut/`. Font URLs in CSS and image `srcset` URLs also need this prefix.
- Retro typography uses locally hosted Anton 400 for display lettering and primary booking buttons and Yellowtail 400 for brush-script lettering. These are open-license visual alternatives to the reference site's fonts. Keep Manrope for body text, navigation, menu controls, prices, captions and legal-page reading text; do not add remote font requests. Font provenance and licenses are recorded in `ASSET-SOURCES.md` and `assets/fonts/`.
- Legal pages live at `/mrs-goodcut/impressum/` and `/mrs-goodcut/datenschutz/`. Their hosting information describes this portfolio copy on GitHub Pages, separately from the private Sites preview.
- Keep the page-level `noindex, nofollow` metadata. This is a public portfolio concept, not a migration of the salon's official domain. Do not copy the original preview's root `robots.txt` or Cloudflare `_headers` into the portfolio.
- Keep the existing Meetergo booking destination and the confirmed deposit threshold of €150. Prices and salon information were checked against the original website on 4 November 2026; review with the salon before any official launch.
- Run the repository checks with `npm run check`. Before publishing, verify all three routes, responsive images and fonts, mobile navigation, gallery keyboard controls, booking/phone links and the portfolio homepage.

The source was imported from the Mrs.Goodcut private preview, revision `fdf5fc4eb6c177936353e1d554a46fd85458caed`, with paths, social preview URLs and hosting information adapted for this domain. The original salon site at <https://mrsgoodcut.com/> remains separate.

Photos and salon content retain their respective owners' rights. Font license copies are in `assets/fonts/`; credits and source URLs are in `ASSET-SOURCES.md`.
