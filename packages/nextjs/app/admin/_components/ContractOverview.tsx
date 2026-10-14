import { Address } from "@scaffold-ui/components";
import type { Address as AddressType } from "viem";
import { InfoTile } from "~~/app/admin/_components/InfoTile";

type ContractOverviewProps = {
  contractAddress: AddressType;
  owner: AddressType | undefined;
  chainId: number;
  paused: boolean | undefined;
};

export const ContractOverview = ({ contractAddress, owner, chainId, paused }: ContractOverviewProps) => (
  <div className="rounded-3xl border border-base-300 bg-base-100 dark:border-white/10 dark:bg-gray-900/60 p-6">
    <h1 className="text-2xl md:text-3xl font-bold">Admin Console</h1>
    <p className="text-sm text-base-content/70 mt-2">
      Private operational dashboard for `TokenpingPaywall`. This page is intentionally not linked in navigation.
    </p>
    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
      <InfoTile label="Contract">
        <Address address={contractAddress} />
      </InfoTile>
      <InfoTile label="Owner">
        {owner ? <Address address={owner} /> : <span className="text-base-content/70">Loading owner...</span>}
      </InfoTile>
      <InfoTile label="Chain ID">
        <span>{chainId}</span>
      </InfoTile>
      <InfoTile label="Paused">
        <span>{paused ? "Yes" : "No"}</span>
      </InfoTile>
    </div>
  </div>
);
