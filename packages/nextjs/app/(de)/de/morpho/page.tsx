import { MorphoPage, morphoMetadata } from "~~/components/pages/MorphoPage";

export const metadata = morphoMetadata("de");

const Morpho = () => MorphoPage({ locale: "de" });

export default Morpho;
