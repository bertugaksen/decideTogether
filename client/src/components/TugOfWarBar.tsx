import React from 'react';

export interface TugOfWarBarProps {
  score1: number;
  score2: number;
  label1?: string;
  label2?: string;
  smoothingFactor?: number;
}

export const TugOfWarBar: React.FC<TugOfWarBarProps> = ({
  score1,
  score2,
  label1 = 'Oyuncu 1',
  label2 = 'Oyuncu 2',
  smoothingFactor = 4,
}) => {
  // Laplace smoothing: (score1 + k) / (score1 + score2 + 2k) * 100
  const p1Percent = Math.round(
    ((score1 + smoothingFactor) / (score1 + score2 + 2 * smoothingFactor)) * 100
  );
  const p2Percent = 100 - p1Percent;

  return (
    <div className="w-full space-y-1 select-none">
      <div className="flex justify-between items-center text-xs font-bold px-1">
        <span className="text-[#E07A5F] truncate max-w-[120px]">
          {label1} ({score1})
        </span>
        <span className="text-[#2D6A4F] truncate max-w-[120px]">
          ({score2}) {label2}
        </span>
      </div>

      <div className="w-full h-3 bg-[#E7E2D9] rounded-full overflow-hidden flex border border-[#D5CEC5]">
        <div
          className="bg-[#E07A5F] h-full"
          style={{
            width: `${p1Percent}%`,
            transition: 'width 120ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        />
        <div
          className="bg-[#2D6A4F] h-full"
          style={{
            width: `${p2Percent}%`,
            transition: 'width 120ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        />
      </div>
    </div>
  );
};