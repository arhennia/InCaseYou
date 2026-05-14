// js/pages/landing.js
import { appState, saveState } from '../modules/state.js';

export function initLandingPage() {
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
