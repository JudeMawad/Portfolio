# Cube display app media

These local assets supply the Cube portfolio's display preview.
Clock and Weather come from the Cube implementation, not a visual
reconstruction. Music retains its original playback indicators and timing with
the user-supplied Hotel California album cover. Animation uses the user-supplied
`animation/PAC_MAN.gif`, adapted to Cube's 64×64 display grid.

This folder is self-contained and used by `Cube/index.html`. Paths in
`manifest.json` are relative to this folder. Cube source references are for
traceability only; no Cube code, service, account or hardware is needed to play
the media. There are no external media URLs or runtime dependencies.

## Contents and meaning

| App | Preview | What it shows |
| --- | --- | --- |
| Clock | 6 seconds | Actual tetromino pieces falling and assembling **12:34**, above **SAT 26 SEP** (fixed 2026-09-26 fixture). Assembly takes the implemented 2.8 seconds; the completed time then holds. |
| Weather | 5.4 seconds | Actual rain animation, **18° Celsius**, **RAIN 60%**. Synthetic daytime weather; no location or live forecast. Three complete rain cycles. |
| Animation | 4.04 seconds | User-supplied **PAC_MAN.gif**, showing Pac-Man and ghosts crossing the frame. The complete 480×480 frames are reduced to the 64×64 display grid with nearest-neighbor sampling; the original GIF delays are preserved. |
| Music / Spotify | 10 seconds | Current artwork layout with the user-supplied Hotel California album cover. A three-minute fictional track starts at 45 seconds, plays for four seconds, pauses for two, then resumes for four. Progress moves at real speed; no audio. |

The `clock` and `weather` directories each contain:

- `preview.webm`: **64×64**, 30 fps, lossless RGB VP9 (profile 1). Every decoded
  frame was verified byte-for-byte against native renderer output.
- `preview.mp4`: **512×512**, 30 fps, H.264 compatibility version. Generated with
  nearest-neighbor 8× enlargement before encoding. Lossy video/color conversion
  can cause small differences; WebM and PNG are the pixel references.
- `poster.png`: **64×64**, lossless RGB still selected from the actual capture.
- `poster-512.png`: exact **512×512** nearest-neighbor enlargement of that still.

The `animation` directory contains the replacement animation:

- `PAC_MAN.gif`: the supplied **480×480**, 75-frame GIF, copied byte-for-byte.
- `pac-man.webm`: **64×64**, 25 fps, lossless RGB VP9 preview.
- `pac-man.mp4`: **512×512**, 25 fps, H.264 compatibility preview, enlarged from
  the 64×64 frames with nearest-neighbor sampling before encoding.
- `pac-man-poster.png`: **64×64** still from source GIF frame 26 at **1.52 seconds**.
- `pac-man-poster-512.png`: exact **512×512** nearest-neighbor enlargement of that still.

Both replacement videos contain **101 frames** and last **4.04 seconds**. GIF
frames are composited in sequence, preserving disposal behavior; repeated frames
at 25 fps preserve every original delay. The full square frame and black
background remain intact. The previous animation previews and posters have
been removed.

The `music` directory contains the replacement album-art preview:

- `hotel-california.jpg`: the supplied **500×500** album cover, copied byte-for-byte.
- `hotel-california-artwork.png`: the complete cover resized to the **58×58**
  artwork viewport, without cropping.
- `hotel-california.webm`: **64×64**, 30 fps, lossless RGB VP9 preview.
- `hotel-california.mp4`: **512×512**, 30 fps, H.264 compatibility preview, enlarged
  from the 64×64 frames with nearest-neighbor sampling before encoding.
- `hotel-california-poster.png`: **64×64** still from frame 60 at **2 seconds**.
- `hotel-california-poster-512.png`: exact **512×512** nearest-neighbor enlargement.

Only the artwork rectangle at **x=3, y=0, width=58, height=58** changes. The six
bottom rows, including playback state and progress, remain from the original
lossless capture. All **300 frames**, the **10-second** duration, and pause/resume
timing are preserved. Track duration and progress remain demonstration fixtures;
they are not metadata for the supplied album. The original geometric cover and
its preview files have been replaced.

`manifest.json` contains descriptions, durations, loop behavior, fixtures,
relative media paths, source-file hashes and media checksums.
`validation.json` records automated media checks. Keep `LICENSE.txt` with copies.
All four previews are animated. All videos are silent and opaque, including
their intentional black background. Nothing is cropped or given a panel frame.

## Website presentation

The Display apps section uses one Cube photograph and a shared canvas overlay.
Scrolling through the four descriptions selects the app. On screens with enough
room, the descriptions stack while the heading and Cube remain together;
shorter screens keep a compact viewer beside the flowing descriptions.

The canvas samples each full frame at 64×64 with nearest-neighbor sampling,
then uses the homepage's calibrated LED projection to fit the photograph.
Square lights and transparent gaps belong to the website renderer; the source
media remain unchanged. Near-black MP4 codec noise is normalized to OFF before
projection. Device pixel ratio and browser compositing can affect sharpness.

The website loads the selected MP4 on demand and plays it muted, inline, and
looping. Only one preview plays at a time, with playback paused when the viewer
is offscreen or the tab is hidden. PNG posters cover loading and playback
failures. Descriptions remain semantic HTML outside the decorative canvas.
Without JavaScript, the photograph and descriptions appear in normal flow.
The lossless WebM files remain available as pixel references.

Videos do not encode an instruction to repeat: set `loop` in the website.
Weather and Animation are cyclic. Clock and Music deliberately restart their
demonstration on replay, so their loop boundaries are visible. Do not use
cross-fades, reversals or timing changes to imply nonexistent device behavior.

## How these were produced

The following native export process describes the original Clock, Weather and
Music captures. Clock and Weather remain unchanged. Music subsequently received
the supplied cover in its existing artwork viewport; its other pixels and timing
remain from that capture. The Animation replacement is derived separately from
the supplied GIF as documented above; it is not a capture of the native animation
renderer.

The production entrypoint is `client/native/cube-display/cube-display.cc`.
Its four apps live in `client/native/cube-display/apps/`, and each writes an
RGB `Frame64` without hardware dependencies. Existing clock and weather native
tests support PPM snapshots; `tools/preview_cube_animations.py` provides a
developer asset preview. There was no shared four-app video exporter.

The added developer utilities `tools/export_portfolio_display.cc` and
`tools/export_portfolio_display.py` link the existing app implementations into
an isolated offscreen executable. They use the real `DisplayRuntime`, idle
`Compose` and `ContentRenderer` path, with explicit content inactive. The
exporter checks that this idle composition preserves the app frames exactly.
It does not link the matrix driver or production entrypoint, open sockets,
read account configuration, call providers, deploy, or restart anything.

Inputs follow the existing native test seams: injected `LocalClockSource`,
valid `WeatherState` and `MusicState` fixture messages. Music artwork passes through the
existing backend `prepare_artwork()` function before the native Music app
renders its viewport. This function is loaded in the export utility only;
service imports and HTTP contracts were not changed.

Capture samples simulated monotonic time at 30 fps (the production loop targets
33 ms per frame). It does not speed up the source motion or interpolate frames.
Only the selected app is captured; the normal four-app carousel is not replayed.
The export includes current working-tree changes, not just committed files.
`source_sha256` in the manifest identifies the exact source snapshot.

To rebuild **within the Cube repository**, use a Python environment with Pillow,
PyAV, numpy and httpx, plus `g++`, FFmpeg with libvpx-vp9/libx264, and ffprobe:

```sh
python tools/export_portfolio_display.py
```

This regenerates the original export's media, manifest, validation and license;
it does not reproduce the supplied GIF or album-cover replacements. Preserve or
reapply those replacements and their metadata after re-exporting. This README is maintained
separately. Compiler output, raw frames and temporary source assets
are kept in a temporary directory and removed automatically. The portfolio
repository does not need the exporter or its dependencies.

## Provenance and attribution

Cube's `LICENSE` grants the MIT license to original Cube code and its generated
visuals. Its full text is included as `LICENSE.txt`; retain it when
copying this package. Credit: **Cube contributors**.

`animation/PAC_MAN.gif` was supplied by the portfolio owner to replace the
original animation sample. Its derived previews and posters retain that source's
provenance; the included Cube MIT license does not establish a license for the
supplied GIF or its derivatives.

`music/hotel-california.jpg` was supplied by the portfolio owner to replace the
original geometric music fixture. Its album artwork and derived previews retain
that source's provenance; the included Cube MIT license does not establish a
license for the supplied cover. No Spotify connection, account data or audio is
included. “Spotify” identifies the implemented integration, not an endorsement.

The native matrix driver is not linked or distributed here. No executable,
model, dependency, account configuration, provider response, build directory
or cache belongs in the portfolio assets. The unused explicit-content glyph
path references the upstream public-domain 6x13 BDF font; displayed clock and
weather glyphs are Cube's own compact glyphs.

## Limits and things not to infer

- Clock and Weather are renderer captures. Music combines its captured playback
  indicators with a supplied album cover; Animation is an adapted supplied GIF.
  None are photographs or recordings of the physical
  LEDs. Hardware brightness, PWM, color response, panel diffusion, refresh
  artifacts and viewing conditions are not simulated or verified.
- Clock assembly repeats because the clip restarts. The real clock rebuilds
  changed digits when time changes; it does not constantly rebuild the whole
  time or restart assembly on each carousel visit. The fixture is not live time.
- Weather is one supported state, not an exhaustive condition gallery, and
  60% means precipitation probability, not rainfall amount.
- Animation demonstrates the supplied GIF on the display grid. It does not
  verify that this asset is installed in the current Cube runtime catalog.
- Music has a **58×58 artwork viewport at x=3, y=0**, two blank rows below it,
  a playback-state glyph at rows 60–62 and a progress line on row 61. These are
  visual indicators, not on-device touch buttons. There is no track/artist text,
  next/previous control, equalizer or audio visualizer in this layout.
- The two-second pause is a fixture demonstrating the existing pause notice;
  it is not a claim that the real app stays selected indefinitely while paused.
- The bottom voice-overlay row is idle. These assets do not demonstrate voice
  recognition, microphone activity, content transitions, carousel timing,
  network availability, live Spotify playback or physical integration success.
- Portfolio scrolling and card stacking are website behavior, not an on-device
  touchscreen or card interface.

## Verification

The unchanged Clock and Weather WebM frames match the captured RGB bytes. Music
WebM frames match the cover-composited frames and preserve every pixel outside
the artwork rectangle from the original capture. Each poster matches its
selected frame, and each enlarged poster is an exact nearest-neighbor copy.
Both video formats decode throughout; MP4 dimensions, frame counts and durations
were checked. Native regression tests and the hardware-boundary audit cover the
original export, not the GIF or cover replacements. Replacement checks and
current media checksums are recorded in `validation.json` and `manifest.json`.

Only fixed, public fixtures feed the original native export. That export was checked for private
information and unexpected files/metadata; no credential, token, hostname,
account identifier or personal media metadata is included. Source references
are repository-relative, and everything required for website playback is inside
this folder. These checks do not constitute a physical-panel or live-provider
test.
