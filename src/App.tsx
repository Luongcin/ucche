import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameStatus, LevelData, PhysicsConfig, AdminMonetizationConfig, UserProgress, LeaderboardEntry } from './types/game';
import { GAME_LEVELS } from './data/levels';
import { PhysicsEngine } from './game/physicsEngine';
import { soundEngine } from './utils/audio';
import { hapticsEngine } from './utils/haptics';
import {
  loadProgress,
  saveProgress,
  loadPhysicsConfig,
  savePhysicsConfig,
  loadMonetizationConfig,
  saveMonetizationConfig,
  loadLeaderboard,
  recordScoreToLeaderboard,
} from './utils/storage';

// Components
import { GameCanvas } from './components/GameCanvas';
import { TwoThumbControlsOverlay } from './components/TwoThumbControlsOverlay';
import { CourseMinimap } from './components/CourseMinimap';
import { RageRoastModal } from './components/RageRoastModal';
import { VictoryModal } from './components/VictoryModal';
import { LevelSelectModal } from './components/LevelSelectModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { AdminPortalModal } from './components/AdminPortalModal';
import { TitleScreenModal } from './components/TitleScreenModal';
import { AdSimulationModal } from './components/AdSimulationModal';
import { MarketingAdBanner } from './components/MarketingAdBanner';
import { VipShopModal } from './components/VipShopModal';

export default function App() {
  // Persistent State
  const [progress, setProgress] = useState<UserProgress>(loadProgress);
  const [physicsConfig, setPhysicsConfig] = useState<PhysicsConfig>(loadPhysicsConfig);
  const [monetizationConfig, setMonetizationConfig] = useState<AdminMonetizationConfig>(loadMonetizationConfig);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(loadLeaderboard);

  // Gameplay State
  const [currentLevelId, setCurrentLevelId] = useState<number>(() => {
    return Math.min(progress.unlockedLevel, GAME_LEVELS.length);
  });
  const currentLevel: LevelData = GAME_LEVELS.find((l) => l.id === currentLevelId) || GAME_LEVELS[0];

  const [deathsThisLevel, setDeathsThisLevel] = useState<number>(0);
  const [levelStartTime, setLevelStartTime] = useState<number>(() => Date.now());
  const [hasShield, setHasShield] = useState<boolean>(false);
  const [bgmActive, setBgmActive] = useState<boolean>(true);

  // Map Navigation & Pan Preview State
  const [isPanMode, setIsPanMode] = useState<boolean>(false);
  const [characterX, setCharacterX] = useState<number>(currentLevel.startPos.x);

  // Modals & Screen States
  const [isTitleOpen, setIsTitleOpen] = useState<boolean>(true);
  const [isRoastOpen, setIsRoastOpen] = useState<boolean>(false);
  const [isVictoryOpen, setIsVictoryOpen] = useState<boolean>(false);
  const [isShopOpen, setIsShopOpen] = useState<boolean>(false);
  const [autoAdvanceCountdown, setAutoAdvanceCountdown] = useState<number | null>(null);
  const [isLevelSelectOpen, setIsLevelSelectOpen] = useState<boolean>(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);

  // Quick Comic Death Toast (when auto-respawning back to start without blocking modal)
  const [deathToast, setDeathToast] = useState<string | null>(null);

  // Ad simulation state
  const [isAdOpen, setIsAdOpen] = useState<boolean>(false);
  const [isRewardAd, setIsRewardAd] = useState<boolean>(false);
  const [rewardType, setRewardType] = useState<'shield' | 'coins'>('shield');
  const deathsSinceLastAdRef = useRef<number>(0);
  const autoNextTimerRef = useRef<number | null>(null);

  // Screenshot captures
  const [failReason, setFailReason] = useState<string>('');
  const [lastScreenshot, setLastScreenshot] = useState<string>('');
  const [victoryTime, setVictoryTime] = useState<number>(0);
  const [victoryStars, setVictoryStars] = useState<number>(3);

  // Engine ref
  const engineRef = useRef<PhysicsEngine | null>(null);

  // Sync audio & haptics settings
  useEffect(() => {
    soundEngine.setEnabled(progress.soundEnabled);
    hapticsEngine.setEnabled(progress.hapticsEnabled);
  }, [progress.soundEnabled, progress.hapticsEnabled]);

  // Periodic position tracker for Minimap
  useEffect(() => {
    const interval = setInterval(() => {
      if (engineRef.current) {
        setCharacterX(engineRef.current.character.x);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Handle Game Fail / Slipping into Crocodiles: Auto-respawn to start!
  const handleFail = useCallback((reason: string, screenshot: string) => {
    setFailReason(reason);
    setLastScreenshot(screenshot);

    setDeathsThisLevel((prev) => prev + 1);
    deathsSinceLastAdRef.current += 1;

    // Show comic death banner
    setDeathToast(reason || 'Phanh cháy chân trượt thẳng vào hồ cá sấu!');
    setTimeout(() => {
      setDeathToast(null);
    }, 1600);

    // Update global death stats
    setProgress((prev) => {
      const updatedTotal = prev.totalDeaths + 1;
      const currentLevelStats = prev.levelStats[currentLevelId] || { completed: false, bestTime: 999, deaths: 0, stars: 0 };
      const updated: UserProgress = {
        ...prev,
        totalDeaths: updatedTotal,
        levelStats: {
          ...prev.levelStats,
          [currentLevelId]: {
            ...currentLevelStats,
            deaths: currentLevelStats.deaths + 1,
          },
        },
      };
      saveProgress(updated);
      return updated;
    });

    // Check if Interstitial Ad should trigger based on Admin frequency
    if (
      monetizationConfig.enableInterstitialAds &&
      deathsSinceLastAdRef.current >= monetizationConfig.adFrequencyDeaths
    ) {
      deathsSinceLastAdRef.current = 0;
      setIsRewardAd(false);
      setIsAdOpen(true);
    }
  }, [currentLevelId, monetizationConfig]);

  // Go to Next Level (supports automatic advance and manual click)
  const handleNextLevel = useCallback(() => {
    if (autoNextTimerRef.current) {
      clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }
    setAutoAdvanceCountdown(null);
    setIsVictoryOpen(false);
    const nextId = Math.min(GAME_LEVELS.length, currentLevelId + 1);
    setCurrentLevelId(nextId);
    setDeathsThisLevel(0);
    setLevelStartTime(Date.now());
    setHasShield(false);
    setIsPanMode(false);
  }, [currentLevelId]);

  // Handle Game Victory
  const handleWin = useCallback((screenshot: string) => {
    const elapsedSeconds = Math.max(0.5, (Date.now() - levelStartTime) / 1000);
    setVictoryTime(elapsedSeconds);
    setLastScreenshot(screenshot);

    let stars = 3;
    if (deathsThisLevel > currentLevel.parDeaths + 4) {
      stars = 1;
    } else if (deathsThisLevel > currentLevel.parDeaths) {
      stars = 2;
    }
    setVictoryStars(stars);

    setProgress((prev) => {
      const nextUnlocked = Math.max(prev.unlockedLevel, Math.min(GAME_LEVELS.length, currentLevelId + 1));
      const currentStat = prev.levelStats[currentLevelId];
      const bestTime = currentStat ? Math.min(currentStat.bestTime, elapsedSeconds) : elapsedSeconds;

      const updated: UserProgress = {
        ...prev,
        coins: (prev.coins || 0) + 150, // Thưởng 150 Xu khi vượt màn thành công!
        unlockedLevel: nextUnlocked,
        levelStats: {
          ...prev.levelStats,
          [currentLevelId]: {
            completed: true,
            bestTime,
            deaths: deathsThisLevel,
            stars: Math.max(currentStat?.stars || 0, stars),
          },
        },
      };
      saveProgress(updated);
      return updated;
    });

    const updatedLeaderboard = recordScoreToLeaderboard({
      playerName: 'Bé Bông (Bạn)',
      level: currentLevelId,
      deaths: deathsThisLevel,
      timeSeconds: elapsedSeconds,
      badge: stars === 3 ? '⭐ Thần Bắn' : '🎯 Vượt Ải',
    });
    setLeaderboard(updatedLeaderboard);

    setIsVictoryOpen(true);

    // Auto advance to next level after 2s
    if (currentLevelId < GAME_LEVELS.length) {
      setAutoAdvanceCountdown(2);
      autoNextTimerRef.current = window.setTimeout(() => {
        handleNextLevel();
      }, 2000);
    }
  }, [currentLevelId, currentLevel, deathsThisLevel, levelStartTime, handleNextLevel]);

  // Restart to checkpoint or start immediately
  const handleInstantRestart = useCallback(() => {
    if (autoNextTimerRef.current) {
      clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }
    setAutoAdvanceCountdown(null);
    setIsRoastOpen(false);
    setIsVictoryOpen(false);
    setFailReason('');
    setLastScreenshot('');
    setIsPanMode(false);
    if (engineRef.current) {
      engineRef.current.resetPan();
      engineRef.current.reset(hasShield);
    }
  }, [hasShield]);

  // Return to Main Menu (Thoát về Màn Hình Chính)
  const handleReturnHome = () => {
    soundEngine.stopBgm();
    setIsTitleOpen(true);
    setIsRoastOpen(false);
    setIsVictoryOpen(false);
    setIsPanMode(false);
    if (engineRef.current) {
      engineRef.current.resetPan();
      engineRef.current.reset(false);
    }
  };

  // Replay current level
  const handleReplayLevel = () => {
    if (autoNextTimerRef.current) {
      clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }
    setAutoAdvanceCountdown(null);
    setIsVictoryOpen(false);
    setDeathsThisLevel(0);
    setLevelStartTime(Date.now());
    setHasShield(false);
    setIsPanMode(false);
    if (engineRef.current) {
      engineRef.current.resetPan();
      engineRef.current.reset(false);
    }
  };

  // Switch level from LevelSelect
  const handleSelectLevel = (levelId: number) => {
    if (autoNextTimerRef.current) {
      clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }
    setAutoAdvanceCountdown(null);
    setCurrentLevelId(levelId);
    setDeathsThisLevel(0);
    setLevelStartTime(Date.now());
    setHasShield(false);
    setIsPanMode(false);
    setIsRoastOpen(false);
    setIsVictoryOpen(false);
  };

  // Sound and Haptics toggles
  const handleToggleSound = () => {
    setProgress((prev) => {
      const nextVal = !prev.soundEnabled;
      const updated = { ...prev, soundEnabled: nextVal };
      saveProgress(updated);
      soundEngine.setEnabled(nextVal);
      return updated;
    });
  };

  const handleToggleBgm = () => {
    const nextBgm = !bgmActive;
    setBgmActive(nextBgm);
    soundEngine.setBgmEnabled(nextBgm);
  };

  const handleToggleHaptics = () => {
    setProgress((prev) => {
      const nextVal = !prev.hapticsEnabled;
      const updated = { ...prev, hapticsEnabled: nextVal };
      saveProgress(updated);
      hapticsEngine.setEnabled(nextVal);
      return updated;
    });
  };

  // Shield activator
  const handleUseShield = () => {
    if (progress.bubbleShieldCount > 0 && !hasShield) {
      setProgress((prev) => {
        const updated = { ...prev, bubbleShieldCount: prev.bubbleShieldCount - 1 };
        saveProgress(updated);
        return updated;
      });
      setHasShield(true);
      if (engineRef.current) {
        engineRef.current.character.hasShield = true;
      }
    }
  };

  // Watch Reward Ad to earn a Bubble Shield
  const handleWatchRewardAd = () => {
    setIsRoastOpen(false);
    setRewardType('shield');
    setIsRewardAd(true);
    setIsAdOpen(true);
  };

  // Watch Reward Ad to earn +300 Coins for VIP Shop
  const handleWatchAdForCoins = () => {
    setIsShopOpen(false);
    setRewardType('coins');
    setIsRewardAd(true);
    setIsAdOpen(true);
  };

  const handleAdCompleted = () => {
    if (isRewardAd) {
      if (rewardType === 'coins') {
        setProgress((prev) => {
          const updated = { ...prev, coins: (prev.coins || 0) + 300 };
          saveProgress(updated);
          return updated;
        });
        soundEngine.playVictory();
        hapticsEngine.victoryFanfare();
        setIsShopOpen(true);
        return;
      } else {
        setProgress((prev) => {
          const updated = { ...prev, bubbleShieldCount: prev.bubbleShieldCount + 1 };
          saveProgress(updated);
          return updated;
        });
        setHasShield(true);
        if (engineRef.current) {
          engineRef.current.character.hasShield = true;
        }
      }
    }
    handleInstantRestart();
  };

  // Camera Peek Actions
  const handleTogglePanMode = () => {
    setIsPanMode((prev) => {
      const next = !prev;
      if (!next && engineRef.current) {
        engineRef.current.resetPan();
      }
      return next;
    });
  };

  const handlePeekGoal = () => {
    if (engineRef.current) {
      engineRef.current.setPeekTarget(currentLevel.goal.x);
      setTimeout(() => {
        engineRef.current?.setPeekTarget(null);
      }, 2500);
    }
  };

  const handleReturnToRobot = () => {
    setIsPanMode(false);
    if (engineRef.current) {
      engineRef.current.resetPan();
    }
  };

  // Admin updates
  const handleUpdatePhysics = (newConfig: PhysicsConfig) => {
    setPhysicsConfig(newConfig);
    savePhysicsConfig(newConfig);
    if (engineRef.current) {
      engineRef.current.config = newConfig;
    }
  };

  const handleUpdateMonetization = (newConfig: AdminMonetizationConfig) => {
    setMonetizationConfig(newConfig);
    saveMonetizationConfig(newConfig);
  };

  const handleUnlockAllLevels = () => {
    setProgress((prev) => {
      const updated = { ...prev, unlockedLevel: GAME_LEVELS.length };
      saveProgress(updated);
      return updated;
    });
  };

  const handleResetProgress = () => {
    localStorage.clear();
    const fresh = loadProgress();
    setProgress(fresh);
    setCurrentLevelId(1);
    setDeathsThisLevel(0);
    if (engineRef.current) {
      engineRef.current.reset(false);
    }
  };

  const activeAdForModal = monetizationConfig.customAds?.find((ad) =>
    ad.active && (isRewardAd ? ad.type === 'reward' : ad.type === 'interstitial')
  ) || monetizationConfig.customAds?.[0];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Admin Configurable Marketing Banner (Top) */}
      <MarketingAdBanner config={monetizationConfig} />

      {/* Main Canvas Area */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        <GameCanvas
          level={currentLevel}
          physicsConfig={physicsConfig}
          hasShield={hasShield}
          isPanMode={isPanMode}
          equippedSkill={progress.equippedCharacterSkill}
          equippedSlingshot={progress.equippedSlingshot}
          equippedTrail={progress.equippedVipTrail}
          equippedLanding={progress.equippedLandingEffect}
          onWin={handleWin}
          onFail={handleFail}
          engineRef={engineRef}
        />

        {/* Top Course Minimap: 20 Chasms Progress & Peek Controls */}
        <div className="absolute top-14 left-0 right-0 z-20 pointer-events-none">
          <CourseMinimap
            level={currentLevel}
            robotX={characterX}
            isPanMode={isPanMode}
            onTogglePanMode={handleTogglePanMode}
            onPeekGoal={handlePeekGoal}
            onReturnToRobot={handleReturnToRobot}
          />
        </div>

        {/* Two-Thumb Controls & HUD Overlay */}
        <TwoThumbControlsOverlay
          currentLevel={currentLevelId}
          levelTitle={currentLevel.title}
          deathsThisLevel={deathsThisLevel}
          totalDeaths={progress.totalDeaths}
          coins={progress.coins}
          soundEnabled={progress.soundEnabled}
          bgmEnabled={bgmActive}
          hapticsEnabled={progress.hapticsEnabled}
          hasShield={hasShield}
          shieldCount={progress.bubbleShieldCount}
          engineRef={engineRef}
          onRestart={handleInstantRestart}
          onToggleSound={handleToggleSound}
          onToggleBgm={handleToggleBgm}
          onToggleHaptics={handleToggleHaptics}
          onReturnHome={handleReturnHome}
          onOpenLevelSelect={() => setIsLevelSelectOpen(true)}
          onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
          onOpenShop={() => setIsShopOpen(true)}
          onOpenAdmin={() => setIsAdminOpen(true)}
          onUseShield={handleUseShield}
        />

        {/* Automatic Comic Respawn Toast (0.4s fast restart without blocking modal) */}
        {deathToast && (
          <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-40 bg-rose-950/95 border-2 border-rose-500 text-white px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce">
            <span className="text-xl">🐊💥</span>
            <div>
              <div className="font-extrabold text-xs text-rose-300">
                PHANH CHÁY CHÂN!
              </div>
              <div className="text-[10px] text-slate-200">
                {deathToast} · Bắt đầu lại từ điểm xuất phát ban đầu!
              </div>
            </div>
          </div>
        )}

        {/* Auto-Advance Notification Banner */}
        {autoAdvanceCountdown !== null && currentLevelId < GAME_LEVELS.length && (
          <div className="absolute top-28 left-1/2 -translate-x-1/2 z-40 bg-emerald-950/95 border-2 border-emerald-400 text-white px-5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
            <span className="text-xl">🐱🏆</span>
            <div>
              <div className="font-extrabold text-xs text-emerald-300">
                ĐÃ VƯỢT QUA 20 VỰC SÂU CÁ SẤU!
              </div>
              <div className="text-[11px] text-slate-200">
                Tự động sang Màn {currentLevelId + 1} sau 2 giây...
              </div>
            </div>
            <button
              onClick={handleNextLevel}
              className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow ml-1"
            >
              Qua ngay ➔
            </button>
          </div>
        )}
      </main>

      {/* Title / Welcome Screen Modal */}
      {isTitleOpen && (
        <TitleScreenModal
          onStart={() => {
            setIsTitleOpen(false);
            setLevelStartTime(Date.now());
            if (bgmActive) {
              soundEngine.startBgm();
            }
          }}
          onOpenShop={() => setIsShopOpen(true)}
          coins={progress.coins}
        />
      )}

      {/* VIP Shop Modal for Skills & Slingshots */}
      {isShopOpen && (
        <VipShopModal
          userProgress={progress}
          onUpdateProgress={(updated) => {
            setProgress(updated);
            saveProgress(updated);
            if (engineRef.current) {
              engineRef.current.setEquippedItems(
                updated.equippedCharacterSkill,
                updated.equippedSlingshot,
                updated.equippedVipTrail,
                updated.equippedLandingEffect
              );
            }
          }}
          onWatchAdForCoins={handleWatchAdForCoins}
          onClose={() => setIsShopOpen(false)}
        />
      )}

      {/* Rage Roast Death Modal (available anytime if opened manually or via share) */}
      {isRoastOpen && (
        <RageRoastModal
          currentLevel={currentLevelId}
          levelTitle={currentLevel.title}
          failReason={failReason}
          deathsThisLevel={deathsThisLevel}
          totalDeaths={progress.totalDeaths}
          screenshot={lastScreenshot}
          onInstantRestart={handleInstantRestart}
          onWatchRewardAd={handleWatchRewardAd}
          canWatchAd={monetizationConfig.enableRewardAds}
        />
      )}

      {/* Victory Level Complete Modal */}
      {isVictoryOpen && (
        <VictoryModal
          levelNumber={currentLevelId}
          levelTitle={currentLevel.title}
          deaths={deathsThisLevel}
          timeSeconds={victoryTime}
          stars={victoryStars}
          screenshot={lastScreenshot}
          isLastLevel={currentLevelId === GAME_LEVELS.length}
          onNextLevel={handleNextLevel}
          onReplay={handleReplayLevel}
        />
      )}

      {/* Level Select Modal */}
      {isLevelSelectOpen && (
        <LevelSelectModal
          userProgress={progress}
          currentLevel={currentLevelId}
          onSelectLevel={handleSelectLevel}
          onClose={() => setIsLevelSelectOpen(false)}
        />
      )}

      {/* Leaderboard Modal */}
      {isLeaderboardOpen && (
        <LeaderboardModal
          entries={leaderboard}
          onClose={() => setIsLeaderboardOpen(false)}
        />
      )}

      {/* Admin Portal & Monetization Modal */}
      {isAdminOpen && (
        <AdminPortalModal
          physicsConfig={physicsConfig}
          monetizationConfig={monetizationConfig}
          userProgress={progress}
          onUpdatePhysics={handleUpdatePhysics}
          onUpdateMonetization={handleUpdateMonetization}
          onUnlockAllLevels={handleUnlockAllLevels}
          onResetProgress={handleResetProgress}
          onClose={() => setIsAdminOpen(false)}
        />
      )}

      {/* Ad Simulation Modal with Custom Ads */}
      {isAdOpen && (
        <AdSimulationModal
          isRewardAd={isRewardAd}
          activeAd={activeAdForModal}
          onAdCompleted={handleAdCompleted}
          onClose={() => setIsAdOpen(false)}
        />
      )}
    </div>
  );
}
