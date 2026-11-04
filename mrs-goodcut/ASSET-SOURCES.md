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

### First retro restyle fonts (retained, inactive)

Retrieved 4 November 2026 from Google Fonts. These are locally hosted, unmodified Latin WOFF2 subsets. FontTools verified weights 700 and 400 respectively, and actual character-map coverage for Ä, Ö, Ü, ä, ö, ü, ß and €. Barlow Condensed and Oleo Script are retained from the first retro iteration but are superseded by the active fonts below. Fraunces is retained from the original preview and remains inactive.

| Font | Local file | Original WOFF2 source | License |
| --- | --- | --- | --- |
| Barlow Condensed, normal 700 | `assets/fonts/barlow-condensed-700-latin.woff2` | https://fonts.gstatic.com/s/barlowcondensed/v13/HTxwL3I-JCGChYJ8VI-L6OO_au7B46r2z3bWuQ.woff2 | `assets/fonts/BarlowCondensed-LICENSE.txt` |
| Oleo Script, normal 400 | `assets/fonts/oleo-script-400-latin.woff2` | https://fonts.gstatic.com/s/oleoscript/v15/rax5HieDvtMOe0iICsUccChdu08.woff2 | `assets/fonts/OleoScript-LICENSE.txt` |

- Google Fonts family CSS: https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700&family=Oleo+Script&display=swap
- Barlow Condensed license source: https://raw.githubusercontent.com/google/fonts/main/ofl/barlowcondensed/OFL.txt
- Oleo Script license source: https://raw.githubusercontent.com/google/fonts/main/ofl/oleoscript/OFL.txt
- Both families use the SIL Open Font License 1.1. Barlow credits The Barlow Project Authors; Oleo Script credits Soytutype and retains its reserved font name.

### Closer reference match (active)

Retrieved 4 November 2026 from the official Google Fonts service. Anton 400 supplies dense, condensed sign lettering; Yellowtail 400 supplies slanted brush-script lettering. These are visual alternatives, not the exact typefaces on [Il Letterista](https://illetterista.it/). That site's font catalog was marked "coming soon" when checked, and no reusable license was established for its TUBO WEB or IL Vernacolare files. Its Tratto family is offered commercially by [AlfaType](https://www.alfatypefonts.com/). No font files were copied from the reference site.

| Font | Local file | Original WOFF2 source | License |
| --- | --- | --- | --- |
| Anton, normal 400 | `assets/fonts/anton-400-latin.woff2` | https://fonts.gstatic.com/s/anton/v27/1Ptgg87LROyAm3Kz-C8.woff2 | `assets/fonts/Anton-LICENSE.txt` (SIL OFL 1.1) |
| Yellowtail, normal 400 | `assets/fonts/yellowtail-400-latin.woff2` | https://fonts.gstatic.com/s/yellowtail/v25/OZpGg_pnoDtINPfRIlLohlvHwQ.woff2 | `assets/fonts/Yellowtail-LICENSE.txt` (Apache 2.0) |

- Official family CSS: https://fonts.googleapis.com/css2?family=Anton&family=Yellowtail&display=swap
- Anton license: https://raw.githubusercontent.com/google/fonts/main/ofl/anton/OFL.txt. Copyright 2020 The Anton Project Authors.
- Yellowtail license: https://raw.githubusercontent.com/google/fonts/main/apache/yellowtail/LICENSE.txt. Copyright 2011 Brian J. Bonislawsky DBA Astigmatic (AOETI). The official distribution contains no separate NOTICE file.
- Files are unmodified Latin WOFF2 subsets served locally. FontTools verified weight 400 and character-map coverage for Ä, Ö, Ü, ä, ö, ü, ß and € in both files.
- Manrope remains the readable body, interface, prices and legal-content font. No runtime Google Fonts requests are made.

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

Active typography: self-hosted Anton for display lettering, Yellowtail for brush-script lettering, and Manrope for reading and interface text. Earlier display-font files remain archived locally and are not loaded by the active page or stylesheet.
