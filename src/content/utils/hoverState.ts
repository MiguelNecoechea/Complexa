/**
 * Utility helpers for keeping the hover state of token spans in sync with
 * the different feature toggles (global hover setting, POS filters and word
 * exclusions).
 */

/**
 * Recompute the effective hover state for a span based on the stored dataset
 * flags. The hover tooltip should only appear when the global setting is
 * enabled, the POS tag is marked as enabled and the token is not excluded by
 * the word filters.
 */
export function recomputeHoverState(span: HTMLSpanElement): void {
    const hoverSetting: boolean = span.dataset.hoverSetting !== "false";
    const posEnabled: boolean = span.dataset.posEnabled !== "false";
    const wordExcluded: boolean = span.dataset.wordExcluded === "true";

    span.dataset.hoverEnabled = String(hoverSetting && posEnabled && !wordExcluded);
}
