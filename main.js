document.addEventListener('DOMContentLoaded', () => {
    // Application State
    const appState = {
        for: '',
        from: '',
        note: '',
        letters: [],
        currentLetterId: null
    };

    // Load state from local storage
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

        // Pre-fill
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
        // Enforce state
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
                    content: [],
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

        document.getElementById('btn-back-collection').addEventListener('click', () => {
            window.location.href = 'collection.html';
        });

        // Initialize editor logic
        initEditor(currentLetter);
    }
});

// --- EDITOR LOGIC ---
function initEditor(letterData) {
    const photocardToggle = document.getElementById('toggle-photocard');
    const photocardUploadArea = document.getElementById('photocard-upload-area');
    const photocardInput = document.getElementById('photocard-input');
    const btnUploadPhotocard = document.getElementById('btn-upload-photocard');
    
    const bgInput = document.getElementById('bg-input');
    const btnAddBg = document.getElementById('btn-add-bg');

    const paper = document.getElementById('letter-paper');

    // Add Text Element
    const textBtns = document.querySelectorAll('.element-btn');
    textBtns.forEach(btn => {
        if(btn.textContent.includes('TEXT')) {
            btn.addEventListener('click', () => {
                addTextToCanvas("Type something...");
            });
        }
    });

    // Photocard Toggle
    if (photocardToggle) {
        photocardToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                photocardUploadArea.classList.remove('hidden');
            } else {
                photocardUploadArea.classList.add('hidden');
            }
        });
    }

    // Photocard Upload
    if (btnUploadPhotocard && photocardInput) {
        btnUploadPhotocard.addEventListener('click', () => {
            photocardInput.click();
        });

        photocardInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    addPhotocardToCanvas(e.target.result);
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Background Upload
    if (btnAddBg && bgInput) {
        btnAddBg.addEventListener('click', () => {
            bgInput.click();
        });

        bgInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    document.getElementById('editor-canvas-container').style.backgroundImage = `url(${e.target.result})`;
                    document.getElementById('editor-canvas-container').style.backgroundSize = 'cover';
                    document.getElementById('editor-canvas-container').style.backgroundPosition = 'center';
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Background Swatches
    const swatches = document.querySelectorAll('.bg-swatch:not(.add-bg)');
    swatches.forEach(swatch => {
        swatch.addEventListener('click', (e) => {
            // Apply color/image from swatch
            const bg = getComputedStyle(e.target).backgroundColor;
            document.getElementById('editor-canvas-container').style.backgroundImage = 'none';
            document.getElementById('editor-canvas-container').style.backgroundColor = bg;
        });
    });

    // interact.js logic for draggable elements
    if (typeof interact !== 'undefined') {
        interact('.draggable')
            .draggable({
                inertia: true,
                modifiers: [
                    interact.modifiers.restrictRect({
                        restriction: 'parent',
                        endOnly: true
                    })
                ],
                autoScroll: true,
                listeners: {
                    move: dragMoveListener,
                }
            })
            .resizable({
                edges: { left: true, right: true, bottom: true, top: true },
                modifiers: [
                    interact.modifiers.restrictEdges({ outer: 'parent' }),
                    interact.modifiers.restrictSize({ min: { width: 50, height: 50 } })
                ],
                inertia: true,
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
                    }
                }
            });

        // Add a simple rotation logic (Ctrl+Drag or similar in full implementation, but for now we apply default rotations on creation)
    }

    // Deselect elements when clicking canvas
    document.getElementById('editor-canvas-container').addEventListener('mousedown', (e) => {
        if(e.target.id === 'editor-canvas-container' || e.target.id === 'letter-paper' || e.target.id === 'editor-canvas-wrapper') {
            document.querySelectorAll('.draggable').forEach(el => el.classList.remove('selected'));
        }
    });
}

function dragMoveListener(event) {
    var target = event.target;
    var x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
    var y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
    var angle = (parseFloat(target.getAttribute('data-angle')) || 0);

    target.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;

    target.setAttribute('data-x', x);
    target.setAttribute('data-y', y);
}

function selectElement(el) {
    document.querySelectorAll('.draggable').forEach(item => item.classList.remove('selected'));
    el.classList.add('selected');
}

function addPhotocardToCanvas(imgSrc) {
    const paper = document.getElementById('letter-paper');
    if (!paper) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'draggable photocard-item selected';
    
    // random slight rotation
    const angle = Math.floor(Math.random() * 10) - 5;
    wrapper.style.transform = `translate(100px, 100px) rotate(${angle}deg)`;
    wrapper.setAttribute('data-x', '100');
    wrapper.setAttribute('data-y', '100');
    wrapper.setAttribute('data-angle', angle);

    wrapper.addEventListener('mousedown', () => selectElement(wrapper));

    const img = document.createElement('img');
    img.src = imgSrc;

    wrapper.appendChild(img);
    paper.appendChild(wrapper);
}

function addTextToCanvas(text) {
    const paper = document.getElementById('letter-paper');
    if (!paper) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'draggable text-item selected';
    wrapper.style.transform = `translate(50px, 50px) rotate(0deg)`;
    wrapper.setAttribute('data-x', '50');
    wrapper.setAttribute('data-y', '50');
    wrapper.setAttribute('data-angle', '0');

    wrapper.addEventListener('mousedown', () => selectElement(wrapper));

    const content = document.createElement('div');
    content.className = 'editable-text';
    content.contentEditable = true;
    content.textContent = text;
    
    // Don't drag while editing text
    content.addEventListener('mousedown', (e) => e.stopPropagation());

    wrapper.appendChild(content);
    paper.appendChild(wrapper);
}
