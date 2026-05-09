# 💌 InCaseYou

> A delicate, emotional, and highly interactive digital scrapbook and letter editor.

**InCaseYou** is a pure vanilla frontend web application designed to feel like a luxury stationery workspace. It allows you to create collections of digital letters and photocard scrapbooks for the people you care about, utilizing a completely custom, fluid drag-and-drop canvas interface.

---

## ✨ Features

- **Asymmetric Editorial Layouts**: A quiet, refined, and cinematic user interface inspired by premium personal stationery.
- **Interactive Drag & Drop Canvas**: Powered by `interact.js`, allowing you to freely position, resize, and layer text and photos on a digital paper canvas.
- **Custom Rotation Engine**: A bespoke rotation handle built with JavaScript (`Math.atan2`), allowing 360-degree fluid rotation of any canvas element.
- **Floating Text Editor**: A contextual, pill-shaped toolbar that appears only when needed. Includes 10 curated Google Fonts (including Geist), custom color palettes, and rich-text layer controls.
- **State Persistence Engine**: A custom JSON serialization/deserialization engine that automatically autosaves your canvas state (including precise X/Y coordinates, angles, and styles) to `localStorage` every 5 seconds.
- **Multi-Page Architecture**: Seamlessly handles state transfer across 4 dedicated views: Landing, Collection Overview, New Letter Initialization, and the Canvas Editor.

## 🛠 Tech Stack

- **HTML5**: Semantic layout structure.
- **CSS3 (Vanilla)**: Pure CSS implementation focusing on soft shadows, pill-shaped UI components, and curated web typography (no heavy CSS frameworks used).
- **JavaScript (Vanilla)**: Core application logic, DOM manipulation, and `localStorage` state management.
- **Interact.js**: External library utilized for cross-device drag, drop, and resize gesture tracking.

## 📂 Project Structure

```text
InCaseYou/
├── index.html          # The landing page and collection initializer
├── collection.html     # The editorial overview of your letter collection
├── newletter.html      # Form to initialize a new letter ("in case you...")
├── editor.html         # The interactive workspace and drag-and-drop canvas
├── style.css           # Global design system and layout styling
└── main.js             # Global state management and editor logic
```

## 🚀 Getting Started

Because **InCaseYou** relies purely on standard web technologies and `localStorage`, there is no complex build step required to run it locally.

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/incaseyou.git
   ```
2. **Open the project**:
   Simply open the `index.html` file in your preferred web browser, or use an extension like **Live Server** in VS Code for hot-reloading during development.
3. **Start Creating**: 
   Type a name in the landing page to initialize your `localStorage` state and begin building your letter collection.

## 🎨 Design Philosophy

The application strictly adheres to a "quiet, emotional, and airy" design language:
- **Palette**: Mint green backgrounds (`#E0F5EE`), soft brown typography (`#866144`), and cream-colored envelopes.
- **Typography**: A mix of `Inter` for structured UI elements and expressive script/serif fonts (like `Gorditas`, `Great Vibes`, and `Cedarville Cursive`) for the actual letter content.
- **Spacing**: Heavy use of generous whitespace, absolute positioning for asymmetrical elegance, and intentional vertical rhythm.

## 📝 License

This project is open-source. Please see the `LICENSE` file for more details.
