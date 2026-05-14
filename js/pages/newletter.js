// js/pages/newletter.js
import { appState, saveState } from '../modules/state.js';

export function initNewLetterPage() {
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
