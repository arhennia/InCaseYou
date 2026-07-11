# InCaseYou

> An elegant, deeply personal, and highly interactive digital scrapbook and letter editor.

🔗 **[Live Demo Website](https://in-case-you.vercel.app/pages/index.html)**

**InCaseYou** is a vanilla frontend web application designed to emulate a luxury stationery workspace. It empowers you to craft beautiful, personalized digital letter collections for the people you care about—featuring a fully interactive drag-and-drop canvas, rich media support, and a seamless editorial workflow.

> [!NOTE]
> The project is live and deployed! We will continue to refine, update, and add new features to enhance the experience over time.

---

## Preview

### Main Landing Page
![Main Landing Page](assets/images/Screenshot%202026-06-07%20141504.png)

### Editor Workspace
*Add custom text, rich media, and beautiful stickers on a realistic paper canvas.*
![Editor Workspace](assets/images/Screenshot%202026-06-08%20013023.png)

---

## Features

### Multi-Page Flow
- **Landing Page** (`pages/index.html`) — Enter the recipient and sender names along with a personal note to initialize your collection.
- **Collection Page** (`pages/collection.html`) — Editorial, asymmetric overview of your letter collection with an envelope card for each letter.
- **New Letter Page** (`pages/newletter.html`) — Set the letter's subtitle ("in case you...") with a live envelope preview.
- **Editor Page** (`pages/editor.html`) — The full interactive canvas workspace.

### Editor Canvas
- **Real paper texture** — Uses a custom `paper.png` background image for an authentic handmade feel.
- **Custom background scenery** — Curated background images or user-uploaded scenery behind the paper.
- **Ambient environment** — Soft mint-themed header and workspace for a focused, premium desk atmosphere.
- **Photocard Frame Overlay** — A fixed, non-interactive framing element that overlaps the stationery to provide aesthetic depth.
- **Advanced Workspace** — Intuitive zoom and pan mechanics via a translucent, high-fidelity floating controls bar with a unified mode-toggle pill.

### Media-Rich Elements
Every element on the canvas behaves like a professional editor object: **draggable, resizable, rotatable, and customizable.**
- **Text Elements**: Inline editing with a robust floating toolbar for font selection, color picking, size, style, alignment, and layer management.
- **Link Pills**: Premium, pill-shaped buttons with live color pickers for both label text and button background.
- **Audio Elements**: High-fidelity audio recording or file upload with elegant waveform visualization and an integrated preview player.
- **Video Elements**: Drag-and-drop uploads (limit 10MB) that render as interactive video thumbnails on the paper.
- **Sticker Library**: Curated categories (Ribbons, Flowers, Frames, Stamps, Papers, Memes) for personalization.

### Firebase Sharing & Cloud Sync
- **Share to Cloud**: Instantly upload your entire collection state to Firebase Firestore with a single click.
- **Automatic Copy**: Generates a unique shareable URL and copies it directly to your clipboard.
- **Dynamic Loading**: Opening a share URL containing `?id=DOCUMENT_ID` automatically fetches the shared collection from Firestore and loads it.

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
| Database | Firebase Cloud Firestore (NoSQL Cloud Database) |
| Interactions | `interact.js` (CDN) |
| Media | MediaRecorder API (Audio), HTML5 Video |
| Fonts | Google Fonts (Gorditas, Inter, Space Mono, etc.) |
| Persistence | `localStorage` (Local Cache) & Firestore (Cloud Storage) |

---

## Project Structure

```text
InCaseYou/
├── assets/                 # Global assets (images, audio, etc.)
│   ├── images/             # UI graphics, paper textures, and backgrounds
│   │   ├── stickers/       # Decorative sticker packs
│   │   └── bgs/            # Canvas background options
│   └── audio/              # Pre-recorded audio assets
├── css/                    # Organized Design System
│   ├── base.css            # Typography and variables
│   ├── components.css      # Buttons, modals, and tooltips
│   ├── pages.css           # Page-specific layouts
│   └── editor.css          # Canvas and toolbar styles
├── js/                     # Application Logic
│   ├── modules/            # ES Modules (State, Utils, Canvas)
│   ├── pages/              # Page-specific initialization
│   ├── firebase.js         # Firebase configuration and Firestore services
│   └── main.js             # Core page rendering and interaction logic
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
   Use **Live Server** in VS Code or run a simple local HTTP server:
   ```bash
   npx serve .
   ```

3. **Start creating**:
   Fill in the landing form and hit **MAKE IT →** to begin.

---

## Design Philosophy

**InCaseYou** is designed to evoke the feeling of opening a beautifully arranged stationery desk, rather than a traditional productivity app.

- **Palette**: Mint green (`#E0F5EE`), warm muted browns (`#866144`, `#968571`), and soft cream paper whites.
- **Typography**: `Inter` for structured UI elements, `Gorditas` and `Great Vibes` for editorial headings, and `Space Mono` for status indicators.
- **Layout**: Asymmetric, editorial compositions featuring intentional whitespace and minimalist navigation.
- **Interactions**: Subtle hover micro-animations, glassmorphism toolbars, and a sleek pill-shaped floating control bar.

---

## Known Limitations

- **Storage limit**: `localStorage` has a ~5MB cap. Heavy use of media blobs (Audio/Video) may approach this limit locally, though Firestore sharing works independently.
- **Public access**: Shared collections are public to anyone who possesses the share URL.
- **Desktop preferred**: While optimized for mouse precision, basic touch support is inherited from `interact.js`.

---

## License

Open-source. See `LICENSE` for details.
