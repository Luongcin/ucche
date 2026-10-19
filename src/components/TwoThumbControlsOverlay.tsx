import React from 'react';
import { RotateCcw, Volume2, VolumeX, Smartphone, Trophy, Grid, Shield, Settings, Home, Music } from 'lucide-react';
import { PhysicsEngine } from '../game/physicsEngine';

interface TwoThumbControlsOverlayProps {
  currentLevel: number;
  levelTitle: string;
  deathsThisLevel: number;
  totalDeaths: number;
  coins: number;
  soundEnabled: boolean;
  bgmEnabled: boolean;
  hapticsEnabled: boolean;
  hasShield: boolean;
  shieldCount: number;
  engineRef: React.MutableRefObject<PhysicsEngine | null>;
  onRestart: () => void;
  onToggleSound: () => void;
  onToggleBgm: () => void;
  onToggleHaptics: () => void;
  onReturnHome: () => void;
  onOpenLevelSelect: () => void;
  onOpenLeaderboard: () => void;
  onOpenShop: () => void;
  onOpenAdmin: () => void;
  onUseShield: () => void;
}

export const TwoThumbControlsOverlay: React.FC<TwoThumbControlsOverlayProps> = ({
  currentLevel,
  levelTitle,
  deathsThisLevel,
  totalDeaths,
  coins,
  soundEnabled,
  bgmEnabled,
  hapticsEnabled,
  hasShield,
  shieldCount,
  engineRef,
  onRestart,
  onToggleSound,
  onToggleBgm,
  onToggleHaptics,
  onReturnHome,
  onOpenLevelSelect,
  onOpenLeaderboard,
  onOpenShop,
  onOpenAdmin,
  onUseShield,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 select-none">
      {/* Top HUD Bar */}
      <header className="flex items-center justify-between gap-2.5 pointer-events-auto bg-slate-900/85 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-800 shadow-lg">
        {/* Left: Home Button & Level Selector */}
        <div className="flex items-center gap-2">
          {/* Home Button (Về Màn Hình Chính) */}
          <button
            onClick={onReturnHome}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors border border-slate-700"
            title="Thoát về Màn Hình Chính"
          >
            <Home className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Trang Chủ</span>
          </button>

          <button
            onClick={onOpenLevelSelect}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors"
            title="Chọn Màn Chơi (20 Màn)"
          >
            <Grid className="w-3.5 h-3.5 text-emerald-400" />
            <span>Màn {currentLevel}/20</span>
          </button>

          <div className="flex items-center gap-1 text-xs pl-1">
            <span className="text-rose-400 font-bold tabular-nums">#{deathsThisLevel + 1}</span>
            <span className="text-slate-400 text-[11px] hidden sm:inline">thử lại</span>
          </div>
        </div>

        {/* Right: Actions, Coins Shop, Audio, Haptics, Settings */}
        <div className="flex items-center gap-1.5">
          {/* VIP Shop Button */}
          <button
            onClick={onOpenShop}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-amber-500 to-rose-500 hover:opacity-90 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-500/20 active:scale-95 transition-all"
            title="Mở Shop Skill & Súng Bắn VIP"
          >
            <span className="text-xs">🪙</span>
            <span className="font-extrabold tabular-nums">{coins}</span>
            <span className="hidden sm:inline text-[10px] uppercase font-black tracking-wide">Shop VIP</span>
          </button>

          {/* Shield activator */}
          {!hasShield && shieldCount > 0 && (
            <button
              onClick={onUseShield}
              className="flex items-center gap-1 px-2 py-1 bg-sky-950 border border-sky-600/60 hover:bg-sky-900 text-sky-300 text-xs font-semibold rounded-lg transition-all animate-pulse"
              title="Kích hoạt khiên bảo vệ"
            >
              <Shield className="w-3.5 h-3.5 text-sky-400" />
              <span>Khiên ({shieldCount})</span>
            </button>
          )}

          {hasShield && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-sky-500/20 text-sky-300 border border-sky-400/50 rounded-lg text-xs font-medium">
              <Shield className="w-3 h-3 text-sky-400" />
              <span>Bật khiên</span>
            </div>
          )}

          {/* Quick Restart */}
          <button
            onClick={onRestart}
            className="p-1.5 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors"
            title="Bắn lại từ đầu (Phím R)"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
          </button>

          {/* Dramatic BGM Music Toggle */}
          <button
            onClick={onToggleBgm}
            className={`p-1.5 rounded-lg transition-colors ${
              bgmEnabled ? 'bg-amber-950/60 text-amber-400 border border-amber-500/40' : 'bg-slate-800 text-slate-500'
            }`}
            title="Bật/Tắt Nhạc Nền Kịch Tính"
          >
            <Music className="w-4 h-4" />
          </button>

          {/* Sound FX Toggle */}
          <button
            onClick={onToggleSound}
            className="p-1.5 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors"
            title="Bật/Tắt hiệu ứng âm thanh"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Haptics Toggle */}
          <button
            onClick={onToggleHaptics}
            className="p-1.5 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors"
            title="Rung phản hồi Haptic"
          >
            <Smartphone className={`w-4 h-4 ${hapticsEnabled ? 'text-sky-400' : 'text-slate-500'}`} />
          </button>

          {/* Leaderboard */}
          <button
            onClick={onOpenLeaderboard}
            className="p-1.5 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors"
            title="Bảng xếp hạng"
          >
            <Trophy className="w-4 h-4 text-yellow-400" />
          </button>

          {/* Admin Settings Button */}
          <button
            onClick={onOpenAdmin}
            className="p-1.5 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors"
            title="Cài đặt Quản Trị & Thêm Quảng Cáo"
          >
            <Settings className="w-4 h-4 text-slate-400 hover:text-slate-200" />
          </button>
        </div>
      </header>

      {/* Bottom Slingshot & Skid Guide Instructions */}
      <footer className="w-full flex items-end justify-between gap-4 pb-2">
        {/* Slingshot Pull Guide */}
        <div className="bg-slate-900/85 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-800 shadow-xl max-w-[280px]">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
            <span>🎯 SÚNG CAO SU</span>
          </div>
          <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
            Chạm & kéo nhân vật về sau để tích lực, thả tay để bắn bay qua 20 vực sâu!
          </p>
        </div>

        {/* Phanh Cháy Chân Warning */}
        <div className="bg-slate-900/85 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-800 shadow-xl max-w-[270px] text-right">
          <div className="flex items-center justify-end gap-1.5 text-xs font-bold text-rose-400">
            <span>⚠️ PHANH CHÁY CHÂN</span>
          </div>
          <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
            Khi tiếp đất bục an toàn, chú ý phanh kịp thời kẻo trượt chân rơi hồ cá sấu!
          </p>
        </div>
      </footer>
    </div>
  );
};
