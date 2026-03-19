/** Layouts where each face has its own distinct image (truly double-faced). */
const FLIP_LAYOUTS = new Set(['transform', 'modal_dfc', 'reversible_card']);

/**
 * Returns true if the card has two visually distinct faces that should be
 * shown via a flip animation (layout is transform / modal_dfc / reversible_card
 * AND both faces have their own image_uris).
 */
export const isFlipCard = (card) =>
    !!card &&
    FLIP_LAYOUTS.has(card.layout) &&
    !!(card.card_faces?.[0]?.image_uris) &&
    !!(card.card_faces?.[1]?.image_uris);

/**
 * Returns the best available image URL for a card.
 *
 * Some cards (double-faced, modal DFCs, etc.) do NOT have a root-level
 * `image_uris` object. Their images live inside `card_faces[0].image_uris`.
 * This helper resolves that fallback transparently.
 *
 * @param {object} card - The full card object from the API.
 * @param {'large'|'png'|'normal'|'small'|'art_crop'} [preferred] - Preferred size.
 * @returns {string} The resolved image URL (or a placeholder).
 */
export const getCardImage = (card, preferred = 'large') => {
    if (!card) return '/not-found-image.png';
    // Primary: use root-level image_uris
    const uris = card.image_uris
        // Secondary: fall back to the first face for double-faced cards
        || card.card_faces?.[0]?.image_uris
        || null;

    if (!uris) return '/not-found-image.png';

    if (preferred === 'art_crop') {
        return uris.art_crop || uris.large || uris.png || uris.normal || uris.small || '/not-found-image.png';
    }
    if (preferred === 'small') {
        return uris.small || uris.normal || uris.large || '/not-found-image.png';
    }
    if (preferred === 'normal') {
        return uris.normal || uris.large || uris.png || uris.small || '/not-found-image.png';
    }

    // Default priority: large > png > normal > small
    return uris.large || uris.png || uris.normal || uris.small || '/not-found-image.png';
};
