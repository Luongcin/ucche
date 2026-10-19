import React, { useState } from 'react';
import { Settings, Shield, Sliders, DollarSign, Megaphone, BarChart3, RotateCcw, X, Check, Lock, Unlock } from 'lucide-react';
import { PhysicsConfig, AdminMonetizationConfig, UserProgress } from '../types/game';
import { DEFAULT_PHYSICS } from '../utils/storage';

interface AdminPortalModalProps {
  physicsConfig: PhysicsConfig;
  monetizationConfig: AdminMonetizationConfig;
  userProgress: UserProgress;
  onUpdatePhysics: (config: PhysicsConfig) => void;
  onUpdateMonetization: (config: AdminMonetizationConfig) => void;
  onUnlockAllLevels: () => void;
  onResetProgress: () => void;
  onClose: () => void;
}

export const AdminPortalModal: React.FC<AdminPortalModalProps> = ({
  physicsConfig,
  monetizationConfig,
  userProgress,
  onUpdatePhysics,
  onUpdateMonetization,
  onUnlockAllLevels,
  onResetProgress,
  onClose,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true); // default open in dev
  const [passcode, setPasscode] = useState('');
  const [activeTab, setActiveTab] = useState<'physics' | 'monetization' | 'marketing' | 'analytics'>('physics');

  // Local state copies
  const [localPhysics, setLocalPhysics] = useState<PhysicsConfig>(physicsConfig);
  const [localMonetization, setLocalMonetization] = useState<AdminMonetizationConfig>(monetizationConfig);
  const [saveToast, setSaveToast] = useState(false);

  const handleSavePhysics = () => {
    onUpdatePhysics(localPhysics);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  const handleSaveMonetization = () => {
    onUpdateMonetization(localMonetization);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  const handleResetDefaultPhysics = () => {
    setLocalPhysics(DEFAULT_PHYSICS);
    onUpdatePhysics(DEFAULT_PHYSICS);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  // Custom Ad Creator State
  const [showAddAdForm, setShowAddAdForm] = useState(false);
  const [newAdTitle, setNewAdTitle] = useState('');
  const [newAdDesc, setNewAdDesc] = useState('');
  const [newAdType, setNewAdType] = useState<'interstitial' | 'banner' | 'reward'>('interstitial');
  const [newAdSponsor, setNewAdSponsor] = useState('');
  const [newAdUrl, setNewAdUrl] = useState('https://google.com');
  const [newAdCta, setNewAdCta] = useState('Tải Game Ngay');

  const handleAddCustomAd = () => {
    if (!newAdTitle.trim()) return;
    const newAd = {
      id: `ad_${Date.now()}`,
      title: newAdTitle.trim(),
      description: newAdDesc.trim() || 'Ưu đãi đặc biệt từ nhà tài trợ!',
      type: newAdType,
      targetUrl: newAdUrl.trim() || 'https://google.com',
      ctaText: newAdCta.trim() || 'Xem Ngay',
      sponsorName: newAdSponsor.trim() || 'Tài Trợ',
      active: true,
      impressions: 0,
      clicks: 0,
    };
    const updatedAds = [newAd, ...(localMonetization.customAds || [])];
    const updatedConfig = { ...localMonetization, customAds: updatedAds };
    setLocalMonetization(updatedConfig);
    onUpdateMonetization(updatedConfig);
    setNewAdTitle('');
    setNewAdDesc('');
    setShowAddAdForm(false);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  const handleToggleAdActive = (adId: string) => {
    const updatedAds = (localMonetization.customAds || []).map((a) =>
      a.id === adId ? { ...a, active: !a.active } : a
    );
    const updatedConfig = { ...localMonetization, customAds: updatedAds };
    setLocalMonetization(updatedConfig);
    onUpdateMonetization(updatedConfig);
  };

  const handleDeleteAd = (adId: string) => {
    const updatedAds = (localMonetization.customAds || []).filter((a) => a.id !== adId);
    const updatedConfig = { ...localMonetization, customAds: updatedAds };
    setLocalMonetization(updatedConfig);
    onUpdateMonetization(updatedConfig);
  };

  // Calculate Mock drop-off statistics based on actual player deaths
  const totalDeaths = userProgress.totalDeaths;
  const adImpressions = Math.floor(totalDeaths / Math.max(1, localMonetization.adFrequencyDeaths));
  const estimatedEcpm = 2.45; // $2.45 eCPM
  const estimatedEarnings = ((adImpressions * estimatedEcpm) / 1000).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Settings className="w-6 h-6 text-sky-400" />
            <div>
              <h2 className="text-base font-bold text-white font-display">Bảng Điều Khiển Admin & Kiếm Tiền</h2>
              <p className="text-[11px] text-slate-400">Tùy biến độ khó vật lý, phân bổ quảng cáo & marketing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('physics')}
            className={`py-2 px-1 text-[11px] font-bold rounded-lg transition-colors flex flex-col items-center gap-1 ${
              activeTab === 'physics' ? 'bg-sky-950 text-sky-300 border border-sky-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Độ Khó</span>
          </button>
          <button
            onClick={() => setActiveTab('monetization')}
            className={`py-2 px-1 text-[11px] font-bold rounded-lg transition-colors flex flex-col items-center gap-1 ${
              activeTab === 'monetization' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Quảng Cáo</span>
          </button>
          <button
            onClick={() => setActiveTab('marketing')}
            className={`py-2 px-1 text-[11px] font-bold rounded-lg transition-colors flex flex-col items-center gap-1 ${
              activeTab === 'marketing' ? 'bg-amber-950 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Marketing</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-2 px-1 text-[11px] font-bold rounded-lg transition-colors flex flex-col items-center gap-1 ${
              activeTab === 'analytics' ? 'bg-purple-950 text-purple-300 border border-purple-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Thống Kê</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 min-h-[300px]">
          {/* TAB 1: PHYSICS & DIFFICULTY */}
          {activeTab === 'physics' && (
            <div className="flex flex-col gap-3.5 text-xs">
              <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800 space-y-3">
                {/* Gravity */}
                <div>
                  <div className="flex justify-between font-medium text-slate-300 mb-1">
                    <span>Trọng lực Gravity:</span>
                    <span className="font-mono text-sky-400 font-bold">{localPhysics.gravity.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.15"
                    max="0.65"
                    step="0.01"
                    value={localPhysics.gravity}
                    onChange={(e) => setLocalPhysics({ ...localPhysics, gravity: parseFloat(e.target.value) })}
                    className="w-full accent-sky-400 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>Bay bổng (Dễ)</span>
                    <span>Nặng nề (Cực khó)</span>
                  </div>
                </div>

                {/* Slingshot Power */}
                <div>
                  <div className="flex justify-between font-medium text-slate-300 mb-1">
                    <span>Lực bắn Súng cao su:</span>
                    <span className="font-mono text-sky-400 font-bold">{localPhysics.slingshotPower.toFixed(3)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.08"
                    max="0.28"
                    step="0.005"
                    value={localPhysics.slingshotPower}
                    onChange={(e) => setLocalPhysics({ ...localPhysics, slingshotPower: parseFloat(e.target.value) })}
                    className="w-full accent-sky-400 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Tray Friction */}
                <div>
                  <div className="flex justify-between font-medium text-slate-300 mb-1">
                    <span>Độ bám của Khay (Ma sát lăn):</span>
                    <span className="font-mono text-sky-400 font-bold">{localPhysics.trayFriction.toFixed(3)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.92"
                    max="0.99"
                    step="0.005"
                    value={localPhysics.trayFriction}
                    onChange={(e) => setLocalPhysics({ ...localPhysics, trayFriction: parseFloat(e.target.value) })}
                    className="w-full accent-sky-400 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>Dính chặt (Dễ)</span>
                    <span>Trơn trượt (Cực cay)</span>
                  </div>
                </div>

                {/* Ball Bounciness */}
                <div>
                  <div className="flex justify-between font-medium text-slate-300 mb-1">
                    <span>Độ đàn hồi của Quả Cầu:</span>
                    <span className="font-mono text-sky-400 font-bold">{localPhysics.ballBounciness.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="0.7"
                    step="0.05"
                    value={localPhysics.ballBounciness}
                    onChange={(e) => setLocalPhysics({ ...localPhysics, ballBounciness: parseFloat(e.target.value) })}
                    className="w-full accent-sky-400 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Safety Rails (God mode for test) */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <div>
                    <span className="font-bold text-slate-200 block">Thanh Chắn An Toàn (Test Map):</span>
                    <span className="text-[10px] text-slate-400">Bóng không bao giờ rớt khỏi khay khi nhảy</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={localPhysics.safetyGuardRails}
                    onChange={(e) => setLocalPhysics({ ...localPhysics, safetyGuardRails: e.target.checked })}
                    className="w-5 h-5 accent-sky-400 rounded cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSavePhysics}
                  className="flex-1 py-2.5 px-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Áp Dụng Vật Lý Ngay</span>
                </button>
                <button
                  onClick={handleResetDefaultPhysics}
                  className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition-colors"
                  title="Khôi phục mặc định"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: MONETIZATION & ADS */}
          {activeTab === 'monetization' && (
            <div className="flex flex-col gap-3 text-xs">
              <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800 space-y-3">
                {/* Interstitial Ad switch */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-200 block">Quảng Cáo Chuyển Cảnh (Interstitial):</span>
                    <span className="text-[10px] text-slate-400">Hiện popup quảng cáo sau số lần chết để tăng doanh thu</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={localMonetization.enableInterstitialAds}
                    onChange={(e) => setLocalMonetization({ ...localMonetization, enableInterstitialAds: e.target.checked })}
                    className="w-5 h-5 accent-emerald-400 rounded cursor-pointer"
                  />
                </div>

                {/* Ad frequency */}
                {localMonetization.enableInterstitialAds && (
                  <div>
                    <div className="flex justify-between font-medium text-slate-300 mb-1">
                      <span>Tần suất xuất hiện quảng cáo:</span>
                      <span className="font-mono text-emerald-400 font-bold">Cứ sau {localMonetization.adFrequencyDeaths} lần chết</span>
                    </div>
                    <input
                      type="range"
                      min="3"
                      max="15"
                      step="1"
                      value={localMonetization.adFrequencyDeaths}
                      onChange={(e) => setLocalMonetization({ ...localMonetization, adFrequencyDeaths: parseInt(e.target.value) })}
                      className="w-full accent-emerald-400 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="text-[10px] text-slate-400 mt-1">
                      Khuyên dùng: 5 - 7 lần chết để không gây khó chịu nhưng vẫn tối ưu hóa lượt hiển thị.
                    </div>
                  </div>
                )}

                {/* Reward Ads */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <div>
                    <span className="font-bold text-slate-200 block">Quảng Cáo Nhận Thưởng (Reward Video):</span>
                    <span className="text-[10px] text-slate-400">Xem quảng cáo 5s để nhận 1 Khiên Bảo Vệ</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={localMonetization.enableRewardAds}
                    onChange={(e) => setLocalMonetization({ ...localMonetization, enableRewardAds: e.target.checked })}
                    className="w-5 h-5 accent-emerald-400 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* SECTION: ADMIN THÊM & QUẢN LÝ QUẢNG CÁO */}
              <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-100 text-xs">Quản Lý Các Mẫu Quảng Cáo ({localMonetization.customAds?.length || 0})</h3>
                    <p className="text-[10px] text-slate-400">Admin tự thêm các banner, popup chuyển cảnh và video thưởng</p>
                  </div>
                  <button
                    onClick={() => setShowAddAdForm(!showAddAdForm)}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1"
                  >
                    <span>{showAddAdForm ? 'Đóng Form' : '+ Thêm Quảng Cáo'}</span>
                  </button>
                </div>

                {/* Form Thêm Quảng Cáo Mới */}
                {showAddAdForm && (
                  <div className="p-3 bg-slate-900 border border-emerald-500/40 rounded-xl space-y-2 animate-in fade-in">
                    <span className="font-bold text-emerald-400 text-[11px] block">Tạo Quảng Cáo Mới Cho Admin:</span>

                    <div>
                      <label className="text-[10px] text-slate-300 block mb-0.5">Tiêu đề chiến dịch:</label>
                      <input
                        type="text"
                        value={newAdTitle}
                        onChange={(e) => setNewAdTitle(e.target.value)}
                        placeholder="Ví dụ: Siêu Phẩm Robot 3D Mới Ra Mắt"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-slate-100 text-[11px] focus:outline-none focus:border-emerald-400"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-300 block mb-0.5">Mô tả / Slogan quảng cáo:</label>
                      <textarea
                        value={newAdDesc}
                        onChange={(e) => setNewAdDesc(e.target.value)}
                        placeholder="Mô tả hấp dẫn người chơi bấm vào..."
                        rows={2}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-slate-100 text-[11px] focus:outline-none focus:border-emerald-400"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-300 block mb-0.5">Loại hình QC:</label>
                        <select
                          value={newAdType}
                          onChange={(e) => setNewAdType(e.target.value as 'interstitial' | 'banner' | 'reward')}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-slate-100 text-[11px] focus:outline-none focus:border-emerald-400"
                        >
                          <option value="interstitial">Chuyển Cảnh (Interstitial)</option>
                          <option value="reward">Video Thưởng (Reward)</option>
                          <option value="banner">Banner Đầu Game (Banner)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-300 block mb-0.5">Thương hiệu / Sponsor:</label>
                        <input
                          type="text"
                          value={newAdSponsor}
                          onChange={(e) => setNewAdSponsor(e.target.value)}
                          placeholder="Ví dụ: TechBrand VN"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-slate-100 text-[11px] focus:outline-none focus:border-emerald-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-300 block mb-0.5">Link đích (URL):</label>
                        <input
                          type="text"
                          value={newAdUrl}
                          onChange={(e) => setNewAdUrl(e.target.value)}
                          placeholder="https://..."
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-slate-100 text-[11px] focus:outline-none focus:border-emerald-400"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-300 block mb-0.5">Nút bấm (CTA Text):</label>
                        <input
                          type="text"
                          value={newAdCta}
                          onChange={(e) => setNewAdCta(e.target.value)}
                          placeholder="Ví dụ: Tải Ngay, Xem Thêm"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-slate-100 text-[11px] focus:outline-none focus:border-emerald-400"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleAddCustomAd}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors shadow-md"
                    >
                      + Lưu & Kích Hoạt Quảng Cáo Này
                    </button>
                  </div>
                )}

                {/* Danh Sách Các Quảng Cáo Hiện Có */}
                <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto pr-1">
                  {(localMonetization.customAds || []).map((ad) => (
                    <div
                      key={ad.id}
                      className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between gap-2"
                    >
                      <div className="truncate flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded uppercase ${
                            ad.type === 'reward' ? 'bg-amber-950 text-amber-300 border border-amber-500/30' :
                            ad.type === 'interstitial' ? 'bg-purple-950 text-purple-300 border border-purple-500/30' :
                            'bg-sky-950 text-sky-300 border border-sky-500/30'
                          }`}>
                            {ad.type}
                          </span>
                          <span className="font-bold text-slate-100 text-[11px] truncate">{ad.title}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">{ad.description}</p>
                        <div className="text-[9px] text-slate-500 mt-0.5">
                          👁️ {ad.impressions || 0} hiển thị · 👆 {ad.clicks || 0} click · {ad.targetUrl}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleToggleAdActive(ad.id)}
                          className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                            ad.active ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          {ad.active ? 'Bật' : 'Tắt'}
                        </button>
                        <button
                          onClick={() => handleDeleteAd(ad.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                          title="Xóa quảng cáo"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSaveMonetization}
                className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/50"
              >
                <Check className="w-4 h-4" />
                <span>Lưu Tất Cả Cấu Hình Quảng Cáo</span>
              </button>
            </div>
          )}

          {/* TAB 3: MARKETING */}
          {activeTab === 'marketing' && (
            <div className="flex flex-col gap-3 text-xs">
              <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-200 block">Hiển Thị Banner Marketing:</span>
                    <span className="text-[10px] text-slate-400">Chạy dải banner tài trợ / tải game ở đầu hoặc chân trang</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={localMonetization.showMarketingBanner}
                    onChange={(e) => setLocalMonetization({ ...localMonetization, showMarketingBanner: e.target.checked })}
                    className="w-5 h-5 accent-amber-400 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nội Dung Thông Điệp Marketing:</label>
                  <input
                    type="text"
                    value={localMonetization.sponsorBannerText}
                    onChange={(e) => setLocalMonetization({ ...localMonetization, sponsorBannerText: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 text-xs focus:outline-none focus:border-amber-400"
                    placeholder="Nhập thông điệp marketing..."
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Đường Dẫn Đích (Affiliate / Web URL):</label>
                  <input
                    type="text"
                    value={localMonetization.sponsorBannerLink}
                    onChange={(e) => setLocalMonetization({ ...localMonetization, sponsorBannerLink: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 text-xs focus:outline-none focus:border-amber-400"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nhãn Nút Kêu Gọi Hành Động (CTA Label):</label>
                  <input
                    type="text"
                    value={localMonetization.sponsorCtaLabel}
                    onChange={(e) => setLocalMonetization({ ...localMonetization, sponsorCtaLabel: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 text-xs focus:outline-none focus:border-amber-400"
                    placeholder="Ví dụ: Tải Ngay, Chia Sẻ, Ủng Hộ..."
                  />
                </div>
              </div>

              <button
                onClick={handleSaveMonetization}
                className="w-full py-2.5 px-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Cập Nhật Chiến Dịch Marketing</span>
              </button>
            </div>
          )}

          {/* TAB 4: ANALYTICS & DROP-OFF */}
          {activeTab === 'analytics' && (
            <div className="flex flex-col gap-3 text-xs">
              {/* Financial Metrics */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block">Lượt Xem QC</span>
                  <span className="text-base font-bold text-emerald-400 tabular-nums">{adImpressions}</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block">eCPM Ước Tính</span>
                  <span className="text-base font-bold text-sky-400 tabular-nums">${estimatedEcpm}</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block">Doanh Thu QC</span>
                  <span className="text-base font-bold text-yellow-400 tabular-nums">${estimatedEarnings}</span>
                </div>
              </div>

              {/* Drop-off funnel analysis */}
              <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
                <h3 className="font-bold text-slate-200 mb-2">Phân Tích Tỷ Lệ Rớt (Drop-Off Funnel)</h3>
                <p className="text-[11px] text-slate-400 mb-2">
                  Màn chơi có tỷ lệ chết cao đột biến thường là điểm nghẽn khiến người chơi bỏ game. Admin nên giảm bớt chướng ngại vật ở các màn này.
                </p>

                <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                  {Array.from({ length: 20 }, (_, i) => i + 1).map((lvl) => {
                    const stat = userProgress.levelStats[lvl];
                    const deaths = stat ? stat.deaths : 0;
                    const isCompleted = stat ? stat.completed : false;

                    return (
                      <div key={lvl} className="flex items-center justify-between py-1 border-b border-slate-900 text-[11px]">
                        <span className="text-slate-300 font-medium">Màn {lvl}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-rose-400 tabular-nums">{deaths} lần chết</span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${isCompleted ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                            {isCompleted ? 'Đã Qua' : 'Chưa'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Admin Quick Actions */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={onUnlockAllLevels}
                  className="py-2 px-3 bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-700/50 font-bold rounded-xl transition-colors flex items-center justify-center gap-1"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Mở Khóa Toàn Bộ Màn</span>
                </button>
                <button
                  onClick={onResetProgress}
                  className="py-2 px-3 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-700/50 font-bold rounded-xl transition-colors flex items-center justify-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Tiến Độ Chơi</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Save confirmation toast */}
        {saveToast && (
          <div className="py-1.5 px-3 bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-semibold rounded-xl text-center animate-in fade-in">
            ✓ Đã lưu thay đổi thành công!
          </div>
        )}
      </div>
    </div>
  );
};
