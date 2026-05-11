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
        deserializeCanvas(currentLetter.content);
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

    target.style.width = (event.rect.width * inv) + 'px';
    target.style.height = (event.rect.height * inv) + 'px';

    x += event.deltaRect.left * inv;
    y += event.deltaRect.top * inv;

    target.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;
    target.setAttribute('data-x', x);
    target.setAttribute('data-y', y);
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
        btnEdit.classList.add('active');
        btnPan.classList.remove('active');
    }
    function setPanMode() {
        isPanMode = true;
        canvas.style.cursor = 'grab';
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
            '#text-formatting-toolbar, #text-rotate-btn, .txt-toolbar, #txt-color-popup, .txt-color-popup, .txt-dd-list, .txt-layers-menu, #align-menu'
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
        syncTextToolbarFromSelection();
    } else {
        hideTextToolbar();
        showElementActionToolbar(el);
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
    } else {
        positionElementActionToolbar(currentSelectedElement);
    }
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
    document.querySelectorAll('.txt-dd-list').forEach(l => l.classList.add('hidden'));
    const cp = document.getElementById('txt-color-popup');
    if (cp) cp.classList.add('hidden');
    const am = document.getElementById('align-menu');
    if (am) am.classList.add('hidden');
    document.getElementById('layers-menu')?.classList.add('hidden');
}

function hideTextToolbar() {
    document.getElementById('text-formatting-toolbar').classList.add('hidden');
    document.getElementById('text-rotate-btn').classList.add('hidden');
}

function closeAllTextToolbarMenus() {
    document.querySelectorAll('.txt-dd-list').forEach(l => l.classList.add('hidden'));
    const am = document.getElementById('align-menu');
    if (am) am.classList.add('hidden');
    const at = document.getElementById('align-trigger-btn');
    if (at) at.setAttribute('aria-expanded', 'false');
    const cp = document.getElementById('txt-color-popup');
    if (cp) cp.classList.add('hidden');
    const cb = document.getElementById('toolbar-color-btn');
    if (cb) cb.setAttribute('aria-expanded', 'false');
    const lm = document.getElementById('layers-menu');
    if (lm) lm.classList.add('hidden');
}

function initTxtColorPicker() {
    const popup = document.getElementById('txt-color-popup');
    const btn = document.getElementById('toolbar-color-btn');
    const sv = document.getElementById('txt-color-sv');
    const ind = document.getElementById('txt-color-sv-indicator');
    const hueInput = document.getElementById('txt-color-hue');
    const preview = document.getElementById('txt-color-preview');
    const hexInput = document.getElementById('txt-color-hex');
    const eye = document.getElementById('txt-color-eyedropper');
    if (!popup || !btn || !sv || !ind || !hueInput || !preview || !hexInput || !eye) return;

    let pickerH = 28;
    let pickerS = 0.35;
    let pickerV = 0.45;

    function applyRgbToSelected(rgb) {
        if (!currentSelectedElement || !currentSelectedElement.classList.contains('text-item')) return;
        const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
        currentSelectedElement.querySelector('.editable-text').style.color = hex;
        btn.style.backgroundColor = hex;
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

    function openFromCurrentText() {
        if (!currentSelectedElement || !currentSelectedElement.classList.contains('text-item')) return;
        const tn = currentSelectedElement.querySelector('.editable-text');
        const rgb = parseColorToRgb(tn.style.color || getComputedStyle(tn).color);
        const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
        pickerH = hsv.h;
        pickerS = hsv.s;
        pickerV = hsv.v;
        hueInput.value = String(Math.round(pickerH));
        updateSvGradients();
        ind.style.left = `${pickerS * 100}%`;
        ind.style.top = `${(1 - pickerV) * 100}%`;
        preview.style.backgroundColor = rgbToHex(rgb.r, rgb.g, rgb.b);
        hexInput.value = rgbToHex(rgb.r, rgb.g, rgb.b);
    }

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const willOpen = popup.classList.contains('hidden');
        closeAllTextToolbarMenus();
        if (willOpen) {
            popup.classList.remove('hidden');
            btn.setAttribute('aria-expanded', 'true');
            openFromCurrentText();
        }
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
            const am = document.getElementById('align-menu');
            if (am) am.classList.add('hidden');
            const cp = document.getElementById('txt-color-popup');
            if (cp) cp.classList.add('hidden');
            const tcb = document.getElementById('toolbar-color-btn');
            if (tcb) tcb.setAttribute('aria-expanded', 'false');
            document.getElementById('layers-menu')?.classList.add('hidden');
            list.classList.toggle('hidden');
        });
    });

    const alignTrigger = document.getElementById('align-trigger-btn');
    const alignMenu = document.getElementById('align-menu');
    if (alignTrigger && alignMenu) {
        alignTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const opening = alignMenu.classList.contains('hidden');
            closeAllTextToolbarMenus();
            if (opening) {
                alignMenu.classList.remove('hidden');
                alignTrigger.setAttribute('aria-expanded', 'true');
            }
        });
        alignMenu.querySelectorAll('.txt-align-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!currentSelectedElement || !currentSelectedElement.classList.contains('text-item')) return;
                const al = item.getAttribute('data-align');
                currentSelectedElement.querySelector('.editable-text').style.textAlign = al;
                setAlignToolbarIcon(al);
                alignMenu.classList.add('hidden');
                alignTrigger.setAttribute('aria-expanded', 'false');
            });
        });
    }

    initTxtColorPicker();

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
            const am = document.getElementById('align-menu');
            if (am) am.classList.add('hidden');
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
            positionTextToolbar();
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

function addStickerToCanvas(imgSrc) {
    const paper = document.getElementById('letter-paper');
    if (!paper) return;

    const paperRect = paper.getBoundingClientRect();
    const stickerSize = 120;
    // Place roughly in center of paper
    const x = Math.max(10, (paperRect.width / 2) - (stickerSize / 2));
    const y = Math.max(10, (paperRect.height / 2) - (stickerSize / 2));
    const angle = Math.floor(Math.random() * 10) - 5;

    const wrapper = document.createElement('div');
    wrapper.className = 'draggable sticker-item selected';
    wrapper.setAttribute('data-type', 'sticker');
    wrapper.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;
    wrapper.style.width = stickerSize + 'px';
    wrapper.style.height = stickerSize + 'px';
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

function addTextToCanvas(text, x=50, y=50, w='auto', h='auto', angle=0, styleString='') {
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
    if(!paper) return [];
    const elements = [];
    paper.querySelectorAll('.draggable').forEach(el => {
        const data = {
            type: el.getAttribute('data-type'),
            x: el.getAttribute('data-x'),
            y: el.getAttribute('data-y'),
            angle: el.getAttribute('data-angle'),
            width: el.style.width,
            height: el.style.height,
            zIndex: el.style.zIndex
        };
        
        if (data.type === 'text') {
            const textNode = el.querySelector('.editable-text');
            data.text = textNode.textContent;
            data.styles = textNode.style.cssText;
        } else if (data.type === 'image') {
            const imgNode = el.querySelector('img');
            data.src = imgNode.src;
        }
        elements.push(data);
    });
    return elements;
}

function deserializeCanvas(elements) {
    if(!elements || elements.length === 0) return;
    elements.forEach(el => {
        if(el.type === 'text') {
            addTextToCanvas(el.text, el.x, el.y, el.width, el.height, el.angle, el.styles);
        } else if(el.type === 'image') {
            addPhotocardToCanvas(el.src, el.x, el.y, el.width, el.height, el.angle);
        }
    });
    
    // Deselect all
    document.querySelectorAll('.draggable').forEach(item => item.classList.remove('selected'));
    currentSelectedElement = null;
    hideTextToolbar();
}
