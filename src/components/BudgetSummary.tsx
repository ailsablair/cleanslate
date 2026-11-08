import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { MonthlyReport, UserProfile } from '../types';

interface BudgetSummaryProps {
  currentReport?: MonthlyReport;
  profile: UserProfile;
  onNavigateToReports: () => void;
}

interface BudgetSlice {
  id: string;
  name: string;
  shortName: string;
  amount: number;
  percentage: number;
  color: string;
  textColor: string;
  sliceLabel: string;
}

export const BudgetSummary: React.FC<BudgetSummaryProps> = ({
  currentReport,
  profile,
  onNavigateToReports
}) => {
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);

  // Exact statutory budget breakdown matching updated design mockup
  const totalIncome = 6680.00;

  const slices: BudgetSlice[] = [
    {
      id: 'estate',
      name: 'Estate Payments (Trustee)',
      shortName: 'Estate Payments...',
      amount: 1500.00,
      percentage: 20,
      color: '#ff5ea7', // Pink
      textColor: '#2c2448',
      sliceLabel: '$1,500'
    },
    {
      id: 'living',
      name: 'Living Expenses',
      shortName: 'Living Expenses',
      amount: 2500.00,
      percentage: 32,
      color: '#2be4a7', // Mint Green
      textColor: '#2c2448',
      sliceLabel: '$2,500'
    },
    {
      id: 'nondisc',
      name: 'Non-Discretionary Deductions',
      shortName: 'Non-Discretionary...',
      amount: 1200.00,
      percentage: 18,
      color: '#fbf050', // Yellow
      textColor: '#2c2448',
      sliceLabel: '$1,200'
    },
    {
      id: 'retained',
      name: 'Retained Cash Balance',
      shortName: 'Retained Cash Bal...',
      amount: 900.00,
      percentage: 15,
      color: '#00a8cc', // Cyan / Teal
      textColor: '#ffffff',
      sliceLabel: '$900'
    },
    {
      id: 'employment',
      name: 'Employment Mandatory Expenses',
      shortName: 'Employment Expen...',
      amount: 450.00,
      percentage: 10,
      color: '#2c2448', // Dark Navy
      textColor: '#ffffff',
      sliceLabel: '$450'
    },
    {
      id: 'medical',
      name: 'Medical Expenses (PHI)',
      shortName: 'Medical Expenses',
      amount: 130.00,
      percentage: 5,
      color: '#a9b5fe', // Lavender
      textColor: '#2c2448',
      sliceLabel: '$130'
    }
  ];

  // SVG Geometry Calculation for Pixel-Perfect Donut Chart
  const size = 300;
  const center = size / 2;
  const outerRadius = 135;
  const innerRadius = 78;
  const labelRadius = (outerRadius + innerRadius) / 2;

  // Compute angles for each slice (starting at top: -90 degrees)
  let cumulativeAngle = -90;
  const arcData = slices.map((slice) => {
    const angleSpan = (slice.amount / totalIncome) * 360;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angleSpan;
    const midAngle = startAngle + angleSpan / 2;
    cumulativeAngle = endAngle;

    // Convert degrees to radians
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const sRad = toRad(startAngle);
    const eRad = toRad(endAngle);
    const mRad = toRad(midAngle);

    // Points on outer arc
    const x1 = center + outerRadius * Math.cos(sRad);
    const y1 = center + outerRadius * Math.sin(sRad);
    const x2 = center + outerRadius * Math.cos(eRad);
    const y2 = center + outerRadius * Math.sin(eRad);

    // Points on inner arc
    const x3 = center + innerRadius * Math.cos(eRad);
    const y3 = center + innerRadius * Math.sin(eRad);
    const x4 = center + innerRadius * Math.cos(sRad);
    const y4 = center + innerRadius * Math.sin(sRad);

    const largeArcFlag = angleSpan > 180 ? 1 : 0;

    const pathData = [
      `M ${x1} ${y1}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
      'Z'
    ].join(' ');

    // Center point for slice label
    const labelX = center + labelRadius * Math.cos(mRad);
    const labelY = center + labelRadius * Math.sin(mRad);

    return {
      ...slice,
      pathData,
      labelX,
      labelY
    };
  });

  return (
    <div className="bg-white text-[#242031] rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-6">
      
      {/* 1. Header Bar matching updated design */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-base sm:text-lg font-bold tracking-wider text-slate-900 uppercase">
            BANKRUPTCY STATUS
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-normal leading-relaxed max-w-xl">
            Real-time visual breakdown of statutory income allocation, monthly surplus contributions, and discharge process.
          </p>
        </div>

        {/* Top Right Mint Badge */}
        <div className="shrink-0 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#38efb0] text-[#1d1a27] text-xs font-bold shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-[#1d1a27]" />
            <span>BIA Form 65</span>
          </span>
        </div>
      </div>

      {/* Hairline Divider Line */}
      <div className="h-[1px] w-full bg-slate-100" />

      {/* 2. Middle Row: Donut Chart (Left) + 6 Allocation Cards (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        
        {/* Left Column: Donut Chart with Embedded Slice Amounts & Center Metric */}
        <div className="md:col-span-5 flex flex-col items-center justify-center">
          <div className="w-[280px] h-[280px] sm:w-[300px] sm:h-[300px] relative flex items-center justify-center select-none">
            <svg
              viewBox={`0 0 ${size} ${size}`}
              className="w-full h-full transform transition-transform duration-300"
            >
              {arcData.map((arc) => {
                const isHovered = activeSegmentId === arc.id;
                // Item 3: Omit text on narrow slices (<=8% like $130) to prevent overflow
                const showDirectLabel = arc.percentage > 8;

                return (
                  <g
                    key={arc.id}
                    onMouseEnter={() => setActiveSegmentId(arc.id)}
                    onMouseLeave={() => setActiveSegmentId(null)}
                    className="cursor-pointer transition-all duration-200"
                  >
                    <path
                      d={arc.pathData}
                      fill={arc.color}
                      stroke="#ffffff"
                      strokeWidth={3}
                      className={`transition-all duration-200 ${
                        isHovered ? 'filter brightness-110 drop-shadow-md' : ''
                      }`}
                    />
                    {/* Dollar amount directly inside the donut segment only when wide enough */}
                    {showDirectLabel && (
                      <text
                        x={arc.labelX}
                        y={arc.labelY}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill={arc.textColor}
                        style={{
                          fontFamily: "'Google Sans Flex', sans-serif",
                          fontWeight: 700,
                          fontSize: '11px',
                          pointerEvents: 'none'
                        }}
                      >
                        {arc.sliceLabel}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Center Hole of Donut: Dynamic inspection on hover, or default Monthly Income */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4 transition-all duration-150">
              {activeSegmentId ? (() => {
                const seg = slices.find(s => s.id === activeSegmentId);
                if (!seg) return null;
                return (
                  <div className="animate-in fade-in zoom-in-95 duration-150">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5 truncate max-w-[130px]">
                      {seg.shortName}
                    </span>
                    <span className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight whitespace-nowrap block">
                      ${seg.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span 
                      className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 shadow-2xs"
                      style={{ backgroundColor: seg.color, color: seg.textColor }}
                    >
                      {seg.percentage}% Allocation
                    </span>
                  </div>
                );
              })() : (
                <>
                  <span className="text-[11px] font-medium text-slate-500 tracking-wide mb-0.5">
                    Monthly Income
                  </span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight whitespace-nowrap">
                    $6,680.00
                  </span>
                  <span className="inline-flex items-center text-[10px] font-semibold text-emerald-300 bg-[#254942] px-3 py-0.5 rounded-full mt-1.5 shadow-2xs">
                    On Track
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: 6 Allocation Cards (2 Columns x 3 Rows) */}
        <div className="md:col-span-7 flex flex-col justify-center space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {slices.map((slice) => {
              const isHovered = activeSegmentId === slice.id;
              return (
                <div
                  key={slice.id}
                  onMouseEnter={() => setActiveSegmentId(slice.id)}
                  onMouseLeave={() => setActiveSegmentId(null)}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer select-none ${
                    isHovered
                      ? 'bg-white border-slate-400 shadow-xs ring-1 ring-slate-300'
                      : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  {/* Top Row: Color Dot + Title */}
                  <div className="flex items-center gap-2 mb-1.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: slice.color }}
                    />
                    <span className="text-xs font-bold text-slate-900 truncate" title={slice.name}>
                      {slice.shortName}
                    </span>
                  </div>

                  {/* Bottom Row: Amount + Percentage (Item 14: no colliding text, hide percentage when space is small) */}
                  <div className="flex items-baseline justify-between text-xs pt-0.5 gap-2">
                    <span className="text-sm sm:text-base font-normal text-slate-900 tracking-tight whitespace-nowrap">
                      ${slice.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="hidden xl:inline text-xs font-medium text-slate-400 whitespace-nowrap">
                      {slice.percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Subtitle guidance below cards */}
          <p className="text-xs text-slate-400 text-center font-normal pt-1">
            Hover or tap any slice to inspect category allocation and details
          </p>
        </div>
      </div>

      {/* 3. Bottom Row: FULL-WIDTH DARK DISCHARGE REPAYMENTS PROGRESS CARD */}
      <div className="bg-[#2d293d] rounded-2xl sm:rounded-3xl p-6 sm:p-7 text-white space-y-4 shadow-sm">
        
        {/* Top Header of Dark Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-200">
            DISCHARGE REPAYMENTS PROGRESS
          </div>
          <div className="text-left sm:text-right">
            <span className="text-sm font-bold text-[#fbf050] tracking-wide block">
              43% COMPLETE
            </span>
            <span className="text-xs text-slate-400 font-normal">
              12 months remaining
            </span>
          </div>
        </div>

        {/* Big Metric Display: $1,431.00 of $3,339.00 */}
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            $1,431.00
          </span>
          <span className="text-2xl sm:text-3xl font-light text-slate-300">
            of $3,339.00
          </span>
        </div>

        {/* Multi-Color Gradient Progress Bar */}
        <div className="w-full bg-white/15 h-2 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#ff5ea7] via-[#fbf050] to-[#2be4a7] transition-all duration-500"
            style={{ width: '43%' }}
          />
        </div>

        {/* Bottom Dual Statistics: CURRENT PAYMENT + TARGET DISCHARGE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              CURRENT PAYMENT
            </span>
            <span className="text-2xl sm:text-3xl font-light text-white tracking-tight">
              $159.68
            </span>
          </div>

          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              TARGET DISCHARGE
            </span>
            <span className="text-2xl sm:text-3xl font-light text-white tracking-tight">
              June 2024
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};
