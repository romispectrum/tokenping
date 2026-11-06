import { expect } from "chai";
import { deployments } from "hardhat";
import { type StorageLayout, storageLayoutProblems } from "../deploy/shared/storageLayout";
import savedImplementation from "../deployments/arbitrum/TokenpingPaywall_Implementation.json";

const types = {
  t_uint256: { label: "uint256" },
  "t_mapping(t_address,t_uint256)": { label: "mapping(address => uint256)" },
  "t_array(t_uint256)48_storage": { label: "uint256[48]" },
  "t_array(t_uint256)50_storage": { label: "uint256[50]" },
  "t_array(t_uint256)49_storage": { label: "uint256[49]" },
};
const entry = (label: string, slot: number, type: string) => ({ label, slot: String(slot), offset: 0, type });
const MAPPING = "t_mapping(t_address,t_uint256)";

const current: StorageLayout = {
  types,
  storage: [
    entry("maxDurationSeconds", 0, "t_uint256"),
    entry("expiry", 1, MAPPING),
    entry("__gap", 2, "t_array(t_uint256)50_storage"),
  ],
};

describe("storageLayoutProblems", function () {
  it("accepts the same layout", function () {
    void expect(storageLayoutProblems(current, current)).to.deep.equal([]);
  });

  it("accepts a new variable taken from the gap", function () {
    const next = {
      types,
      storage: [
        ...current.storage.slice(0, 2),
        entry("added", 2, "t_uint256"),
        entry("__gap", 3, "t_array(t_uint256)49_storage"),
      ],
    };
    void expect(storageLayoutProblems(current, next)).to.deep.equal([]);
  });

  it("ignores the AST numbers in a struct's type id", function () {
    const structTypes = (id: number) => ({ [`t_struct(Plan)${id}_storage`]: { label: "struct Plan" } });
    const layout = (id: number) => ({
      types: structTypes(id),
      storage: [entry("plan", 0, `t_struct(Plan)${id}_storage`)],
    });
    void expect(storageLayoutProblems(layout(100), layout(200))).to.deep.equal([]);
  });

  it("refuses a renamed, moved or retyped variable", function () {
    const renamed = { types, storage: [entry("averageBlockTime", 0, "t_uint256"), ...current.storage.slice(1)] };
    const retyped = { types, storage: [entry("maxDurationSeconds", 0, MAPPING), ...current.storage.slice(1)] };
    void expect(storageLayoutProblems(current, renamed)).to.deep.equal([
      "slot 0 held maxDurationSeconds, now averageBlockTime",
    ]);
    void expect(storageLayoutProblems(current, retyped)).to.have.length(1);
  });

  it("refuses a gap that does not end where it did", function () {
    const next = {
      types,
      storage: [...current.storage.slice(0, 2), entry("__gap", 2, "t_array(t_uint256)48_storage")],
    };
    void expect(storageLayoutProblems(current, next)).to.deep.equal(["__gap ends at slot 50, was 52"]);
  });

  it("refuses the block-based layout the live proxy started with", function () {
    const blockBased: StorageLayout = {
      types,
      storage: [
        entry("averageBlockTime", 0, "t_uint256"),
        entry("maxDurationBlocks", 1, "t_uint256"),
        entry("plans", 2, MAPPING),
        entry("expiryBlock", 3, MAPPING),
        entry("expiryTimestamp", 4, MAPPING),
        entry("__gap", 5, "t_array(t_uint256)48_storage"),
      ],
    };
    void expect(storageLayoutProblems(blockBased, current)).to.not.deep.equal([]);
  });

  it("accepts the current source against the implementation deployed on Arbitrum", async function () {
    const { storageLayout } = await deployments.getExtendedArtifact("TokenpingPaywall");
    void expect(
      storageLayoutProblems(savedImplementation.storageLayout as StorageLayout, storageLayout as StorageLayout),
    ).to.deep.equal([]);
  });
});
