import React from 'react';
import { Eye, EyeOff, Flag, Navigation } from 'lucide-react';
import { LevelData } from '../types/game';

interface CourseMinimapProps {
  level: LevelData;
  robotX: number;
  isPanMode: boolean;
  onTogglePanMode: () => void;
  onPeekGoal: () => void;
  onReturnToRobot: () => void;
}

export const CourseMinimap: React.FC<CourseMinimapProps> = ({
  level,
  robotX,
  isPanMode,
  onTogglePanMode,
  onPeekGoal,
  onReturnToRobot,
}) => {
  const totalW = level.totalWidth || 2800;
  const progressRatio = Math.min(1, Math.max(0, robotX / totalW));
  const chasmProgress = Math.min(20, Math.floor(progressRatio * 20));

  return (
    <div className="w-full max-w-xl mx-auto px-3 pointer-events-auto select-none mt-1">
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-2 px-3 flex flex-col gap-1.5 shadow-lg">
        {/* Top Info & Action Buttons */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-emerald-400">
              🐊 20 VỰC SÂU CÁ SẤU
            </span>
            <span className="text-[11px] text-slate-400">·</span>
            <span className="text-[11px] text-slate-300 font-medium">
              Vực <span className="text-yellow-400 font-bold tabular-nums">{chasmProgress}/20</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Toggle Pan Map Mode */}
            <button
              onClick={onTogglePanMode}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                isPanMode
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 ring-1 ring-amber-300 animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
              title="Lướt xem bản đồ"
            >
              {isPanMode ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3 text-sky-400" />}
              <span>{isPanMode ? 'Đang Soi Bản Đồ' : 'Soi Bản Đồ'}</span>
            </button>

            {/* Quick Peek Goal */}
            <button
              onClick={onPeekGoal}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1"
              title="Xem vị trí đích đến"
            >
              <Flag className="w-3 h-3 text-yellow-400" />
              <span>Xem Đích</span>
            </button>

            {/* Return to Robot */}
            {isPanMode && (
              <button
                onClick={onReturnToRobot}
                className="px-2 py-0.5 bg-sky-950 border border-sky-600/60 text-sky-300 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1"
                title="Quay lại vị trí Robot"
              >
                <Navigation className="w-3 h-3" />
                <span>Về Bé Bông</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar with 20 Crocodile Chasms */}
        <div className="relative w-full h-3 bg-slate-950 rounded-full border border-slate-800 overflow-hidden flex items-center">
          {/* 20 chasm notch marks */}
          <div className="absolute inset-0 flex justify-between px-1 pointer-events-none">
            {Array.from({ length: 20 }).map((_, idx) => (
              <div
                key={idx}
                className={`w-0.5 h-full ${idx < chasmProgress ? 'bg-emerald-500/60' : 'bg-slate-800'}`}
                title={`Vực sâu cá sấu #${idx + 1}`}
              />
            ))}
          </div>

          {/* Active progress fill */}
          <div
            className="h-full bg-gradient-to-r from-sky-500 via-emerald-500 to-amber-500 rounded-full transition-all duration-150"
            style={{ width: `${progressRatio * 100}%` }}
          />

          {/* Robot marker pin */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-sky-400 border-2 border-slate-950 rounded-full shadow-md shadow-sky-400/50 flex items-center justify-center transition-all duration-100"
            style={{ left: `${progressRatio * 100}%` }}
          >
            <div className="w-1.5 h-1.5 bg-white rounded-full" />
          </div>

          {/* Goal Flag Pin */}
          <div className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px]">
            🏁
          </div>
        </div>

        {isPanMode && (
          <div className="text-[10px] text-amber-300 text-center font-medium animate-pulse">
            👆 Đang ở chế độ Soi Bản Đồ: Hãy vuốt / kéo màn hình để lướt xem các bục và đàn cá sấu!
          </div>
        )}
      </div>
    </div>
  );
};
