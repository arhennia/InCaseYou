# InCaseYou

> A delicate, emotional, and highly interactive digital scrapbook and letter editor.

**InCaseYou** is a pure vanilla frontend web application designed to feel like a luxury stationery workspace. It lets you build beautiful, personalised digital letter collections for the people you care about — complete with a fully interactive drag-and-drop canvas, sticker libraries, background scenery, photocard attachment, and handwritten-style typography.

---

## Features

### Multi-Page Flow
- **Landing Page** (`index.html`) — Enter recipient and sender names and a personal note to initialise your collection.
- **Collection Page** (`collection.html`) — Editorial, asymmetric overview of your letter collection with an envelope card for each letter.
- **New Letter Page** (`newletter.html`) — Set the letter's subtitle ("in case you...") with a live envelope preview.
- **Editor Page** (`editor.html`) — The full interactive canvas workspace.

### Editor Canvas
- **Real paper texture** — Uses a custom `paper.png` background image for an authentic handmade feel.
- **Custom background scenery** — 10 curated background images (clouds, coastal, stormy, starry night, knit, red plaid, etc.) selectable as circular swatches in a 5-per-row grid. Users can also upload their own background.
- **Ambient background** — `green blur.png` sits behind the canvas panel for a warm, soft desk atmosphere.
- **No scroll** — The canvas is locked to exactly fit the viewport so the paper never overflows the screen.

### Drag, Resize & Rotate
- Powered by `interact.js` via CDN for smooth, inertia-driven drag and resize.
- **8-point selection box** — When any element is selected, a warm brown border appears with 8 circular resize handles (4 corners + 4 midpoints).
- **Rotation** — Custom `Math.atan2` drag-to-rotate engine, triggered by a dedicated circular rotate handle below each selected element.
- All elements are **constrained to the paper** — nothing can be dragged outside the letter canvas.

### Sticker Element Controls
When a sticker or image element is selected, a **glassmorphism action toolbar** appears above it with three controls:
- **Layer** — Cycles the element's `z-index` forward through the stacking order.
- **Copy** — Duplicates the element exactly, preserving size, rotation, and position (offset by 20px).
- **Delete** — Removes the element from the canvas.

> Icon credits: Layer & Copy by [Freepik](https://www.freepik.com) · Delete by [Ilham Fitrotul Hayat](https://www.flaticon.com/authors/ilham-fitrotul-hayat) — all via [Flaticon](https://www.flaticon.com)

### Sticker Library
- **6 sticker categories**, each with 6 stickers:
  - `ribbons` — Satin, gingham, and velvet ribbons.
  - `flowers` — Blue, brown, red, pink, white flowers + green clover.
  - `frames` — Camera, film strip, iPhone, and stamp frames.
  - `stamps` — Coloured postage stamps.
  - `papers` — Decorative note papers with messages.
  - `memes` — Fun internet characters.
- Displayed as a **3-column grid**, 6 per category.
- **Arrow navigation** (`<` / `>`) to cycle between categories.
- Click any sticker to instantly place it centered on the canvas, ready to drag, resize, and rotate.

### Photocard
- Toggle a **pill switch** in the sidebar to enable the photocard.
- A fixed **card frame** appears at the bottom-right corner of the paper — slightly rotated, with a white card border and soft drop shadow.
- The sidebar panel shows:
  - **Image preview** — empty placeholder until an image is uploaded.
  - **Edit** — opens a file picker to upload or replace the photo.
  - **Delete** — clears the photo but keeps the card frame active.
- The photocard is **fixed in position** — it cannot be dragged, resized, or rotated like stickers. It has no action toolbar.
- Unchecking the toggle removes the card frame entirely.

### Canvas Controls (Floating Toolbar)
A translucent frosted-glass pill bar sits at the bottom-right of the canvas:

| Button | Icon Author | Function |
|---|---|---|
| Edit mode | Pixel perfect (Flaticon) | Default mode — click/drag elements to edit |
| Pan mode | Maniprasanth (Flaticon) | Click-drag the canvas to pan freely |
| Zoom out | Chanut (Flaticon) | Zoom out (min: 100%, cannot shrink below initial) |
| Zoom in | Chanut (Flaticon) | Zoom in (max: 300%) |
| Reset view | Royyan Wijaya (Flaticon) | Snap back to 100% zoom, centre pan, restore edit mode |

- **Scroll wheel** also zooms (min `1×`, max `3×`).
- The **Edit / Pan** toggle appears as a subtle 2-button pill — the active mode gets a raised white circle indicator.

### Text Elements
- Add rich text directly onto the canvas.
- **Floating formatting toolbar** — Appears contextually above any selected text with:
  - **Font family** selector — 10 curated fonts including `Geist`, `Nunito`, `Cedarville Cursive`, `La Belle Aurore`, `Space Mono`, `Patrick Hand`, `Playfair Display`, and more.
  - **Font size** dropdown.
  - **Bold, Italic, Underline** toggles.
  - **Alignment** — Left, Center, Right.
  - **Color picker** — Curated warm palette.
  - **Layer up/down**, **Duplicate**, **Delete** actions.

### Auto-Save
- Canvas state (all element positions, styles, content, background, photocard) is serialised to JSON and auto-saved to `localStorage` every 5 seconds.
- State persists across page navigations and browser reloads.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Structure | HTML5 (Semantic, MPA) |
| Styling | Vanilla CSS3 — no frameworks |
| Logic | Vanilla JavaScript (ES6+) |
| Interactions | `interact.js` (CDN) |
| Fonts | Google Fonts + Geist (CDN) |
| Persistence | `localStorage` |

---

## Project Structure

```text
InCaseYou/
├── index.html              # Landing page
├── collection.html         # Collection overview
├── newletter.html          # New letter setup
├── editor.html             # Interactive canvas editor
├── style.css               # Global design system
├── main.js                 # App state + editor logic
└── images/
    ├── envelope.png        # Envelope graphic
    ├── paper.png           # Canvas paper texture
    ├── green blur.png      # Ambient background behind canvas
    ├── bgs/                # 10 background images
    └── stickers/
        ├── ribbons/        # 6 ribbon stickers
        ├── flowers/        # 6 flower stickers
        ├── frames/         # 6 frame stickers
        ├── stamps/         # 6 stamp stickers
        ├── papers/         # 6 decorative paper stickers
        └── memes/          # 6 meme stickers
```

---

## Getting Started

No build step required. Pure HTML + JS + CSS.

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/incaseyou.git
   ```

2. **Open locally**:
   Use **Live Server** in VS Code or open `index.html` directly in your browser.

3. **Start creating**:
   Fill in the landing form and hit **MAKE IT →** to begin.

---

## Design Philosophy

**InCaseYou** is designed to feel like opening a beautifully arranged stationery desk, not a productivity app.

- **Palette** — Mint green (`#E0F5EE`), warm muted browns (`#866144`, `#968571`), and soft cream paper whites.
- **Typography** — `Inter` for structured UI labels. Script and serif display fonts (`Gorditas`, `Great Vibes`) for emotional headings and canvas elements.
- **Layout** — Asymmetric, editorial compositions with intentional whitespace. Absolute positioning for logo and signature creates a cinematic, non-dashboard feel.
- **Interactions** — Subtle hover micro-animations, soft brown selection handles, glassmorphism toolbars, and a clean pill-shaped floating control bar.

---

## Icon Credits

All icons used in the UI are sourced from [Flaticon](https://www.flaticon.com):

| UI Element | Icon Author |
|---|---|
| Edit mode (cursor arrow) | [Pixel perfect](https://www.flaticon.com/authors/pixel-perfect) |
| Pan mode (move arrows) | [Maniprasanth](https://www.flaticon.com/authors/maniprasanth) |
| Zoom in / Zoom out | [Chanut](https://www.flaticon.com/authors/chanut) |
| Reset view | [Royyan Wijaya](https://www.flaticon.com/authors/royyan-wijaya) |
| Layer (sticker action) | [Freepik](https://www.freepik.com) via Flaticon |
| Copy / Duplicate | [Freepik](https://www.freepik.com) via Flaticon |
| Delete | [Ilham Fitrotul Hayat](https://www.flaticon.com/authors/ilham-fitrotul-hayat) |
| Rotate | [Freepik](https://www.freepik.com) via Flaticon |

---

## Known Limitations

- **Storage limit** — `localStorage` has a ~5MB cap. Base64-encoded uploaded images (photocards, custom backgrounds) may approach this limit with heavy use.
- **No backend** — All data is local to the browser. Clearing `localStorage` will erase collections.
- **Desktop only** — Touch/mobile precision for rotate and resize gestures has not been optimised.

---

## License

Open-source. See `LICENSE` for details.
