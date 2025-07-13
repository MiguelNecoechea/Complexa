/**
 * Imports the PopupView class from the PopupView.js module.
 *
 * The PopupView class is responsible for handling popup windows or dialogs
 * in the application. It contains methods to create, display, and manage
 * popup content that will be initialized when the DOM is fully loaded.
 *
 * @see PopupView.js for the implementation details
 */
import { PopupView } from "../views/PopupView";

// Local constants - defined directly in this file to avoid dependencies
document.addEventListener("DOMContentLoaded", () => {
    const popupView = new PopupView();
    popupView.init();
});
