import { GET as ardManifest } from "~~/app/.well-known/ard.json/route";

// The ARD manifest at the path of the spec's predecessor (ai-catalog), which scanners still ask for. The same response
// as /.well-known/ard.json.
export const dynamic = "force-static";

export const GET = ardManifest;
