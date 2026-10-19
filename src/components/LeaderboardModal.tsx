import React, { useState } from 'react';
import { Trophy, Flame, Zap, X } from 'lucide-react';
import { LeaderboardEntry } from '../types/game';

interface LeaderboardModalProps {
  entries: LeaderboardEntry[];
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ entries, onClose }) => {
  const [tab, setTab] = useState<'rage' | 'speedrun'>('rage');

  const sortedEntries = [...entries].sort((a, b) => {
    if (tab === 'rage') {
      // Sort by most deaths (who persevered the most)
      return b.deaths - a.deaths;
    } else {
      // Sort by least deaths, then by time
      if (a.deaths !== b.deaths) return a.deaths - b.deaths;
      return a.timeSeconds - b.timeSeconds;
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-400" />
            <h2 className="text-lg font-bold text-white font-display">Bảng Xếp Hạng Thánh Cay Cú</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button
            onClick={() => setTab('rage')}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              tab === 'rage'
                ? 'bg-rose-950 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span>Vua Lì Đòn (Chết nhiều nhất)</span>
          </button>
          <button
            onClick={() => setTab('speedrun')}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              tab === 'speedrun'
                ? 'bg-sky-950 text-sky-300 border border-sky-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-sky-400" />
            <span>Thần Cân Speedrun</span>
          </button>
        </div>

        {/* List of entries */}
        <div className="flex flex-col gap-2 overflow-y-auto pr-1 max-h-[380px]">
          {sortedEntries.map((entry, idx) => {
            const isTop3 = idx < 3;
            const rankColor = idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-amber-600' : 'text-slate-500';

            return (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 bg-slate-950/70 border border-slate-800/80 rounded-2xl"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 text-center font-black text-sm tabular-nums ${rankColor}`}>
                    #{idx + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-100 text-xs">{entry.playerName}</span>
                      <span className="text-[10px] text-amber-300 font-medium">{entry.badge}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Màn {entry.level} · {entry.timeSeconds.toFixed(1)}s · {entry.date}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-bold text-sm text-rose-400 block tabular-nums">
                    {entry.deaths} <span className="text-[10px] font-normal text-slate-400">lần vỡ</span>
                  </span>
                  {isTop3 && (
                    <span className="text-[10px] font-semibold text-emerald-400">
                      {idx === 0 ? '👑 Huyền Thoại' : '⭐ Xuất Sắc'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <p className="text-[11px] text-slate-400 text-center">
          Dữ liệu lưu trữ offline trên thiết bị. Cập nhật theo thời gian thực mỗi khi bạn hoàn thành màn!
        </p>
      </div>
    </div>
  );
};
