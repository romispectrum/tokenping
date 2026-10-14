import { isAddress } from "viem";

type HexAddressInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
};

// Not scaffold-ui's AddressInput: it resolves ENS names on Ethereum mainnet, but these transactions run on Arbitrum,
// where the mainnet address of a name (e.g. a Safe) may not be controlled by its owner.
/** A literal 0x address only; the form parsers reject anything viem's strict (EIP-55) isAddress rejects. */
export const HexAddressInput = ({ value, onChange, placeholder }: HexAddressInputProps) => {
  const isInvalid = value !== "" && !isAddress(value, { strict: true });
  return (
    <input
      type="text"
      className={`input input-bordered w-full${isInvalid ? " input-error" : ""}`}
      placeholder={placeholder}
      value={value}
      onChange={event => onChange(event.target.value.trim())}
      aria-invalid={isInvalid || undefined}
      autoComplete="off"
      spellCheck={false}
    />
  );
};
