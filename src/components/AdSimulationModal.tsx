import React, { useEffect, useState } from 'react';
import { Shield, Sparkles, ExternalLink } from 'lucide-react';
import { CustomAd } from '../types/game';

interface AdSimulationModalProps {
  isRewardAd: boolean;
  activeAd?: CustomAd;
  onAdCompleted: () => void;
  onClose: () => void;
}

export const AdSimulationModal: React.FC<AdSimulationModalProps> = ({
  isRewardAd,
  activeAd,
  onAdCompleted,
  onClose,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(4);
  const [canClose, setCanClose] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanClose(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleFinish = () => {
    if (canClose) {
      onAdCompleted();
      onClose();
    }
  };

  const handleAdClick = () => {
    if (activeAd?.targetUrl) {
      window.open(activeAd.targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 text-center">
        {/* Top Ad Info */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="px-2 py-0.5 bg-slate-800 text-[10px] rounded uppercase font-bold text-amber-400">
            {isRewardAd ? 'Quảng Cáo Nhận Thưởng' : 'Quảng Cáo Do Admin Thêm'}
          </span>
          <span className="font-mono text-slate-300">
            {canClose ? 'Có thể đóng' : `Bỏ qua sau ${secondsRemaining}s`}
          </span>
        </div>

        {/* Ad creative display */}
        <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-sky-950 border border-indigo-700/40 rounded-2xl p-5 flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center shadow-lg shadow-rose-900/50">
            <Sparkles className="w-8 h-8 text-white animate-spin" />
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-sky-400">
              {activeAd?.sponsorName || 'Nhà Tài Trợ Game'}
            </span>
            <h3 className="text-base font-extrabold text-white font-display mt-0.5">
              {activeAd?.title || 'SIÊU PHẨM ROBOT CÂN NÃO 2026'}
            </h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {activeAd?.description || 'Vượt 20 vực sâu cá sấu đầy kịch tính! Tải ngay hôm nay để nhận quà tân thủ.'}
            </p>
          </div>

          {/* Ad Link / CTA Button */}
          {activeAd?.targetUrl && (
            <button
              onClick={handleAdClick}
              className="mt-1 px-4 py-1.5 bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 text-xs font-bold rounded-full border border-amber-400/40 transition-colors flex items-center gap-1.5"
            >
              <span>{activeAd.ctaText || 'Tìm hiểu thêm'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Reward info */}
        {isRewardAd && (
          <div className="flex items-center justify-center gap-2 p-2 bg-sky-950/60 border border-sky-500/30 rounded-xl text-sky-200 text-xs font-semibold">
            <Shield className="w-4 h-4 text-sky-400" />
            <span>Phần thưởng: +1 Khiên Bảo Vệ Quả Cầu</span>
          </div>
        )}

        {/* Close / Action Button */}
        {canClose ? (
          <button
            onClick={handleFinish}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-2xl transition-all shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2"
          >
            <span>{isRewardAd ? 'NHẬN THƯỞNG & ĐÓNG' : 'TIẾP TỤC CHƠI NGAY'}</span>
          </button>
        ) : (
          <div className="w-full py-3 px-4 bg-slate-800 text-slate-400 font-bold text-sm rounded-2xl">
            Vui lòng xem hết ({secondsRemaining}s)...
          </div>
        )}
      </div>
    </div>
  );
};
