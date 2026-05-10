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

function applyCanvasTransform() {
    const wrapper = document.getElementById('editor-canvas-wrapper');
    if (wrapper) {
        wrapper.style.transform = `translate(${canvasOffsetX}px, ${canvasOffsetY}px) scale(${canvasScale})`;
        wrapper.style.transformOrigin = 'center center';
    }
}

function initCanvasControls() {
    const canvas = document.getElementById('editor-canvas-container');
    const wrapper = document.getElementById('editor-canvas-wrapper');

    // --- Mode buttons ---
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

    // --- Zoom ---
    document.getElementById('btn-zoom-in').addEventListener('click', () => {
        canvasScale = Math.min(canvasScale + 0.15, 3);
        applyCanvasTransform();
    });
    document.getElementById('btn-zoom-out').addEventListener('click', () => {
        canvasScale = Math.max(canvasScale - 0.15, 0.4);
        applyCanvasTransform();
    });

    // --- Reset view ---
    document.getElementById('btn-reset-view').addEventListener('click', () => {
        canvasScale = 1;
        canvasOffsetX = 0;
        canvasOffsetY = 0;
        applyCanvasTransform();
        setEditMode();
    });

    // --- Pan drag ---
    let panStartX = 0, panStartY = 0, panDragging = false;
    canvas.addEventListener('mousedown', (e) => {
        if (!isPanMode) return;
        if (e.target !== canvas && e.target !== wrapper && e.target.id !== 'letter-paper' && e.target.id !== 'editor-canvas-wrapper') return;
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

    // --- Scroll-wheel zoom ---
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        canvasScale = Math.min(Math.max(canvasScale + delta, 0.4), 3);
        applyCanvasTransform();
    }, { passive: false });
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
                addTextToCanvas("Type something...");
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

    // interact.js for dragging & resizing
    if (typeof interact !== 'undefined') {
        interact('.draggable')
            .draggable({
                inertia: true,
                ignoreFrom: '.rotate-handle, .editable-text',
                modifiers: [ interact.modifiers.restrictRect({ restriction: 'parent', endOnly: true }) ],
                autoScroll: true,
                listeners: { 
                    move: dragMoveListener,
                    end: updateToolbarPosition
                }
            })
            .resizable({
                edges: { left: true, right: true, bottom: true, top: true },
                modifiers: [
                    interact.modifiers.restrictEdges({ outer: 'parent' }),
                    interact.modifiers.restrictSize({ min: { width: 50, height: 30 } })
                ],
                listeners: {
                    move(event) {
                        let target = event.target;
                        let x = (parseFloat(target.getAttribute('data-x')) || 0);
                        let y = (parseFloat(target.getAttribute('data-y')) || 0);
                        let angle = (parseFloat(target.getAttribute('data-angle')) || 0);

                        target.style.width = event.rect.width + 'px';
                        target.style.height = event.rect.height + 'px';

                        x += event.deltaRect.left;
                        y += event.deltaRect.top;

                        target.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;
                        target.setAttribute('data-x', x);
                        target.setAttribute('data-y', y);
                    },
                    end: updateToolbarPosition
                }
            });
    }

    // Deselect elements when clicking outside
    document.getElementById('editor-canvas-container').addEventListener('mousedown', (e) => {
        if(e.target.id === 'editor-canvas-container' || e.target.id === 'letter-paper' || e.target.id === 'editor-canvas-wrapper') {
            document.querySelectorAll('.draggable').forEach(el => {
                el.classList.remove('selected');
                const overlay = el.querySelector('.selection-overlay');
                if (overlay) overlay.remove();
            });
            currentSelectedElement = null;
            document.getElementById('text-formatting-toolbar').classList.add('hidden');
            hideElementActionToolbar();
        }
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

        bindElementInteractions(clone);
        paper.appendChild(clone);
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
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });

    initTextToolbar();
}

function dragMoveListener(event) {
    const target = event.target;
    // Don't drag if we are dragging the rotate handle
    if(event.target.classList.contains('rotate-handle')) return;

    const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
    const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
    const angle = (parseFloat(target.getAttribute('data-angle')) || 0);

    target.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;
    target.setAttribute('data-x', x);
    target.setAttribute('data-y', y);
    updateToolbarPosition();
}

function selectElement(el) {
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
    } else {
        document.getElementById('text-formatting-toolbar').classList.add('hidden');
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
        const toolbar = document.getElementById('text-formatting-toolbar');
        if (toolbar.classList.contains('hidden')) return;
        const rect = currentSelectedElement.getBoundingClientRect();
        toolbar.style.top = (rect.top - 65) + 'px';
        toolbar.style.left = (rect.left + (rect.width / 2)) + 'px';
    } else {
        positionElementActionToolbar(currentSelectedElement);
    }
}


function showTextToolbar(el) {
    const toolbar = document.getElementById('text-formatting-toolbar');
    toolbar.classList.remove('hidden');
    updateToolbarPosition();
    
    // Update toolbar active states based on element
    const textNode = el.querySelector('.editable-text');
    if(!textNode) return;

    // Reset dropdowns
    document.querySelectorAll('.dropdown-list').forEach(l => l.classList.add('hidden'));
    document.getElementById('color-palette').classList.add('hidden');
}

function initTextToolbar() {
    // Dropdowns
    const dropdownTriggers = document.querySelectorAll('.dropdown-trigger');
    dropdownTriggers.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const list = btn.nextElementSibling;
            document.querySelectorAll('.dropdown-list, .color-palette').forEach(l => {
                if(l !== list) l.classList.add('hidden');
            });
            list.classList.toggle('hidden');
        });
    });

    // Font Family Select
    document.querySelectorAll('#font-family-list li').forEach(li => {
        li.addEventListener('click', () => {
            if(currentSelectedElement && currentSelectedElement.classList.contains('text-item')) {
                const font = li.getAttribute('data-value');
                currentSelectedElement.querySelector('.editable-text').style.fontFamily = font;
                document.getElementById('font-family-display').textContent = li.textContent;
            }
            li.parentElement.classList.add('hidden');
        });
    });

    // Font Size Select
    document.querySelectorAll('#font-size-list li').forEach(li => {
        li.addEventListener('click', () => {
            if(currentSelectedElement && currentSelectedElement.classList.contains('text-item')) {
                const size = li.getAttribute('data-value');
                currentSelectedElement.querySelector('.editable-text').style.fontSize = size + 'px';
                document.getElementById('font-size-display').textContent = size;
            }
            li.parentElement.classList.add('hidden');
        });
    });

    // Color Picker
    document.getElementById('toolbar-color-btn').addEventListener('click', () => {
        const p = document.getElementById('color-palette');
        document.querySelectorAll('.dropdown-list').forEach(l => l.classList.add('hidden'));
        p.classList.toggle('hidden');
    });

    document.querySelectorAll('.color-swatch').forEach(swatch => {
        swatch.addEventListener('click', () => {
            if(currentSelectedElement && currentSelectedElement.classList.contains('text-item')) {
                const color = swatch.getAttribute('data-color');
                currentSelectedElement.querySelector('.editable-text').style.color = color;
                document.getElementById('toolbar-color-btn').style.backgroundColor = color;
            }
            document.getElementById('color-palette').classList.add('hidden');
        });
    });

    // Formatting Buttons
    document.querySelectorAll('.format-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if(!currentSelectedElement || !currentSelectedElement.classList.contains('text-item')) return;
            const format = btn.getAttribute('data-format');
            const textNode = currentSelectedElement.querySelector('.editable-text');
            
            if(format === 'bold') {
                textNode.style.fontWeight = textNode.style.fontWeight === 'bold' ? 'normal' : 'bold';
                btn.classList.toggle('active');
            }
            if(format === 'italic') {
                textNode.style.fontStyle = textNode.style.fontStyle === 'italic' ? 'normal' : 'italic';
                btn.classList.toggle('active');
            }
            if(format === 'underline') {
                textNode.style.textDecoration = textNode.style.textDecoration === 'underline' ? 'none' : 'underline';
                btn.classList.toggle('active');
            }
            if(format.startsWith('align-')) {
                const align = format.split('-')[1];
                textNode.style.textAlign = align;
            }
        });
    });

    // Actions
    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if(!currentSelectedElement) return;
            const action = btn.getAttribute('data-action');
            
            let z = parseInt(currentSelectedElement.style.zIndex || 10);
            if(action === 'layer-up') {
                currentSelectedElement.style.zIndex = z + 1;
            }
            if(action === 'layer-down') {
                currentSelectedElement.style.zIndex = Math.max(1, z - 1);
            }
            if(action === 'duplicate') {
                const clone = currentSelectedElement.cloneNode(true);
                const x = (parseFloat(clone.getAttribute('data-x')) || 0) + 20;
                const y = (parseFloat(clone.getAttribute('data-y')) || 0) + 20;
                const angle = clone.getAttribute('data-angle');
                
                clone.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;
                clone.setAttribute('data-x', x);
                clone.setAttribute('data-y', y);
                
                bindElementInteractions(clone);
                document.getElementById('letter-paper').appendChild(clone);
                selectElement(clone);
            }
            if(action === 'delete') {
                currentSelectedElement.remove();
                currentSelectedElement = null;
                document.getElementById('text-formatting-toolbar').classList.add('hidden');
            }
        });
    });
}

function bindElementInteractions(wrapper) {
    wrapper.addEventListener('mousedown', () => selectElement(wrapper));
    
    const textNode = wrapper.querySelector('.editable-text');
    if(textNode) {
        textNode.addEventListener('mousedown', (e) => e.stopPropagation());
    }

    // Custom Rotation handle
    const rotateHandle = document.createElement('div');
    rotateHandle.className = 'rotate-handle';
    wrapper.appendChild(rotateHandle);

    let isRotating = false;
    let startAngle = 0;

    rotateHandle.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        isRotating = true;
        const rect = wrapper.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const onMouseMove = (moveEvent) => {
            if (!isRotating) return;
            const dx = moveEvent.clientX - centerX;
            const dy = moveEvent.clientY - centerY;
            // atan2 yields radians from -PI to PI, adding 90 degrees offset because handle is at the top
            let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
            
            const x = parseFloat(wrapper.getAttribute('data-x')) || 0;
            const y = parseFloat(wrapper.getAttribute('data-y')) || 0;
            
            wrapper.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;
            wrapper.setAttribute('data-angle', angle);
        };

        const onMouseUp = () => {
            isRotating = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
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
    bindElementInteractions(wrapper);
    paper.appendChild(wrapper);
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
    bindElementInteractions(wrapper);
    paper.appendChild(wrapper);
    selectElement(wrapper);
}

function addTextToCanvas(text, x=50, y=50, w='auto', h='auto', angle=0, styleString='') {
    const paper = document.getElementById('letter-paper');
    if (!paper) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'draggable text-item selected';
    wrapper.setAttribute('data-type', 'text');
    
    wrapper.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;
    wrapper.style.width = w;
    wrapper.style.height = h;
    wrapper.style.zIndex = 10;
    
    wrapper.setAttribute('data-x', x);
    wrapper.setAttribute('data-y', y);
    wrapper.setAttribute('data-angle', angle);

    const content = document.createElement('div');
    content.className = 'editable-text';
    content.contentEditable = true;
    content.textContent = text;
    if(styleString) content.style.cssText = styleString;

    wrapper.appendChild(content);
    bindElementInteractions(wrapper);
    paper.appendChild(wrapper);
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
    const toolbar = document.getElementById('text-formatting-toolbar');
    if(toolbar) toolbar.classList.add('hidden');
}
