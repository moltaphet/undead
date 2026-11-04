import { LoadingSequence } from "@/components/loading-sequence";

const LINES = ["Gathering ingredients…", "Drawing the circle…", "Speaking the words…"];

export default function Loading() {
  return <LoadingSequence lines={LINES} note="Writing a full relaunch kit takes about a minute. It's worth the wait." />;
}
