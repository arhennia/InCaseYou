// js/modules/elements.js
import { getCanvasInvScale } from './canvas.js';
// import { attachInteractToDraggable } from './interactions.js';

export function addTextToCanvas(content = '', x = 100, y = 100) {
    const paper = document.getElementById('letter-paper');
    const wrapper = document.createElement('div');
    wrapper.className = 'draggable text-item';
    wrapper.style.transform = `translate(${x}px, ${y}px)`;
    wrapper.setAttribute('data-x', x);
    wrapper.setAttribute('data-y', y);
    
    const text = document.createElement('div');
    text.className = 'editable-text';
    text.innerHTML = content || 'double click to type';
    if (!content) text.classList.add('is-empty');
    
    wrapper.appendChild(text);
    paper.appendChild(wrapper);
    
    // attachInteractToDraggable(wrapper);
    return wrapper;
}

export function addStickerToCanvas(src, x = 150, y = 150) {
    const paper = document.getElementById('letter-paper');
    const wrapper = document.createElement('div');
    wrapper.className = 'draggable sticker-item';
    wrapper.style.transform = `translate(${x}px, ${y}px)`;
    wrapper.setAttribute('data-x', x);
    wrapper.setAttribute('data-y', y);
    
    const img = document.createElement('img');
    img.src = src;
    img.style.width = '100px';
    
    wrapper.appendChild(img);
    paper.appendChild(wrapper);
    
    // attachInteractToDraggable(wrapper);
    return wrapper;
}

// ... other element types would go here ...
