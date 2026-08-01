import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface CircleChartData {
  value: number;
  color: string;
  label: string;
}

interface CircleChartProps {
  size?: number;
  strokeWidth?: number;
  data?: CircleChartData[];
  bgColor?: string;
  total?: number;
}

const CircleChart = ({
  size = 250,
  strokeWidth = 40,
  data = [{ value: 35, color: "#4F46E5", label: "Asset A" }],
  bgColor = "#93C5FD",
  total = 0
}: CircleChartProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const { t } = useTranslation();

  const [segments, setSegments] = useState(
    data.map(() => ({ offset: circumference, dashOffset: 0 }))
  );

  useEffect(() => {
    if (!data || data.length === 0) return;

    const initialSegments = data.map(() => ({
      offset: circumference,
      dashOffset: 0
    }));
    setSegments(initialSegments);

    let accumulatedPercentage = 0;
    const newSegments = data.map(item => {
      const segmentPercentage = item.value;
      const segmentLength = (segmentPercentage / 100) * circumference;
      const segmentOffset = (accumulatedPercentage / 100) * circumference;
      accumulatedPercentage += segmentPercentage;

      return {
        offset: circumference - segmentLength,
        dashOffset: segmentOffset
      };
    });

    const timer = setTimeout(() => setSegments(newSegments), 100);

    return () => clearTimeout(timer);
  }, [data, circumference]);

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size}>
        {/* Circle nền */}
        <circle
          className="transition-all duration-1000 ease-in-out"
          stroke={bgColor}
          fill="none"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />

        {/* Các segments */}
        {data.map((segment, index) => {
          const seg = segments[index];
          if (!seg) return null;

          return (
            <circle
              key={index}
              className="transition-all duration-1000 ease-in-out"
              stroke={segment.color}
              fill="none"
              strokeWidth={strokeWidth}
              strokeLinecap="butt"
              strokeDasharray={circumference}
              strokeDashoffset={seg.offset}
              r={radius}
              cx={size / 2}
              cy={size / 2}
              style={{
                transform: `rotate(${(seg.dashOffset * 360) / circumference - 90}deg)`,
                transformOrigin: "center"
              }}
            />
          );
        })}
      </svg>

      {/* Text ở giữa */}
      <div className="absolute flex flex-col items-center">
        <span className="text-[100px] leading-none font-extrabold flex flex-col items-center justify-center">
          {total > 0 ? total : data.reduce((sum, d) => sum + d.value, 0)}
          <span className="text-base font-semibold">
            {t("dashboard.totalQuantity")}
          </span>
        </span>
      </div>
    </div>
  );
};

export default CircleChart;
