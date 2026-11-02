import { MorphoPage, morphoMetadata } from "~~/components/pages/MorphoPage";

export const metadata = morphoMetadata("fr");

const Morpho = () => MorphoPage({ locale: "fr" });

export default Morpho;
