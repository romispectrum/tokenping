import { MorphoPage, morphoMetadata } from "~~/components/pages/MorphoPage";

export const metadata = morphoMetadata("nl");

const Morpho = () => MorphoPage({ locale: "nl" });

export default Morpho;
