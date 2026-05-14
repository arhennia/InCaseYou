document.addEventListener('DOMContentLoaded', () => {
    // Application State
    const appState = {
        for: '',
        from: '',
        note: '',
        letters: [],
        currentLetterId: null
    };

    const savedState = localStorage.getItem('incaseyou_state');
    if (savedState) {
        try {
            const parsed = JSON.parse(savedState);
            Object.assign(appState, parsed);
        } catch (e) {
            console.error("Could not parse saved state.", e);
        }
    }

    const saveState = () => {
        localStorage.setItem('incaseyou_state', JSON.stringify(appState));
    };

    const page = document.body.dataset.page;

    // --- LANDING PAGE ---
    if (page === 'landing') {
        const form = document.getElementById('creation-form');
        const inputFor = document.getElementById('input-for');
        const inputFrom = document.getElementById('input-from');
        const inputNote = document.getElementById('input-note');
        const noteCounter = document.getElementById('note-counter');

        if (appState.for) inputFor.value = appState.for;
        if (appState.from) inputFrom.value = appState.from;
        if (appState.note) {
            inputNote.value = appState.note;
            if(noteCounter) noteCounter.textContent = appState.note.length;
        }

        if (inputNote && noteCounter) {
            inputNote.addEventListener('input', (e) => {
                noteCounter.textContent = e.target.value.length;
            });
        }

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                appState.for = inputFor.value.trim();
                appState.from = inputFrom.value.trim();
                appState.note = inputNote.value.trim();
                saveState();
                window.location.href = 'collection.html';
            });
        }
    }

    // --- COLLECTION PAGE ---
    if (page === 'collection') {
        if (!appState.for || !appState.from) {
            window.location.href = 'index.html';
            return;
        }

        document.getElementById('display-for').textContent = appState.for;
        document.getElementById('display-from').textContent = appState.from;
        document.getElementById('display-note').textContent = appState.note;

        document.getElementById('btn-nav-new-letter').addEventListener('click', () => {
            window.location.href = 'newletter.html';
        });

        document.getElementById('btn-add-letter').addEventListener('click', () => {
            window.location.href = 'newletter.html';
        });

        document.getElementById('btn-share').addEventListener('click', () => {
            alert('Sharing functionality will be implemented with backend integration.');
        });

        const lettersContainer = document.getElementById('letters-container');
        const emptyState = document.getElementById('empty-state');

        const renderLetters = () => {
            if (!lettersContainer) return;
            const existingCards = lettersContainer.querySelectorAll('.letter-card');
            existingCards.forEach(card => card.remove());

            if (appState.letters && appState.letters.length > 0) {
                emptyState.style.display = 'none';
                lettersContainer.classList.remove('empty');
                
                appState.letters.forEach(letter => {
                    const card = document.createElement('button');
                    card.className = 'letter-card';
                    card.innerHTML = `
                        <div class="envelope-body">
                            <p class="envelope-prefix">in case you...</p>
                            <p class="envelope-text">${letter.subtitle}</p>
                        </div>
                    `;
                    card.addEventListener('click', () => {
                        appState.currentLetterId = letter.id;
                        saveState();
                        window.location.href = 'editor.html';
                    });
                    lettersContainer.appendChild(card);
                });
            } else {
                emptyState.style.display = 'flex';
                lettersContainer.classList.add('empty');
            }
        };

        renderLetters();
    }

    // --- NEW LETTER PAGE ---
    if (page === 'newletter') {
        const form = document.getElementById('new-letter-form');
        const inputSubtitle = document.getElementById('input-subtitle');
        const subtitleCounter = document.getElementById('subtitle-counter');
        const envelopeLiveText = document.getElementById('envelope-live-text');

        if (inputSubtitle && subtitleCounter && envelopeLiveText) {
            inputSubtitle.addEventListener('input', (e) => {
                const text = e.target.value;
                subtitleCounter.textContent = text.length;
                envelopeLiveText.textContent = text || 'e.g., you need motivation';
            });
        }

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const newLetter = {
                    id: Date.now().toString(),
                    subtitle: inputSubtitle.value.trim(),
                    content: [], // serialized elements go here
                    background: null
                };
                if (!appState.letters) appState.letters = [];
                appState.letters.push(newLetter);
                appState.currentLetterId = newLetter.id;
                saveState();
                window.location.href = 'editor.html';
            });
        }
    }

    // --- EDITOR PAGE ---
    if (page === 'editor') {
        const currentLetter = appState.letters.find(l => l.id === appState.currentLetterId);
        if (!currentLetter) {
            window.location.href = 'collection.html';
            return;
        }

        document.getElementById('editor-title-display').textContent = currentLetter.subtitle || 'new letter';

        // Saving logic
        const saveEditorAndGoBack = () => {
            currentLetter.content = serializeCanvas();
            currentLetter.background = document.getElementById('editor-canvas-container').style.backgroundImage || document.getElementById('editor-canvas-container').style.backgroundColor;
            saveState();
            window.location.href = 'collection.html';
        };

        document.getElementById('btn-back-collection').addEventListener('click', saveEditorAndGoBack);
        
        // Auto-save periodically
        setInterval(() => {
            currentLetter.content = serializeCanvas();
            currentLetter.background = document.getElementById('editor-canvas-container').style.backgroundImage || document.getElementById('editor-canvas-container').style.backgroundColor;
            saveState();
        }, 5000);

        initEditor(currentLetter);
        initCollectionSystem();
        initTextToolbar();
        initLinkSystem();
        initImageSystem();
        initImageToolbar();
        initAudioSystem();
        initVideoSystem();
        initEditorActions();
        initControls();
        initDragAndDrop();
        setupCanvasClick();
        deserializeCanvas(currentLetter.content);
        initColorPickerSystem();
        if(currentLetter.background) {
            const container = document.getElementById('editor-canvas-container');
            if (currentLetter.background.includes('url')) {
                container.style.backgroundImage = currentLetter.background;
                container.style.backgroundSize = 'cover';
                container.style.backgroundPosition = 'center';
            } else {
                container.style.backgroundColor = currentLetter.background;
            }
        }
    }
});

// --- EDITOR LOGIC ---
let currentSelectedElement = null;
let canvasScale = 1;
let canvasOffsetX = 0;
let canvasOffsetY = 0;
let isPanMode = false;
/** When true, the next empty-canvas mousedown should not clear selection (just ended text edit). */
let skipCanvasDeselectFromTextEdit = false;

const TEXT_DEFAULT_PLACEHOLDER = 'double click to type';

function syncTextEmptyState(textEl) {
    if (!textEl) return;
    const empty = !textEl.textContent || textEl.textContent.trim() === '';
    textEl.classList.toggle('is-empty', empty);
}

function exitTextEditMode(wrapper) {
    if (!wrapper || !wrapper.classList.contains('is-text-editing')) return;
    const textEl = wrapper.querySelector('.editable-text');
    if (textEl) {
        const sel = window.getSelection();
        if (sel?.anchorNode && textEl.contains(sel.anchorNode)) {
            sel.removeAllRanges();
        }
        textEl.contentEditable = 'false';
        textEl.classList.remove('is-editing');
        textEl.blur();
        syncTextEmptyState(textEl);
    }
    wrapper.classList.remove('is-text-editing');
    updateToolbarPosition();
}

function enterTextEditMode(wrapper) {
    if (!wrapper || !wrapper.classList.contains('text-item')) return;
    const textEl = wrapper.querySelector('.editable-text');
    if (!textEl) return;

    document.querySelectorAll('.text-item.is-text-editing').forEach(w => {
        if (w !== wrapper) exitTextEditMode(w);
    });

    selectElement(wrapper);
    textEl.contentEditable = 'true';
    textEl.classList.add('is-editing');
    wrapper.classList.add('is-text-editing');

    requestAnimationFrame(() => {
        const sel = window.getSelection();
        sel?.removeAllRanges();
        textEl.focus();
        const range = document.createRange();
        range.selectNodeContents(textEl);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
        updateToolbarPosition();
    });
}

function getCanvasInvScale() {
    return 1 / (canvasScale > 0 ? canvasScale : 1);
}

function setEditorDragging(active) {
    const c = document.getElementById('editor-canvas-container');
    if (!c) return;
    c.classList.toggle('editor-is-dragging', active);
    c.classList.toggle('editor-suppress-native-select', active);
}

/** During rotate (no full-canvas grab cursor); still block native text selection on text objects. */
function setEditorNativeSelectSuppressed(active) {
    document.getElementById('editor-canvas-container')?.classList.toggle('editor-suppress-native-select', active);
}

function dragMoveListener(event) {
    let target = event.target;
    if (target && !target.classList.contains('draggable')) {
        target = target.closest('.draggable');
    }
    if (!target || !target.classList.contains('draggable')) return;

    const inv = getCanvasInvScale();
    const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx * inv;
    const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy * inv;
    const angle = (parseFloat(target.getAttribute('data-angle')) || 0);

    target.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;
    target.setAttribute('data-x', x);
    target.setAttribute('data-y', y);
    updateToolbarPosition();
}

function resizeMoveListener(event) {
    let target = event.target;
    if (target && !target.classList.contains('draggable')) {
        target = target.closest('.draggable');
    }
    if (!target || !target.classList.contains('draggable')) return;
    const inv = getCanvasInvScale();
    let x = (parseFloat(target.getAttribute('data-x')) || 0);
    let y = (parseFloat(target.getAttribute('data-y')) || 0);
    const angle = (parseFloat(target.getAttribute('data-angle')) || 0);

    if (target.classList.contains('link-item')) {
        const inv = getCanvasInvScale();
        // For links, we scale font-size based on height change
        const currentSize = parseFloat(target.getAttribute('data-font-size')) || 16;
        const ratio = event.rect.height / (parseFloat(target.dataset.prevHeight) || event.rect.height);
        const newSize = Math.max(8, Math.round(currentSize * ratio));
        
        target.style.fontSize = newSize + 'px';
        target.setAttribute('data-font-size', newSize);
        const display = document.getElementById('link-font-size-display');
        if (display) display.textContent = newSize;
    } else if (target.classList.contains('image-item') && !target.classList.contains('is-cropping')) {
        // Normal image resize: maintain aspect ratio or just set width/height
        target.style.width = (event.rect.width * inv) + 'px';
        target.style.height = (event.rect.height * inv) + 'px';
    } else if (target.classList.contains('is-cropping')) {
        // Crop mode resize: only resize the frame
        target.style.width = (event.rect.width * inv) + 'px';
        target.style.height = (event.rect.height * inv) + 'px';
    } else {
        target.style.width = (event.rect.width * inv) + 'px';
        target.style.height = (event.rect.height * inv) + 'px';
    }

    x += event.deltaRect.left * inv;
    y += event.deltaRect.top * inv;

    target.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;
    target.setAttribute('data-x', x);
    target.setAttribute('data-y', y);
    
    if (target.classList.contains('link-item')) {
        target.dataset.prevHeight = event.rect.height;
    }
}

function attachInteractToDraggable(wrapper) {
    if (typeof interact === 'undefined' || !wrapper) return;
    if (wrapper.getAttribute('data-interact-bound') === '1') return;
    wrapper.setAttribute('data-interact-bound', '1');

    interact(wrapper)
        .draggable({
            inertia: true,
            ignoreFrom: '.rotate-handle, .sel-handle, .editable-text[contenteditable="true"]',
            modifiers: [interact.modifiers.restrictRect({ restriction: 'parent', endOnly: true })],
            autoScroll: true,
            listeners: {
                start() {
                    setEditorDragging(true);
                },
                move: dragMoveListener,
                end() {
                    setEditorDragging(false);
                    updateToolbarPosition();
                }
            }
        })
        .resizable({
            edges: { left: true, right: true, bottom: true, top: true },
            modifiers: [
                interact.modifiers.restrictEdges({ outer: 'parent' }),
                interact.modifiers.restrictSize({ min: { width: 50, height: 30 } })
            ],
            listeners: {
                start() {
                    setEditorDragging(true);
                },
                move: resizeMoveListener,
                end() {
                    setEditorDragging(false);
                    updateToolbarPosition();
                }
            }
        });
}

// --- Color math (toolbar picker) ---
function rgbToHsv(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    let h = 0;
    const s = max === 0 ? 0 : d / max;
    const v = max;
    if (d !== 0) {
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            default: h = ((r - g) / d + 4) / 6;
        }
    }
    return { h: h * 360, s, v };
}

function hsvToRgb(h, s, v) {
    h = ((h % 360) + 360) % 360;
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;
    let rp = 0;
    let gp = 0;
    let bp = 0;
    if (h < 60) { rp = c; gp = x; }
    else if (h < 120) { rp = x; gp = c; }
    else if (h < 180) { gp = c; bp = x; }
    else if (h < 240) { gp = x; bp = c; }
    else if (h < 300) { rp = x; bp = c; }
    else { rp = c; bp = x; }
    return {
        r: Math.round((rp + m) * 255),
        g: Math.round((gp + m) * 255),
        b: Math.round((bp + m) * 255)
    };
}

function rgbToHex(r, g, b) {
    const h = (n) => n.toString(16).padStart(2, '0');
    return `#${h(r)}${h(g)}${h(b)}`;
}

function parseColorToRgb(colorStr) {
    if (!colorStr) return { r: 134, g: 97, b: 68 };
    const s = colorStr.trim().toLowerCase();
    if (s.startsWith('#')) {
        const hex = s.slice(1);
        if (hex.length === 3) {
            return {
                r: parseInt(hex[0] + hex[0], 16),
                g: parseInt(hex[1] + hex[1], 16),
                b: parseInt(hex[2] + hex[2], 16)
            };
        }
        if (hex.length === 6) {
            return {
                r: parseInt(hex.slice(0, 2), 16),
                g: parseInt(hex.slice(2, 4), 16),
                b: parseInt(hex.slice(4, 6), 16)
            };
        }
    }
    const m = s.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/);
    if (m) {
        return { r: Math.round(+m[1]), g: Math.round(+m[2]), b: Math.round(+m[3]) };
    }
    return { r: 134, g: 97, b: 68 };
}

const ALIGN_ICON_SVGS = {
    left: '<line x1="3" y1="10" x2="18" y2="10"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="14" x2="21" y2="14"/><line x1="3" y1="18" x2="18" y2="18"/>',
    center: '<line x1="18" y1="10" x2="6" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="18" y1="18" x2="6" y2="18"/>',
    right: '<line x1="21" y1="10" x2="6" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="6" y2="18"/>'
};

function normalizeTextAlign(val) {
    if (!val || val === 'start') return 'left';
    if (val === 'end') return 'right';
    if (val === 'center' || val === 'right' || val === 'left') return val;
    return 'left';
}

function setAlignToolbarIcon(align) {
    const svg = document.getElementById('align-icon-svg');
    if (!svg) return;
    const a = normalizeTextAlign(align);
    svg.innerHTML = ALIGN_ICON_SVGS[a] || ALIGN_ICON_SVGS.left;
}

function ensureTextBoxWidthForAlignment(wrapper, align) {
    if (!wrapper || !wrapper.classList.contains('text-item')) return;
    const a = normalizeTextAlign(align);
    const textNode = wrapper.querySelector('.editable-text');
    if (!textNode) return;

    // If width is not explicitly set, center/right alignment is meaningless because the box collapses.
    const hasExplicitWidth = !!wrapper.style.width && wrapper.style.width !== 'auto';

    if ((a === 'center' || a === 'right') && !hasExplicitWidth) {
        // Lock current visual width as the text box width (keeps object position stable).
        const rect = wrapper.getBoundingClientRect();
        const paper = document.getElementById('letter-paper');
        const paperRect = paper ? paper.getBoundingClientRect() : null;
        let w = rect.width;
        if (paperRect) {
            // Convert screen px → canvas px (account for zoom)
            w = rect.width * getCanvasInvScale();
        }
        wrapper.style.width = `${Math.max(72, Math.round(w))}px`;
    }

    // Text should align within the box width.
    textNode.style.width = '100%';
}

function cycleTextAlignment() {
    if (!currentSelectedElement || !currentSelectedElement.classList.contains('text-item')) return;
    const textNode = currentSelectedElement.querySelector('.editable-text');
    if (!textNode) return;
    const cur = normalizeTextAlign(textNode.style.textAlign || getComputedStyle(textNode).textAlign);
    const next = cur === 'left' ? 'center' : (cur === 'center' ? 'right' : 'left');
    ensureTextBoxWidthForAlignment(currentSelectedElement, next);
    textNode.style.textAlign = next;
    setAlignToolbarIcon(next);
    updateToolbarPosition();
}

function syncTextToolbarFromSelection() {
    if (!currentSelectedElement || !currentSelectedElement.classList.contains('text-item')) return;
    const textNode = currentSelectedElement.querySelector('.editable-text');
    if (!textNode) return;

    const align = normalizeTextAlign(textNode.style.textAlign || getComputedStyle(textNode).textAlign);
    setAlignToolbarIcon(align);

    const rgb = parseColorToRgb(textNode.style.color || getComputedStyle(textNode).color);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    const colorBtn = document.getElementById('toolbar-color-btn');
    if (colorBtn) colorBtn.style.backgroundColor = hex;

    const boldBtn = document.querySelector('.format-btn[data-format="bold"]');
    if (boldBtn) {
        const w = textNode.style.fontWeight || getComputedStyle(textNode).fontWeight;
        boldBtn.classList.toggle('active', w === 'bold' || w === '700');
    }
}

function applyCanvasTransform() {
    const wrapper = document.getElementById('editor-canvas-wrapper');
    if (wrapper) {
        wrapper.style.transform = `translate(${canvasOffsetX}px, ${canvasOffsetY}px) scale(${canvasScale})`;
        wrapper.style.transformOrigin = 'center center';
    }
}

function initCanvasControls() {
    const canvas = document.getElementById('editor-canvas-container');

    // --- Mode toggle ---
    const btnEdit = document.getElementById('btn-mode-edit');
    const btnPan  = document.getElementById('btn-mode-pan');

    function setEditMode() {
        isPanMode = false;
        canvas.style.cursor = 'default';
        canvas.classList.remove('is-pan-mode');
        btnEdit.classList.add('active');
        btnPan.classList.remove('active');
    }
    function setPanMode() {
        isPanMode = true;
        canvas.style.cursor = 'grab';
        canvas.classList.add('is-pan-mode');
        btnPan.classList.add('active');
        btnEdit.classList.remove('active');
    }
    btnEdit.addEventListener('click', setEditMode);
    btnPan.addEventListener('click', setPanMode);

    // --- Zoom (min = 1, cannot shrink below initial size) ---
    const btnZoomIn  = document.getElementById('btn-zoom-in');
    const btnZoomOut = document.getElementById('btn-zoom-out');

    function updateZoomButtons() {
        btnZoomOut.disabled = canvasScale <= 1;
    }

    btnZoomIn.addEventListener('click', () => {
        canvasScale = Math.min(canvasScale + 0.15, 3);
        applyCanvasTransform();
        updateZoomButtons();
    });
    btnZoomOut.addEventListener('click', () => {
        if (canvasScale <= 1) return;
        canvasScale = Math.max(canvasScale - 0.15, 1);
        applyCanvasTransform();
        updateZoomButtons();
    });

    // --- Reset view ---
    document.getElementById('btn-reset-view').addEventListener('click', () => {
        canvasScale = 1;
        canvasOffsetX = 0;
        canvasOffsetY = 0;
        applyCanvasTransform();
        updateZoomButtons();
        setEditMode();
    });

    // --- Pan drag ---
    let panStartX = 0, panStartY = 0, panDragging = false;
    canvas.addEventListener('mousedown', (e) => {
        if (!isPanMode) return;
        panDragging = true;
        panStartX = e.clientX - canvasOffsetX;
        panStartY = e.clientY - canvasOffsetY;
        canvas.style.cursor = 'grabbing';
    });
    document.addEventListener('mousemove', (e) => {
        if (!panDragging) return;
        canvasOffsetX = e.clientX - panStartX;
        canvasOffsetY = e.clientY - panStartY;
        applyCanvasTransform();
    });
    document.addEventListener('mouseup', () => {
        if (!panDragging) return;
        panDragging = false;
        if (isPanMode) canvas.style.cursor = 'grab';
    });

    // --- Scroll-wheel zoom (min 1) ---
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        canvasScale = Math.min(Math.max(canvasScale + delta, 1), 3);
        applyCanvasTransform();
        updateZoomButtons();
    }, { passive: false });

    // Initial state
    updateZoomButtons();
}

function initEditor(letterData) {
    const bgInput = document.getElementById('bg-input');
    const btnAddBg = document.getElementById('btn-add-bg');

    initCanvasControls();

    // --- STICKER CATEGORIES ---
    const stickerCategories = [
        {
            name: 'ribbons',
            items: [
                'images/stickers/ribbons/blue ribbon.png',
                'images/stickers/ribbons/brown ribbon.png',
                'images/stickers/ribbons/red ribbon.png',
                'images/stickers/ribbons/pink ribbon.png',
                'images/stickers/ribbons/checked red ribbon.png',
                'images/stickers/ribbons/checked green ribbon.png',
            ]
        },
        {
            name: 'flowers',
            items: [
                'images/stickers/flowers/blue flower.png',
                'images/stickers/flowers/brown flower.png',
                'images/stickers/flowers/red flower.png',
                'images/stickers/flowers/pink flower.png',
                'images/stickers/flowers/white flower.png',
                'images/stickers/flowers/green clover.png',
            ]
        },
        {
            name: 'frames',
            items: [
                'images/stickers/frames/cam 1 frame.png',
                'images/stickers/frames/cam 2 frame.png',
                'images/stickers/frames/film 1 frame.png',
                'images/stickers/frames/film 3 frame.png',
                'images/stickers/frames/iphone frame.png',
                'images/stickers/frames/stamp frame.png',
            ]
        },
        {
            name: 'stamps',
            items: [
                'images/stickers/stamps/blue stamp.png',
                'images/stickers/stamps/brown stamp.png',
                'images/stickers/stamps/green stamp.png',
                'images/stickers/stamps/pink stamp.png',
                'images/stickers/stamps/red stamp.png',
                'images/stickers/stamps/white stamp.png',
            ]
        },
        {
            name: 'papers',
            items: [
                'images/stickers/papers/blue paper.png',
                'images/stickers/papers/fav person paper.png',
                'images/stickers/papers/good luck paper.png',
                'images/stickers/papers/good stamp paper.png',
                'images/stickers/papers/ily paper.png',
                'images/stickers/papers/pink paper.png',
            ]
        },
        {
            name: 'memes',
            items: [
                'images/stickers/memes/cat meme.png',
                'images/stickers/memes/hamster meme.png',
                'images/stickers/memes/kitten meme.png',
                'images/stickers/memes/man meme.png',
                'images/stickers/memes/pepe meme.png',
                'images/stickers/memes/sbsp meme.png',
            ]
        }
    ];

    let currentCategoryIndex = 0;
    const gallery = document.getElementById('stickers-gallery');

    function renderStickers() {
        const cat = stickerCategories[currentCategoryIndex];
        gallery.innerHTML = '';
        cat.items.forEach(src => {
            const div = document.createElement('div');
            div.className = 'sticker-thumb';
            div.style.backgroundImage = `url('${src}')`;
            div.title = src.split('/').pop().replace('.png', '');
            div.addEventListener('click', () => addStickerToCanvas(src));
            gallery.appendChild(div);
        });
    }

    document.getElementById('sticker-prev').addEventListener('click', () => {
        currentCategoryIndex = (currentCategoryIndex - 1 + stickerCategories.length) % stickerCategories.length;
        renderStickers();
    });
    document.getElementById('sticker-next').addEventListener('click', () => {
        currentCategoryIndex = (currentCategoryIndex + 1) % stickerCategories.length;
        renderStickers();
    });

    renderStickers();

    // Add Text Element
    const textBtns = document.querySelectorAll('.element-btn');
    textBtns.forEach(btn => {
        if(btn.textContent.includes('TEXT')) {
            btn.addEventListener('click', () => {
                addTextToCanvas('');
            });
        }
    });


    // --- PHOTOCARD ---
    const photocardToggle = document.getElementById('toggle-photocard');
    const photocardPanel = document.getElementById('photocard-panel');
    const photocardFrame = document.getElementById('photocard-frame');
    const photocardFrameInner = document.getElementById('photocard-frame-inner');
    const photocardInput = document.getElementById('photocard-input');
    const photocardPreviewImg = document.getElementById('photocard-preview-img');
    const photocardPreviewEmpty = document.getElementById('photocard-preview-empty');

    function setPhotocardImage(src) {
        // Update sidebar preview
        photocardPreviewImg.src = src;
        photocardPreviewImg.classList.remove('hidden');
        photocardPreviewEmpty.style.display = 'none';
        // Update canvas frame
        photocardFrameInner.innerHTML = '';
        const img = document.createElement('img');
        img.src = src;
        photocardFrameInner.appendChild(img);
    }

    function clearPhotocardImage() {
        photocardPreviewImg.src = '';
        photocardPreviewImg.classList.add('hidden');
        photocardPreviewEmpty.style.display = '';
        photocardFrameInner.innerHTML = '';
    }

    photocardToggle.addEventListener('change', () => {
        if (photocardToggle.checked) {
            photocardPanel.classList.remove('hidden');
            photocardFrame.classList.remove('hidden');
        } else {
            photocardPanel.classList.add('hidden');
            photocardFrame.classList.add('hidden');
            clearPhotocardImage();
        }
    });

    document.getElementById('btn-photocard-edit').addEventListener('click', () => {
        photocardInput.value = '';
        photocardInput.click();
    });

    photocardInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => setPhotocardImage(ev.target.result);
        reader.readAsDataURL(file);
    });

    document.getElementById('btn-photocard-delete').addEventListener('click', () => {
        clearPhotocardImage();
    });

    if (btnAddBg && bgInput) {
        btnAddBg.addEventListener('click', () => bgInput.click());
        bgInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const c = document.getElementById('editor-canvas-container');
                    c.style.backgroundImage = `url(${e.target.result})`;
                    c.style.backgroundSize = 'cover';
                    c.style.backgroundPosition = 'center';
                };
                reader.readAsDataURL(file);
            }
        });
    }

    const letterPaper = document.getElementById('letter-paper');
    if (letterPaper) {
        letterPaper.addEventListener('selectstart', (e) => {
            const t = e.target;
            if (!t || t.nodeType !== 1) return;
            if (t.closest('.editable-text.is-editing')) return;
            if (t.closest('.editable-text')) e.preventDefault();
        }, true);
        letterPaper.addEventListener('dragstart', (e) => {
            if (e.target.closest?.('.text-item') && !e.target.closest?.('.editable-text.is-editing')) {
                e.preventDefault();
            }
        }, true);
    }

    // Background Swatches
    document.querySelectorAll('.bg-swatch:not(.add-bg)').forEach(swatch => {
        swatch.addEventListener('click', (e) => {
            const bgPath = e.currentTarget.dataset.bg;
            const c = document.getElementById('editor-canvas-container');
            c.style.backgroundImage = `url('${bgPath}')`;
            c.style.backgroundSize = 'cover';
            c.style.backgroundPosition = 'center';
            // Update active state
            document.querySelectorAll('.bg-swatch').forEach(s => s.classList.remove('active'));
            e.currentTarget.classList.add('active');
        });
    });

    document.addEventListener('mousedown', (e) => {
        const editingWrapper = document.querySelector('.text-item.is-text-editing');
        skipCanvasDeselectFromTextEdit = false;
        if (!editingWrapper) return;
        if (editingWrapper.contains(e.target)) return;
        const uiChrome = e.target.closest(
            '#text-formatting-toolbar, #text-rotate-btn, .txt-toolbar, #txt-color-popup, .txt-color-popup, .txt-dd-list, .txt-layers-menu'
        );
        if (uiChrome) return;

        skipCanvasDeselectFromTextEdit = true;
        exitTextEditMode(editingWrapper);
    }, true);

    // Deselect elements when clicking empty canvas
    document.getElementById('editor-canvas-container').addEventListener('mousedown', (e) => {
        if (e.target.id === 'editor-canvas-container' || e.target.id === 'letter-paper' || e.target.id === 'editor-canvas-wrapper') {
            if (skipCanvasDeselectFromTextEdit) {
                skipCanvasDeselectFromTextEdit = false;
                return;
            }
            document.querySelectorAll('.text-item.is-text-editing').forEach(exitTextEditMode);
            document.querySelectorAll('.draggable').forEach(el => {
                el.classList.remove('selected');
                const overlay = el.querySelector('.selection-overlay');
                if (overlay) overlay.remove();
            });
            currentSelectedElement = null;
            hideTextToolbar();
            hideElementActionToolbar();
            hideLinkToolbar();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        const editing = document.querySelector('.text-item.is-text-editing');
        if (!editing) return;
        e.preventDefault();
        exitTextEditMode(editing);
    });

    // --- Element Action Toolbar Buttons ---
    document.getElementById('elem-btn-layer').addEventListener('click', () => {
        if (!currentSelectedElement) return;
        const cur = parseInt(currentSelectedElement.style.zIndex || 10);
        currentSelectedElement.style.zIndex = cur + 1;
    });

    document.getElementById('elem-btn-copy').addEventListener('click', () => {
        if (!currentSelectedElement) return;
        const el = currentSelectedElement;
        const paper = document.getElementById('letter-paper');
        if (!paper) return;

        // Deep clone the element
        const clone = el.cloneNode(true);
        clone.removeAttribute('data-interact-bound');

        // Remove the selection overlay from the clone
        const cloneOverlay = clone.querySelector('.selection-overlay');
        if (cloneOverlay) cloneOverlay.remove();
        clone.classList.remove('selected');

        // Offset position by 20px so it's visually distinct
        const x = (parseFloat(el.getAttribute('data-x')) || 0) + 20;
        const y = (parseFloat(el.getAttribute('data-y')) || 0) + 20;
        const angle = parseFloat(el.getAttribute('data-angle')) || 0;

        clone.setAttribute('data-x', x);
        clone.setAttribute('data-y', y);
        clone.setAttribute('data-angle', angle);
        clone.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;

        paper.appendChild(clone);
        bindElementInteractions(clone);
        selectElement(clone);
    });

    document.getElementById('elem-btn-delete').addEventListener('click', () => {
        if (!currentSelectedElement) return;
        currentSelectedElement.remove();
        currentSelectedElement = null;
        hideElementActionToolbar();
    });

    // --- Rotate Button drag-to-rotate ---
    const rotateBtnEl = document.getElementById('element-rotate-btn');
    rotateBtnEl.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const el = currentSelectedElement;
        if (!el) return;
        setEditorNativeSelectSuppressed(true);
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const onMouseMove = (moveEvent) => {
            const dx = moveEvent.clientX - centerX;
            const dy = moveEvent.clientY - centerY;
            let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
            const x = parseFloat(el.getAttribute('data-x')) || 0;
            const y = parseFloat(el.getAttribute('data-y')) || 0;
            el.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;
            el.setAttribute('data-angle', angle);
            positionElementActionToolbar(el);
        };
        const onMouseUp = () => {
            setEditorNativeSelectSuppressed(false);
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });

    initTextToolbar();
}

/**
 * --- Link System ---
 * Handles link creation, modal logic, and toolbar integration.
 */
function initLinkSystem() {
    const addLinkBtn = document.getElementById('btn-add-link');
    const modalOverlay = document.getElementById('link-modal-overlay');
    const closeBtn = document.getElementById('btn-close-link-modal');
    const confirmBtn = document.getElementById('btn-add-link-confirm');
    const urlInput = document.getElementById('input-link-url');
    const labelInput = document.getElementById('input-link-label');
    const charCounter = document.getElementById('link-label-counter');
    const modalTitle = document.getElementById('link-modal-title');

    let editingLinkElement = null;

    function openModal(el = null) {
        editingLinkElement = el;
        if (el) {
            modalTitle.textContent = 'edit link button';
            confirmBtn.textContent = 'SAVE';
            urlInput.value = el.getAttribute('data-url') || '';
            labelInput.value = el.querySelector('.link-label').textContent || '';
        } else {
            modalTitle.textContent = 'add link button';
            confirmBtn.textContent = 'ADD';
            urlInput.value = '';
            labelInput.value = '';
        }
        updateCharCount();
        validate();
        modalOverlay.classList.remove('hidden');
    }

    function closeModal() {
        modalOverlay.classList.add('hidden');
    }

    function validate() {
        confirmBtn.disabled = !urlInput.value.trim() || !labelInput.value.trim();
    }

    function updateCharCount() {
        charCounter.textContent = `${labelInput.value.length}/30`;
    }

    if (addLinkBtn) addLinkBtn.addEventListener('click', () => openModal());
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModal();
        });
    }

    if (urlInput) urlInput.addEventListener('input', validate);
    if (labelInput) {
        labelInput.addEventListener('input', () => {
            updateCharCount();
            validate();
        });
    }

    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            const url = urlInput.value.trim();
            const label = labelInput.value.trim();

            if (editingLinkElement) {
                editingLinkElement.setAttribute('data-url', url);
                editingLinkElement.querySelector('.link-label').textContent = label;
            } else {
                addLinkToCanvas(url, label);
            }
            closeModal();
        });
    }

    // Toolbar Edit Button
    const toolbarEditBtn = document.getElementById('btn-edit-link-modal');
    if (toolbarEditBtn) {
        toolbarEditBtn.addEventListener('click', () => {
            if (currentSelectedElement && currentSelectedElement.classList.contains('link-item')) {
                openModal(currentSelectedElement);
            }
        });
    }

    // Toolbar Layers
    const layersToggle = document.getElementById('link-layers-toggle-btn');
    const layersMenu = document.getElementById('link-layers-menu');
    if (layersToggle && layersMenu) {
        layersToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllTextToolbarMenus();
            layersMenu.classList.toggle('hidden');
        });
    }
    // Toolbar Font Size
    const fontSizeDisplay = document.getElementById('link-font-size-display');
    const fontSizeList = document.getElementById('link-font-size-list');
    
    document.querySelectorAll('#link-font-size-list li').forEach(li => {
        li.addEventListener('click', () => {
            if (currentSelectedElement && currentSelectedElement.classList.contains('link-item')) {
                const size = li.getAttribute('data-value');
                currentSelectedElement.style.fontSize = size + 'px';
                currentSelectedElement.setAttribute('data-font-size', size);
                if (fontSizeDisplay) fontSizeDisplay.textContent = size;
                updateToolbarPosition();
            }
            fontSizeList.classList.add('hidden');
        });
    });

    document.querySelectorAll('#link-layers-menu .txt-layers-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!currentSelectedElement) return;
            const paper = document.getElementById('letter-paper');
            const allDraggables = Array.from(paper.querySelectorAll('.draggable'));
            const action = item.getAttribute('data-layer');

            if (action === 'front') {
                let maxZ = 0;
                allDraggables.forEach(el => {
                    const z = parseInt(el.style.zIndex || 10);
                    if (z > maxZ) maxZ = z;
                });
                currentSelectedElement.style.zIndex = maxZ + 1;
            } else if (action === 'back') {
                let minZ = Infinity;
                allDraggables.forEach(el => {
                    const z = parseInt(el.style.zIndex || 10);
                    if (z < minZ) minZ = z;
                });
                currentSelectedElement.style.zIndex = Math.max(1, minZ - 1);
            }
            layersMenu.classList.add('hidden');
        });
    });
}

function addLinkToCanvas(url, label, x=150, y=150, angle=0, bgColor='#333333', textColor='#ffffff', zIndex=10, fontSize=16) {
    const paper = document.getElementById('letter-paper');
    if (!paper) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'draggable link-item selected';
    wrapper.setAttribute('data-type', 'link');
    wrapper.setAttribute('data-url', url);
    wrapper.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;
    wrapper.style.backgroundColor = bgColor;
    wrapper.style.color = textColor;
    wrapper.style.zIndex = zIndex;
    wrapper.style.fontSize = fontSize + 'px';
    
    wrapper.setAttribute('data-x', x);
    wrapper.setAttribute('data-y', y);
    wrapper.setAttribute('data-angle', angle);
    wrapper.setAttribute('data-font-size', fontSize);

    wrapper.innerHTML = `
        <svg class="link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
        <span class="link-label">${label}</span>
    `;

    // Click vs Drag behavior
    let startX, startY;
    let isMoving = false;

    wrapper.addEventListener('mousedown', (e) => {
        startX = e.clientX;
        startY = e.clientY;
        isMoving = false;
        selectElement(wrapper);
    });

    wrapper.addEventListener('mousemove', (e) => {
        if (startX === undefined) return;
        const dist = Math.sqrt(Math.pow(e.clientX - startX, 2) + Math.pow(e.clientY - startY, 2));
        if (dist > 7) {
            isMoving = true;
        }
    });

    wrapper.addEventListener('mouseup', (e) => {
        const dist = Math.sqrt(Math.pow(e.clientX - startX, 2) + Math.pow(e.clientY - startY, 2));
        if (dist < 7 && !isMoving) {
            // It's a clean click
            const url = wrapper.getAttribute('data-url');
            if (url) {
                // If the link is already selected, open it. If not, just select it (handled by mousedown)
                if (wrapper.classList.contains('selected')) {
                    window.open(url.startsWith('http') ? url : 'https://' + url, '_blank');
                }
            }
        }
        startX = undefined;
        startY = undefined;
    });

    paper.appendChild(wrapper);
    bindElementInteractions(wrapper);
    selectElement(wrapper);
}

function initImageSystem() {
    const modalOverlay = document.getElementById('image-modal-overlay');
    const closeBtn = document.getElementById('btn-close-image-modal');
    const fileInput = document.getElementById('image-file-input');
    const dropZone = document.getElementById('image-drop-zone');
    const uploadState = document.getElementById('image-upload-state');
    const previewState = document.getElementById('image-preview-state');
    const previewImg = document.getElementById('upload-preview-img');
    const replaceBtn = document.getElementById('btn-replace-image');
    const confirmAddBtn = document.getElementById('btn-add-image-confirm');
    const btnAddImageSidebar = document.getElementById('btn-add-image');

    let currentFile = null;

    function openModal() {
        modalOverlay.classList.remove('hidden');
        resetModal();
    }

    function closeModal() {
        modalOverlay.classList.add('hidden');
    }

    function resetModal() {
        uploadState.classList.remove('hidden');
        previewState.classList.add('hidden');
        fileInput.value = '';
        currentFile = null;
    }

    function handleFile(file) {
        if (!file || !file.type.startsWith('image/')) return;
        if (file.size > 10 * 1024 * 1024) {
            alert('File too large (max 10MB)');
            return;
        }

        currentFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImg.src = e.target.result;
            uploadState.classList.add('hidden');
            previewState.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }

    btnAddImageSidebar?.addEventListener('click', openModal);
    closeBtn?.addEventListener('click', closeModal);
    
    modalOverlay?.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });

    dropZone?.addEventListener('click', () => fileInput.click());
    dropZone?.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--primary-brown)';
        dropZone.style.background = 'rgba(255, 255, 255, 0.6)';
    });
    dropZone?.addEventListener('dragleave', () => {
        dropZone.style.borderColor = '';
        dropZone.style.background = '';
    });
    dropZone?.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '';
        dropZone.style.background = '';
        const file = e.dataTransfer.files[0];
        handleFile(file);
    });

    fileInput?.addEventListener('change', (e) => {
        handleFile(e.target.files[0]);
    });

    replaceBtn?.addEventListener('click', () => resetModal());

    confirmAddBtn?.addEventListener('click', () => {
        if (previewImg.src) {
            addImageToCanvas(previewImg.src);
            closeModal();
        }
    });
}

function initImageToolbar() {
    const btnCrop = document.getElementById('btn-image-crop');
    const btnLayers = document.getElementById('btn-image-layers');
    const layersMenu = document.getElementById('image-layers-menu');
    const btnDuplicate = document.getElementById('btn-image-duplicate');
    const btnDelete = document.getElementById('btn-image-delete');

    if (btnCrop) {
        btnCrop.addEventListener('click', () => {
            if (currentSelectedElement && currentSelectedElement.classList.contains('image-item')) {
                const isCropping = currentSelectedElement.classList.toggle('is-cropping');
                btnCrop.classList.toggle('active', isCropping);
                
                // Toggle confirmation icon inside crop button
                const iconCrop = btnCrop.querySelector('.icon-crop');
                const iconConfirm = btnCrop.querySelector('.icon-confirm');
                if (iconCrop && iconConfirm) {
                    iconCrop.classList.toggle('hidden', isCropping);
                    iconConfirm.classList.toggle('hidden', !isCropping);
                }
            }
        });
    }

    if (btnLayers && layersMenu) {
        btnLayers.addEventListener('click', (e) => {
            e.stopPropagation();
            layersMenu.classList.toggle('hidden');
        });

        layersMenu.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!currentSelectedElement) return;
                const action = btn.getAttribute('data-action');
                const paper = document.getElementById('letter-paper');
                const draggables = Array.from(paper.querySelectorAll('.draggable'));

                if (action === 'front') {
                    let maxZ = 10;
                    draggables.forEach(el => maxZ = Math.max(maxZ, parseInt(el.style.zIndex || 10)));
                    currentSelectedElement.style.zIndex = maxZ + 1;
                } else {
                    let minZ = 10;
                    draggables.forEach(el => minZ = Math.min(minZ, parseInt(el.style.zIndex || 10)));
                    currentSelectedElement.style.zIndex = Math.max(1, minZ - 1);
                }
                layersMenu.classList.add('hidden');
            });
        });
    }

    if (btnDuplicate) {
        btnDuplicate.addEventListener('click', () => {
            if (!currentSelectedElement || !currentSelectedElement.classList.contains('image-item')) return;
            const el = currentSelectedElement;
            const src = el.getAttribute('data-src');
            const x = (parseFloat(el.getAttribute('data-x')) || 0) + 20;
            const y = (parseFloat(el.getAttribute('data-y')) || 0) + 20;
            const w = parseFloat(el.style.width);
            const h = parseFloat(el.style.height);
            const angle = parseFloat(el.getAttribute('data-angle')) || 0;
            const z = parseInt(el.style.zIndex || 10);
            
            const imgNode = el.querySelector('img');
            const cx = parseFloat(imgNode.getAttribute('data-crop-x')) || 0;
            const cy = parseFloat(imgNode.getAttribute('data-crop-y')) || 0;

            addImageToCanvas(src, x, y, w, h, angle, z, cx, cy);
        });
    }

    if (btnDelete) {
        btnDelete.addEventListener('click', () => {
            if (currentSelectedElement) {
                currentSelectedElement.remove();
                currentSelectedElement = null;
                hideImageToolbar();
            }
        });
    }

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.txt-layers-wrap')) {
            layersMenu?.classList.add('hidden');
        }
    });
}

function initAudioSystem() {
    const addAudioBtn = document.getElementById('btn-add-audio');
    const modalOverlay = document.getElementById('audio-modal-overlay');
    const closeBtn = document.getElementById('btn-close-audio-modal');
    const fileInput = document.getElementById('input-audio-file');
    
    // States
    const optionsState = document.getElementById('audio-options-state');
    const countdownState = document.getElementById('audio-countdown-state');
    const recordingState = document.getElementById('audio-recording-state');
    const previewState = document.getElementById('audio-preview-state');
    const modalFooter = document.getElementById('audio-modal-footer');
    
    // Controls
    const recordStartBtn = document.getElementById('btn-audio-record-start');
    const uploadStartBtn = document.getElementById('btn-audio-upload-start');
    const countdownCancelBtn = document.getElementById('btn-audio-countdown-cancel');
    const stopRecordingBtn = document.getElementById('btn-audio-stop-recording');
    const previewPlayBtn = document.getElementById('btn-audio-preview-play');
    const replaceBtn = document.getElementById('btn-audio-replace');
    const reRecordBtn = document.getElementById('btn-audio-re-record');
    const confirmBtn = document.getElementById('btn-add-audio-confirm');
    
    // Displays
    const countdownNum = document.getElementById('audio-countdown-number');
    const recordingTimer = document.getElementById('audio-recording-timer');
    const previewDuration = document.getElementById('audio-preview-duration');

    let mediaRecorder;
    let audioChunks = [];
    let audioBlob;
    let audioUrl;
    let recordingInterval;
    let recordingStartTime;
    let previewAudio = new Audio();
    let countdownInterval;

    function openModal() {
        modalOverlay.classList.remove('hidden');
        showState('options');
    }

    function closeModal() {
        modalOverlay.classList.add('hidden');
        stopRecording();
        stopPreview();
    }

    function showState(state) {
        optionsState.classList.add('hidden');
        countdownState.classList.add('hidden');
        recordingState.classList.add('hidden');
        previewState.classList.add('hidden');
        modalFooter.classList.add('hidden');

        if (state === 'options') optionsState.classList.remove('hidden');
        if (state === 'countdown') countdownState.classList.remove('hidden');
        if (state === 'recording') recordingState.classList.remove('hidden');
        if (state === 'preview') {
            previewState.classList.remove('hidden');
            modalFooter.classList.remove('hidden');
        }
    }

    function startCountdown() {
        showState('countdown');
        let count = 3;
        countdownNum.textContent = count;
        
        countdownInterval = setInterval(() => {
            count--;
            if (count > 0) {
                countdownNum.textContent = count;
            } else {
                clearInterval(countdownInterval);
                startRecording();
            }
        }, 1000);
    }

    async function startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];

            mediaRecorder.ondataavailable = (e) => {
                audioChunks.push(e.data);
            };

            mediaRecorder.onstop = () => {
                audioBlob = new Blob(audioChunks, { type: 'audio/mpeg' });
                audioUrl = URL.createObjectURL(audioBlob);
                previewAudio.src = audioUrl;
                
                previewAudio.onloadedmetadata = () => {
                    previewDuration.textContent = formatTime(previewAudio.duration);
                    showState('preview');
                };
            };

            mediaRecorder.start();
            showState('recording');
            recordingStartTime = Date.now();
            recordingInterval = setInterval(updateRecordingTimer, 1000);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Microphone access denied or not available.");
            showState('options');
        }
    }

    function stopRecording() {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
        clearInterval(recordingInterval);
        clearInterval(countdownInterval);
    }

    function updateRecordingTimer() {
        const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
        recordingTimer.textContent = formatTime(elapsed);
    }

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    function stopPreview() {
        previewAudio.pause();
        previewAudio.currentTime = 0;
    }

    if (addAudioBtn) addAudioBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModal();
        });
    }

    if (recordStartBtn) recordStartBtn.addEventListener('click', startCountdown);
    if (uploadStartBtn) uploadStartBtn.addEventListener('click', () => fileInput.click());
    
    if (countdownCancelBtn) {
        countdownCancelBtn.addEventListener('click', () => {
            clearInterval(countdownInterval);
            showState('options');
        });
    }

    if (stopRecordingBtn) stopRecordingBtn.addEventListener('click', stopRecording);

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 40 * 1024 * 1024) {
                    alert("File too large (max 40MB)");
                    return;
                }
                audioUrl = URL.createObjectURL(file);
                previewAudio.src = audioUrl;
                previewAudio.onloadedmetadata = () => {
                    previewDuration.textContent = formatTime(previewAudio.duration);
                    showState('preview');
                };
            }
        });
    }

    if (previewPlayBtn) {
        previewPlayBtn.addEventListener('click', () => {
            if (previewAudio.paused) {
                previewAudio.play();
                previewPlayBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`;
            } else {
                previewAudio.pause();
                previewPlayBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
            }
        });
        previewAudio.onended = () => {
            previewPlayBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
        };
    }

    if (replaceBtn) replaceBtn.addEventListener('click', () => fileInput.click());
    if (reRecordBtn) reRecordBtn.addEventListener('click', startCountdown);

    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            if (audioUrl) {
                addAudioToCanvas(audioUrl, previewDuration.textContent);
                closeModal();
            }
        });
    }

    // Audio Toolbar Layers
    const layersToggle = document.getElementById('audio-layers-toggle-btn');
    const layersMenu = document.getElementById('audio-layers-menu');
    if (layersToggle && layersMenu) {
        layersToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllTextToolbarMenus();
            layersMenu.classList.toggle('hidden');
        });
    }

    document.querySelectorAll('#audio-layers-menu .txt-layers-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!currentSelectedElement) return;
            const paper = document.getElementById('letter-paper');
            const allDraggables = Array.from(paper.querySelectorAll('.draggable'));
            const action = item.getAttribute('data-layer');

            if (action === 'front') {
                let maxZ = 0;
                allDraggables.forEach(el => {
                    const z = parseInt(el.style.zIndex || 10);
                    if (z > maxZ) maxZ = z;
                });
                currentSelectedElement.style.zIndex = maxZ + 1;
            } else if (action === 'back') {
                let minZ = Infinity;
                allDraggables.forEach(el => {
                    const z = parseInt(el.style.zIndex || 10);
                    if (z < minZ) minZ = z;
                });
                currentSelectedElement.style.zIndex = Math.max(1, minZ - 1);
            }
            layersMenu.classList.add('hidden');
        });
    });
}

function addAudioToCanvas(src, durationStr, x=150, y=150, width=280, height=44, angle=0, zIndex=10) {
    const paper = document.getElementById('letter-paper');
    if (!paper) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'audio-item draggable draggable-item audio-element';
    
    wrapper.style.left = '0';
    wrapper.style.top = '0';
    wrapper.style.width = width + 'px';
    wrapper.style.height = height + 'px';
    wrapper.style.zIndex = zIndex;
    wrapper.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;
    
    wrapper.setAttribute('data-x', x);
    wrapper.setAttribute('data-y', y);
    wrapper.setAttribute('data-angle', angle);
    wrapper.setAttribute('data-src', src);
    wrapper.setAttribute('data-duration', durationStr);

    wrapper.innerHTML = `
        <div class="audio-item-inner">
            <div class="audio-play-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </div>
            <div class="waveform-visual">
                <div class="wave-bar" style="height: 12px;"></div>
                <div class="wave-bar" style="height: 20px;"></div>
                <div class="wave-bar" style="height: 16px;"></div>
                <div class="wave-bar" style="height: 24px;"></div>
                <div class="wave-bar" style="height: 14px;"></div>
                <div class="wave-bar" style="height: 22px;"></div>
                <div class="wave-bar" style="height: 18px;"></div>
                <div class="wave-bar" style="height: 10px;"></div>
                <div class="wave-bar" style="height: 16px;"></div>
                <div class="wave-bar" style="height: 20px;"></div>
                <div class="wave-bar" style="height: 12px;"></div>
            </div>
            <span class="audio-duration">${durationStr}</span>
        </div>
    `;

    paper.appendChild(wrapper);
    bindElementInteractions(wrapper);
    selectElement(wrapper);
}

function addImageToCanvas(src, x=150, y=150, width=240, height=240, angle=0, zIndex=10, cropX=0, cropY=0) {
    const paper = document.getElementById('letter-paper');
    if (!paper) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'draggable image-item selected';
    wrapper.setAttribute('data-type', 'image');
    wrapper.setAttribute('data-src', src);
    
    wrapper.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;
    wrapper.style.width = `${width}px`;
    wrapper.style.height = `${height}px`;
    wrapper.style.zIndex = zIndex;
    
    wrapper.setAttribute('data-x', x);
    wrapper.setAttribute('data-y', y);
    wrapper.setAttribute('data-angle', angle);

    const img = document.createElement('img');
    img.src = src;
    img.draggable = false;
    img.style.transform = `translate(${cropX}px, ${cropY}px)`;
    img.setAttribute('data-crop-x', cropX);
    img.setAttribute('data-crop-y', cropY);

    wrapper.appendChild(img);
    paper.appendChild(wrapper);

    // Internal dragging for crop mode
    let isPanning = false;
    let startX, startY, baseCX, baseCY;

    wrapper.addEventListener('mousedown', (e) => {
        if (!wrapper.classList.contains('is-cropping')) return;
        e.stopPropagation();
        isPanning = true;
        startX = e.clientX;
        startY = e.clientY;
        baseCX = parseFloat(img.getAttribute('data-crop-x')) || 0;
        baseCY = parseFloat(img.getAttribute('data-crop-y')) || 0;
        wrapper.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
        if (!isPanning) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        const newCX = baseCX + dx;
        const newCY = baseCY + dy;
        img.style.transform = `translate(${newCX}px, ${newCY}px)`;
        img.setAttribute('data-crop-x', newCX);
        img.setAttribute('data-crop-y', newCY);
    });

    window.addEventListener('mouseup', () => {
        if (isPanning) {
            isPanning = false;
            wrapper.style.cursor = '';
        }
    });

    bindElementInteractions(wrapper);
    selectElement(wrapper);
}

function initEditorActions() {
    // Title Editing
    const btnEditTitle = document.getElementById('btn-edit-title');
    const titleModal = document.getElementById('title-modal-overlay');
    const inputTitle = document.getElementById('input-letter-title');
    const displayTitle = document.getElementById('editor-title-display');
    const btnSaveTitle = document.getElementById('btn-save-title');
    const charCounter = document.getElementById('title-char-counter');

    btnEditTitle?.addEventListener('click', () => {
        inputTitle.value = displayTitle.textContent === 'open when...' ? '' : displayTitle.textContent;
        updateCharCounter();
        titleModal.classList.remove('hidden');
    });

    inputTitle?.addEventListener('input', updateCharCounter);

    function updateCharCounter() {
        if (charCounter) charCounter.textContent = `${inputTitle.value.length}/65`;
    }

    btnSaveTitle?.addEventListener('click', () => {
        const val = inputTitle.value.trim().toLowerCase();
        displayTitle.textContent = val || 'open when...';
        titleModal.classList.add('hidden');
    });

    document.getElementById('btn-close-title-modal')?.addEventListener('click', () => titleModal.classList.add('hidden'));

    // Deletion
    const btnDelete = document.getElementById('btn-delete-letter');
    const deleteModal = document.getElementById('delete-modal-overlay');
    
    btnDelete?.addEventListener('click', () => deleteModal.classList.remove('hidden'));
    document.getElementById('btn-close-delete-modal')?.addEventListener('click', () => deleteModal.classList.add('hidden'));
    document.getElementById('btn-cancel-delete')?.addEventListener('click', () => deleteModal.classList.add('hidden'));
    
    document.getElementById('btn-confirm-delete')?.addEventListener('click', () => {
        // In a real app, this would be a fetch DELETE request
        alert("Letter deleted. Redirecting to collection...");
        window.location.reload(); // Simple mock
    });

    // Preview Mode
    const btnPreview = document.getElementById('btn-preview-mode');
    const previewOverlay = document.getElementById('preview-mode-overlay');
    const btnExitPreview = document.getElementById('btn-exit-preview');

    btnPreview?.addEventListener('click', togglePreviewMode);
    btnExitPreview?.addEventListener('click', () => previewOverlay.classList.remove('active'));

    function togglePreviewMode() {
        const scene = document.getElementById('preview-scene');
        const paper = document.getElementById('letter-paper');
        const editorMain = document.querySelector('.editor-canvas-area');
        
        // Clear previous
        scene.innerHTML = '';
        
        // Clone Background (if any)
        const bg = editorMain.querySelector('.canvas-background-layer');
        if (bg) {
            const bgClone = bg.cloneNode(true);
            scene.appendChild(bgClone);
        }

        // Clone Paper
        const paperClone = paper.cloneNode(true);
        paperClone.id = 'preview-paper';
        paperClone.classList.remove('paper-editor-active');
        paperClone.classList.add('paper-preview-active');
        
        // Clean up editor specific classes from clones
        paperClone.querySelectorAll('.draggable').forEach(el => {
            el.classList.remove('selected', 'draggable', 'draggable-item');
            el.querySelector('.selection-overlay')?.remove();
            
            // Enable media controls in preview
            if (el.classList.contains('video-element')) {
                const video = el.querySelector('video');
                video.style.pointerEvents = 'auto';
                video.controls = true;
            }
            if (el.classList.contains('audio-item')) {
                const playBtn = el.querySelector('.audio-play-btn');
                const audio = el.querySelector('audio');
                if (playBtn && audio) {
                    playBtn.style.pointerEvents = 'auto';
                    playBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (audio.paused) audio.play();
                        else audio.pause();
                    });
                }
            }
        });

        scene.appendChild(paperClone);
        previewOverlay.classList.add('active');
    }

    // Publishing
    const btnPublish = document.getElementById('btn-publish-toggle');
    const successNotif = document.getElementById('publish-success-notification');
    let isPublished = false;

    btnPublish?.addEventListener('click', () => {
        if (!isPublished) {
            isPublished = true;
            btnPublish.textContent = 'UNPUBLISH';
            successNotif.classList.remove('hidden');
            setTimeout(() => {
                // successNotif.classList.add('hidden');
            }, 5000);
        } else {
            isPublished = false;
            btnPublish.textContent = 'PUBLISH';
            successNotif.classList.add('hidden');
        }
    });

    document.getElementById('btn-next-letter')?.addEventListener('click', () => {
        window.location.reload(); // Simple mock for "fresh start"
    });

    document.getElementById('btn-success-back')?.addEventListener('click', () => {
        alert("Redirecting to collection...");
    });
}

function initVideoSystem() {
    const addVideoBtn = document.getElementById('btn-add-video');
    const modalOverlay = document.getElementById('video-modal-overlay');
    const closeBtn = document.getElementById('btn-close-video-modal');
    const dropZone = document.getElementById('video-drop-zone');
    const fileInput = document.getElementById('input-video-file');
    
    // States
    const uploadState = document.getElementById('video-upload-state');
    const previewState = document.getElementById('video-preview-state');
    const modalFooter = document.getElementById('video-modal-footer');
    
    // Controls
    const previewVideo = document.getElementById('video-upload-preview');
    const replaceBtn = document.getElementById('btn-replace-video');
    const confirmBtn = document.getElementById('btn-add-video-confirm');

    let videoUrl;

    function openModal() {
        modalOverlay.classList.remove('hidden');
        showState('upload');
    }

    function closeModal() {
        modalOverlay.classList.add('hidden');
        previewVideo.pause();
        previewVideo.src = "";
    }

    function showState(state) {
        uploadState.classList.add('hidden');
        previewState.classList.add('hidden');
        modalFooter.classList.add('hidden');

        if (state === 'upload') uploadState.classList.remove('hidden');
        if (state === 'preview') {
            previewState.classList.remove('hidden');
            modalFooter.classList.remove('hidden');
        }
    }

    function handleFile(file) {
        if (!file) return;
        if (file.size > 50 * 1024 * 1024) {
            alert("Video too large (max 50MB)");
            return;
        }
        
        videoUrl = URL.createObjectURL(file);
        previewVideo.src = videoUrl;
        showState('preview');
    }

    if (addVideoBtn) addVideoBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModal();
        });
    }

    if (dropZone) {
        dropZone.addEventListener('click', () => fileInput.click());
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            handleFile(e.dataTransfer.files[0]);
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
    }

    if (replaceBtn) replaceBtn.addEventListener('click', () => fileInput.click());

    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            if (videoUrl) {
                addVideoToCanvas(videoUrl);
                closeModal();
            }
        });
    }

    // Video Toolbar Layers
    const layersToggle = document.getElementById('video-layers-toggle-btn');
    const layersMenu = document.getElementById('video-layers-menu');
    if (layersToggle && layersMenu) {
        layersToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllTextToolbarMenus();
            layersMenu.classList.toggle('hidden');
        });
    }

    document.querySelectorAll('#video-layers-menu .txt-layers-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!currentSelectedElement) return;
            const paper = document.getElementById('letter-paper');
            const allDraggables = Array.from(paper.querySelectorAll('.draggable'));
            const action = item.getAttribute('data-layer');

            if (action === 'front') {
                let maxZ = 0;
                allDraggables.forEach(el => {
                    const z = parseInt(el.style.zIndex || 10);
                    if (z > maxZ) maxZ = z;
                });
                currentSelectedElement.style.zIndex = maxZ + 1;
            } else if (action === 'back') {
                let minZ = Infinity;
                allDraggables.forEach(el => {
                    const z = parseInt(el.style.zIndex || 10);
                    if (z < minZ) minZ = z;
                });
                currentSelectedElement.style.zIndex = Math.max(1, minZ - 1);
            }
            layersMenu.classList.add('hidden');
        });
    });
}

function addVideoToCanvas(src, x=150, y=150, width=280, height=157.5, angle=0, zIndex=10) {
    const paper = document.getElementById('letter-paper');
    if (!paper) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'video-item draggable draggable-item video-element';
    
    wrapper.style.left = '0';
    wrapper.style.top = '0';
    wrapper.style.width = width + 'px';
    wrapper.style.height = height + 'px';
    wrapper.style.zIndex = zIndex;
    wrapper.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;
    
    wrapper.setAttribute('data-x', x);
    wrapper.setAttribute('data-y', y);
    wrapper.setAttribute('data-angle', angle);
    wrapper.setAttribute('data-src', src);

    wrapper.innerHTML = `
        <video src="${src}" playsinline muted loop></video>
    `;

    paper.appendChild(wrapper);
    bindElementInteractions(wrapper);
    selectElement(wrapper);
}

function selectElement(el) {
    document.querySelectorAll('.text-item.is-text-editing').forEach(w => {
        if (w !== el) exitTextEditMode(w);
    });

    // Remove overlay from any previously selected element
    document.querySelectorAll('.draggable').forEach(item => {
        item.classList.remove('selected');
        const old = item.querySelector('.selection-overlay');
        if (old) old.remove();
    });

    el.classList.add('selected');
    currentSelectedElement = el;

    // Inject selection overlay with 8 handle circles
    const overlay = document.createElement('div');
    overlay.className = 'selection-overlay';
    const positions = ['tl','tc','tr','ml','mr','bl','bc','br'];
    positions.forEach(pos => {
        const h = document.createElement('div');
        h.className = `sel-handle ${pos}`;
        overlay.appendChild(h);
    });
    el.appendChild(overlay);

    if (el.classList.contains('text-item')) {
        showTextToolbar(el);
        hideElementActionToolbar();
        hideLinkToolbar();
        hideImageToolbar();
        hideAudioToolbar();
        syncTextToolbarFromSelection();
    } else if (el.classList.contains('link-item')) {
        hideTextToolbar();
        hideElementActionToolbar();
        hideImageToolbar();
        hideAudioToolbar();
        showLinkToolbar(el);
        syncLinkToolbarFromSelection();
    } else if (el.classList.contains('image-item')) {
        hideTextToolbar();
        hideLinkToolbar();
        hideAudioToolbar();
        hideElementActionToolbar();
        showImageToolbar(el);
    } else if (el.classList.contains('audio-item')) {
        hideTextToolbar();
        hideLinkToolbar();
        hideImageToolbar();
        hideVideoToolbar();
        hideElementActionToolbar();
        showAudioToolbar(el);
    } else if (el.classList.contains('video-item')) {
        hideTextToolbar();
        hideLinkToolbar();
        hideImageToolbar();
        hideAudioToolbar();
        hideElementActionToolbar();
        showVideoToolbar(el);
    } else {
        hideTextToolbar();
        hideLinkToolbar();
        hideImageToolbar();
        hideAudioToolbar();
        hideVideoToolbar();
        showElementActionToolbar(el);
    }
}

function showAudioToolbar(el) {
    const toolbar = document.getElementById('audio-formatting-toolbar');
    const rotateBtn = document.getElementById('text-rotate-btn');
    if (toolbar) toolbar.classList.remove('hidden');
    if (rotateBtn) rotateBtn.classList.remove('hidden');
    positionAudioToolbar();
    closeAllTextToolbarMenus();
}

function hideAudioToolbar() {
    const toolbar = document.getElementById('audio-formatting-toolbar');
    if (toolbar) toolbar.classList.add('hidden');
}

function positionAudioToolbar() {
    const toolbar = document.getElementById('audio-formatting-toolbar');
    const rotateBtn = document.getElementById('text-rotate-btn');
    if (!currentSelectedElement || !toolbar || toolbar.classList.contains('hidden')) return;

    const rect = currentSelectedElement.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const toolbarH = 36;
    const gap = 12;

    let top;
    if (rect.top - toolbarH - gap < 8) {
        top = rect.bottom + gap;
    } else {
        top = rect.top - toolbarH - gap;
    }

    toolbar.style.top = top + 'px';
    toolbar.style.left = cx + 'px';

    if (rotateBtn) {
        rotateBtn.style.left = cx + 'px';
        rotateBtn.style.top = (rect.bottom + 12) + 'px';
    }
}


function showElementActionToolbar(el) {
    const toolbar = document.getElementById('element-action-toolbar');
    const rotateBtn = document.getElementById('element-rotate-btn');
    toolbar.classList.remove('hidden');
    rotateBtn.classList.remove('hidden');
    positionElementActionToolbar(el);
}

function hideElementActionToolbar() {
    document.getElementById('element-action-toolbar').classList.add('hidden');
    document.getElementById('element-rotate-btn').classList.add('hidden');
}

function positionElementActionToolbar(el) {
    const toolbar = document.getElementById('element-action-toolbar');
    const rotateBtn = document.getElementById('element-rotate-btn');
    if (!el || toolbar.classList.contains('hidden')) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    toolbar.style.left = cx + 'px';
    toolbar.style.top = (rect.top - 58) + 'px';
    rotateBtn.style.left = cx + 'px';
    rotateBtn.style.top = (rect.bottom + 14) + 'px';
}

function updateToolbarPosition() {
    if (!currentSelectedElement) return;
    if (currentSelectedElement.classList.contains('text-item')) {
        positionTextToolbar();
    } else if (currentSelectedElement.classList.contains('link-item')) {
        positionLinkToolbar();
    } else {
        positionElementActionToolbar(currentSelectedElement);
    }
}
/**
 * --- Link Toolbar Management ---
 */
function showLinkToolbar(el) {
    const toolbar = document.getElementById('link-formatting-toolbar');
    const rotateBtn = document.getElementById('text-rotate-btn'); 
    if (toolbar) toolbar.classList.remove('hidden');
    if (rotateBtn) rotateBtn.classList.remove('hidden');
    positionLinkToolbar();
    closeAllTextToolbarMenus();
}

function hideLinkToolbar() {
    const toolbar = document.getElementById('link-formatting-toolbar');
    if (toolbar) toolbar.classList.add('hidden');
}

function positionLinkToolbar() {
    const toolbar = document.getElementById('link-formatting-toolbar');
    const rotateBtn = document.getElementById('text-rotate-btn');
    if (!currentSelectedElement || !toolbar || toolbar.classList.contains('hidden')) return;

    const rect = currentSelectedElement.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const toolbarH = 36;
    const gap = 12;

    let top;
    if (rect.top - toolbarH - gap < 8) {
        top = rect.bottom + gap;
    } else {
        top = rect.top - toolbarH - gap;
    }

    toolbar.style.top = top + 'px';
    toolbar.style.left = cx + 'px';

    if (rotateBtn) {
        rotateBtn.style.left = cx + 'px';
        rotateBtn.style.top = (rect.bottom + 12) + 'px';
    }
}

function showImageToolbar(el) {
    const toolbar = document.getElementById('image-formatting-toolbar');
    const rotateBtn = document.getElementById('text-rotate-btn');
    if (toolbar) toolbar.classList.remove('hidden');
    if (rotateBtn) rotateBtn.classList.remove('hidden');
    positionImageToolbar();
    closeAllTextToolbarMenus();
}

function hideImageToolbar() {
    const toolbar = document.getElementById('image-formatting-toolbar');
    if (toolbar) toolbar.classList.add('hidden');
}

function positionImageToolbar() {
    const toolbar = document.getElementById('image-formatting-toolbar');
    const rotateBtn = document.getElementById('text-rotate-btn');
    if (!currentSelectedElement || !toolbar || toolbar.classList.contains('hidden')) return;

    const rect = currentSelectedElement.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const toolbarH = 36;
    const gap = 12;

    let top;
    if (rect.top - toolbarH - gap < 8) {
        top = rect.bottom + gap;
    } else {
        top = rect.top - toolbarH - gap;
    }

    toolbar.style.top = top + 'px';
    toolbar.style.left = cx + 'px';

    if (rotateBtn) {
        rotateBtn.style.left = cx + 'px';
        rotateBtn.style.top = (rect.bottom + 12) + 'px';
    }
}

function syncLinkToolbarFromSelection() {
    if (!currentSelectedElement || !currentSelectedElement.classList.contains('link-item')) return;
    
    const bgColor = currentSelectedElement.style.backgroundColor || getComputedStyle(currentSelectedElement).backgroundColor;
    const textColor = currentSelectedElement.style.color || getComputedStyle(currentSelectedElement).color;
    const fontSize = currentSelectedElement.getAttribute('data-font-size') || 16;
    
    const boxBtn = document.getElementById('link-box-color-btn');
    const textBtn = document.getElementById('link-text-color-btn');
    const fontSizeDisplay = document.getElementById('link-font-size-display');
    
    if (boxBtn) boxBtn.style.backgroundColor = bgColor;
    if (textBtn) textBtn.style.backgroundColor = textColor;
    if (fontSizeDisplay) fontSizeDisplay.textContent = fontSize;
}

function positionTextToolbar() {
    const toolbar = document.getElementById('text-formatting-toolbar');
    const rotateBtn = document.getElementById('text-rotate-btn');
    if (!currentSelectedElement || toolbar.classList.contains('hidden')) return;

    const rect = currentSelectedElement.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const toolbarH = 36;
    const gap = 10;  // offset so it never overlaps text

    // Smart position: above by default, flip below if too close to top
    let top;
    if (rect.top - toolbarH - gap < 8) {
        // Not enough room above — place below
        top = rect.bottom + gap;
    } else {
        top = rect.top - toolbarH - gap;
    }

    toolbar.style.top = top + 'px';
    toolbar.style.left = cx + 'px';

    // Rotate button below text
    if (rotateBtn) {
        rotateBtn.style.left = cx + 'px';
        rotateBtn.style.top = (rect.bottom + 12) + 'px';
    }
}


function showTextToolbar(el) {
    const toolbar = document.getElementById('text-formatting-toolbar');
    const rotateBtn = document.getElementById('text-rotate-btn');
    toolbar.classList.remove('hidden');
    rotateBtn.classList.remove('hidden');
    positionTextToolbar();

    // Close any open dropdowns / palettes / layers
    closeAllTextToolbarMenus();
    hideLinkToolbar();
}

function hideTextToolbar() {
    document.getElementById('text-formatting-toolbar').classList.add('hidden');
    document.getElementById('text-rotate-btn').classList.add('hidden');
}

function closeAllTextToolbarMenus() {
    document.querySelectorAll('.txt-dd-list').forEach(l => l.classList.add('hidden'));
    const cp = document.getElementById('txt-color-popup');
    if (cp) cp.classList.add('hidden');
    const cb = document.getElementById('toolbar-color-btn');
    if (cb) cb.setAttribute('aria-expanded', 'false');
    const lm = document.getElementById('layers-menu');
    if (lm) lm.classList.add('hidden');
}

/**
 * Generic Color Picker System
 * Can be triggered by different buttons (Text Color, Box Color)
 * and applies to different targets (currentSelectedElement style properties).
 */
let activeColorPickerTrigger = null; // The button that opened the picker

function initColorPickerSystem() {
    const popup = document.getElementById('txt-color-popup');
    const sv = document.getElementById('txt-color-sv');
    const ind = document.getElementById('txt-color-sv-indicator');
    const hueInput = document.getElementById('txt-color-hue');
    const preview = document.getElementById('txt-color-preview');
    const hexInput = document.getElementById('txt-color-hex');
    const eye = document.getElementById('txt-color-eyedropper');
    if (!popup || !sv || !ind || !hueInput || !preview || !hexInput || !eye) return;

    let pickerH = 28;
    let pickerS = 0.35;
    let pickerV = 0.45;

    function applyRgbToSelected(rgb) {
        if (!currentSelectedElement || !activeColorPickerTrigger) return;
        const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
        
        // Determine target based on trigger button ID
        const tid = activeColorPickerTrigger.id;
        if (tid === 'toolbar-color-btn') {
            // Text color (Text element)
            currentSelectedElement.querySelector('.editable-text').style.color = hex;
        } else if (tid === 'link-text-color-btn') {
            // Text/Icon color (Link element)
            currentSelectedElement.style.color = hex;
        } else if (tid === 'link-box-color-btn') {
            // Background color (Link element)
            currentSelectedElement.style.background = hex;
        }

        activeColorPickerTrigger.style.backgroundColor = hex;
        preview.style.backgroundColor = hex;
        hexInput.value = hex;
    }

    function updateSvGradients() {
        sv.style.backgroundImage =
            `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${pickerH}, 100%, 50%))`;
    }

    function syncUIFromHsv() {
        const rgb = hsvToRgb(pickerH, pickerS, pickerV);
        updateSvGradients();
        ind.style.left = `${pickerS * 100}%`;
        ind.style.top = `${(1 - pickerV) * 100}%`;
        applyRgbToSelected(rgb);
    }

    function positionColorPopup(btn) {
        const container = document.getElementById('editor-canvas-container');
        if (!popup || !container || !btn) return;
        const btnRect = btn.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const popupWidth = 200; 

        // Align left of picker with left of button
        let left = btnRect.left - containerRect.left;
        let top = btnRect.bottom - containerRect.top + 0; // No gap

        // If it would overflow right edge of container, align right edge of picker with right edge of container
        if (left + popupWidth > containerRect.width - 15) {
            left = containerRect.width - popupWidth - 15;
        }
        
        // If it would overflow left edge (sidebar), shift right
        if (left < 5) {
            left = 5;
        }

        popup.style.left = left + 'px';
        popup.style.top = top + 'px';
    }

    function openFromTrigger(btn) {
        activeColorPickerTrigger = btn;
        positionColorPopup(btn);
        let currentColor = '#000000';
        
        // Get current color from the target
        if (btn.id === 'toolbar-color-btn') {
            const tn = currentSelectedElement.querySelector('.editable-text');
            currentColor = tn.style.color || getComputedStyle(tn).color;
        } else if (btn.id === 'link-text-color-btn') {
            currentColor = currentSelectedElement.style.color || getComputedStyle(currentSelectedElement).color;
        } else if (btn.id === 'link-box-color-btn') {
            currentColor = currentSelectedElement.style.backgroundColor || getComputedStyle(currentSelectedElement).backgroundColor;
        }

        const rgb = parseColorToRgb(currentColor);
        const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
        pickerH = hsv.h;
        pickerS = hsv.s;
        pickerV = hsv.v;
        hueInput.value = String(Math.round(pickerH));
        updateSvGradients();
        ind.style.left = `${pickerS * 100}%`;
        ind.style.top = `${(1 - pickerV) * 100}%`;
        const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
        preview.style.backgroundColor = hex;
        hexInput.value = hex;
    }

    // Attach to all color buttons
    const colorTriggers = ['toolbar-color-btn', 'link-text-color-btn', 'link-box-color-btn'];
    colorTriggers.forEach(id => {
        const btn = document.getElementById(id);
        if (!btn) return;
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const willOpen = popup.classList.contains('hidden') || activeColorPickerTrigger !== btn;
            closeAllTextToolbarMenus();
            if (willOpen) {
                popup.classList.remove('hidden');
                btn.setAttribute('aria-expanded', 'true');
                openFromTrigger(btn);
            }
        });
    });

    function setSvFromPointer(clientX, clientY) {
        const rect = sv.getBoundingClientRect();
        if (rect.width < 1 || rect.height < 1) return;
        pickerS = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        pickerV = Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height));
        syncUIFromHsv();
    }

    sv.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        sv.setPointerCapture(e.pointerId);
        setSvFromPointer(e.clientX, e.clientY);
    });
    sv.addEventListener('pointermove', (e) => {
        if (!sv.hasPointerCapture(e.pointerId)) return;
        setSvFromPointer(e.clientX, e.clientY);
    });
    sv.addEventListener('pointerup', (e) => {
        try {
            sv.releasePointerCapture(e.pointerId);
        } catch (_) { /* noop */ }
    });
    sv.addEventListener('pointercancel', (e) => {
        try {
            sv.releasePointerCapture(e.pointerId);
        } catch (_) { /* noop */ }
    });

    hueInput.addEventListener('input', () => {
        pickerH = parseFloat(hueInput.value) || 0;
        syncUIFromHsv();
    });

    hueInput.addEventListener('keydown', (e) => e.stopPropagation());

    hexInput.addEventListener('input', () => {
        let v = hexInput.value.trim();
        if (!v.startsWith('#')) v = '#' + v.replace(/^#/, '');
        if (!/^#[0-9A-Fa-f]{6}$/.test(v)) return;
        const rgb = parseColorToRgb(v);
        const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
        pickerH = hsv.h;
        pickerS = hsv.s;
        pickerV = hsv.v;
        hueInput.value = String(Math.round(pickerH));
        updateSvGradients();
        ind.style.left = `${pickerS * 100}%`;
        ind.style.top = `${(1 - pickerV) * 100}%`;
        applyRgbToSelected(rgb);
    });

    hexInput.addEventListener('keydown', (e) => e.stopPropagation());

    eye.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!window.EyeDropper) return;
        try {
            const res = await new EyeDropper().open();
            const rgb = parseColorToRgb(res.sRGBHex);
            const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
            pickerH = hsv.h;
            pickerS = hsv.s;
            pickerV = hsv.v;
            hueInput.value = String(Math.round(pickerH));
            updateSvGradients();
            ind.style.left = `${pickerS * 100}%`;
            ind.style.top = `${(1 - pickerV) * 100}%`;
            applyRgbToSelected(rgb);
        } catch (_) { /* user cancelled */ }
    });

    if (!window.EyeDropper) {
        eye.style.opacity = '0.4';
        eye.disabled = true;
        eye.title = 'Eyedropper not supported in this browser';
    }

    popup.addEventListener('mousedown', (e) => e.stopPropagation());
    popup.addEventListener('click', (e) => e.stopPropagation());
}

function initTextToolbar() {
    document.querySelectorAll('.txt-dd-trigger').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const list = btn.nextElementSibling;
            document.querySelectorAll('.txt-dd-list').forEach(l => {
                if (l !== list) l.classList.add('hidden');
            });
            const cp = document.getElementById('txt-color-popup');
            if (cp) cp.classList.add('hidden');
            const tcb = document.getElementById('toolbar-color-btn');
            if (tcb) tcb.setAttribute('aria-expanded', 'false');
            document.getElementById('layers-menu')?.classList.add('hidden');
            list.classList.toggle('hidden');
        });
    });

    const alignBtn = document.getElementById('align-btn');
    if (alignBtn) {
        alignBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            cycleTextAlignment();
        });
    }

    // initTxtColorPicker(); // Removed: now handled by initColorPickerSystem() in initEditor

    // --- Font family select ---
    document.querySelectorAll('#font-family-list li').forEach(li => {
        li.addEventListener('click', () => {
            if (currentSelectedElement && currentSelectedElement.classList.contains('text-item')) {
                const font = li.getAttribute('data-value');
                currentSelectedElement.querySelector('.editable-text').style.fontFamily = font;
                document.getElementById('font-family-display').textContent = li.textContent;
            }
            li.parentElement.classList.add('hidden');
        });
    });

    // --- Font size select ---
    document.querySelectorAll('#font-size-list li').forEach(li => {
        li.addEventListener('click', () => {
            if (currentSelectedElement && currentSelectedElement.classList.contains('text-item')) {
                const size = li.getAttribute('data-value');
                currentSelectedElement.querySelector('.editable-text').style.fontSize = size + 'px';
                document.getElementById('font-size-display').textContent = size;
            }
            li.parentElement.classList.add('hidden');
        });
    });

    // --- Format buttons (bold) ---
    document.querySelectorAll('.format-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!currentSelectedElement || !currentSelectedElement.classList.contains('text-item')) return;
            const format = btn.getAttribute('data-format');
            const textNode = currentSelectedElement.querySelector('.editable-text');
            if (format === 'bold') {
                const isBold = textNode.style.fontWeight === 'bold' || textNode.style.fontWeight === '700';
                textNode.style.fontWeight = isBold ? 'normal' : 'bold';
                btn.classList.toggle('active', !isBold);
            }
        });
    });

    // --- Layers dropdown ---
    const layersToggle = document.getElementById('layers-toggle-btn');
    const layersMenu = document.getElementById('layers-menu');

    if (layersToggle && layersMenu) {
        layersToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.txt-dd-list').forEach(l => l.classList.add('hidden'));
            const cp = document.getElementById('txt-color-popup');
            if (cp) cp.classList.add('hidden');
            const tcb = document.getElementById('toolbar-color-btn');
            if (tcb) tcb.setAttribute('aria-expanded', 'false');
            layersMenu.classList.toggle('hidden');
        });
    }

    document.querySelectorAll('.txt-layers-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!currentSelectedElement) { layersMenu?.classList.add('hidden'); return; }

            const paper = document.getElementById('letter-paper');
            const allDraggables = Array.from(paper.querySelectorAll('.draggable'));
            const action = item.getAttribute('data-layer');

            if (action === 'front') {
                // Find highest z-index among siblings and go above it
                let maxZ = 0;
                allDraggables.forEach(el => {
                    const z = parseInt(el.style.zIndex || 10);
                    if (z > maxZ) maxZ = z;
                });
                currentSelectedElement.style.zIndex = maxZ + 1;
            }
            if (action === 'back') {
                // Find lowest z-index among siblings and go below it
                let minZ = Infinity;
                allDraggables.forEach(el => {
                    const z = parseInt(el.style.zIndex || 10);
                    if (z < minZ) minZ = z;
                });
                currentSelectedElement.style.zIndex = Math.max(1, minZ - 1);
            }

            layersMenu?.classList.add('hidden');
        });
    });

    // --- Action buttons (duplicate, delete) ---
    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!currentSelectedElement) return;
            const action = btn.getAttribute('data-action');

            if (action === 'duplicate') {
                const clone = currentSelectedElement.cloneNode(true);
                clone.removeAttribute('data-interact-bound');
                const overlay = clone.querySelector('.selection-overlay');
                if (overlay) overlay.remove();
                clone.classList.remove('selected');

                const x = (parseFloat(clone.getAttribute('data-x')) || 0) + 20;
                const y = (parseFloat(clone.getAttribute('data-y')) || 0) + 20;
                const angle = clone.getAttribute('data-angle');

                clone.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;
                clone.setAttribute('data-x', x);
                clone.setAttribute('data-y', y);

                document.getElementById('letter-paper').appendChild(clone);
                bindElementInteractions(clone);
                selectElement(clone);
            }
            if (action === 'delete') {
                currentSelectedElement.remove();
                currentSelectedElement = null;
                hideTextToolbar();
            }
        });
    });

    // --- Text rotate button drag-to-rotate ---
    const txtRotateBtn = document.getElementById('text-rotate-btn');
    txtRotateBtn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const el = currentSelectedElement;
        if (!el) return;
        setEditorNativeSelectSuppressed(true);
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const onMouseMove = (moveEvent) => {
            const dx = moveEvent.clientX - centerX;
            const dy = moveEvent.clientY - centerY;
            let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
            const x = parseFloat(el.getAttribute('data-x')) || 0;
            const y = parseFloat(el.getAttribute('data-y')) || 0;
            el.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;
            el.setAttribute('data-angle', angle);
            updateToolbarPosition();
        };
        const onMouseUp = () => {
            setEditorNativeSelectSuppressed(false);
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.txt-dropdown') && !e.target.closest('.color-picker-wrapper') && !e.target.closest('.txt-layers-wrap')) {
            closeAllTextToolbarMenus();
        }
    });
}

function bindElementInteractions(wrapper) {
    const existingText = wrapper.querySelector('.editable-text');
    if (existingText) {
        existingText.contentEditable = 'false';
        existingText.classList.remove('is-editing');
        wrapper.classList.remove('is-text-editing');
        if (!existingText.getAttribute('data-placeholder')) {
            existingText.setAttribute('data-placeholder', TEXT_DEFAULT_PLACEHOLDER);
        }
        syncTextEmptyState(existingText);
    }

    // Text hitbox: invisible padded area for easy dragging tiny text
    if (wrapper.classList.contains('text-item')) {
        let hit = wrapper.querySelector('.text-drag-hitbox');
        if (!hit) {
            hit = document.createElement('div');
            hit.className = 'text-drag-hitbox';
            hit.setAttribute('aria-hidden', 'true');
            // Insert behind the text node so text stays visually unchanged
            wrapper.insertBefore(hit, wrapper.firstChild);
        }

        // Double click anywhere on the text object enters edit mode
        wrapper.addEventListener('dblclick', (e) => {
            if (wrapper.classList.contains('is-text-editing')) return;
        const uiChrome = e.target.closest?.(
            '#text-formatting-toolbar, #text-rotate-btn, .txt-toolbar, #txt-color-popup, .txt-color-popup, .txt-dd-list, .txt-layers-menu'
        );
            if (uiChrome) return;
            e.preventDefault();
            e.stopPropagation();
            enterTextEditMode(wrapper);
        });
    }

    wrapper.addEventListener('mousedown', () => selectElement(wrapper));

    const textNode = wrapper.querySelector('.editable-text');
    if (textNode) {
        textNode.addEventListener('dblclick', (e) => {
            e.preventDefault();
            e.stopPropagation();
            enterTextEditMode(wrapper);
        });
        textNode.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                exitTextEditMode(wrapper);
            }
        });
        textNode.addEventListener('input', () => {
            syncTextEmptyState(textNode);
            updateToolbarPosition();
        });
    }

    let rotateHandle = wrapper.querySelector('.rotate-handle');
    if (!rotateHandle) {
        rotateHandle = document.createElement('div');
        rotateHandle.className = 'rotate-handle';
        wrapper.appendChild(rotateHandle);
    }

    let isRotating = false;

    rotateHandle.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        isRotating = true;
        setEditorNativeSelectSuppressed(true);
        const rect = wrapper.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const onMouseMove = (moveEvent) => {
            if (!isRotating) return;
            const dx = moveEvent.clientX - centerX;
            const dy = moveEvent.clientY - centerY;
            let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;

            const x = parseFloat(wrapper.getAttribute('data-x')) || 0;
            const y = parseFloat(wrapper.getAttribute('data-y')) || 0;

            wrapper.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;
            wrapper.setAttribute('data-angle', angle);
        };

        const onMouseUp = () => {
            isRotating = false;
            setEditorNativeSelectSuppressed(false);
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });

    attachInteractToDraggable(wrapper);
}

function addStickerToCanvas(imgSrc, x=null, y=null, w=null, h=null, angle=null) {
    const paper = document.getElementById('letter-paper');
    if (!paper) return;

    const paperRect = paper.getBoundingClientRect();
    const stickerSize = 120;
    
    // Default to center if no coords provided
    if (x === null) x = Math.max(10, (paperRect.width / 2) - (stickerSize / 2));
    if (y === null) y = Math.max(10, (paperRect.height / 2) - (stickerSize / 2));
    if (angle === null) angle = Math.floor(Math.random() * 10) - 5;
    if (w === null) w = stickerSize + 'px';
    if (h === null) h = stickerSize + 'px';

    const wrapper = document.createElement('div');
    wrapper.className = 'draggable sticker-item selected';
    wrapper.setAttribute('data-type', 'sticker');
    wrapper.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;
    wrapper.style.width = w;
    wrapper.style.height = h;
    wrapper.style.zIndex = 10;
    wrapper.setAttribute('data-x', x);
    wrapper.setAttribute('data-y', y);
    wrapper.setAttribute('data-angle', angle);

    const img = document.createElement('img');
    img.src = imgSrc;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'contain';
    img.style.pointerEvents = 'none';
    img.draggable = false;

    wrapper.appendChild(img);
    paper.appendChild(wrapper);
    bindElementInteractions(wrapper);
    selectElement(wrapper);
}

function addPhotocardToCanvas(imgSrc, x=100, y=100, w='auto', h='auto', angle=null) {
    const paper = document.getElementById('letter-paper');
    if (!paper) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'draggable photocard-item selected';
    wrapper.setAttribute('data-type', 'image');
    
    angle = angle === null ? Math.floor(Math.random() * 10) - 5 : angle;
    wrapper.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;
    wrapper.style.width = w;
    wrapper.style.height = h;
    wrapper.style.zIndex = 10;
    
    wrapper.setAttribute('data-x', x);
    wrapper.setAttribute('data-y', y);
    wrapper.setAttribute('data-angle', angle);

    const img = document.createElement('img');
    img.src = imgSrc;

    wrapper.appendChild(img);
    paper.appendChild(wrapper);
    bindElementInteractions(wrapper);
    selectElement(wrapper);
}

function addTextToCanvas(text, x=150, y=150, w='auto', h='auto', angle=0, styleString='') {
    const paper = document.getElementById('letter-paper');
    if (!paper) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'draggable text-item selected';
    wrapper.setAttribute('data-type', 'text');
    
    wrapper.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;
    if (w && w !== 'auto') wrapper.style.width = w;
    if (h && h !== 'auto') wrapper.style.height = h;
    wrapper.style.zIndex = 10;
    
    wrapper.setAttribute('data-x', x);
    wrapper.setAttribute('data-y', y);
    wrapper.setAttribute('data-angle', angle);

    const content = document.createElement('div');
    content.className = 'editable-text';
    content.contentEditable = 'false';
    content.setAttribute('data-placeholder', TEXT_DEFAULT_PLACEHOLDER);
    content.textContent = text || '';
    if (styleString) content.style.cssText = styleString;
    syncTextEmptyState(content);

    wrapper.appendChild(content);
    paper.appendChild(wrapper);
    bindElementInteractions(wrapper);
    selectElement(wrapper);
}

// Serialization
function serializeCanvas() {
    const paper = document.getElementById('letter-paper');
    if (!paper) return [];

    const elements = [];
    paper.querySelectorAll('.draggable').forEach(el => {
        let type = 'element';
        if (el.classList.contains('text-item')) type = 'text';
        else if (el.classList.contains('link-item')) type = 'link';
        else if (el.classList.contains('image-item')) type = 'image';
        else if (el.classList.contains('audio-item')) type = 'audio';
        else if (el.classList.contains('video-item')) type = 'video';

        const item = {
            type: type,
            x: parseFloat(el.getAttribute('data-x')) || 0,
            y: parseFloat(el.getAttribute('data-y')) || 0,
            angle: parseFloat(el.getAttribute('data-angle')) || 0,
            zIndex: el.style.zIndex || 10
        };

        if (type === 'text') {
            const textNode = el.querySelector('.editable-text');
            item.content = textNode.innerHTML;
            item.fontSize = textNode.style.fontSize;
            item.fontFamily = textNode.style.fontFamily;
            item.color = textNode.style.color;
            item.fontWeight = textNode.style.fontWeight;
            item.textAlign = textNode.style.textAlign;
        } else if (type === 'link') {
            item.url = el.getAttribute('data-url');
            item.label = el.querySelector('.link-label').textContent;
            item.fontSize = el.getAttribute('data-font-size');
            item.bgColor = el.style.backgroundColor;
            item.textColor = el.style.color;
        } else if (type === 'image') {
            item.src = el.getAttribute('data-src');
            item.width = parseFloat(el.style.width);
            item.height = parseFloat(el.style.height);
            // Save crop transform
            const img = el.querySelector('img');
            if (img) {
                item.cropX = parseFloat(img.getAttribute('data-crop-x')) || 0;
                item.cropY = parseFloat(img.getAttribute('data-crop-y')) || 0;
            }
        } else if (type === 'audio') {
            item.src = el.getAttribute('data-src');
            item.width = parseFloat(el.style.width);
            item.height = parseFloat(el.style.height);
            item.duration = el.getAttribute('data-duration');
        } else if (type === 'video') {
            item.src = el.getAttribute('data-src');
            item.width = parseFloat(el.style.width);
            item.height = parseFloat(el.style.height);
        }

        elements.push(item);
    });
    return elements;
}

function deserializeCanvas(elements) {
    if (!elements || !Array.isArray(elements)) return;
    const paper = document.getElementById('letter-paper');
    if (!paper) return;
    paper.innerHTML = '';

    elements.forEach(item => {
        if (item.type === 'text') {
            addTextToCanvas(item.content, item.x, item.y, item.angle, item.fontSize, item.fontFamily, item.color, item.fontWeight, item.textAlign, item.zIndex);
        } else if (item.type === 'link') {
            addLinkToCanvas(item.url, item.label, item.x, item.y, item.angle, item.bgColor, item.textColor, item.zIndex, item.fontSize);
        } else if (item.type === 'image') {
            addImageToCanvas(item.src, item.x, item.y, item.width, item.height, item.angle, item.zIndex, item.cropX, item.cropY);
        } else if (item.type === 'audio') {
            addAudioToCanvas(item.src, item.duration, item.x, item.y, item.width, item.height, item.angle, item.zIndex);
        } else if (item.type === 'video') {
            addVideoToCanvas(item.src, item.x, item.y, item.width, item.height, item.angle, item.zIndex);
        }
    });

    // Deselect all
    document.querySelectorAll('.draggable').forEach(item => {
        item.classList.remove('selected');
        item.querySelector('.selection-overlay')?.remove();
    });
    currentSelectedElement = null;
    hideTextToolbar();
    hideLinkToolbar();
    hideImageToolbar();
    hideAudioToolbar();
    hideVideoToolbar();
    hideElementActionToolbar();
}
