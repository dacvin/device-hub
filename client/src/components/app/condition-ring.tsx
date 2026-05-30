import { conditionTone } from "@/lib/domain/devices";

const STROKE: Record<"success" | "warning" | "danger", string> = {
  success: "oklch(0.67 0.12 167)",
  warning: "oklch(0.78 0.13 75)",
  danger: "oklch(0.577 0.245 27.325)",
};

export function ConditionRing({ value, size = 84 }: { value: number; size?: number }) {
  const pct = Math.max(0, Math.min(100, value));
  const stroke = STROKE[conditionTone(pct)];
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct / 100);
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={5}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth={5}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold tabular-nums">{pct}%</div>
        </div>
      </div>
    </div>
  );
}
