type Activity = {
  id: string;
  type: string;
  message: string;
  createdAt: Date;
};

const ACTIVITY_ICONS: Record<string, string> = {
  LEAD_CREATED: "created",
  LEAD_ANALYZED: "analyzed",
  DRAFT_GENERATED: "draft",
  EMAIL_SENT_SIMULATED: "sent",
  SEND_SKIPPED: "skipped",
  STATUS_CHANGED: "status",
  NOTE_ADDED: "note",
  FOLLOW_UP_SET: "followup",
};

export default function ActivityTimeline({
  activities,
}: {
  activities: Activity[];
}) {
  if (activities.length === 0) {
    return (
      <p className="text-sm text-zinc-500 py-4 text-center">
        No activity recorded yet.
      </p>
    );
  }

  return (
    <div className="space-y-0">
      {activities.map((a, i) => (
        <div key={a.id} className="flex gap-3 pb-3 relative">
          {i < activities.length - 1 && (
            <div className="absolute left-[7px] top-4 bottom-0 w-px bg-zinc-800" />
          )}
          <div className="size-3.5 rounded-full bg-zinc-700 mt-1 shrink-0 ring-2 ring-zinc-900" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-zinc-600">
                {a.type}
              </span>
              <span className="text-[10px] text-zinc-700">
                {new Date(a.createdAt).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">{a.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
