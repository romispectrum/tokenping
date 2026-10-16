"use client";

import { type ReactNode, useState } from "react";
import { isAddress } from "viem";
import { Field, Input } from "~~/components/ui";

export const ADDRESS_ERROR =
  "Enter a full 0x address. ENS names are not accepted, and a mixed-case address must match its checksum.";

type AddressFieldProps = {
  /** The input id, unique on the page. */
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  description?: ReactNode;
  /** The card's failed submit, when it failed on this field. */
  error?: string;
};

// Not scaffold-ui's AddressInput: it resolves ENS names on Ethereum mainnet, but these transactions run on Arbitrum,
// where the mainnet address of a name (e.g. a Safe) may not be controlled by its owner.
/**
 * A literal 0x address only; the form parsers reject anything viem's strict (EIP-55) isAddress rejects. Nothing is
 * flagged while the owner types: the check runs when they leave the field with an invalid value, then on every
 * change until they leave it valid. A failed submit shows the parser's message instead.
 */
export const AddressField = ({ id, label, value, onChange, description, error }: AddressFieldProps) => {
  const [isChecked, setIsChecked] = useState(false);
  const isInvalid = value !== "" && !isAddress(value, { strict: true });
  return (
    <Field
      id={id}
      label={label}
      description={description}
      error={error ?? (isChecked && isInvalid ? ADDRESS_ERROR : undefined)}
    >
      {control => (
        <Input
          {...control}
          className="font-data"
          value={value}
          onChange={event => onChange(event.target.value.trim())}
          onBlur={() => setIsChecked(isInvalid)}
          autoComplete="off"
          spellCheck={false}
        />
      )}
    </Field>
  );
};
