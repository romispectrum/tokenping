import { MorphoPage, morphoMetadata } from "~~/components/pages/MorphoPage";

export const metadata = morphoMetadata("hu");

const Morpho = () => MorphoPage({ locale: "hu" });

export default Morpho;
