import { MorphoPage, morphoMetadata } from "~~/components/pages/MorphoPage";

export const metadata = morphoMetadata("hi");

const Morpho = () => MorphoPage({ locale: "hi" });

export default Morpho;
