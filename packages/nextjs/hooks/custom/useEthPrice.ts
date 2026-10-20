import { useQuery } from "@tanstack/react-query";
import { apiUrl } from "~~/services/api/apiClient";

// /api/eth-price changes at most every five minutes (ETH_PRICE_REVALIDATE_SECONDS, server-only).
const ETH_PRICE_STALE_MS = 5 * 60 * 1000;

/** Null rather than an error when the price is unavailable: the footer just leaves it out. */
export const fetchEthPrice = async (): Promise<number | null> => {
  const res = await fetch(apiUrl("/api/eth-price")).catch(() => null);
  if (!res?.ok) return null;
  const { price }: { price?: unknown } = await res.json().catch(() => ({}));
  return typeof price === "number" && price > 0 ? price : null;
};

/** The ETH price in US dollars from this site's own API (it reads the chain server-side), or null while unknown. */
export const useEthPrice = () => {
  const { data } = useQuery({
    queryKey: ["eth-price"],
    queryFn: fetchEthPrice,
    staleTime: ETH_PRICE_STALE_MS,
    // A failed fetch resolves null; asking again would only repeat the failure.
    retry: false,
  });
  return data ?? null;
};
