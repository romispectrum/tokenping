/**
 * Joins class names and drops falsy entries. It does not merge conflicting utilities, so a className passed to a
 * primitive is for layout additions (margins, width, grid placement), not for overriding its variant colours.
 */
export const cx = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(" ");
