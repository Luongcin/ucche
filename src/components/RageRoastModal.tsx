import React, { useRef, useState } from 'react';
import { RotateCcw, Share2, Shield, Download, Check, Flame } from 'lucide-react';
import { getRandomRoast } from '../data/roasts';

interface RageRoastModalProps {
  currentLevel: number;
  levelTitle: string;
  failReason: string;
  deathsThisLevel: number;
  totalDeaths: number;
  screenshot: string;
  onInstantRestart: () => void;
  onWatchRewardAd: () => void;
  canWatchAd: boolean;
}

export const RageRoastModal: React.FC<RageRoastModalProps> = ({
  currentLevel,
  levelTitle,
  failReason,
  deathsThisLevel,
  totalDeaths,
  screenshot,
  onInstantRestart,
  onWatchRewardAd,
  canWatchAd,
}) => {
  const [roastQuote] = useState(() => getRandomRoast(deathsThisLevel));
  const [copied, setCopied] = useState(false);
  const cardCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Generate meme card and share
  const handleShare = async () => {
    const canvas = cardCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 600;
    canvas.height = 750;

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 750);
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 600, 750);

    // Border neon glow
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, 592, 742);

    // Header Title
    ctx.fillStyle = '#f43f5e';
    ctx.font = '900 32px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🔥 KHOẢNH KHẮC CAY CÚ 🔥', 300, 60);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 18px Plus Jakarta Sans, sans-serif';
    ctx.fillText(`Màn ${currentLevel}: ${levelTitle}`, 300, 95);

    // Draw Screenshot
    if (screenshot) {
      const img = new Image();
      img.src = screenshot;
      await new Promise((res) => { img.onload = res; });
      ctx.drawImage(img, 50, 120, 500, 290);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.strokeRect(50, 120, 500, 290);
    }

    // Death Stats Banner
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(50, 430, 500, 90);
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 2;
    ctx.strokeRect(50, 430, 500, 90);

    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 28px Outfit, sans-serif';
    ctx.fillText(`ĐÃ VỠ BÓNG ${deathsThisLevel} LẦN Ở MÀN NÀY!`, 300, 470);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '15px Plus Jakarta Sans, sans-serif';
    ctx.fillText(`Tổng số bóng đã hiến tế: ${totalDeaths} quả · Thần Cân Quả Cầu`, 300, 500);

    // Roast Quote
    ctx.fillStyle = '#fef08a';
    ctx.font = 'italic bold 20px Plus Jakarta Sans, sans-serif';
    ctx.fillText(`"${roastQuote}"`, 300, 570);

    // Watermark & Challenge CTA
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 18px Outfit, sans-serif';
    ctx.fillText('👉 ĐỐ BẠN QUA ĐƯỢC MÀN NÀY KHÔNG CAY! 👈', 300, 640);

    ctx.fillStyle = '#64748b';
    ctx.font = '14px sans-serif';
    ctx.fillText('Cân Não: Thần Cân Quả Cầu (RoboBalance Rage)', 300, 680);

    // Export image & share
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `cay_cu_man_${currentLevel}.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: `Tôi vừa vỡ quả cầu ${deathsThisLevel} lần ở màn ${currentLevel}!`,
            text: `Bạn có dám thử thách không? "${roastQuote}"`,
            files: [file],
          });
          return;
        } catch {
          // fallback to download
        }
      }

      // Download fallback
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cay_cu_man_${currentLevel}.png`;
      a.click();
      URL.revokeObjectURL(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }, 'image/png');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      {/* Hidden canvas for card generation */}
      <canvas ref={cardCanvasRef} className="hidden" />

      <div className="w-full max-w-sm bg-slate-900 border-2 border-rose-600/70 rounded-3xl p-5 shadow-2xl shadow-rose-950/50 flex flex-col gap-4 text-center">
        {/* Roast Header */}
        <div className="flex items-center justify-center gap-2">
          <Flame className="w-6 h-6 text-rose-500 animate-bounce" />
          <h2 className="text-xl font-extrabold text-white font-display tracking-wide">
            VỠ BÓNG RỒI!
          </h2>
        </div>

        {/* Death Snapshot */}
        <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 aspect-video max-h-36 mx-auto w-full">
          {screenshot ? (
            <img src={screenshot} alt="Khoảnh khắc vỡ bóng" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
              Khoảnh khắc bi hài
            </div>
          )}
          <div className="absolute top-2 left-2 px-2 py-0.5 bg-rose-950/90 border border-rose-500/50 text-rose-300 text-[10px] font-bold rounded-md">
            Lần #{deathsThisLevel}
          </div>
          <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/80 text-slate-300 text-[10px] rounded">
            {failReason || 'Mất thăng bằng'}
          </div>
        </div>

        {/* Savage Roast Quote */}
        <div className="p-3 bg-rose-950/30 border border-rose-500/20 rounded-xl">
          <p className="text-xs sm:text-sm font-semibold text-rose-200 italic leading-snug">
            "{roastQuote}"
          </p>
        </div>

        {/* Death Stats Pill */}
        <div className="flex items-center justify-center gap-4 text-xs text-slate-300 bg-slate-800/80 py-2 px-3 rounded-xl border border-slate-700">
          <div>
            <span className="text-slate-400 block text-[10px]">Màn này</span>
            <span className="font-bold text-rose-400 text-sm tabular-nums">{deathsThisLevel} lần chết</span>
          </div>
          <div className="w-px h-6 bg-slate-700" />
          <div>
            <span className="text-slate-400 block text-[10px]">Tổng cộng</span>
            <span className="font-bold text-amber-400 text-sm tabular-nums">{totalDeaths} quả vỡ</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-1">
          {/* Instant Restart Primary CTA */}
          <button
            onClick={onInstantRestart}
            autoFocus
            className="w-full py-3 px-4 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-rose-900/40 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>THỬ LẠI NGAY (0.1s)</span>
          </button>

          {/* Share Cay Cú Button */}
          <button
            onClick={handleShare}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-2"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-sky-400" />}
            <span>{copied ? 'Đã lưu ảnh Card Meme!' : 'Share Cay Cú (TikTok/FB/Zalo)'}</span>
          </button>

          {/* Reward Ad for Shield */}
          {canWatchAd && (
            <button
              onClick={onWatchRewardAd}
              className="w-full py-2 px-3 bg-sky-950/70 hover:bg-sky-900 text-sky-300 border border-sky-600/40 font-medium text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5 text-sky-400" />
              <span>Xem QC nhận Khiên Bảo Vệ 1 lần</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
