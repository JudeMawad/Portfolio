# Demo asset sources

The only photograph is an AI-generated fictional retro salon interior, created with the built-in image tool on 5 November 2026. It does not depict a real salon. The prompt is recorded in IMAGE-PROMPTS.md.

Responsive assets: `assets/hero-retro-960.webp` (960 × 1280) and `assets/hero-retro-1080.webp` (1080 × 1440). Both are WebP derivatives of the same shop photograph; the larger version is also the social preview. They are optimized locally with Sharp. The team and six hairstyle spaces use labeled HTML/CSS placeholders with original inline SVG icons, not additional photographs.

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
