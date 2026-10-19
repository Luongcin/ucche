export type GameStatus = 'TITLE' | 'PLAYING' | 'FAIL_ROAST' | 'VICTORY' | 'LEVEL_SELECT' | 'LEADERBOARD' | 'ADMIN';

export interface Vector2D {
  x: number;
  y: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  shape?: 'circle' | 'spark' | 'ring' | 'bubble';
}

export interface CrocodileData {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  swimPhase: number;
  jawOpen: number; // 0 to 1
  isSnapping: boolean;
}

export interface Obstacle {
  id: string;
  type: 'platform' | 'ice' | 'bouncy' | 'laser' | 'fan' | 'moving_platform' | 'spike' | 'crocodile_pit';
  x: number;
  y: number;
  w: number;
  h: number;
  color?: string;
  // Specific properties
  vx?: number;
  vy?: number;
  minY?: number;
  maxY?: number;
  minX?: number;
  maxX?: number;
  windForce?: Vector2D;
  laserActive?: boolean;
  laserCycle?: number;
  laserPeriod?: number;
  laserActiveTime?: number;
  crocodiles?: CrocodileData[];
}

export interface LevelGoal {
  x: number;
  y: number;
  radius: number;
}

export interface LevelData {
  id: number;
  title: string;
  subtitle: string;
  parDeaths: number;
  startPos: Vector2D;
  goal: LevelGoal;
  obstacles: Obstacle[];
  chasmCount: number; // Number of chasms in this level (at least 20)
  totalWidth: number;
  trayLength?: number;
  tip?: string;
}

export interface PhysicsConfig {
  gravity: number;
  ballFriction: number;
  ballBounciness: number;
  trayFriction: number;
  slingshotPower: number;
  airResistance: number;
  safetyGuardRails: boolean;
}

export interface CustomAd {
  id: string;
  title: string;
  description: string;
  type: 'interstitial' | 'banner' | 'reward';
  targetUrl: string;
  ctaText: string;
  sponsorName?: string;
  bgColor?: string;
  active: boolean;
  impressions: number;
  clicks: number;
}

export interface AdminMonetizationConfig {
  enableInterstitialAds: boolean;
  adFrequencyDeaths: number;
  enableRewardAds: boolean;
  sponsorBannerText: string;
  sponsorBannerLink: string;
  sponsorCtaLabel: string;
  showMarketingBanner: boolean;
  customAds: CustomAd[];
}

export interface VipItem {
  id: string;
  name: string;
  category: 'skill' | 'slingshot' | 'trail' | 'landing';
  price: number;
  description: string;
  badge: string;
  icon: string;
  accentColor: string;
}

export interface UserProgress {
  unlockedLevel: number;
  levelStats: Record<number, {
    completed: boolean;
    bestTime: number;
    deaths: number;
    stars: number;
  }>;
  totalDeaths: number;
  bubbleShieldCount: number;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  coins: number;
  equippedCharacterSkill: string;
  equippedSlingshot: string;
  equippedVipTrail: string;
  equippedLandingEffect: string;
  unlockedItems: string[];
}

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  level: number;
  deaths: number;
  timeSeconds: number;
  badge: string;
  date: string;
}
