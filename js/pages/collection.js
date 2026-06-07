// js/pages/collection.js
import { appState, saveState } from '../modules/state.js';

export function initCollectionPage() {
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

    document.getElementById('btn-share').addEventListener('click', async () => {
        try {
            const { shareCollection } = await import('../firebase.js');
            const id = await shareCollection(appState);
            const shareUrl = `${window.location.origin}/pages/collection.html?id=${id}`;
            await navigator.clipboard.writeText(shareUrl);
            alert(`Share link copied!\n\n${shareUrl}`);
        } catch (e) {
            console.error('Share failed:', e);
            alert('Could not generate share link.');
        }
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
