import { LoadingSequence } from "@/components/loading-sequence";

const LINES = ["Exhuming the repo…", "Reading the last commit…", "Consulting the coroner…", "Filing the paperwork…"];

export default function Loading() {
  return <LoadingSequence lines={LINES} note="A first autopsy takes about 20 seconds. Repeat visits are instant." />;
}
