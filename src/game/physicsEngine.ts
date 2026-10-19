import { LevelData, Obstacle, Particle, PhysicsConfig, Vector2D } from '../types/game';
import { soundEngine } from '../utils/audio';
import { hapticsEngine } from '../utils/haptics';

export interface CuteCharacterState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  isGrounded: boolean;
  isSkidding: boolean;   // Phanh cháy chân
  skidTime: number;
  isSlipping: boolean;   // Đang trượt đà
  slipTime: number;
  isGliding: boolean;    // Dù lượn cứu nguy
  canDoubleJump: boolean; // Phản lực nhảy kép
  expression: 'normal' | 'aiming' | 'flying' | 'skidding' | 'panicked' | 'happy' | 'gliding';
  facingRight: boolean;
  squashStretch: number;
  rotation: number;
  hasShield: boolean;
  isAlive: boolean;
}

export interface SlingshotState {
  anchorX: number;
  anchorY: number;
  forkLeft: Vector2D;
  forkRight: Vector2D;
}

export interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  pullVector: Vector2D;
  tension: number;        // 0 to 1
  reachedMaxHaptic: boolean;
}

export class PhysicsEngine {
  public character: CuteCharacterState;
  public slingshot: SlingshotState;
  public level: LevelData;
  public config: PhysicsConfig;
  public dragState: DragState;
  public particles: Particle[] = [];
  public camera: Vector2D = { x: 0, y: 0 };

  // Equipped VIP items
  public equippedSkill: string = 'none';
  public equippedSlingshot: string = 'classic';
  public equippedTrail: string = 'classic_stars';
  public equippedLanding: string = 'smoke_sparks';

  // Checkpoint: Start of level
  public checkpointX: number;
  public checkpointY: number;

  // Camera Pan & Look-ahead Preview
  public isFreePanning: boolean = false;
  public manualPanX: number = 0;
  public peekTargetX: number | null = null;

  public isWon: boolean = false;
  public isFailed: boolean = false;
  public failReason: string = '';
  public lastFrameScreenshot: string = '';

  // Auto-respawn timer (0.45s comic death then immediate replay)
  public respawnTimer: number = 0;

  constructor(
    level: LevelData,
    config: PhysicsConfig,
    hasInitialShield: boolean = false,
    equippedSkill: string = 'none',
    equippedSlingshot: string = 'classic',
    equippedTrail: string = 'classic_stars',
    equippedLanding: string = 'smoke_sparks'
  ) {
    this.level = level;
    this.config = config;
    this.equippedSkill = equippedSkill;
    this.equippedSlingshot = equippedSlingshot;
    this.equippedTrail = equippedTrail;
    this.equippedLanding = equippedLanding;

    this.checkpointX = level.startPos.x;
    this.checkpointY = level.startPos.y;

    this.character = {
      x: level.startPos.x,
      y: level.startPos.y,
      vx: 0,
      vy: 0,
      radius: 17,
      isGrounded: true,
      isSkidding: false,
      skidTime: 0,
      isSlipping: false,
      slipTime: 0,
      isGliding: false,
      canDoubleJump: true,
      expression: 'normal',
      facingRight: true,
      squashStretch: 1,
      rotation: 0,
      hasShield: hasInitialShield,
      isAlive: true,
    };

    this.slingshot = {
      anchorX: level.startPos.x,
      anchorY: level.startPos.y,
      forkLeft: { x: level.startPos.x - 14, y: level.startPos.y - 12 },
      forkRight: { x: level.startPos.x + 14, y: level.startPos.y - 12 },
    };

    this.dragState = {
      isDragging: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      pullVector: { x: 0, y: 0 },
      tension: 0,
      reachedMaxHaptic: false,
    };
  }

  public setEquippedItems(skill: string, slingshot: string, trail: string, landing: string) {
    this.equippedSkill = skill;
    this.equippedSlingshot = slingshot;
    this.equippedTrail = trail;
    this.equippedLanding = landing;
  }

  public reset(hasShield: boolean = false) {
    // Luôn quay lại điểm đầu tiên (startPos) của màn chơi khi chết hoặc reset!
    this.checkpointX = this.level.startPos.x;
    this.checkpointY = this.level.startPos.y;

    this.character.x = this.level.startPos.x;
    this.character.y = this.level.startPos.y;
    this.character.vx = 0;
    this.character.vy = 0;
    this.character.isGrounded = true;
    this.character.isSkidding = false;
    this.character.skidTime = 0;
    this.character.isSlipping = false;
    this.character.slipTime = 0;
    this.character.isGliding = false;
    this.character.canDoubleJump = true;
    this.character.expression = 'normal';
    this.character.rotation = 0;
    this.character.squashStretch = 1;
    this.character.hasShield = hasShield;
    this.character.isAlive = true;

    this.updateSlingshotAnchor(this.level.startPos.x, this.level.startPos.y);

    this.dragState.isDragging = false;
    this.dragState.tension = 0;
    this.dragState.reachedMaxHaptic = false;

    this.isWon = false;
    this.isFailed = false;
    this.failReason = '';
    this.respawnTimer = 0;
    this.camera.x = 0;
    this.camera.y = 0;
  }

  public updateSlingshotAnchor(x: number, y: number) {
    this.slingshot.anchorX = x;
    this.slingshot.anchorY = y;
    this.slingshot.forkLeft = { x: x - 14, y: y - 10 };
    this.slingshot.forkRight = { x: x + 14, y: y - 10 };
  }

  /**
   * Kích hoạt Nhảy Phản Lực Trên Không (Double Jump Skill)
   */
  public triggerDoubleJump(): boolean {
    if (!this.character.isGrounded && this.character.canDoubleJump && this.character.isAlive) {
      this.character.canDoubleJump = false;
      this.character.vy = -7.8;
      this.character.vx = Math.max(3.2, this.character.vx + 1.8);
      this.character.isGliding = false;
      this.character.isSlipping = false;
      this.character.expression = 'flying';
      this.character.squashStretch = 1.3;

      soundEngine.playLaunch();
      hapticsEngine.tap();

      // Spawn jetpack rocket flame burst
      for (let i = 0; i < 18; i++) {
        this.particles.push({
          x: this.character.x + (Math.random() - 0.5) * 14,
          y: this.character.y + 12,
          vx: (Math.random() - 0.5) * 4,
          vy: Math.random() * 5 + 3,
          color: Math.random() > 0.4 ? '#8b5cf6' : '#ec4899',
          size: Math.random() * 4 + 2,
          life: 0.35,
          maxLife: 0.35,
          shape: 'spark',
        });
      }
      return true;
    }
    return false;
  }

  public startDrag(x: number, y: number) {
    if (this.isWon || !this.character.isAlive) return;

    // Nếu đang bay và có skill Nhảy Kép -> kích hoạt nhảy trên không!
    if (!this.character.isGrounded && this.equippedSkill === 'double_jump' && this.character.canDoubleJump) {
      this.triggerDoubleJump();
      return;
    }

    // Chỉ kéo súng cao su khi đang tiếp đất hoặc dừng đà
    if (!this.character.isGrounded && Math.hypot(this.character.vx, this.character.vy) > 0.6) return;

    this.dragState.isDragging = true;
    this.dragState.startX = x;
    this.dragState.startY = y;
    this.dragState.currentX = x;
    this.dragState.currentY = y;
    this.dragState.pullVector = { x: 0, y: 0 };
    this.dragState.tension = 0;
    this.dragState.reachedMaxHaptic = false;

    this.character.isSlipping = false;
    this.character.expression = 'aiming';
  }

  public updateDrag(x: number, y: number) {
    if (!this.dragState.isDragging || !this.character.isAlive) return;
    this.dragState.currentX = x;
    this.dragState.currentY = y;

    const dx = this.dragState.startX - x;
    const dy = this.dragState.startY - y;
    const dist = Math.hypot(dx, dy);
    const maxPull = 140;

    this.dragState.tension = Math.min(1, dist / maxPull);

    // Pull vector
    this.dragState.pullVector = {
      x: dx * (Math.min(dist, maxPull) / Math.max(1, dist)),
      y: dy * (Math.min(dist, maxPull) / Math.max(1, dist)),
    };

    // Pulled position reflects in slingshot
    this.character.x = this.slingshot.anchorX - this.dragState.pullVector.x * 0.45;
    this.character.y = this.slingshot.anchorY - this.dragState.pullVector.y * 0.45;

    soundEngine.playPull(this.dragState.tension);

    // Max power haptic kick
    if (this.dragState.tension >= 0.98 && !this.dragState.reachedMaxHaptic) {
      this.dragState.reachedMaxHaptic = true;
      hapticsEngine.maxPowerKick();
    } else if (this.dragState.tension < 0.9) {
      this.dragState.reachedMaxHaptic = false;
    }
  }

  public releaseDrag(): boolean {
    if (!this.dragState.isDragging || !this.character.isAlive) {
      this.dragState.isDragging = false;
      return false;
    }

    const { tension, pullVector } = this.dragState;
    this.dragState.isDragging = false;

    if (tension > 0.12) {
      // Launch impulse with Slingshot VIP Power scaling
      let power = this.config.slingshotPower;
      if (this.equippedSlingshot === 'dragon_flame') {
        power *= 1.25; // +25% lực bắn
      } else if (this.equippedSlingshot === 'rainbow_galaxy') {
        power *= 1.15; // +15% lực bắn
      }

      this.character.vx = pullVector.x * power * 1.05;
      this.character.vy = pullVector.y * power * 1.15;
      this.character.isGrounded = false;
      this.character.isSkidding = false;
      this.character.isSlipping = false;
      this.character.isGliding = false;
      this.character.canDoubleJump = true;
      this.character.expression = 'flying';
      this.character.squashStretch = 1.35;
      this.character.facingRight = this.character.vx >= 0;

      // Spawn launch wind & sparkles
      const launchColors = this.equippedSlingshot === 'dragon_flame'
        ? ['#f97316', '#ef4444', '#fbbf24']
        : this.equippedSlingshot === 'plasma_shock'
        ? ['#c084fc', '#8b5cf6', '#38bdf8']
        : ['#fbbf24', '#38bdf8', '#ffffff'];

      for (let i = 0; i < 18; i++) {
        this.particles.push({
          x: this.character.x + (Math.random() - 0.5) * 20,
          y: this.character.y + 10,
          vx: -pullVector.x * 0.05 + (Math.random() - 0.5) * 3,
          vy: -pullVector.y * 0.05 + Math.random() * 2.5,
          color: launchColors[Math.floor(Math.random() * launchColors.length)],
          size: Math.random() * 4 + 2,
          life: 0.38,
          maxLife: 0.38,
          shape: 'spark',
        });
      }

      soundEngine.playLaunch();
      hapticsEngine.tap();
      return true;
    }

    // Return to anchor gently
    this.character.x = this.slingshot.anchorX;
    this.character.y = this.slingshot.anchorY;
    this.character.expression = 'normal';
    return false;
  }

  public update(dt: number) {
    // Check Auto-respawn timer if dead
    if (this.isFailed) {
      this.respawnTimer += dt;
      this.updateParticles(dt);
      if (this.respawnTimer > 0.5) {
        // Auto-respawn immediately back to safe start
        this.reset(this.character.hasShield);
      }
      return;
    }

    if (this.isWon) {
      this.updateParticles(dt);
      return;
    }

    // 1. If currently dragging, stay placed in slingshot
    if (this.dragState.isDragging) {
      this.updateParticles(dt);
      return;
    }

    // 2. Physics simulation when in air or skidding
    if (!this.character.isGrounded || this.character.isSkidding || this.character.isSlipping) {
      // Feather weight skill reduces gravity by 35%
      const effectiveGravity = this.equippedSkill === 'feather_weight'
        ? this.config.gravity * 0.65
        : this.config.gravity;

      // Parachute gliding slows descent
      if (this.character.isGliding) {
        this.character.vy += effectiveGravity * 0.35;
        this.character.vy = Math.min(this.character.vy, 1.4); // capped slow glide
        this.character.vx = Math.max(this.character.vx, 2.0); // forward glide momentum
      } else {
        this.character.vy += effectiveGravity;
      }

      this.character.vx *= this.config.airResistance;

      this.character.x += this.character.vx;
      this.character.y += this.character.vy;

      if (!this.character.isGrounded) {
        this.character.rotation += this.character.vx * 0.04;

        // Spawn VIP Flight Trails
        this.spawnFlightTrailParticles();
      }
    }

    // Reset grounded flag before obstacle check
    this.character.isGrounded = false;

    // 3. Update obstacles (moving elevators, crocodiles, lasers, wind fans)
    this.updateObstacles(dt);

    // 4. Character collision with platforms (including skidding / phanh cháy chân)
    this.checkPlatformCollisions(dt);

    // 5. Check Goal & Crocodile Death conditions
    this.checkWinLoss(dt);

    // 6. Camera Tracking with Aim Look-Ahead & Pan
    let targetCamX = this.character.x - 260;
    if (this.dragState.isDragging && this.dragState.tension > 0.08) {
      const aimForward = this.dragState.pullVector.x * this.config.slingshotPower * 24;
      targetCamX += Math.max(-100, Math.min(380, aimForward));
    }

    if (this.peekTargetX !== null) {
      targetCamX = this.peekTargetX - 300;
    } else if (this.isFreePanning) {
      targetCamX = this.manualPanX;
    }

    const maxCamX = Math.max(0, this.level.totalWidth - 600);
    targetCamX = Math.max(0, Math.min(maxCamX, targetCamX));

    this.camera.x += (targetCamX - this.camera.x) * 0.12;
    this.camera.y += (this.character.y - 280 - this.camera.y) * 0.08;

    // 7. Update Particles
    this.updateParticles(dt);

    // 8. Squash & stretch recovery
    this.character.squashStretch += (1.0 - this.character.squashStretch) * 0.12;
  }

  private checkPlatformCollisions(dt: number) {
    const cx = this.character.x;
    const cy = this.character.y;
    const r = this.character.radius;

    for (const obs of this.level.obstacles) {
      if (obs.type === 'fan' || obs.type === 'crocodile_pit') continue;

      if (obs.type === 'laser' && obs.laserActive) {
        if (cx + r > obs.x && cx - r < obs.x + obs.w && cy + r > obs.y && cy - r < obs.y + obs.h) {
          this.triggerDeath('Va phải tia Laser tử thần!');
          return;
        }
      }

      if (['platform', 'ice', 'bouncy', 'moving_platform'].includes(obs.type)) {
        // Landing on safe platform top
        if (cx + r * 0.7 > obs.x && cx - r * 0.7 < obs.x + obs.w && cy + r >= obs.y && cy - r <= obs.y + obs.h) {
          if (this.character.vy > 0 && cy < obs.y + 12) {
            this.character.y = obs.y - r;
            this.character.vy = 0;
            this.character.isGrounded = true;
            this.character.isSlipping = false; // HỒI PHỤC KHI ĐÁP XUỐNG BỤC AN TOÀN!
            this.character.isGliding = false;
            this.character.canDoubleJump = true;
            this.character.squashStretch = 0.8;

            if (obs.type === 'bouncy') {
              this.character.vy = -12.8;
              this.character.isGrounded = false;
              this.character.expression = 'flying';
              soundEngine.playBouncy();
              this.spawnBounceParticles(cx, obs.y);
              return;
            }

            // Spawn VIP Landing Effect
            this.spawnLandingEffect(cx, obs.y);

            // === HIỆU ỨNG PHANH CHÁY CHÂN KHI TIẾP ĐẤT AN TOÀN ===
            const speed = Math.abs(this.character.vx);
            if (speed > 1.2) {
              this.character.isSkidding = true;
              this.character.expression = 'skidding';
              this.character.skidTime += dt;

              // Play friction screech sound
              soundEngine.playSkidScreech();
              hapticsEngine.tap();

              // Spawn burning skid sparks & smoke puffs from feet!
              this.spawnSkidEffects(cx, obs.y, this.character.vx);

              // Friction deceleration: Sticky Brakes skill slows down much faster!
              let friction = obs.type === 'ice' ? 0.985 : 0.88;
              if (this.equippedSkill === 'sticky_brakes') {
                friction = 0.65; // Móng vuốt phanh dính giảm 80% độ trượt
              }
              this.character.vx *= friction;
            } else {
              // Came to a safe stop!
              this.character.isSkidding = false;
              this.character.isSlipping = false;
              this.character.vx = 0;
              this.character.expression = 'happy';

              // Cập nhật vị trí súng cao su tại bục an toàn này để bắn tiếp!
              this.updateSlingshotAnchor(cx, cy);
            }

            soundEngine.playLand();
          }
        }
      }
    }

    // Check if character was skidding and slipped off the edge of the platform
    if (this.character.isSkidding && this.character.isGrounded) {
      let stillOnPlatform = false;
      for (const obs of this.level.obstacles) {
        if (['platform', 'ice', 'bouncy', 'moving_platform'].includes(obs.type)) {
          if (cx >= obs.x && cx <= obs.x + obs.w && Math.abs(cy - (obs.y - r)) < 6) {
            stillOnPlatform = true;
            break;
          }
        }
      }

      // TRƯỢT KHỎI MÉP BỤC: Chưa chết! Cho nhân vật rơi tự do hoặc bung dù cứu nguy!
      if (!stillOnPlatform) {
        this.character.isGrounded = false;
        this.character.isSkidding = false;
        this.character.isSlipping = true;
        this.character.expression = 'panicked';
        soundEngine.playPanickedScream();
        hapticsEngine.edgeDangerPulse();

        // Nếu trang bị Dù Lượn Cứu Nguy: tự động bung dù bay là là hạ cánh!
        if (this.equippedSkill === 'parachute') {
          this.character.isGliding = true;
          this.character.expression = 'gliding';
          this.character.vy = Math.min(this.character.vy, 1.4);
          this.character.vx = Math.max(this.character.vx, 2.2);
        }
      }
    }
  }

  private updateObstacles(dt: number) {
    for (const obs of this.level.obstacles) {
      if (obs.type === 'moving_platform') {
        if (obs.vy !== undefined) {
          obs.y += obs.vy;
          if (obs.minY !== undefined && obs.y <= obs.minY) obs.vy = Math.abs(obs.vy);
          if (obs.maxY !== undefined && obs.y >= obs.maxY) obs.vy = -Math.abs(obs.vy);
        }
      } else if (obs.type === 'laser') {
        const period = obs.laserPeriod || 2.0;
        const activeTime = obs.laserActiveTime || 1.0;
        obs.laserCycle = ((obs.laserCycle || 0) + dt) % period;
        obs.laserActive = obs.laserCycle < activeTime;
      } else if (obs.type === 'crocodile_pit' && obs.crocodiles) {
        for (const croc of obs.crocodiles) {
          croc.swimPhase += dt * 3.5;
          if (croc.isSnapping) {
            croc.jawOpen = Math.min(1, croc.jawOpen + dt * 12);
          } else {
            croc.jawOpen = 0.15 + Math.sin(croc.swimPhase * 2) * 0.12;
          }
        }
      } else if (obs.type === 'fan' && obs.windForce) {
        // Súng Sấm Sét Plasma: miễn nhiễm gió bão!
        if (this.equippedSlingshot !== 'plasma_shock') {
          if (this.isInsideBox(this.character.x, this.character.y, obs)) {
            this.character.vx += obs.windForce.x * 0.9;
            this.character.vy += obs.windForce.y * 0.9;
          }
        }
      }
    }
  }

  private isInsideBox(px: number, py: number, obs: Obstacle): boolean {
    return px >= obs.x && px <= obs.x + obs.w && py >= obs.y && py <= obs.y + obs.h;
  }

  private checkWinLoss(dt: number) {
    // 1. Victory check: Goal portal reached!
    const goal = this.level.goal;
    const distToGoal = Math.hypot(this.character.x - goal.x, this.character.y - goal.y);
    if (distToGoal < goal.radius + this.character.radius) {
      this.isWon = true;
      this.character.expression = 'happy';
      soundEngine.playVictory();
      hapticsEngine.victoryFanfare();
      this.spawnVictoryParticles(goal.x, goal.y);
      return;
    }

    // 2. Crocodile pit collision: CHỈ CHẾT KHI RƠI THỰC SỰ VÀO ĐẦM CÁ SẤU
    for (const obs of this.level.obstacles) {
      if (obs.type === 'crocodile_pit') {
        if (
          this.character.x + this.character.radius > obs.x &&
          this.character.x - this.character.radius < obs.x + obs.w &&
          this.character.y + this.character.radius > obs.y + 12
        ) {
          if (obs.crocodiles) {
            obs.crocodiles.forEach((c) => { c.isSnapping = true; });
          }
          this.spawnWaterSplashParticles(this.character.x, obs.y + 15);
          soundEngine.playChomp();
          soundEngine.playSplash();
          this.triggerDeath('Rơi thẳng vào hồ cá sấu đầm lầy!');
          return;
        }
      }
    }

    // 3. Rơi khỏi màn hình
    if (this.character.y > 540) {
      this.triggerDeath('Rơi xuống vực sâu mất hút!');
      return;
    }
  }

  public triggerDeath(reason: string) {
    if (this.isFailed || this.isWon) return;
    this.isFailed = true;
    this.character.isAlive = false;
    this.character.expression = 'panicked';
    this.failReason = reason;

    // Khi chết: Quay lại điểm đầu tiên của màn chơi, bắt đầu lại từ đầu
    this.checkpointX = this.level.startPos.x;
    this.checkpointY = this.level.startPos.y;

    this.spawnDeathParticles(this.character.x, this.character.y);
    hapticsEngine.deathImpact();
  }

  // === VIP PARTICLES & EFFECTS ===

  private spawnFlightTrailParticles() {
    const x = this.character.x;
    const y = this.character.y;

    if (this.equippedTrail === 'fire_meteor') {
      // Meteor Fire Trail
      this.particles.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 8,
        vx: -this.character.vx * 0.15 + (Math.random() - 0.5) * 1.5,
        vy: -this.character.vy * 0.15 + (Math.random() - 0.5) * 1.5,
        color: Math.random() > 0.3 ? '#ea580c' : '#fbbf24',
        size: Math.random() * 4 + 2,
        life: 0.35,
        maxLife: 0.35,
        shape: 'spark',
      });
    } else if (this.equippedTrail === 'plasma_lightning') {
      // Purple Plasma Lightning Sparks
      this.particles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        color: Math.random() > 0.4 ? '#c084fc' : '#38bdf8',
        size: Math.random() * 3 + 1.5,
        life: 0.28,
        maxLife: 0.28,
        shape: 'spark',
      });
    } else if (this.equippedTrail === 'rainbow_hearts') {
      // Rainbow Hearts & Colorful Dust
      const rainbowColors = ['#f43f5e', '#ec4899', '#38bdf8', '#fbbf24', '#a855f7'];
      this.particles.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 8,
        vx: -this.character.vx * 0.1,
        vy: -this.character.vy * 0.1 - 0.5,
        color: rainbowColors[Math.floor(Math.random() * rainbowColors.length)],
        size: Math.random() * 4 + 2,
        life: 0.4,
        maxLife: 0.4,
        shape: 'circle',
      });
    } else {
      // Default Classic Golden Stars
      this.particles.push({
        x: x + (Math.random() - 0.5) * 6,
        y: y + (Math.random() - 0.5) * 6,
        vx: -this.character.vx * 0.1,
        vy: -this.character.vy * 0.1,
        color: '#fbbf24',
        size: Math.random() * 2.5 + 1,
        life: 0.25,
        maxLife: 0.25,
        shape: 'spark',
      });
    }
  }

  private spawnLandingEffect(cx: number, cy: number) {
    if (this.equippedLanding === 'diamond_shockwave') {
      // Diamond Shockwave Rings
      for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2;
        this.particles.push({
          x: cx,
          y: cy - 2,
          vx: Math.cos(angle) * 4.5,
          vy: Math.sin(angle) * 1.5,
          color: '#38bdf8',
          size: Math.random() * 3 + 2,
          life: 0.45,
          maxLife: 0.45,
          shape: 'spark',
        });
      }
    } else if (this.equippedLanding === 'electric_burst') {
      // Electric Arc Shock
      for (let i = 0; i < 20; i++) {
        this.particles.push({
          x: cx + (Math.random() - 0.5) * 20,
          y: cy - 2,
          vx: (Math.random() - 0.5) * 6,
          vy: -Math.random() * 4 - 1,
          color: Math.random() > 0.5 ? '#e879f9' : '#c084fc',
          size: Math.random() * 3.5 + 1.5,
          life: 0.35,
          maxLife: 0.35,
          shape: 'spark',
        });
      }
    } else if (this.equippedLanding === 'inferno_flame') {
      // Inferno Floor Flame
      for (let i = 0; i < 22; i++) {
        this.particles.push({
          x: cx + (Math.random() - 0.5) * 24,
          y: cy - 2,
          vx: (Math.random() - 0.5) * 4,
          vy: -Math.random() * 5 - 2,
          color: Math.random() > 0.4 ? '#ef4444' : '#f97316',
          size: Math.random() * 4 + 2,
          life: 0.45,
          maxLife: 0.45,
          shape: 'spark',
        });
      }
    }
  }

  private spawnSkidEffects(x: number, y: number, vx: number) {
    // Burning sparks
    for (let i = 0; i < 4; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y - 2,
        vx: -vx * 0.4 + (Math.random() - 0.5) * 3,
        vy: -Math.random() * 3 - 1,
        color: this.equippedLanding === 'inferno_flame' ? '#ef4444' : Math.random() > 0.4 ? '#f59e0b' : '#ef4444',
        size: Math.random() * 3 + 1.5,
        life: 0.25,
        maxLife: 0.25,
        shape: 'spark',
      });
    }

    // Smoke puffs
    this.particles.push({
      x: x + (Math.random() - 0.5) * 6,
      y: y - 3,
      vx: -vx * 0.2 + (Math.random() - 0.5) * 1.5,
      vy: -Math.random() * 2,
      color: '#94a3b8',
      size: Math.random() * 5 + 3,
      life: 0.35,
      maxLife: 0.35,
      shape: 'circle',
    });
  }

  public spawnWaterSplashParticles(x: number, y: number) {
    const colors = ['#059669', '#10b981', '#34d399', '#38bdf8', '#ffffff'];
    for (let i = 0; i < 32; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.5;
      const speed = Math.random() * 7 + 2;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 5 + 2,
        life: 0.6,
        maxLife: 0.6,
        shape: Math.random() > 0.4 ? 'spark' : 'circle',
      });
    }
  }

  private spawnBounceParticles(x: number, y: number) {
    for (let i = 0; i < 16; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 30,
        y: y,
        vx: (Math.random() - 0.5) * 5,
        vy: -Math.random() * 6 - 2,
        color: '#6ee7b7',
        size: Math.random() * 4 + 2,
        life: 0.4,
        maxLife: 0.4,
        shape: 'circle',
      });
    }
  }

  private spawnDeathParticles(x: number, y: number) {
    const colors = ['#f43f5e', '#fbbf24', '#f97316', '#ffffff'];
    for (let i = 0; i < 28; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 1.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 3 + 1,
        life: 0.35,
        maxLife: 0.35,
        shape: 'spark',
      });
    }
  }

  private spawnVictoryParticles(x: number, y: number) {
    const colors = ['#38bdf8', '#818cf8', '#fbbf24', '#34d399', '#f43f5e'];
    for (let i = 0; i < 50; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 9 + 3;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 6 + 2,
        life: 1.2,
        maxLife: 1.2,
        shape: 'spark',
      });
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
    }
  }

  public getTrajectoryPoints(steps: number = 24): Vector2D[] {
    if (!this.dragState.isDragging || this.dragState.tension < 0.05) return [];

    // Laser Sight VIP Slingshot: gives 52 predictive trajectory points!
    const totalSteps = this.equippedSlingshot === 'laser_sight' ? 52 : steps;

    const points: Vector2D[] = [];
    let simX = this.character.x;
    let simY = this.character.y;

    let power = this.config.slingshotPower;
    if (this.equippedSlingshot === 'dragon_flame') power *= 1.25;
    else if (this.equippedSlingshot === 'rainbow_galaxy') power *= 1.15;

    let simVx = this.dragState.pullVector.x * power * 1.05;
    let simVy = this.dragState.pullVector.y * power * 1.15;

    const effectiveGravity = this.equippedSkill === 'feather_weight'
      ? this.config.gravity * 0.65
      : this.config.gravity;

    for (let i = 0; i < totalSteps; i++) {
      simVy += effectiveGravity;
      simVx *= this.config.airResistance;
      simX += simVx;
      simY += simVy;
      points.push({ x: simX, y: simY });
    }

    return points;
  }

  public setPeekTarget(x: number | null) {
    this.peekTargetX = x;
  }

  public manualPan(deltaX: number) {
    this.isFreePanning = true;
    this.peekTargetX = null;
    const maxCamX = Math.max(0, this.level.totalWidth - 600);
    this.manualPanX = Math.max(0, Math.min(maxCamX, this.camera.x + deltaX));
  }

  public resetPan() {
    this.isFreePanning = false;
    this.peekTargetX = null;
    this.manualPanX = this.character.x - 260;
  }
}
