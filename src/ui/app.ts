/**
 * Main App Script for Co
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('App page loaded');

    const appContainer: HTMLElement | null = document.getElementById('app-container');
    if (appContainer) appContainer.innerHTML = '<p class="text-white text-xl">Welcome to Complexa!</p>';

});