/**
 * Mobile Haptic Feedback controller using navigator.vibrate
 */
class HapticsEngine {
  private enabled: boolean = true;
  private lastEdgeVibrate: number = 0;

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  private canVibrate(): boolean {
    return this.enabled && typeof navigator !== 'undefined' && 'vibrate' in navigator;
  }

  /** Triggered when slingshot power reaches 100% */
  public maxPowerKick() {
    if (!this.canVibrate()) return;
    try {
      navigator.vibrate([20, 30, 25]);
    } catch {
      // Ignore
    }
  }

  /** Triggered when the orb is at the extreme edge of the tray */
  public edgeDangerPulse() {
    if (!this.canVibrate()) return;
    const now = Date.now();
    if (now - this.lastEdgeVibrate < 250) return; // throttle
    this.lastEdgeVibrate = now;
    try {
      navigator.vibrate(15);
    } catch {
      // Ignore
    }
  }

  /** Triggered when orb smashes or robot falls */
  public deathImpact() {
    if (!this.canVibrate()) return;
    try {
      navigator.vibrate([60, 40, 120]);
    } catch {
      // Ignore
    }
  }

  /** Triggered when entering goal portal */
  public victoryFanfare() {
    if (!this.canVibrate()) return;
    try {
      navigator.vibrate([35, 40, 35, 40, 70]);
    } catch {
      // Ignore
    }
  }

  /** Subtle button press haptic */
  public tap() {
    if (!this.canVibrate()) return;
    try {
      navigator.vibrate(8);
    } catch {
      // Ignore
    }
  }
}

export const hapticsEngine = new HapticsEngine();
