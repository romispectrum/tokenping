import { NextResponse } from "next/server";
import { readEthPrice } from "~~/services/marketing/ethPrice";

// The footer's ETH price. Static, regenerated at most every five minutes (ETH_PRICE_REVALIDATE_SECONDS; route config
// must be a literal), so the pool is read a few hundred times a day, not once per page view. Always 200: a failed read
// is `{ "price": null }`, and the footer leaves the price out instead of the browser logging a failed request.
export const revalidate = 300;

export const GET = async () => NextResponse.json({ price: await readEthPrice() });
