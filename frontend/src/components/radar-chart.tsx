export interface Metric {
    label: string;
    value: number;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return {
        x: cx + r * Math.cos(rad),
        y: cy + r * Math.sin(rad),
    };
}

export function RadarChart({
    metrics,
    size = 400,
    levels = 5,
}: {
    metrics: Metric[];
    size?: number;
    levels?: number;
}) {
    const cx = size / 2;
    const cy = size / 2;
    const radius = size * 0.38;
    const count = metrics.length;
    const angleStep = 360 / count;

    // Grid polygons
    const gridPolygons = Array.from({ length: levels }, (_, i) => {
        const r = (radius / levels) * (i + 1);
        const points = Array.from({ length: count }, (_, j) => {
            const { x, y } = polarToCartesian(cx, cy, r, j * angleStep);
            return `${x},${y}`;
        }).join(" ");
        return points;
    });

    // Axis lines
    const axes = Array.from({ length: count }, (_, i) => {
        const { x, y } = polarToCartesian(cx, cy, radius, i * angleStep);
        return { x, y };
    });

    // Data polygon
    const dataPoints = metrics.map((m, i) => {
        const r = m.value * radius;
        return polarToCartesian(cx, cy, r, i * angleStep);
    });
    const dataPolygon = dataPoints.map(({ x, y }) => `${x},${y}`).join(" ");

    // Labels
    const labelOffset = 22;
    const labels = metrics.map((m, i) => {
        const { x, y } = polarToCartesian(
            cx,
            cy,
            radius + labelOffset,
            i * angleStep,
        );
        return { ...m, x, y };
    });

    return (
        <svg width={size * 2} height={size} viewBox={`0 0 ${size} ${size}`}>
            {/* Grid */}
            {gridPolygons.map((points, i) => (
                <polygon
                    key={i}
                    points={points}
                    fill="none"
                    stroke={
                        i === levels - 1
                            ? "var(--color-stone-600)"
                            : "var(--color-stone-800)"
                    }
                    strokeWidth={i === levels - 1 ? 1.5 : 1}
                />
            ))}

            {/* Axis lines */}
            {axes.map((pt, i) => (
                <line
                    key={i}
                    x1={cx}
                    y1={cy}
                    x2={pt.x}
                    y2={pt.y}
                    stroke="var(--color-stone-800)"
                    strokeWidth={1}
                />
            ))}

            {/* Data area */}
            <polygon
                points={dataPolygon}
                fill="var(--color-lime-200)"
                fillOpacity={0.15}
                stroke="var(--color-lime-200)"
                strokeWidth={2}
                strokeLinejoin="round"
            />

            {/* Data points */}
            {dataPoints.map(({ x, y }, i) => (
                <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r={4}
                    fill="var(--color-lime-200)"
                    stroke="var(--color-lime-800)"
                    strokeWidth={1.5}
                />
            ))}

            {/* Labels */}
            {labels.map(({ label, value, x, y }, i) => {
                const textAnchor =
                    x < cx - 5 ? "end" : x > cx + 5 ? "start" : "middle";
                return (
                    <g key={i}>
                        <text
                            x={x}
                            y={y - 4}
                            textAnchor={textAnchor}
                            fill="var(--color-stone-300)"
                            fontSize={10}
                            fontWeight="600">
                            {label}
                        </text>
                        <text
                            x={x}
                            y={y + 10}
                            textAnchor={textAnchor}
                            fill="var(--color-lime-200)"
                            fontSize={11}>
                            {value}
                        </text>
                    </g>
                );
            })}

            {/* Center dot */}
            <circle cx={cx} cy={cy} r={3} fill="var(--color-lime-200)" />
        </svg>
    );
}
