// js/modules/canvas.js
import { updateToolbarPosition } from './toolbars.js';

export const canvasConfig = {
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    isPanMode: false
};

export function applyCanvasTransform() {
    const wrapper = document.getElementById('editor-canvas-wrapper');
    if (wrapper) {
        wrapper.style.transform = `translate(${canvasConfig.offsetX}px, ${canvasConfig.offsetY}px) scale(${canvasConfig.scale})`;
        wrapper.style.transformOrigin = 'center center';
    }
}

export function getCanvasInvScale() {
    return 1 / (canvasConfig.scale > 0 ? canvasConfig.scale : 1);
}

export function initCanvasControls() {
    const canvas = document.getElementById('editor-canvas-container');
    const btnEdit = document.getElementById('btn-mode-edit');
    const btnPan  = document.getElementById('btn-mode-pan');

    function setEditMode() {
        canvasConfig.isPanMode = false;
        canvas.style.cursor = 'default';
        canvas.classList.remove('is-pan-mode');
        btnEdit.classList.add('active');
        btnPan.classList.remove('active');
    }
    function setPanMode() {
        canvasConfig.isPanMode = true;
        canvas.style.cursor = 'grab';
        canvas.classList.add('is-pan-mode');
        btnPan.classList.add('active');
        btnEdit.classList.remove('active');
    }
    btnEdit.addEventListener('click', setEditMode);
    btnPan.addEventListener('click', setPanMode);

    const btnZoomIn  = document.getElementById('btn-zoom-in');
    const btnZoomOut = document.getElementById('btn-zoom-out');

    const updateZoomButtons = () => {
        btnZoomOut.disabled = canvasConfig.scale <= 1;
    };

    btnZoomIn.addEventListener('click', () => {
        canvasConfig.scale = Math.min(canvasConfig.scale + 0.15, 3);
        applyCanvasTransform();
        updateZoomButtons();
    });
    btnZoomOut.addEventListener('click', () => {
        if (canvasConfig.scale <= 1) return;
        canvasConfig.scale = Math.max(canvasConfig.scale - 0.15, 1);
        applyCanvasTransform();
        updateZoomButtons();
    });

    document.getElementById('btn-reset-view').addEventListener('click', () => {
        canvasConfig.scale = 1;
        canvasConfig.offsetX = 0;
        canvasConfig.offsetY = 0;
        applyCanvasTransform();
        updateZoomButtons();
        setEditMode();
    });

    let panStartX = 0, panStartY = 0, panDragging = false;
    canvas.addEventListener('mousedown', (e) => {
        if (!canvasConfig.isPanMode) return;
        panDragging = true;
        panStartX = e.clientX - canvasConfig.offsetX;
        panStartY = e.clientY - canvasConfig.offsetY;
        canvas.style.cursor = 'grabbing';
    });
    document.addEventListener('mousemove', (e) => {
        if (!panDragging) return;
        canvasConfig.offsetX = e.clientX - panStartX;
        canvasConfig.offsetY = e.clientY - panStartY;
        applyCanvasTransform();
    });
    document.addEventListener('mouseup', () => {
        if (!panDragging) return;
        panDragging = false;
        if (canvasConfig.isPanMode) canvas.style.cursor = 'grab';
    });

    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        canvasConfig.scale = Math.min(Math.max(canvasConfig.scale + delta, 1), 3);
        applyCanvasTransform();
        updateZoomButtons();
    }, { passive: false });

    updateZoomButtons();
}

export function serializeCanvas() {
    const paper = document.getElementById('letter-paper');
    if (!paper) return [];
    const elements = [];
    paper.querySelectorAll('.draggable').forEach(el => {
        const type = el.classList.contains('text-item') ? 'text' :
                     el.classList.contains('link-item') ? 'link' :
                     el.classList.contains('image-item') ? 'image' :
                     el.classList.contains('audio-item') ? 'audio' :
                     el.classList.contains('video-item') ? 'video' : 'sticker';
        
        const data = {
            type,
            x: el.getAttribute('data-x') || '0',
            y: el.getAttribute('data-y') || '0',
            angle: el.getAttribute('data-angle') || '0',
            width: el.style.width,
            height: el.style.height,
            zIndex: el.style.zIndex || '1'
        };

        if (type === 'text') {
            const txt = el.querySelector('.editable-text');
            data.content = txt.innerHTML;
            data.color = txt.style.color;
            data.fontFamily = txt.style.fontFamily;
            data.fontSize = txt.style.fontSize;
            data.fontWeight = txt.style.fontWeight;
            data.textAlign = txt.style.textAlign;
        } else if (type === 'link') {
            data.url = el.getAttribute('data-url');
            data.label = el.querySelector('.link-label').textContent;
            data.color = el.style.color;
            data.backgroundColor = el.style.backgroundColor;
            data.fontSize = el.style.fontSize;
        } else if (type === 'image' || type === 'sticker') {
            data.src = el.querySelector('img').src;
            if (type === 'image') {
                const img = el.querySelector('img');
                data.cropX = img.getAttribute('data-crop-x');
                data.cropY = img.getAttribute('data-crop-y');
            }
        } else if (type === 'audio') {
            data.src = el.getAttribute('data-src');
            data.duration = el.getAttribute('data-duration');
        } else if (type === 'video') {
            data.src = el.querySelector('video').src;
        }

        elements.push(data);
    });
    return elements;
}
