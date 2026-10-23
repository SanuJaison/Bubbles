import { useId } from "react";
import { useTheme } from "../../context/ThemeContext";
import { formatShortDay } from "../../utils/adminFormat";

const WIDTH = 720;
const HEIGHT = 250;
const PADDING = { top: 20, right: 16, bottom: 34, left: 42 };

const AdminSignupChart = ({ data = [] }) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const rawId = useId();
  const gradientId = `signup-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const plotWidth = WIDTH - PADDING.left - PADDING.right;
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;
  const max = Math.max(1, ...data.map((entry) => Number(entry.count) || 0));
  const stepX =
    data.length > 1 ? plotWidth / (data.length - 1) : plotWidth;

  const points = data.map((entry, index) => {
    const count = Number(entry.count) || 0;

    return {
      ...entry,
      count,
      x: PADDING.left + index * stepX,
      y: PADDING.top + plotHeight - (count / max) * plotHeight,
    };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${
          PADDING.top + plotHeight
        } L ${points[0].x} ${PADDING.top + plotHeight} Z`
      : "";

  const gridLines = [0, 0.5, 1];
  const labelEvery = data.length > 10 ? 2 : 1;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="h-60 w-full"
      role="img"
      aria-label="New users over the last 14 days"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="0%"
            stopColor={isDark ? "#a78bfa" : "#8b5cf6"}
            stopOpacity="0.28"
          />
          <stop
            offset="100%"
            stopColor={isDark ? "#a78bfa" : "#8b5cf6"}
            stopOpacity="0"
          />
        </linearGradient>
      </defs>

      {gridLines.map((fraction) => {
        const y = PADDING.top + plotHeight - fraction * plotHeight;

        return (
          <g key={fraction}>
            <line
              x1={PADDING.left}
              x2={WIDTH - PADDING.right}
              y1={y}
              y2={y}
              stroke={isDark ? "#334155" : "#e2e8f0"}
              strokeDasharray="4 6"
              strokeWidth="1"
            />
            <text
              x={PADDING.left - 10}
              y={y + 4}
              textAnchor="end"
              fontSize="10"
              fill="#94a3b8"
            >
              {Math.round(max * fraction)}
            </text>
          </g>
        );
      })}

      {areaPath ? <path d={areaPath} fill={`url(#${gradientId})`} /> : null}

      {linePath ? (
        <path
          d={linePath}
          fill="none"
          stroke={isDark ? "#a78bfa" : "#7c3aed"}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}

      {points.map((point, index) => (
        <g key={`${point.date}-${index}`}>
          <circle
            cx={point.x}
            cy={point.y}
            r="4"
            fill={isDark ? "#141418" : "#ffffff"}
            stroke={isDark ? "#a78bfa" : "#7c3aed"}
            strokeWidth="2.5"
          >
            <title>
              {formatShortDay(point.date)}: {point.count} new user
              {point.count === 1 ? "" : "s"}
            </title>
          </circle>
          {index % labelEvery === 0 ? (
            <text
              x={point.x}
              y={HEIGHT - 10}
              textAnchor="middle"
              fontSize="10"
              fill="#94a3b8"
            >
              {formatShortDay(point.date)}
            </text>
          ) : null}
        </g>
      ))}
    </svg>
  );
};

export default AdminSignupChart;
