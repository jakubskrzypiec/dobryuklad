# Premium monochrome preview

Review branch: design/czarno-bialy-podglad. Main is unchanged.

Default heading: Cormorant Garamond 400; body: Manrope. Ten candidates are loaded through Google Fonts; the review page allows changing headings without modifying the site. All candidates support Polish characters.

New original AI-generated conceptual images, not studio realizations:
- premium-portfolio.webp — black stone dining table, charcoal walls, white sculptural pendant.
- premium-quote.webp — grey lounge chair, graphite wall, soft daylight.
- premium-contact.webp — charcoal stone corridor, recessed pale doorway, black console.
- premium-subpage.webp — black stone, pale marble plinth, curved light-grey plaster. Shared by all subpage headers.

Source PNGs: built-in image_gen, 2172 × 724. WebP quality 87. Palette: neutral black, graphite, grey and white; no golden or beige accents. Existing studio portfolio placeholders and the homepage entrance film are preserved.

## Selected direction: Inter + Source Code Pro

User reference: Inter for headlines and body, Source Code Pro for subheadings and labels. New default replaces previous Cormorant selection. Inter 400/500/600/700 and Source Code Pro 400/500 loaded through Google Fonts.

New original AI-generated conceptual hero: premium-hero.webp. Dark graphite walls, light grey sofa, white chair and soft daylight at the right; calm dark left for the headline. No gold, brown or beige accents. Static image is used by both homepage entries and the review. The earlier cinematic walkthrough is retained at dist/wersja-spacer/index.html with its original controller and packed frames. Main branch and the published website remain unchanged.

## Bodoni / background and Poland network direction

User selected Bodoni Moda. Inter remains the body face. Review-only controls compare a fine square grid, a dot matrix and monochrome grain. The previous diagonal decorative lines are hidden. All photographic heroes and divider images have CSS opacity masks at their upper/lower edges, exposing the same page background.

The 560px desktop / 440px mobile quote divider is replaced by a pointer-reactive spherical 3D projection centered on Europe. Poland is filled and outlined; 12 Polish cities are marked using geographic coordinates, with six keyboard-focusable city labels and pointer hover for the others. Data: Natural Earth 1:110m admin-0 country boundaries, public domain, downloaded from nvkelso/natural-earth-vector. Decorative connections are conceptual and do not identify confirmed client locations.

500+ is explicitly marked as a draft number awaiting studio confirmation. Rendering pauses offscreen and when the document is hidden. Pointer rotation is disabled for reduced-motion preference. An SVG fallback uses the same coordinates if JS, canvas or the data request is unavailable.
