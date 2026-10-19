import React, { useEffect, useRef, useCallback } from 'react';
import { PhysicsEngine } from '../game/physicsEngine';
import { LevelData, PhysicsConfig } from '../types/game';
import { soundEngine } from '../utils/audio';

interface GameCanvasProps {
  level: LevelData;
  physicsConfig: PhysicsConfig;
  hasShield: boolean;
  isPanMode: boolean;
  equippedSkill?: string;
  equippedSlingshot?: string;
  equippedTrail?: string;
  equippedLanding?: string;
  onWin: (screenshot: string) => void;
  onFail: (reason: string, screenshot: string) => void;
  engineRef: React.MutableRefObject<PhysicsEngine | null>;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  level,
  physicsConfig,
  hasShield,
  isPanMode,
  equippedSkill = 'none',
  equippedSlingshot = 'classic',
  equippedTrail = 'classic_stars',
  equippedLanding = 'smoke_sparks',
  onWin,
  onFail,
  engineRef,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const leftTouchIdRef = useRef<number | null>(null);
  const rightTouchIdRef = useRef<number | null>(null);
  const leftTouchStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastPanPosRef = useRef<number>(0);

  // Initialize or reconfigure engine
  useEffect(() => {
    const engine = new PhysicsEngine(
      level,
      physicsConfig,
      hasShield,
      equippedSkill,
      equippedSlingshot,
      equippedTrail,
      equippedLanding
    );
    engineRef.current = engine;
  }, [level, physicsConfig, hasShield, equippedSkill, equippedSlingshot, equippedTrail, equippedLanding, engineRef]);

  // Keep equipped items in sync if changed dynamically
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setEquippedItems(equippedSkill, equippedSlingshot, equippedTrail, equippedLanding);
    }
  }, [equippedSkill, equippedSlingshot, equippedTrail, equippedLanding, engineRef]);

  // Main 60 FPS Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min(0.033, (currentTime - lastTime) / 1000);
      lastTime = currentTime;

      const engine = engineRef.current;
      if (engine) {
        // Step physics
        engine.update(dt);

        // Render scene
        renderScene(ctx, canvas, engine, isPanMode);

        // Check state transitions
        if (engine.isWon && !engine.lastFrameScreenshot) {
          engine.lastFrameScreenshot = canvas.toDataURL('image/jpeg', 0.85);
          onWin(engine.lastFrameScreenshot);
        } else if (engine.isFailed && !engine.lastFrameScreenshot) {
          engine.lastFrameScreenshot = canvas.toDataURL('image/jpeg', 0.85);
          onFail(engine.failReason, engine.lastFrameScreenshot);
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [onWin, onFail, engineRef, isPanMode]);

  // Auto-resize canvas to match container dimensions
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      canvasRef.current.width = rect.width;
      canvasRef.current.height = rect.height;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard controls for desktop
  useEffect(() => {
    const activeKeys: Record<string, boolean> = {};

    const handleKeyDown = (e: KeyboardEvent) => {
      activeKeys[e.code] = true;
      const engine = engineRef.current;
      if (!engine) return;

      if (e.code === 'KeyR') {
        engine.reset(hasShield);
        return;
      }

      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        engine.character.vx = Math.min(5, engine.character.vx + 0.8);
      } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        engine.character.vx = Math.max(-5, engine.character.vx - 0.8);
      } else if (e.code === 'Space') {
        // Quick launch forward with spacebar
        if (engine.character.isGrounded) {
          engine.character.vx = 8.5;
          engine.character.vy = -7.5;
          engine.character.isGrounded = false;
          engine.character.expression = 'flying';
          soundEngine.playLaunch();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [hasShield, engineRef]);

  // Touch Handlers for Slingshot & Pan Preview
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const engine = engineRef.current;
    if (!canvas || !engine) return;
    const rect = canvas.getBoundingClientRect();

    if (isPanMode && e.touches.length > 0) {
      lastPanPosRef.current = e.touches[0].clientX;
      return;
    }

    if (e.changedTouches.length > 0 && rightTouchIdRef.current === null) {
      const touch = e.changedTouches[0];
      const px = touch.clientX - rect.left;
      const py = touch.clientY - rect.top;
      rightTouchIdRef.current = touch.identifier;
      engine.startDrag(px, py);
    }
  }, [engineRef, isPanMode]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const engine = engineRef.current;
    if (!canvas || !engine) return;
    const rect = canvas.getBoundingClientRect();

    if (isPanMode && e.touches.length > 0) {
      const currentX = e.touches[0].clientX;
      const deltaX = currentX - lastPanPosRef.current;
      lastPanPosRef.current = currentX;
      engine.manualPan(-deltaX * 1.6);
      return;
    }

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === rightTouchIdRef.current) {
        const px = touch.clientX - rect.left;
        const py = touch.clientY - rect.top;
        engine.updateDrag(px, py);
      }
    }
  }, [engineRef, isPanMode]);

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const engine = engineRef.current;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === rightTouchIdRef.current) {
        rightTouchIdRef.current = null;
        if (engine) {
          engine.releaseDrag();
        }
      }
    }
  }, [engineRef]);

  // Mouse Handlers for Desktop
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const engine = engineRef.current;
    if (!canvas || !engine) return;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    if (isPanMode) {
      lastPanPosRef.current = px;
      return;
    }

    if (e.button === 0) {
      engine.startDrag(px, py);
    }
  }, [engineRef, isPanMode]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const engine = engineRef.current;
    if (!canvas || !engine) return;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    if (isPanMode && e.buttons === 1) {
      const deltaX = px - lastPanPosRef.current;
      lastPanPosRef.current = px;
      engine.manualPan(-deltaX * 1.6);
      return;
    }

    if (engine.dragState.isDragging) {
      engine.updateDrag(px, py);
    }
  }, [engineRef, isPanMode]);

  const handleMouseUp = useCallback(() => {
    const engine = engineRef.current;
    if (engine && engine.dragState.isDragging) {
      engine.releaseDrag();
    }
  }, [engineRef]);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden select-none touch-none">
      <canvas
        ref={canvasRef}
        className={`w-full h-full block ${isPanMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
    </div>
  );
};

// Pure Canvas 2D scene renderer for 60 FPS performance
function renderScene(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, engine: PhysicsEngine, isPanMode: boolean = false) {
  const width = canvas.width;
  const height = canvas.height;

  // 1. Clear background & draw futuristic cyber grid
  ctx.fillStyle = '#030712';
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  // Apply camera translation
  const camX = engine.camera.x;
  const camY = engine.camera.y;
  ctx.translate(-camX, -camY);

  // Background neon tech grid
  ctx.strokeStyle = 'rgba(30, 41, 59, 0.45)';
  ctx.lineWidth = 1;
  const gridSize = 60;
  const startX = Math.floor(camX / gridSize) * gridSize;
  const endX = camX + width + gridSize;
  const startY = Math.floor(camY / gridSize) * gridSize;
  const endY = camY + height + gridSize;

  for (let x = startX; x <= endX; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, startY);
    ctx.lineTo(x, endY);
    ctx.stroke();
  }
  for (let y = startY; y <= endY; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(endX, y);
    ctx.stroke();
  }

  // 2. Render Obstacles
  for (const obs of engine.level.obstacles) {
    if (obs.type === 'platform') {
      ctx.fillStyle = obs.color || '#1e293b';
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
      // Top neon highlight
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(obs.x, obs.y, obs.w, 3);
      // Cyber corner accents
      ctx.fillStyle = '#64748b';
      ctx.fillRect(obs.x + 4, obs.y + 7, 4, 4);
      ctx.fillRect(obs.x + obs.w - 8, obs.y + 7, 4, 4);
    } else if (obs.type === 'ice') {
      // Ice slippery platform
      const grad = ctx.createLinearGradient(obs.x, obs.y, obs.x, obs.y + obs.h);
      grad.addColorStop(0, '#06b6d4');
      grad.addColorStop(1, '#083344');
      ctx.fillStyle = grad;
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
      ctx.fillStyle = '#a5f3fc';
      ctx.fillRect(obs.x, obs.y, obs.w, 4);
    } else if (obs.type === 'bouncy') {
      // Bouncy trampoline
      ctx.fillStyle = '#10b981';
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
      // Bouncy spring stripes
      ctx.strokeStyle = '#6ee7b7';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(obs.x + 8, obs.y + 4);
      ctx.lineTo(obs.x + obs.w - 8, obs.y + 4);
      ctx.stroke();
      // Arrow indicator pointing up
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('▲ TƯNG BẢN ▲', obs.x + obs.w / 2, obs.y + 17);
    } else if (obs.type === 'moving_platform') {
      // Moving elevator
      ctx.fillStyle = '#8b5cf6';
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
      ctx.fillStyle = '#c084fc';
      ctx.fillRect(obs.x, obs.y, obs.w, 3);
      // Mechanical chevron
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⇅ ELEVATOR', obs.x + obs.w / 2, obs.y + 18);
    } else if (obs.type === 'spike') {
      // Deadly spikes
      const spikeWidth = 14;
      const count = Math.floor(obs.w / spikeWidth);
      ctx.fillStyle = obs.color || '#ef4444';
      ctx.beginPath();
      for (let s = 0; s < count; s++) {
        const sx = obs.x + s * spikeWidth;
        ctx.moveTo(sx, obs.y + obs.h);
        ctx.lineTo(sx + spikeWidth / 2, obs.y);
        ctx.lineTo(sx + spikeWidth, obs.y + obs.h);
      }
      ctx.closePath();
      ctx.fill();
    } else if (obs.type === 'laser') {
      // Pulsing laser beam
      if (obs.laserActive) {
        ctx.fillStyle = 'rgba(244, 63, 94, 0.85)';
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(obs.x + obs.w / 2 - 2, obs.y, 4, obs.h);
        // Warning glow
        ctx.strokeStyle = 'rgba(251, 113, 133, 0.4)';
        ctx.lineWidth = 10;
        ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
      } else {
        // Inactive laser warning line
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.2)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(obs.x + obs.w / 2 - 1, obs.y, 2, obs.h);
        ctx.setLineDash([]);
      }
    } else if (obs.type === 'fan') {
      // Wind fan zone
      ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
      // Wind speed stream lines
      const now = performance.now() * 0.003;
      ctx.strokeStyle = 'rgba(125, 211, 252, 0.45)';
      ctx.lineWidth = 1.5;
      for (let wLine = 0; wLine < 4; wLine++) {
        const lineY = obs.y + 30 + wLine * 45;
        const offset = ((now * 80) % obs.w);
        const lx = obs.windForce && obs.windForce.x > 0 ? obs.x + offset : obs.x + obs.w - offset;
        ctx.beginPath();
        ctx.moveTo(lx, lineY);
        ctx.lineTo(lx + 28, lineY);
        ctx.stroke();
      }
    } else if (obs.type === 'crocodile_pit') {
      // Murky swamp water
      const waterGrad = ctx.createLinearGradient(obs.x, obs.y, obs.x, obs.y + obs.h);
      waterGrad.addColorStop(0, '#064e3b');
      waterGrad.addColorStop(0.25, '#022c22');
      waterGrad.addColorStop(1, '#052e16');
      ctx.fillStyle = waterGrad;
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h);

      // Water surface waves & bubbling foam
      const now = performance.now() * 0.003;
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let wx = 0; wx <= obs.w; wx += 10) {
        const wy = obs.y + Math.sin(now * 5 + (obs.x + wx) * 0.07) * 3;
        if (wx === 0) ctx.moveTo(obs.x, wy);
        else ctx.lineTo(obs.x + wx, wy);
      }
      ctx.stroke();

      // Render Crocodiles inside the pit
      if (obs.crocodiles) {
        for (const croc of obs.crocodiles) {
          const swimX = croc.x + Math.sin(croc.swimPhase) * 6;
          const swimY = croc.y + Math.cos(croc.swimPhase) * 2;
          const jawGap = Math.max(2, (croc.jawOpen || 0.2) * 11);

          ctx.save();
          ctx.translate(swimX, swimY);

          // Scaly Snout & Head
          ctx.fillStyle = '#065f46';
          ctx.strokeStyle = '#047857';
          ctx.lineWidth = 1.5;

          // Upper Snout
          ctx.beginPath();
          ctx.ellipse(0, -jawGap / 2, 17, 7, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Predatory Glowing Yellow Reptile Eyes
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(-4, -jawGap / 2 - 5, 2.8, 0, Math.PI * 2);
          ctx.arc(4, -jawGap / 2 - 5, 2.8, 0, Math.PI * 2);
          ctx.fill();
          // Pupil slits
          ctx.fillStyle = '#991b1b';
          ctx.fillRect(-4.5, -jawGap / 2 - 6, 1, 3);
          ctx.fillRect(3.5, -jawGap / 2 - 6, 1, 3);

          // Open lower jaw
          ctx.fillStyle = '#022c22';
          ctx.beginPath();
          ctx.ellipse(0, jawGap / 2, 15, 5, 0, 0, Math.PI * 2);
          ctx.fill();

          // Sharp white teeth!
          ctx.fillStyle = '#ffffff';
          for (let t = -10; t <= 10; t += 4) {
            ctx.beginPath();
            ctx.moveTo(t - 1.5, -jawGap / 2 + 3);
            ctx.lineTo(t + 1.5, -jawGap / 2 + 3);
            ctx.lineTo(t, -jawGap / 2 + 7);
            ctx.closePath();
            ctx.fill();

            // Lower teeth
            ctx.beginPath();
            ctx.moveTo(t - 1.5, jawGap / 2 - 1);
            ctx.lineTo(t + 1.5, jawGap / 2 - 1);
            ctx.lineTo(t, jawGap / 2 - 5);
            ctx.closePath();
            ctx.fill();
          }

          ctx.restore();
        }
      }
    }
  }

  // 3. Render Goal Portal
  const goal = engine.level.goal;
  const time = performance.now() * 0.003;
  ctx.save();
  ctx.translate(goal.x, goal.y);
  // Outer pulse ring
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, goal.radius + Math.sin(time * 3) * 3, 0, Math.PI * 2);
  ctx.stroke();
  // Inner spinning vortex
  ctx.rotate(time * 2);
  ctx.fillStyle = 'rgba(251, 191, 36, 0.4)';
  ctx.beginPath();
  ctx.arc(0, 0, goal.radius - 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ĐÍCH', 0, 0);
  ctx.restore();

  // 4. Render Trajectory Predictive Line (Aiming Arc)
  const trajectory = engine.getTrajectoryPoints(24);
  if (trajectory.length > 0) {
    ctx.save();
    const isLaser = engine.equippedSlingshot === 'laser_sight';
    const isFlame = engine.equippedSlingshot === 'dragon_flame';
    const isPlasma = engine.equippedSlingshot === 'plasma_shock';
    const isRainbow = engine.equippedSlingshot === 'rainbow_galaxy';

    // Laser Sight continuous guiding line
    if (isLaser) {
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(trajectory[0].x, trajectory[0].y);
      for (let i = 1; i < trajectory.length; i++) {
        ctx.lineTo(trajectory[i].x, trajectory[i].y);
      }
      ctx.stroke();
    }

    for (let i = 0; i < trajectory.length; i++) {
      const pt = trajectory[i];
      const progress = 1 - i / trajectory.length;
      const dotSize = Math.max(2, (isLaser ? 5.5 : 4.5) * progress);

      if (isLaser) {
        ctx.fillStyle = '#ef4444';
      } else if (isFlame) {
        ctx.fillStyle = i % 2 === 0 ? '#f97316' : '#fbbf24';
      } else if (isPlasma) {
        ctx.fillStyle = i % 2 === 0 ? '#c084fc' : '#38bdf8';
      } else if (isRainbow) {
        const rainbowColors = ['#f43f5e', '#ec4899', '#38bdf8', '#10b981', '#fbbf24'];
        ctx.fillStyle = rainbowColors[i % rainbowColors.length];
      } else {
        ctx.fillStyle = engine.dragState.tension > 0.95 ? '#f43f5e' : engine.dragState.tension > 0.6 ? '#f59e0b' : '#38bdf8';
      }

      ctx.beginPath();
      ctx.arc(pt.x, pt.y, dotSize, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 5. Render Slingshot Frame & Elastic Bands
  const { slingshot, character } = engine;
  ctx.save();
  const sx = slingshot.anchorX;
  const sy = slingshot.anchorY;

  // Slingshot frame style based on VIP item
  const isFlame = engine.equippedSlingshot === 'dragon_flame';
  const isPlasma = engine.equippedSlingshot === 'plasma_shock';
  const isRainbow = engine.equippedSlingshot === 'rainbow_galaxy';
  const isLaser = engine.equippedSlingshot === 'laser_sight';

  const postColor = isFlame ? '#431407' : isPlasma ? '#2e1065' : isRainbow ? '#713f12' : isLaser ? '#18181b' : '#78350f';
  const prongColor = isFlame ? '#ea580c' : isPlasma ? '#a855f7' : isRainbow ? '#facc15' : isLaser ? '#ef4444' : '#92400e';
  const capColor = isFlame ? '#f97316' : isPlasma ? '#c084fc' : isRainbow ? '#38bdf8' : isLaser ? '#dc2626' : '#d97706';

  // Base post
  ctx.fillStyle = postColor;
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(sx - 5, sy, 10, 22, 3);
  ctx.fill();
  ctx.stroke();

  // Left prong
  ctx.beginPath();
  ctx.moveTo(sx - 3, sy + 4);
  ctx.lineTo(slingshot.forkLeft.x, slingshot.forkLeft.y);
  ctx.lineWidth = 6;
  ctx.strokeStyle = prongColor;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(slingshot.forkLeft.x, slingshot.forkLeft.y, 4, 0, Math.PI * 2);
  ctx.fillStyle = capColor;
  ctx.fill();

  // Right prong
  ctx.beginPath();
  ctx.moveTo(sx + 3, sy + 4);
  ctx.lineTo(slingshot.forkRight.x, slingshot.forkRight.y);
  ctx.lineWidth = 6;
  ctx.strokeStyle = prongColor;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(slingshot.forkRight.x, slingshot.forkRight.y, 4, 0, Math.PI * 2);
  ctx.fillStyle = capColor;
  ctx.fill();

  // Elastic Rubber Bands
  if (engine.dragState.isDragging || (character.isGrounded && Math.hypot(character.x - sx, character.y - sy) < 40)) {
    const bandColor = isFlame ? '#f97316' : isPlasma ? '#c084fc' : isRainbow ? '#38bdf8' : isLaser ? '#ef4444' : '#ef4444';
    ctx.strokeStyle = bandColor;
    ctx.lineWidth = 3.5;

    // Left band
    ctx.beginPath();
    ctx.moveTo(slingshot.forkLeft.x, slingshot.forkLeft.y);
    ctx.lineTo(character.x - 6, character.y);
    ctx.stroke();

    // Right band
    ctx.beginPath();
    ctx.moveTo(slingshot.forkRight.x, slingshot.forkRight.y);
    ctx.lineTo(character.x + 6, character.y);
    ctx.stroke();

    // Leather launch pouch
    ctx.fillStyle = isFlame ? '#7c2d12' : isPlasma ? '#4c1d95' : '#7c2d12';
    ctx.beginPath();
    ctx.arc(character.x, character.y + 4, 8, 0, Math.PI);
    ctx.fill();
  }
  ctx.restore();

  // 6. Render Cute Character ("Bé Bông")
  if (character.isAlive) {
    ctx.save();
    ctx.translate(character.x, character.y);
    ctx.rotate(character.rotation);
    ctx.scale(1 / Math.sqrt(character.squashStretch), character.squashStretch);

    const r = character.radius;

    // A. Cute Ears
    ctx.fillStyle = '#f59e0b';
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 2;

    // Left Ear
    ctx.beginPath();
    ctx.ellipse(-r * 0.55, -r * 0.85, 6, 9, -0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Left Inner Pink Ear
    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.ellipse(-r * 0.55, -r * 0.85, 3.5, 6, -0.25, 0, Math.PI * 2);
    ctx.fill();

    // Right Ear
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.ellipse(r * 0.55, -r * 0.85, 6, 9, 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Right Inner Pink Ear
    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.ellipse(r * 0.55, -r * 0.85, 3.5, 6, 0.25, 0, Math.PI * 2);
    ctx.fill();

    // B. Round Chubby Body (Golden Peach Fur)
    const bodyGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, r + 2);
    bodyGrad.addColorStop(0, '#fef08a');
    bodyGrad.addColorStop(0.4, '#fbbf24');
    bodyGrad.addColorStop(1, '#d97706');
    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // C. Soft Cream Belly
    ctx.fillStyle = '#fef9c3';
    ctx.beginPath();
    ctx.ellipse(0, 4, r * 0.65, r * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // D. Rosy Blush Cheeks
    ctx.fillStyle = 'rgba(244, 63, 94, 0.65)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.55, 2, 4.5, 3, 0, 0, Math.PI * 2);
    ctx.ellipse(r * 0.55, 2, 4.5, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // E. Expressive Cute Eyes based on character state
    if (character.expression === 'happy') {
      // Happy closed crescent eyes ^_^
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(-6, -2, 4.5, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(6, -2, 4.5, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
    } else if (character.expression === 'panicked' || character.isSlipping) {
      // Panicked cartoon dizzy spirals or wide crying eyes!
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-6, -2, 6, 0, Math.PI * 2);
      ctx.arc(6, -2, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(-6, -2, 2.5, 0, Math.PI * 2);
      ctx.arc(6, -2, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Panic tear drops
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(-11, 2, 3, 0, Math.PI * 2);
      ctx.arc(11, 2, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (character.expression === 'skidding') {
      // Skidding gritted eyes > <
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2.5;
      // Left >
      ctx.beginPath();
      ctx.moveTo(-9, -5);
      ctx.lineTo(-4, -2);
      ctx.lineTo(-9, 1);
      ctx.stroke();
      // Right <
      ctx.beginPath();
      ctx.moveTo(9, -5);
      ctx.lineTo(4, -2);
      ctx.lineTo(9, 1);
      ctx.stroke();
    } else {
      // Big sparkling anime starry eyes
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(-6, -2, 4.8, 0, Math.PI * 2);
      ctx.arc(6, -2, 4.8, 0, Math.PI * 2);
      ctx.fill();

      // White sparkle highlights
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-7.5, -4, 2, 0, Math.PI * 2);
      ctx.arc(4.5, -4, 2, 0, Math.PI * 2);
      ctx.arc(-4.5, -1, 1, 0, Math.PI * 2);
      ctx.arc(7.5, -1, 1, 0, Math.PI * 2);
      ctx.fill();
    }

    // F. Cute Mouth
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    if (character.expression === 'panicked' || character.isSlipping) {
      // Open screaming O mouth
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.ellipse(0, 5, 4, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (character.expression === 'skidding') {
      // Gritted teeth
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-5, 4, 10, 4);
      ctx.strokeRect(-5, 4, 10, 4);
    } else {
      // Cute cat mouth :3
      ctx.beginPath();
      ctx.moveTo(-4, 4);
      ctx.quadraticCurveTo(-2, 6.5, 0, 4.5);
      ctx.quadraticCurveTo(2, 6.5, 4, 4);
      ctx.stroke();
    }

    // G. Little Paws (Digging into ground with sparks when skidding)
    ctx.fillStyle = '#f59e0b';
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 2;

    if (character.isSkidding) {
      // Digging feet backward
      ctx.beginPath();
      ctx.ellipse(-7, r - 1, 4, 3, -0.4, 0, Math.PI * 2);
      ctx.ellipse(7, r - 1, 4, 3, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(-6, r - 2, 3.5, 0, Math.PI * 2);
      ctx.arc(6, r - 2, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Protective Bubble Shield if active
    if (character.hasShield) {
      ctx.strokeStyle = 'rgba(96, 165, 250, 0.85)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, r + 7, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(147, 197, 253, 0.25)';
      ctx.beginPath();
      ctx.arc(0, 0, r + 7, 0, Math.PI * 2);
      ctx.fill();
    }

    // Parachute Canopy if gliding
    if (character.isGliding) {
      ctx.save();
      // Canopy
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(0, -r - 18, 22, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Cords
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-20, -r - 18); ctx.lineTo(-4, -r);
      ctx.moveTo(20, -r - 18); ctx.lineTo(4, -r);
      ctx.stroke();
      ctx.restore();
    }

    // H. Comic Speech / Status Bubbles Above Character
    if (character.isGliding) {
      // Parachute rescue bubble
      ctx.save();
      ctx.fillStyle = '#0284c7';
      ctx.strokeStyle = '#bae6fd';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-65, -r - 46, 130, 20, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9.5px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🪂 BUNG DÙ CỨU NGUY!', 0, -r - 36);
      ctx.restore();
    } else if (character.isSkidding) {
      // Burning Skid Reaction Bubble
      ctx.save();
      ctx.fillStyle = '#dc2626';
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-55, -r - 28, 110, 20, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🔥 PHANH CHÁY CHÂN!', 0, -r - 18);
      ctx.restore();
    } else if (character.isSlipping) {
      // Slipping Panic Bubble
      ctx.save();
      ctx.fillStyle = '#7f1d1d';
      ctx.strokeStyle = '#f87171';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-60, -r - 30, 120, 20, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 9.5px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('😱 TRƯỢT CHÂN RỒI!', 0, -r - 20);
      ctx.restore();
    }

    ctx.restore();
  }

  // 8. Render Particles
  for (const p of engine.particles) {
    const alpha = p.life / p.maxLife;
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.fillStyle = p.color;

    if (p.shape === 'spark') {
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  ctx.restore(); // Restore camera translation

  // 9. On-Screen Slingshot Pull Rubber Band (Rendered in screen space)
  if (engine.dragState.isDragging && engine.dragState.tension > 0.05) {
    const { startX, startY, currentX, currentY, tension } = engine.dragState;
    ctx.save();
    ctx.strokeStyle = tension > 0.95 ? '#f43f5e' : tension > 0.6 ? '#f59e0b' : '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();

    // Pull origin ring
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(startX, startY, 18, 0, Math.PI * 2);
    ctx.stroke();

    // Pull handle circle
    ctx.fillStyle = tension > 0.95 ? '#f43f5e' : '#38bdf8';
    ctx.beginPath();
    ctx.arc(currentX, currentY, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
