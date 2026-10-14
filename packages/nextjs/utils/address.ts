/** Wallet addresses are stored lowercased; Postgres text comparison is case-sensitive. */
export const normalizeAddress = (address: string) => address.trim().toLowerCase();
