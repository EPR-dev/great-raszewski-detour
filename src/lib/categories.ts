export const CATEGORIES = [
  "Coast",
  "Wildlife",
  "Outback",
  "Mountains",
  "History",
  "Quirky",
  "Culture",
  "Rainforest",
  "Museum",
] as const;

const MARKS: Record<string, string> = {
  Coast:
    '<path d="M2 16c2.2-2.6 3.4-2.6 5.4 0s3.2 2.6 5.4 0 3.2-2.6 5.4 0 2.4-2.6 4-0" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
  Wildlife:
    '<g fill="currentColor"><circle cx="8" cy="7.2" r="2.1"/><circle cx="16" cy="7.2" r="2.1"/><circle cx="5.2" cy="12" r="1.7"/><circle cx="18.8" cy="12" r="1.7"/><ellipse cx="12" cy="15.6" rx="4.3" ry="3.3"/></g>',
  Outback:
    '<g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="3.1"/><path d="M12 2.8v2.5M12 18.7V21.2M2.8 12h2.5M18.7 12h2.5M5.1 5.1l1.8 1.8M17.1 17.1l1.8 1.8M18.9 5.1l-1.8 1.8M6.9 17.1l-1.8 1.8"/></g>',
  Mountains: '<path fill="currentColor" d="M1.5 19.5 8.2 7.2 12 13.2 15.6 5.5 22.5 19.5Z"/>',
  History:
    '<path d="M7 20.5V11M17 20.5V11M7 11.2c0-4.2 10-4.2 10 0M10 20.5v-5h4v5" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>',
  Quirky: '<path fill="currentColor" d="M12 2.4 14 8.2 20.2 8.6 15.4 12.6 17.2 18.6 12 15.4 6.8 18.6 8.6 12.6 3.8 8.6 10 8.2Z"/>',
  Culture:
    '<g fill="none" stroke="currentColor" stroke-width="2.1"><circle cx="9" cy="12" r="4.3"/><circle cx="15.2" cy="12" r="4.3"/></g>',
  Rainforest:
    '<path fill="currentColor" d="M12 21.2v-6.2c-4.2.1-6.4-2.2-6.4-5 2.2.1 3.5-1.5 4.1-3.3.6 1.6 1.3 2.6 2.3 2.6s1.7-1 2.3-2.6c.6 1.8 1.9 3.4 4.1 3.3 0 2.8-2.2 5.1-6.4 5z"/>',
  Museum:
    '<path d="M3.5 10.2 12 3.6l8.5 6.6V20.4h-17ZM9 20.4v-6.2h6v6.2M3.5 10.2h17" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linejoin="round"/>',
};

export function categorySvg(category: string | null): string {
  const inner =
    (category && MARKS[category]) ||
    '<circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2.2"/>';
  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${inner}</svg>`;
}

export function categoryClass(category: string | null): string {
  return category && category in MARKS ? `cat-${category}` : "cat-none";
}
