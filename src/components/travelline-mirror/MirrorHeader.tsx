import Link from "next/link";

export function MirrorHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a0a]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/tl-mirror/" className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight text-white">
            ✈ Travel Line
          </span>
          <span className="rounded bg-green-700/30 px-1.5 py-0.5 text-[10px] font-medium text-green-400">
            MIRROR
          </span>
        </Link>

        <div className="hidden flex-1 justify-center md:flex">
          <div className="flex w-full max-w-md items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/60">
            <span>Search Group Flights</span>
            <span className="text-white/30">From - To - Date</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <span className="hidden text-white/70 sm:inline">Join Us</span>
          <button
            type="button"
            className="rounded-md bg-white px-4 py-1.5 text-sm font-medium text-black"
          >
            Log In
          </button>
        </div>
      </div>
    </header>
  );
}
