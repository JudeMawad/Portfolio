# Studio Locke salon demo

Fictional, reusable salon website at <https://judemawad.com/salon-demo/>. GitHub Pages serves the static files directly. The portfolio homepage is independent.

## Content and interactions

- Studio Locke, its team, address, contact details, opening hours, prices and policies are sample content. They do not describe a real business.
- The only photograph is the AI-generated retro shop interior. Its two responsive assets share the same image. Provenance and the generation prompt are in `ASSET-SOURCES.md` and `IMAGE-PROMPTS.md`. One team-photo placeholder and six hairstyle placeholders show where a customer's own images belong. They are static, labeled spaces, with no upload or gallery-viewer interaction.
- Booking, telephone, salon email, directions and social actions display an on-page demo notice. They must not call, email or book with a real business. The `.example` email and all-zero telephone are non-operational placeholders.
- Jude Mawad's portfolio credit and clearly labeled designer contact are real. The legal pages distinguish the portfolio operator from the fictional salon. Do not substitute invented details for the actual site operator.

## Maintenance

- Edit `index.html` for content, sample prices and links, `styles.css` for presentation, and `app.js` for the menu, demo notice and scroll animations.
- To add customer photos, replace the relevant `.photo-placeholder` contents with a locally optimized image and meaningful alt text. Keep the existing proportions and add responsive `srcset` values. Update the image credits and legal description as needed.
- Keep local asset, homepage and legal-page URLs under `/salon-demo/`, including font URLs, image `srcset` values and social metadata.
- Legal pages are `/salon-demo/impressum/` and `/salon-demo/datenschutz/`. Their technical description assumes GitHub Pages, local assets, no analytics, no browser storage and no form submissions. Update that description if the implementation changes.
- Keep the page-level `noindex, nofollow` metadata while this is a public demo.
- Fonts remain locally hosted Anton, Yellowtail and Manrope. Keep their license files with the assets.
- Run `npm run check`, then verify the three routes, responsive layouts, image loading, mobile menu, demo-action fallback without JavaScript and the unaffected portfolio homepage.
- Before adapting the demo for an actual customer, replace all sample information with customer-approved details, connect the customer's own booking and contact destinations, use authorized images, and prepare legal information for that customer's actual operation and hosting.
