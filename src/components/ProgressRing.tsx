interface Props {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
  className?: string;
}

export default function ProgressRing({ value, size = 72, stroke = 7, label, className = "" }: Props) {
  const safe = Math.max(0, Math.min(100, value));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className={`relative inline-grid shrink-0 place-items-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#edeaf1" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#6d4aff"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (safe / 100) * circumference}
        />
      </svg>
      <span className="absolute text-center text-sm font-extrabold text-[#25212b]">
        {safe}%
        {label && <span className="block text-[9px] font-semibold text-[#898291]">{label}</span>}
      </span>
    </div>
  );
}
