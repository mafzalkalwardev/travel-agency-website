import type { Announcement } from "@/types";

interface AnnouncementTickerProps {
  announcements: Announcement[];
}

export function AnnouncementTicker({ announcements }: AnnouncementTickerProps) {
  const items = [...announcements, ...announcements];

  return (
    <div className="overflow-hidden bg-gold py-2.5 text-navy">
      <div className="flex animate-ticker whitespace-nowrap">
        {items.map((item, i) => (
          <span key={`${item.id}-${i}`} className="mx-8 inline-flex items-center text-sm font-medium">
            <span className="mr-2 h-1.5 w-1.5 rounded-full bg-navy" />
            {item.message}
          </span>
        ))}
      </div>
    </div>
  );
}
