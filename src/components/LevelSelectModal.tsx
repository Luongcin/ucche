import React from 'react';
import { Lock, Star, X, CheckCircle2 } from 'lucide-react';
import { GAME_LEVELS } from '../data/levels';
import { UserProgress } from '../types/game';

interface LevelSelectModalProps {
  userProgress: UserProgress;
  currentLevel: number;
  onSelectLevel: (levelId: number) => void;
  onClose: () => void;
}

export const LevelSelectModal: React.FC<LevelSelectModalProps> = ({
  userProgress,
  currentLevel,
  onSelectLevel,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white font-display">Chọn Màn Chơi (20 Màn)</h2>
            <p className="text-xs text-slate-400">20 thử thách leo thang độ khó qua đầm lầy cá sấu</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Level Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 overflow-y-auto pr-1 max-h-[460px]">
          {GAME_LEVELS.map((lvl) => {
            const isUnlocked = lvl.id <= userProgress.unlockedLevel;
            const isCurrent = lvl.id === currentLevel;
            const stat = userProgress.levelStats[lvl.id];
            const isCompleted = stat ? stat.completed : false;
            const stars = stat ? stat.stars : 0;
            const deaths = stat ? stat.deaths : 0;

            return (
              <button
                key={lvl.id}
                disabled={!isUnlocked}
                onClick={() => {
                  onSelectLevel(lvl.id);
                  onClose();
                }}
                className={`p-3 rounded-2xl text-left border transition-all flex flex-col justify-between h-24 ${
                  !isUnlocked
                    ? 'bg-slate-950/40 border-slate-800/50 opacity-40 cursor-not-allowed'
                    : isCurrent
                    ? 'bg-sky-950/80 border-sky-400 shadow-lg shadow-sky-950/50 ring-1 ring-sky-400'
                    : isCompleted
                    ? 'bg-slate-950 hover:bg-slate-800/80 border-emerald-800/60'
                    : 'bg-slate-950 hover:bg-slate-800 border-slate-800'
                }`}
              >
                {/* Top row */}
                <div className="flex items-center justify-between w-full">
                  <span className="font-extrabold text-sm text-white font-display">
                    Màn {lvl.id}
                  </span>
                  {isUnlocked ? (
                    isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-sky-400" />
                    )
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                  )}
                </div>

                {/* Title */}
                <div className="truncate text-xs font-semibold text-slate-200">
                  {lvl.title}
                </div>

                {/* Stars and deaths */}
                <div className="flex items-center justify-between w-full text-[10px]">
                  {isUnlocked && isCompleted ? (
                    <>
                      <div className="flex items-center text-yellow-400">
                        {[1, 2, 3].map((s) => (
                          <Star
                            key={s}
                            className={`w-3 h-3 ${s <= stars ? 'fill-yellow-400 text-yellow-400' : 'text-slate-700'}`}
                          />
                        ))}
                      </div>
                      <span className="text-slate-400 tabular-nums">{deaths} chết</span>
                    </>
                  ) : (
                    <span className="text-slate-400 italic">
                      {isUnlocked ? 'Chưa vượt qua' : 'Khóa'}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
