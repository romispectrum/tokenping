import { CircleCheck, CirclePause, ExternalLink } from "lucide-react";
import type { Address, Chain } from "viem";
import { DataList, DataRow, NoData } from "~~/app/admin/_components/DataList";
import { AddressChip } from "~~/components/custom/aave/AddressChip";
import { NetworkBadge } from "~~/components/custom/aave/NetworkBadge";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "~~/components/ui";
import scaffoldConfig from "~~/scaffold.config";
import { getBlockExplorerAddressLink } from "~~/utils/scaffold-eth";

type ContractOverviewProps = {
  contractAddress: Address;
  owner: Address | undefined;
  isOwnerLoading: boolean;
  chainId: number;
  paused: boolean | undefined;
};

/** Whether the paywall takes payments: a status badge with its icon and word. */
export const PaymentsStatus = ({ paused }: { paused: boolean | undefined }) => {
  if (paused === undefined) return <NoData />;
  return paused ? (
    <Badge variant="warning">
      <CirclePause aria-hidden="true" />
      Paused
    </Badge>
  ) : (
    <Badge variant="success">
      <CircleCheck aria-hidden="true" />
      Active
    </Badge>
  );
};

type AddressValueProps = {
  address: Address;
  /** Read before the address and named by the copy button: "Contract". */
  label: string;
  network: Chain | undefined;
};

/** The address chip (with its copy button) and a link to the address on the network's explorer. */
const AddressValue = ({ address, label, network }: AddressValueProps) => {
  if (!network) return <AddressChip address={address} label={label} />;
  const href = getBlockExplorerAddressLink(network, address);
  // A local chain links to SE-2's own explorer page; every other explorer is another site.
  const isExternal = href.startsWith("http");
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <AddressChip address={address} label={label} />
      <a
        href={href}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noreferrer" : undefined}
        className="inline-flex items-center gap-1 text-sm text-link underline decoration-1 underline-offset-4 hover:decoration-2 pointer-coarse:min-h-11"
      >
        {`View ${label.toLowerCase()} on ${network.blockExplorers?.default.name ?? "the block explorer"}`}
        {isExternal ? (
          <>
            <ExternalLink aria-hidden="true" className="size-4" />
            <span className="sr-only"> (opens in a new tab)</span>
          </>
        ) : null}
      </a>
    </div>
  );
};

export const ContractOverview = ({
  contractAddress,
  owner,
  isOwnerLoading,
  chainId,
  paused,
}: ContractOverviewProps) => {
  const network = scaffoldConfig.targetNetworks.find(chain => chain.id === chainId);
  return (
    <Card role="region" aria-labelledby="admin-contract-title">
      <CardHeader>
        <CardTitle as="h2" id="admin-contract-title">
          Contract
        </CardTitle>
        <CardDescription>The TokenpingPaywall contract this console controls.</CardDescription>
      </CardHeader>
      <CardContent>
        <DataList>
          <DataRow label="Address">
            <AddressValue address={contractAddress} label="Contract" network={network} />
          </DataRow>
          <DataRow label="Owner">
            {owner ? (
              <AddressValue address={owner} label="Owner" network={network} />
            ) : isOwnerLoading ? (
              <span className="text-muted-foreground">Loading owner</span>
            ) : (
              <NoData />
            )}
          </DataRow>
          <DataRow label="Network">
            {network ? (
              <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <NetworkBadge name={network.name} testnet={network.testnet} />
                <span className="font-data text-muted-foreground">ID {chainId}</span>
              </span>
            ) : (
              <span className="font-data">ID {chainId}</span>
            )}
          </DataRow>
          <DataRow label="Payments">
            <PaymentsStatus paused={paused} />
          </DataRow>
        </DataList>
      </CardContent>
    </Card>
  );
};
