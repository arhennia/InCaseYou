# InCaseYou

> A delicate, emotional, and highly interactive digital scrapbook and letter editor.

**InCaseYou** is a pure vanilla frontend web application designed to feel like a luxury stationery workspace. It lets you build beautiful, personalised digital letter collections for the people you care about — complete with a fully interactive drag-and-drop canvas, media-rich elements, and a cinematic editorial workflow.

---

## Features

### Multi-Page Flow
- **Landing Page** (`pages/index.html`) — Enter recipient and sender names and a personal note to initialise your collection.
- **Collection Page** (`pages/collection.html`) — Editorial, asymmetric overview of your letter collection with an envelope card for each letter.
- **New Letter Page** (`pages/newletter.html`) — Set the letter's subtitle ("in case you...") with a live envelope preview.
- **Editor Page** (`pages/editor.html`) — The full interactive canvas workspace.

### Editor Canvas
- **Real paper texture** — Uses a custom `paper.png` background image for an authentic handmade feel.
- **Custom background scenery** — Curated background images or user-uploaded scenery behind the paper.
- **Ambient environment** — Soft mint-themed header and workspace for a focused, premium desk atmosphere.
- **No scroll** — The canvas is locked to exactly fit the viewport, ensuring a focused design experience.

### Media-Rich Elements
Every element on the canvas behaves like a professional editor object: **draggable, resizable, rotatable, and customizable.**

- **Text Elements**: Inline editing with a floating toolbar for font, size, style, and alignment.
- **Link Pills**: Premium, pill-shaped buttons with live color pickers for both label text and button background.
- **Audio Elements**: High-fidelity audio recording or file upload with elegant waveform visualization and an integrated preview player.
- **Video Elements**: Drag-and-drop MP4/MOV uploads that render as interactive thumbnails on the paper.
- **Sticker Library**: 6 curated categories (Ribbons, Flowers, Frames, Stamps, Papers, Memes) for personalization.

### Editorial Action System
A premium top-right navigation system for professional letter management:
- **Cinematic Preview**: An immersive, full-screen mode that simulates the exact experience for the recipient, allowing for interactive media playback and link navigation.
- **Letter Title Management**: Edit letter subtitles with a dedicated mint-themed modal and character counter.
- **Publishing Workflow**: Manage letter states with a Publish/Unpublish toggle and elegant success notifications.
- **Safe Deletion**: A double-confirmation deletion flow with mascot-themed modals to prevent accidental data loss.

### Interaction Engine
- **Powered by `interact.js`**: Smooth, inertia-driven drag and 8-point resizing.
- **Floating Toolbars**: Context-aware toolbars for every element type (Text, Link, Audio, Video) for layering, duplication, and deletion.
- **Selection System**: Soft brown selection boxes with refined handles and a dedicated rotation engine.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Structure | HTML5 (Semantic, MPA) |
| Styling | Vanilla CSS3 (Custom Design System) |
| Logic | Vanilla JavaScript (ES6+) |
| Interactions | `interact.js` (CDN) |
| Media | MediaRecorder API (Audio), HTML5 Video |
| Fonts | Google Fonts (Gorditas, Inter, Space Mono, etc.) |
| Persistence | `localStorage` (JSON Serialization) |

---

## Project Structure

```text
InCaseYou/
├── assets/                 # Global assets (images, audio, etc.)
│   ├── images/             # UI graphics, paper textures, and backgrounds
│   └── audio/              # Pre-recorded audio assets
├── css/                    # Organized Design System
│   ├── base.css            # Typography and variables
│   ├── components.css      # Buttons, modals, and tooltips
│   ├── pages.css           # Page-specific layouts
│   └── editor.css          # Canvas and toolbar styles
├── js/                     # Application Logic
│   ├── modules/            # ES Modules (State, Utils, Canvas)
│   ├── pages/              # Page-specific initialization
│   └── main.js             # Legacy core logic (consolidated)
├── pages/                  # Application Views
│   ├── index.html          # Entry point (Landing Page)
│   ├── collection.html
│   ├── newletter.html
│   └── editor.html
├── index.html              # Root Redirect (to pages/index.html)
└── style.css               # Main CSS Entry Point (Imports modules)
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

- **Palette**: Mint green (`#E0F5EE`), warm muted browns (`#866144`, `#968571`), and soft cream paper whites.
- **Typography**: `Inter` for structured UI. `Gorditas` and `Great Vibes` for editorial headings. `Space Mono` for status indicators.
- **Layout**: Asymmetric, editorial compositions with intentional whitespace and minimalist navigation.
- **Interactions**: Subtle hover micro-animations, glassmorphism toolbars, and a clean pill-shaped floating control bar.

---

## Known Limitations

- **Storage limit**: `localStorage` has a ~5MB cap. Heavy use of media blobs (Audio/Video) may approach this limit.
- **No backend**: All data is local to the browser. Clearing `localStorage` will erase collections.
- **Desktop preferred**: While optimized for mouse precision, basic touch support is inherited from `interact.js`.

---

## License

Open-source. See `LICENSE` for details.
