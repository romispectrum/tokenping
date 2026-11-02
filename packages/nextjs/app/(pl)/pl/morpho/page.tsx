import { MorphoPage, morphoMetadata } from "~~/components/pages/MorphoPage";

export const metadata = morphoMetadata("pl");

const Morpho = () => MorphoPage({ locale: "pl" });

export default Morpho;
