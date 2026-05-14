// js/modules/toolbars.js
import { getCanvasInvScale } from './canvas.js';
import { parseColorToRgb, rgbToHex, rgbToHsv, hsvToRgb } from './utils.js';

export let currentSelectedElement = null;

export function setSelectedElement(el) {
    currentSelectedElement = el;
}

export function updateToolbarPosition() {
    if (!currentSelectedElement) return;
    
    const rect = currentSelectedElement.getBoundingClientRect();
    const toolbar = getActiveToolbar();
    if (!toolbar) return;

    toolbar.classList.remove('hidden');
    
    // Position toolbar above element
    const top = rect.top - toolbar.offsetHeight - 15;
    const left = rect.left + rect.width / 2;
    
    toolbar.style.top = `${Math.max(80, top)}px`;
    toolbar.style.left = `${left}px`;

    // Update rotation handle if needed
    updateRotateHandlePosition(rect);
}

function getActiveToolbar() {
    if (!currentSelectedElement) return null;
    if (currentSelectedElement.classList.contains('text-item')) return document.getElementById('text-formatting-toolbar');
    if (currentSelectedElement.classList.contains('link-item')) return document.getElementById('link-formatting-toolbar');
    if (currentSelectedElement.classList.contains('image-item')) return document.getElementById('image-formatting-toolbar');
    if (currentSelectedElement.classList.contains('audio-item')) return document.getElementById('audio-formatting-toolbar');
    if (currentSelectedElement.classList.contains('video-item')) return document.getElementById('video-formatting-toolbar');
    return document.getElementById('element-action-toolbar'); // Stickers
}

function updateRotateHandlePosition(rect) {
    const handle = document.getElementById('text-rotate-btn');
    if (!handle || handle.classList.contains('hidden')) return;
    
    handle.style.top = `${rect.bottom + 20}px`;
    handle.style.left = `${rect.left + rect.width / 2}px`;
}

export function initColorPickerSystem() {
    // This is a complex part of the original main.js. 
    // For now, I'll provide a placeholder or move the logic if I can extract it cleanly.
    // ...
}
