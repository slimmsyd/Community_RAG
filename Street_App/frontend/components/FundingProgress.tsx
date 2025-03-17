interface FundingProgressProps {
  currentAmount: number;
  goal?: number;
  size?: number;
  strokeWidth?: number;
}

export function FundingProgress({
  currentAmount,
  goal = 170000,
  size = 200,
  strokeWidth = 16
}: FundingProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.min(currentAmount / goal, 1);
  const offset = circumference - progress * circumference;

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            className="text-gray-200"
            stroke="currentColor"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          <circle
            className="text-green-500 transition-all duration-500"
            stroke="currentColor"
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-3xl font-bold text-gray-800">
            ${currentAmount.toLocaleString()}
          </div>
          <div className="text-gray-500">of ${goal.toLocaleString()} goal</div>
        </div>
      </div>
      <div className="text-lg font-semibold text-gray-700">
        Land Acquisition Fund
      </div>
    </div>
  );
} 