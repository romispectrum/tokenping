import { notFound } from "next/navigation";
import { DebugContracts } from "./_components/DebugContracts";
import type { Metadata, NextPage } from "next";
import { DEV_ROUTE_NOT_FOUND_METADATA, areDevRoutesEnabled } from "~~/utils/devRoutes";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export const generateMetadata = (): Metadata =>
  areDevRoutesEnabled()
    ? getMetadata({
        title: "Debug Contracts",
        description: "Read and call the contracts deployed on the local development chain.",
      })
    : DEV_ROUTE_NOT_FOUND_METADATA;

const Debug: NextPage = () => {
  if (!areDevRoutesEnabled()) notFound();

  return (
    <>
      <DebugContracts />
      <div className="text-center mt-8 bg-secondary p-10">
        <h1 className="text-4xl my-0">Debug Contracts</h1>
        <p className="text-neutral">
          You can debug & interact with your deployed contracts here.
          <br /> Check{" "}
          <code className="italic bg-base-300 text-base font-bold [word-spacing:-0.5rem] px-1">
            packages / nextjs / app / debug / page.tsx
          </code>{" "}
        </p>
      </div>
    </>
  );
};

export default Debug;
