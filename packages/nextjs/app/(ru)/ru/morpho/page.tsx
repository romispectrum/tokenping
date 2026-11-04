import { MorphoPage, morphoMetadata } from "~~/components/pages/MorphoPage";

export const metadata = morphoMetadata("ru");

const Morpho = () => MorphoPage({ locale: "ru" });

export default Morpho;
