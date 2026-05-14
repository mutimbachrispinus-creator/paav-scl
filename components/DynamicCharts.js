import React from 'react';

/**
 * Lightweight, zero-dependency SVG chart components.
 * Replaces bulky Recharts to keep Cloudflare Worker bundle under the limit.
 */

const COLORS = ['#1E40AF', '#D4AF37', '#0F172A', '#E11D48', '#059669', '#7C3AED'];

export const ResponsiveContainer = ({ children, height = 300 }) => (
  <div style={{ width: '100%', height, position: 'relative' }}>
    {children}
  </div>
);

export const AreaChart = ({ data = [], children }) => {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.value || 0), 100);
  const points = data.map((d, i) => `${(i / (data.length - 1)) * 100},${100 - ((d.value || 0) / max) * 100}`).join(' ');
  
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
      <defs>
        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
          <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
        </linearGradient>
      </defs>
      <polyline
        fill="url(#areaGradient)"
        stroke="none"
        points={`0,100 ${points} 100,100`}
      />
      <polyline
        fill="none"
        stroke="var(--primary)"
        strokeWidth="2"
        points={points}
        vectorEffect="non-scaling-stroke"
      />
      {children}
    </svg>
  );
};

export const BarChart = ({ data = [], children }) => {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.value || d.amount || 0), 10);
  const barWidth = 100 / data.length - 2;

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
      {data.map((d, i) => {
        const h = ((d.value || d.amount || 0) / max) * 100;
        return (
          <rect
            key={i}
            x={i * (100 / data.length) + 1}
            y={100 - h}
            width={barWidth}
            height={h}
            fill="var(--primary)"
            rx="1"
          />
        );
      })}
      {children}
    </svg>
  );
};

export const PieChart = ({ children }) => (
  <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
    {children}
  </svg>
);

export const Pie = ({ data = [], dataKey = 'value', innerRadius = 0, outerRadius = 40, cx = 50, cy = 50 }) => {
  const total = data.reduce((sum, d) => sum + (d[dataKey] || 0), 0);
  let currentAngle = 0;

  return data.map((d, i) => {
    const angle = ((d[dataKey] || 0) / total) * 360;
    const x1 = cx + outerRadius * Math.cos((Math.PI * currentAngle) / 180);
    const y1 = cy + outerRadius * Math.sin((Math.PI * currentAngle) / 180);
    const x2 = cx + outerRadius * Math.cos((Math.PI * (currentAngle + angle)) / 180);
    const y2 = cy + outerRadius * Math.sin((Math.PI * (currentAngle + angle)) / 180);
    
    const largeArcFlag = angle > 180 ? 1 : 0;
    const pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
    
    currentAngle += angle;
    return <path key={i} d={pathData} fill={COLORS[i % COLORS.length]} />;
  });
};

export const LineChart = ({ data = [], children }) => {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.value || 0), 10);
  const points = data.map((d, i) => `${(i / (data.length - 1)) * 100},${100 - ((d.value || 0) / max) * 100}`).join(' ');
  
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
      <polyline
        fill="none"
        stroke="var(--primary)"
        strokeWidth="2"
        points={points}
        vectorEffect="non-scaling-stroke"
      />
      {children}
    </svg>
  );
};

export const XAxis = () => null;
export const YAxis = () => null;
export const CartesianGrid = () => null;
export const Tooltip = () => null;
export const Cell = () => null;
export const Area = () => null;
export const Bar = () => null;
export const Line = () => null;
