import { LoadingSequence } from "@/components/loading-sequence";

const LINES = ["Dimming the lights…", "Lighting the candles…", "Calling the spirit…"];

export default function Loading() {
  return <LoadingSequence lines={LINES} />;
}
