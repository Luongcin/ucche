import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { Star, Trophy, ArrowRight, RotateCcw, Share2, Check } from 'lucide-react';
import { getRandomVictoryQuote } from '../data/roasts';

interface VictoryModalProps {
  levelNumber: number;
  levelTitle: string;
  deaths: number;
  timeSeconds: number;
  stars: number;
  screenshot: string;
  isLastLevel: boolean;
  onNextLevel: () => void;
  onReplay: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  levelNumber,
  levelTitle,
  deaths,
  timeSeconds,
  stars,
  screenshot,
  isLastLevel,
  onNextLevel,
  onReplay,
}) => {
  const [quote] = useState(() => getRandomVictoryQuote());
  const [copied, setCopied] = useState(false);
  const cardCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // Launch celebratory confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#38bdf8', '#fbbf24', '#34d399', '#f43f5e'],
    });
  }, []);

  const handleShareVictory = async () => {
    const canvas = cardCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 600;
    canvas.height = 720;

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 720);
    bgGrad.addColorStop(0, '#064e3b');
    bgGrad.addColorStop(1, '#022c22');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 600, 720);

    // Golden border
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, 592, 712);

    // Title
    ctx.fillStyle = '#fde047';
    ctx.font = '900 34px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏆 THẦN CÂN QUA MÀN! 🏆', 300, 65);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '600 20px Plus Jakarta Sans, sans-serif';
    ctx.fillText(`Màn ${levelNumber}: ${levelTitle}`, 300, 105);

    // Screenshot
    if (screenshot) {
      const img = new Image();
      img.src = screenshot;
      await new Promise((res) => { img.onload = res; });
      ctx.drawImage(img, 50, 130, 500, 280);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.strokeRect(50, 130, 500, 280);
    }

    // Stats
    ctx.fillStyle = '#065f46';
    ctx.fillRect(50, 430, 500, 90);
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 2;
    ctx.strokeRect(50, 430, 500, 90);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Outfit, sans-serif';
    ctx.fillText(`Thời gian: ${timeSeconds.toFixed(1)}s  |  Số lần thử: ${deaths + 1}`, 300, 470);

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('⭐'.repeat(stars) + '  ĐẲNG CẤP CAO THỦ', 300, 502);

    ctx.fillStyle = '#a7f3d0';
    ctx.font = 'italic bold 18px Plus Jakarta Sans, sans-serif';
    ctx.fillText(`"${quote}"`, 300, 570);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 18px Outfit, sans-serif';
    ctx.fillText('ĐỐ BẠN CÂN BẰNG ĐƯỢC NHƯ TÔI!', 300, 630);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `chien_thang_man_${levelNumber}.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: `Chiến thắng Màn ${levelNumber} - Thần Cân Quả Cầu!`,
            text: `Tôi đã vượt qua màn này với ${deaths} lần thử lại!`,
            files: [file],
          });
          return;
        } catch {
          // fallback
        }
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chien_thang_man_${levelNumber}.png`;
      a.click();
      URL.revokeObjectURL(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }, 'image/png');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <canvas ref={cardCanvasRef} className="hidden" />

      <div className="w-full max-w-sm bg-slate-900 border-2 border-emerald-500/80 rounded-3xl p-5 shadow-2xl shadow-emerald-950/60 flex flex-col gap-4 text-center">
        {/* Victory Header */}
        <div className="flex flex-col items-center gap-1">
          <Trophy className="w-10 h-10 text-yellow-400 animate-bounce" />
          <h2 className="text-2xl font-black text-white font-display">
            HOÀN THÀNH XUẤT SẮC!
          </h2>
          <p className="text-xs text-slate-400">Màn {levelNumber}: {levelTitle}</p>
        </div>

        {/* Stars Display */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map((starIdx) => (
            <Star
              key={starIdx}
              className={`w-7 h-7 transition-all ${
                starIdx <= stars
                  ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]'
                  : 'text-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Compliment Quote */}
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/20 rounded-xl">
          <p className="text-xs font-semibold text-emerald-200 italic">
            "{quote}"
          </p>
        </div>

        {/* Stats Pill */}
        <div className="grid grid-cols-2 gap-3 text-xs text-slate-300 bg-slate-800/80 p-3 rounded-xl border border-slate-700">
          <div>
            <span className="text-slate-400 block text-[10px]">Thời gian</span>
            <span className="font-bold text-sky-400 text-sm tabular-nums">{timeSeconds.toFixed(1)} giây</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Số lần vỡ</span>
            <span className="font-bold text-rose-400 text-sm tabular-nums">{deaths} lần</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-1">
          {!isLastLevel ? (
            <button
              onClick={onNextLevel}
              autoFocus
              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-950/50 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>MÀN TIẾP THEO</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="p-2.5 bg-yellow-500/20 border border-yellow-500/40 rounded-xl text-yellow-300 font-bold text-xs">
              🎉 BẠN ĐÃ PHÁ ĐẢO TOÀN BỘ GAME!
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onReplay}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Chơi lại</span>
            </button>

            <button
              onClick={handleShareVictory}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-sky-400" />}
              <span>{copied ? 'Đã lưu!' : 'Khoe ảnh'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
