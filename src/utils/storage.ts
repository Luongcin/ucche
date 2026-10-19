import { PhysicsConfig, AdminMonetizationConfig, UserProgress, LeaderboardEntry } from '../types/game';

const PROGRESS_KEY = 'robobalance_progress_v1';
const PHYSICS_KEY = 'robobalance_physics_v1';
const MONETIZATION_KEY = 'robobalance_monetization_v1';
const LEADERBOARD_KEY = 'robobalance_leaderboard_v1';

export const DEFAULT_PHYSICS: PhysicsConfig = {
  gravity: 0.38,
  ballFriction: 0.992,
  ballBounciness: 0.35,
  trayFriction: 0.965,
  slingshotPower: 0.165,
  airResistance: 0.998,
  safetyGuardRails: false,
};

export const DEFAULT_MONETIZATION: AdminMonetizationConfig = {
  enableInterstitialAds: true,
  adFrequencyDeaths: 5,
  enableRewardAds: true,
  sponsorBannerText: '🔥 Thần Cân Quả Cầu - Vượt 20 vực sâu cá sấu! Thử thách kiên nhẫn số 1 VN!',
  sponsorBannerLink: 'https://ais-dev-e655fln4bwrtvh65d6obwh-15689533708.asia-east1.run.app',
  sponsorCtaLabel: 'Chia Sẻ Ngay',
  showMarketingBanner: true,
  customAds: [
    {
      id: 'ad_1',
      title: '🌟 ROBOT RUNNER 3D - GAME SIÊU TỐC ĐỘ',
      description: 'Chinh phục hơn 100 màn chơi vũ trụ với đồ họa cyber đỉnh cao. Tải ngay hôm nay nhận quà tân thủ!',
      type: 'interstitial',
      targetUrl: 'https://google.com',
      ctaText: 'CÀI ĐẶT MIỄN PHÍ',
      sponsorName: 'CyberStudio VN',
      bgColor: 'from-purple-950 via-slate-900 to-indigo-950',
      active: true,
      impressions: 42,
      clicks: 9,
    },
    {
      id: 'ad_2',
      title: '🛡️ BẢO VỆ QUẢ CẦU VỚI KHIÊN TỪ TÍNH',
      description: 'Xem hết quảng cáo tài trợ 5 giây để nhận ngay 1 Khiên Bảo Vệ Quả Cầu không vỡ!',
      type: 'reward',
      targetUrl: 'https://google.com',
      ctaText: 'NHẬN THƯỞNG KHIÊN',
      sponsorName: 'RoboShield Labs',
      bgColor: 'from-emerald-950 via-slate-900 to-teal-950',
      active: true,
      impressions: 68,
      clicks: 24,
    },
    {
      id: 'ad_3',
      title: '⚡ TRÀ SỮA TỈNH TÁO CHO GAME THỦ',
      description: 'Nạp năng lượng vượt qua 20 vực sâu cá sấu cùng combo nước uống tăng lực!',
      type: 'banner',
      targetUrl: 'https://google.com',
      ctaText: 'ĐẶT NGAY GIẢM 50%',
      sponsorName: 'GameFuel VN',
      bgColor: 'from-amber-950 via-slate-900 to-orange-950',
      active: true,
      impressions: 120,
      clicks: 18,
    },
  ],
};

export const DEFAULT_PROGRESS: UserProgress = {
  unlockedLevel: 1,
  levelStats: {},
  totalDeaths: 0,
  bubbleShieldCount: 1, // Start with 1 free shield!
  soundEnabled: true,
  hapticsEnabled: true,
  coins: 300,
  equippedCharacterSkill: 'none',
  equippedSlingshot: 'classic',
  equippedVipTrail: 'classic_stars',
  equippedLandingEffect: 'smoke_sparks',
  unlockedItems: ['none', 'classic', 'classic_stars', 'smoke_sparks'],
};

export const INITIAL_LEADERBOARD: LeaderboardEntry[] = [
  { id: '1', playerName: 'Thánh Lì Đòn Hà Nội', level: 12, deaths: 142, timeSeconds: 38.4, badge: '🔥 Siêu Kiên Trì', date: 'Hôm nay' },
  { id: '2', playerName: 'ProGamer Sài Gòn', level: 12, deaths: 3, timeSeconds: 19.8, badge: '⚡ Bách Phát Bách Trúng', date: 'Hôm qua' },
  { id: '3', playerName: 'Nghiêng Là Đổ', level: 11, deaths: 98, timeSeconds: 45.2, badge: '😭 Vua Vỡ Bóng', date: 'Hôm nay' },
  { id: '4', playerName: 'Bàn Tay Vàng', level: 12, deaths: 12, timeSeconds: 24.1, badge: '💎 Thần Cân', date: '3 ngày trước' },
  { id: '5', playerName: 'Cú Nhảy Vô Tận', level: 10, deaths: 76, timeSeconds: 52.0, badge: '🎯 Kiên Cường', date: 'Tuần này' },
  { id: '6', playerName: 'RageQuitter99', level: 7, deaths: 115, timeSeconds: 78.5, badge: '💢 Thánh Cay Cú', date: 'Hôm nay' },
];

export function loadProgress(): UserProgress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (raw) {
      return { ...DEFAULT_PROGRESS, ...JSON.parse(raw) };
    }
  } catch {
    // Local storage disabled or error
  }
  return DEFAULT_PROGRESS;
}

export function saveProgress(progress: UserProgress) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // Ignore
  }
}

export function loadPhysicsConfig(): PhysicsConfig {
  try {
    const raw = localStorage.getItem(PHYSICS_KEY);
    if (raw) {
      return { ...DEFAULT_PHYSICS, ...JSON.parse(raw) };
    }
  } catch {
    // Ignore
  }
  return DEFAULT_PHYSICS;
}

export function savePhysicsConfig(config: PhysicsConfig) {
  try {
    localStorage.setItem(PHYSICS_KEY, JSON.stringify(config));
  } catch {
    // Ignore
  }
}

export function loadMonetizationConfig(): AdminMonetizationConfig {
  try {
    const raw = localStorage.getItem(MONETIZATION_KEY);
    if (raw) {
      return { ...DEFAULT_MONETIZATION, ...JSON.parse(raw) };
    }
  } catch {
    // Ignore
  }
  return DEFAULT_MONETIZATION;
}

export function saveMonetizationConfig(config: AdminMonetizationConfig) {
  try {
    localStorage.setItem(MONETIZATION_KEY, JSON.stringify(config));
  } catch {
    // Ignore
  }
}

export function loadLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // Ignore
  }
  return INITIAL_LEADERBOARD;
}

export function recordScoreToLeaderboard(entry: Omit<LeaderboardEntry, 'id' | 'date'>) {
  try {
    const current = loadLeaderboard();
    const newEntry: LeaderboardEntry = {
      ...entry,
      id: Math.random().toString(36).substring(2, 9),
      date: 'Vừa xong',
    };
    const updated = [newEntry, ...current].slice(0, 20);
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return INITIAL_LEADERBOARD;
  }
}
