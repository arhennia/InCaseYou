// js/modules/state.js

export const appState = {
    for: '',
    from: '',
    note: '',
    letters: [],
    currentLetterId: null
};

export const loadState = () => {
    const savedState = localStorage.getItem('incaseyou_state');
    if (savedState) {
        try {
            const parsed = JSON.parse(savedState);
            Object.assign(appState, parsed);
        } catch (e) {
            console.error("Could not parse saved state.", e);
        }
    }
    return appState;
};

export const saveState = () => {
    localStorage.setItem('incaseyou_state', JSON.stringify(appState));
};

export const getCurrentLetter = () => {
    return appState.letters.find(l => l.id === appState.currentLetterId);
};
