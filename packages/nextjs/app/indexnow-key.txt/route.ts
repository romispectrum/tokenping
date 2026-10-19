import { indexNowKey } from "~~/utils/indexNow";

// The IndexNow key file (utils/indexNow.ts), 404 while INDEXNOW_KEY is not set. Built once per deployment like the RSS
// feed and served without a function call, so a new key needs a redeploy, as any change to a Vercel environment
// variable does.
export const dynamic = "force-static";

export const GET = () => {
  const key = indexNowKey();
  if (!key) {
    if (process.env.INDEXNOW_KEY?.trim()) {
      console.error("INDEXNOW_KEY is not 8 to 128 letters, digits or dashes, so the IndexNow key file answers 404");
    }
    return new Response(null, { status: 404 });
  }
  return new Response(key, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
