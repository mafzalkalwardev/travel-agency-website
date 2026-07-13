import { loadMirrorSnapshot as loadFromDisk } from "@/lib/travelline-mirror/scraper";
import type { TravelLineMirrorSnapshot } from "./types";

export function loadMirrorSnapshot(): TravelLineMirrorSnapshot | null {
  return loadFromDisk();
}
