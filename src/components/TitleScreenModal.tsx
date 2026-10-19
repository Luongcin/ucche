import React from 'react';
import { Play, Sparkles, Smartphone, Flame, Music, Trophy } from 'lucide-react';

interface TitleScreenModalProps {
  onStart: () => void;
  onOpenShop?: () => void;
  coins?: number;
}

export const TitleScreenModal: React.FC<TitleScreenModalProps> = ({ onStart, onOpenShop, coins = 300 }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-3xl p-6 shadow-2xl flex flex-col items-center gap-5 text-center">
        {/* Cute Character Slingshot Avatar */}
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 via-rose-500 to-sky-500 flex items-center justify-center shadow-xl shadow-amber-950/80 animate-bounce">
            <span className="text-4xl">🐱✨</span>
          </div>
          <div className="absolute -bottom-1 -right-1 px-2 py-0.5 bg-emerald-500 text-slate-950 text-[10px] font-black rounded-full shadow">
            20 MÀN
          </div>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-display tracking-tight uppercase leading-tight">
            BẮN BÉ BÔNG: 20 VỰC CÁ SẤU
          </h1>
          <p className="text-xs text-amber-400 font-semibold mt-1">
            20 Màn Chơi Leo Thang · Súng VIP & Skill Phanh Cháy Chân
          </p>
        </div>

        {/* How to Play Cards */}
        <div className="grid grid-cols-2 gap-2.5 w-full text-left">
          {/* Slingshot */}
          <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 flex flex-col gap-1">
            <span className="text-[10px] font-bold text-amber-400 uppercase">🎯 Súng Cao Su</span>
            <span className="text-xs font-bold text-slate-100">Kéo & Bắn</span>
            <p className="text-[11px] text-slate-400 leading-tight">
              Kéo Bé Bông về sau để tích lực, căn đường đạn bay qua 20 vực sâu cá sấu.
            </p>
          </div>

          {/* Phanh Cháy Chân */}
          <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 flex flex-col gap-1">
            <span className="text-[10px] font-bold text-rose-400 uppercase">⚠️ Phanh Cháy Chân</span>
            <span className="text-xs font-bold text-slate-100">Coi Chừng Trượt!</span>
            <p className="text-[11px] text-slate-400 leading-tight">
              Tiếp đất bục an toàn sẽ trượt phanh tóe lửa! Trượt quá mép là cá sấu xơi tái!
            </p>
          </div>
        </div>

        {/* Action Buttons: Start and VIP Shop */}
        <div className="flex flex-col gap-2.5 w-full">
          <button
            onClick={onStart}
            className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-500 via-rose-500 to-sky-500 hover:opacity-90 text-white font-extrabold text-base rounded-2xl shadow-xl shadow-amber-950/60 active:scale-95 transition-all flex items-center justify-center gap-2 font-display"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>BẮT ĐẦU BẮN NGAY</span>
          </button>

          {onOpenShop && (
            <button
              onClick={onOpenShop}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-xl border border-amber-500/40 transition-all flex items-center justify-center gap-2 shadow"
            >
              <span>🪙 Cửa Hàng Skill & Súng VIP ({coins} Xu)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
