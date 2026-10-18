import { cn } from "cn";

/** 0–5 for each axis. */
export type Profile = {
  sweet: number;
  sour: number;
  bitter: number;
  strong: number;
  body: number;
};

const AXES: Array<[keyof Profile, string]> = [
  ["sweet", "Sweet"],
  ["sour", "Sour"],
  ["bitter", "Bitter"],
  ["strong", "Strong"],
  ["body", "Body"],
];

/** Five-pip meters. Pips, not bars: flavor is a judgement, not a measurement. */
export function FlavorProfile({
  profile,
  className,
}: {
  profile: Profile;
  className?: string;
}) {
  return (
    <dl className={cn("space-y-2", className)}>
      {AXES.map(([key, label]) => (
        <div key={key} className="flex items-center justify-between gap-4">
          <dt className="text-sm text-ink-muted">{label}</dt>
          <dd className="flex gap-1" aria-label={`${profile[key]} of 5`}>
            {Array.from({ length: 5 }, (_, i) => (
              <span
                key={i}
                className={cn(
                  "size-2.5 rounded-full",
                  i < profile[key] ? "bg-ink" : "bg-line",
                )}
              />
            ))}
          </dd>
        </div>
      ))}
    </dl>
  );
}
