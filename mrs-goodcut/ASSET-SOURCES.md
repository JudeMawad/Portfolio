# Asset sources

Retrieved 4 November 2026 from the existing Mrs.Goodcut website. Photography is reused solely for the requested redesign; original salon/client photography must not be treated as stock or relicensed. No AI-generated imagery is used.

## Photographs

| Output | Source | Dimensions | Description |
| --- | --- | --- | --- |
| `hero-960.webp` | https://mrsgoodcut.com/wp-content/uploads/2024/02/img_3447.jpg | 960 × 1280 | Salon lounge, leather chairs, chandelier, styling stations. |
| `hero-1600.webp` | Same as above | 1600 × 2133 | Larger hero derivative; original is 1500 × 2000. |
| `hero.jpg` | Same as above | 1500 × 2000 | JPEG fallback / sharing asset. |
| `team-640.webp` | https://mrsgoodcut.com/wp-content/uploads/2024/02/isimg-795695-1.jpg | 640 × 397 | Caro left, Miri right. Black framing removed. |
| `team-1000.webp` | Same as above | 1000 × 620 | Larger team derivative. |
| `salon-detail.webp` | https://mrsgoodcut.com/wp-content/uploads/2024/02/79e25440-1678-4e0d-860b-298f15fecfbc-1.jpg | 900 × 1121 | Vintage red styling chairs and mirrors. |
| `look-1.webp` | https://mrsgoodcut.com/wp-content/uploads/2026/04/img_6005.jpg | 800 × 1067 | Blonde, long layered waves. |
| `look-2.webp` | https://mrsgoodcut.com/wp-content/uploads/2026/03/img_5827.jpg | 800 × 1059 | Long copper balayage and waves. |
| `look-3.webp` | https://mrsgoodcut.com/wp-content/uploads/2026/06/image-2.jpg | 800 × 771 | Short brunette cut with shaved sides. |
| `look-4.webp` | https://mrsgoodcut.com/wp-content/uploads/2026/03/img_5831.jpg | 800 × 943 | Cool blonde straight hair with darker roots. |
| `look-5.webp` | https://mrsgoodcut.com/wp-content/uploads/2026/06/img_6857.jpg | 800 × 788 | Short textured brunette mullet. |
| `look-6.webp` | https://mrsgoodcut.com/wp-content/uploads/2026/06/image-1.jpg | 800 × 824 | Warm copper/brown bob. |
| `price-list-original.webp` | https://mrsgoodcut.com/wp-content/uploads/2026/03/img_0032.png | 1125 × 2000 | Source price list, retained for cross-checking. |

Images were EXIF-oriented, resized, and encoded as WebP using Pillow. Except for removing the team photograph's black framing, the scenes and hair results are unchanged. Descriptions reflect visible appearance and do not assert an unverified specific treatment.

## Fonts

Downloaded from Google Fonts; Latin subsets include German umlauts and the euro sign. The fonts are served from this site's own `assets/fonts/` directory, with no runtime Google Fonts request.

- Fraunces normal, variable weight 300–700, optical size 9–144: `fraunces-latin.woff2`.
- Fraunces italic, variable weight 300–700, optical size 9–144: `fraunces-italic-latin.woff2`.
- Manrope normal, variable weight 400–800: `manrope-latin.woff2`.
- License copies: `Fraunces-LICENSE.txt`, `Manrope-LICENSE.txt` (SIL Open Font License 1.1).
- Google Fonts family CSS: https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..700&family=Manrope:wght@400..800&display=swap
- License sources: https://raw.githubusercontent.com/google/fonts/main/ofl/fraunces/OFL.txt and https://raw.githubusercontent.com/google/fonts/main/ofl/manrope/OFL.txt

## Price transcription

Visually cross-checked against the source image on 4 November 2026. Labels below preserve the source's meaning; the two '+ föhnen/glätten' entries show the total price with styling, not an additional surcharge.

| Source item | Price |
| --- | --- |
| mit waschen/trocken Schnitt | 33 € |
| + föhnen/glätten | 47 € |
| Neuschnitt | 43 € |
| + föhnen/glätten | 57 € |
| nur föhnen/glätten | ab 35 € |
| Locken | 40 € |
| Pony | ab 11 € |
| Bart | ab 11 € |
| Coloration | ab 38 € |
| Strähnen | ab 38 € |
| Balayage/Ombré | ab 170 € |
| Wimpernlifting | 50 € |
| Wimpern färben | 16 € |
| Augenbrauen zupfen / färben | 10 € |
| Olaplex Rebuild Treatment, kurzes Haar | 32 € |
| Olaplex Rebuild Treatment, mittleres Haar | 37 € |
| Olaplex Rebuild Treatment, langes Haar | 42 € |

Source note: Olaplex in Colorationen mit Preisabsprache im Salon.

Additional text prices on the homepage: Haarverdichtung ab 350 €, Haarverlängerung ab 600 €, Lifting nach 4–6 Wochen ab 50 €, Hochsetzen nach 10–12 Wochen ab 150 €, Haarspenden-Haarschnitt 33–43 €.

## Source conflict resolved by the user

The price-list image says a 50% deposit applies to services **from 150 €**, while the current homepage booking text says **from 100 €**. On **4 November 2026**, the user explicitly confirmed that the redesign must use **150 €**, matching the price-list image. This resolves the conflict: publish the €150 threshold with two working days' cancellation notice and the source's 50% deposit/compensation terms. No further threshold confirmation is pending.

The older cached contact subpage also gave Caro's online-booking day as Tuesday; the current homepage says Wednesday. Current homepage details take precedence, with Meetergo providing actual availability.

Typography revision: the active website now uses the self-hosted Manrope family throughout. Fraunces files remain archived locally but are no longer loaded by the page or stylesheet.
