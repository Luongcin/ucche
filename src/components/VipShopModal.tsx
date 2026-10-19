import React, { useState } from 'react';
import { X, Sparkles, Tv, Check, Lock, Zap, ShoppingBag } from 'lucide-react';
import { UserProgress, VipItem } from '../types/game';
import { VIP_ITEMS } from '../data/vipItems';
import { soundEngine } from '../utils/audio';
import { hapticsEngine } from '../utils/haptics';

interface VipShopModalProps {
  userProgress: UserProgress;
  onUpdateProgress: (updated: UserProgress) => void;
  onWatchAdForCoins: () => void;
  onClose: () => void;
}

export const VipShopModal: React.FC<VipShopModalProps> = ({
  userProgress,
  onUpdateProgress,
  onWatchAdForCoins,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'skill' | 'slingshot' | 'trail' | 'landing'>('skill');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2000);
  };

  const handleEquip = (item: VipItem) => {
    let updated: UserProgress = { ...userProgress };
    if (item.category === 'skill') {
      updated.equippedCharacterSkill = item.id;
    } else if (item.category === 'slingshot') {
      updated.equippedSlingshot = item.id;
    } else if (item.category === 'trail') {
      updated.equippedVipTrail = item.id;
    } else if (item.category === 'landing') {
      updated.equippedLandingEffect = item.id;
    }

    onUpdateProgress(updated);
    soundEngine.playVictory();
    hapticsEngine.tap();
    showToast(`Đã trang bị: ${item.name}!`);
  };

  const handleBuy = (item: VipItem) => {
    if (userProgress.coins < item.price) {
      soundEngine.playPanickedScream();
      showToast('Không đủ Xu! Hãy xem Quảng Cáo để nhận thêm Xu nhé!');
      return;
    }

    const updatedUnlocked = [...userProgress.unlockedItems, item.id];
    let updated: UserProgress = {
      ...userProgress,
      coins: userProgress.coins - item.price,
      unlockedItems: updatedUnlocked,
    };

    // Auto-equip upon purchase
    if (item.category === 'skill') {
      updated.equippedCharacterSkill = item.id;
    } else if (item.category === 'slingshot') {
      updated.equippedSlingshot = item.id;
    } else if (item.category === 'trail') {
      updated.equippedVipTrail = item.id;
    } else if (item.category === 'landing') {
      updated.equippedLandingEffect = item.id;
    }

    onUpdateProgress(updated);
    soundEngine.playVictory();
    hapticsEngine.victoryFanfare();
    showToast(`Mở khóa thành công: ${item.name}!`);
  };

  const filteredItems = VIP_ITEMS.filter((item) => item.category === activeTab);

  const isEquipped = (item: VipItem) => {
    if (item.category === 'skill') return userProgress.equippedCharacterSkill === item.id;
    if (item.category === 'slingshot') return userProgress.equippedSlingshot === item.id;
    if (item.category === 'trail') return userProgress.equippedVipTrail === item.id;
    if (item.category === 'landing') return userProgress.equippedLandingEffect === item.id;
    return false;
  };

  const isUnlocked = (item: VipItem) => {
    return item.price === 0 || userProgress.unlockedItems.includes(item.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-slate-900 border border-amber-500/30 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white font-display">
                Cửa Hàng Skill & Súng Bắn VIP
              </h2>
              <p className="text-[11px] text-slate-400">
                Nâng cấp kỹ năng, súng thần và hiệu ứng tiếp đất đỉnh cao
              </p>
            </div>
          </div>

          {/* Coins Badge & Close */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-950/80 border border-amber-500/40 rounded-xl shadow-inner">
              <span className="text-amber-400 text-sm">🪙</span>
              <span className="font-extrabold text-amber-300 text-sm tabular-nums">
                {userProgress.coins}
              </span>
              <span className="text-[10px] text-amber-400/80 font-bold">XU</span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Watch Ad to Earn Coins Banner */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border border-emerald-500/40 p-3 rounded-2xl flex items-center justify-between gap-3 shadow-lg shadow-emerald-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/40 animate-pulse">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1">
                <span>Xem Quảng Cáo Nhận Xu Miễn Phí!</span>
                <span className="px-1.5 py-0.5 bg-emerald-500 text-slate-950 text-[9px] font-black rounded-md">
                  +300 XU
                </span>
              </div>
              <p className="text-[10px] text-slate-300">
                Xem 1 quảng cáo ngắn 5 giây để nhận ngay 300 xu mua sắm đồ VIP
              </p>
            </div>
          </div>

          <button
            onClick={onWatchAdForCoins}
            className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-1 whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
            <span>Xem Ngay</span>
          </button>
        </div>

        {/* Category Tabs */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab('skill')}
            className={`py-2 px-1 text-[11px] font-bold rounded-xl transition-all flex flex-col items-center gap-1 ${
              activeTab === 'skill'
                ? 'bg-amber-950 text-amber-300 border border-amber-500/50 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="text-base">🐾</span>
            <span>Skill Nhân Vật</span>
          </button>
          <button
            onClick={() => setActiveTab('slingshot')}
            className={`py-2 px-1 text-[11px] font-bold rounded-xl transition-all flex flex-col items-center gap-1 ${
              activeTab === 'slingshot'
                ? 'bg-rose-950 text-rose-300 border border-rose-500/50 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="text-base">🎯</span>
            <span>Súng Bắn VIP</span>
          </button>
          <button
            onClick={() => setActiveTab('trail')}
            className={`py-2 px-1 text-[11px] font-bold rounded-xl transition-all flex flex-col items-center gap-1 ${
              activeTab === 'trail'
                ? 'bg-purple-950 text-purple-300 border border-purple-500/50 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="text-base">✨</span>
            <span>Vệt Bay VIP</span>
          </button>
          <button
            onClick={() => setActiveTab('landing')}
            className={`py-2 px-1 text-[11px] font-bold rounded-xl transition-all flex flex-col items-center gap-1 ${
              activeTab === 'landing'
                ? 'bg-sky-950 text-sky-300 border border-sky-500/50 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="text-base">🔥</span>
            <span>Tiếp Đất VIP</span>
          </button>
        </div>

        {/* Items Grid */}
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2.5 max-h-[380px]">
          {filteredItems.map((item) => {
            const unlocked = isUnlocked(item);
            const equipped = isEquipped(item);

            return (
              <div
                key={item.id}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  equipped
                    ? 'bg-slate-900 border-amber-500/60 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30'
                    : unlocked
                    ? 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-950/40 border-slate-800/60 opacity-90'
                }`}
              >
                {/* Left: Icon & Info */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner border"
                    style={{
                      backgroundColor: `${item.accentColor}15`,
                      borderColor: `${item.accentColor}40`,
                    }}
                  >
                    {item.icon}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white">{item.name}</span>
                      <span
                        className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider"
                        style={{
                          backgroundColor: `${item.accentColor}25`,
                          color: item.accentColor,
                        }}
                      >
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5 max-w-[280px] sm:max-w-[340px] leading-snug">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Right: Action Button */}
                <div>
                  {equipped ? (
                    <div className="flex items-center gap-1 px-3 py-1.5 bg-emerald-950 border border-emerald-500/60 text-emerald-300 text-xs font-bold rounded-xl shadow">
                      <Check className="w-3.5 h-3.5" />
                      <span>Đang Dùng</span>
                    </div>
                  ) : unlocked ? (
                    <button
                      onClick={() => handleEquip(item)}
                      className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl transition-all shadow active:scale-95"
                    >
                      Trang Bị
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBuy(item)}
                      className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition-all shadow flex items-center gap-1 active:scale-95 ${
                        userProgress.coins >= item.price
                          ? 'bg-gradient-to-r from-amber-500 to-rose-500 hover:opacity-90 text-white shadow-amber-500/20'
                          : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      <Lock className="w-3 h-3" />
                      <span>{item.price} Xu</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Action Toast Notification */}
        {toastMessage && (
          <div className="bg-amber-950/95 border border-amber-400 text-amber-200 text-xs font-bold px-4 py-2 rounded-xl text-center shadow-lg animate-in fade-in">
            {toastMessage}
          </div>
        )}
      </div>
    </div>
  );
};
