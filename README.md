# InCaseYou

> A cozy, interactive digital scrapbook and letter editor made with love. 💌

🔗 **[Live Demo Website](https://in-case-you.vercel.app/pages/index.html)**

**InCaseYou** is a sweet little vanilla web app designed to feel just like sitting at a comfy desk with your favorite stationery. It lets you put together beautiful, personal digital letter collections for the people you care about most! You get a fully interactive drag-and-drop canvas, fun media elements, and a really smooth editing flow.

> [!NOTE]
> The project is officially live! 🎉 But we'll definitely keep tinkering with it, adding fun stuff, and making it even better over time.

---

## Preview

### Main Landing Page
![Main Landing Page](assets/images/Screenshot%202026-06-07%20141504.png)

### Editor Workspace
*Add custom text, rich media, and beautiful stickers on a realistic paper canvas.*
![Editor Workspace](assets/images/Screenshot%202026-06-08%20013023.png)

---

## Features

### How it Flows
- **Landing Page** (`pages/index.html`) — Pop in the recipient and sender names along with a sweet little note to kick things off.
- **Collection Page** (`pages/collection.html`) — A lovely, relaxed overview of your letter collection, showing a neat envelope for each one.
- **New Letter Page** (`pages/newletter.html`) — Pick a subtitle for your letter (like "in case you miss me...") and see a live preview of the envelope.
- **Editor Page** (`pages/editor.html`) — The main event! Your fully interactive canvas to get creative.

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

**InCaseYou** is all about vibes. It’s meant to feel like opening up a beautifully arranged desk full of craft supplies, rather than using a rigid productivity tool.

- **Palette**: Calming mint green (`#E0F5EE`), warm cozy browns (`#866144`, `#968571`), and soft creamy paper whites.
- **Typography**: `Inter` to keep things readable, `Gorditas` and `Great Vibes` for those pretty, expressive headings, and `Space Mono` for little status updates.
- **Layout**: Relaxed, magazine-style layouts with plenty of breathing room and simple navigation so you never feel lost.
- **Interactions**: Cute little hover animations, frosted-glass toolbars, and a handy floating control pill to keep things clean.

---

## Known Limitations

- **Storage limit**: `localStorage` has a ~5MB cap. Heavy use of media blobs (Audio/Video) may approach this limit locally, though Firestore sharing works independently.
- **Public access**: Shared collections are public to anyone who possesses the share URL.
- **Desktop preferred**: While optimized for mouse precision, basic touch support is inherited from `interact.js`.

---

## License

Open-source. See `LICENSE` for details.
