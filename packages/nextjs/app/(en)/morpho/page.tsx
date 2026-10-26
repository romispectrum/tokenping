import { MorphoPage, morphoMetadata } from "~~/components/pages/MorphoPage";

export const metadata = morphoMetadata("en");

const Morpho = () => MorphoPage({ locale: "en" });

export default Morpho;
