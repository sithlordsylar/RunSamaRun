// src/bossLoop.js
import { ASSETS } from './assets.js';
import { Boss } from './boss.js';
import { createGameOver } from './gameLoop.js';

async function startBossBattle(gameState) {
  console.log(">>> Boss Battle Initialized");

  gameState.bossStage = true;

  // stop and reset any previous bgm cleanly
  try {
    if (gameState.player.bgm) {
      gameState.player.bgm.pause();
      gameState.player.bgm.currentTime = 0;
    }
  } catch (e) {
    console.warn("Error stopping player BGM:", e);
  }

  // create and load boss
  gameState.boss = new Boss(ASSETS.boss);
  gameState.player.inBossBattle = true;  // ✅ switch to grounded boss movement
  await gameState.boss.load();

  // small visual fade-in
  const fadeIn = document.createElement('div');
  fadeIn.style.position = 'absolute';
  fadeIn.style.top = 0;
  fadeIn.style.left = 0;
  fadeIn.style.width = '100%';
  fadeIn.style.height = '100%';
  fadeIn.style.background = 'black';
  fadeIn.style.opacity = 1;
  fadeIn.style.transition = 'opacity 2s';
  fadeIn.style.zIndex = 9999;
  document.body.appendChild(fadeIn);
  setTimeout(() => (fadeIn.style.opacity = 0), 50);
  setTimeout(() => document.body.removeChild(fadeIn), 2000);

  // start boss music after fade
  try {
    gameState.boss.bgm.loop = true;
    await gameState.boss.bgm.play();
    console.log("Boss BGM started.");
  } catch (e) {
    console.error("Failed to start boss BGM:", e);
  }

  // ✅ finally switch to boss state
  gameState.currentState = 'boss';

  // initialize typing slots
  gameState.typingState = {
    phrases: [
      "Kunju on The Loose!",
      "Owh Yeah!",
      "Kunida!",
      "Umbe!",
      "Suthule Choppa!",
      "Kandara Kawasaki!",
      "Shinra Tensei!",
      "Kaiye Thunnai!"
    ],
    cards: null,
    activeCards: [],
    timer: 0,
    meterActive: false,
    currentCard: null,
    meterValue: 0,
    meterDir: 1,
    flashWord: null
  };
}


function updateBoss(dt, t, gameState) {
  if (!gameState.typingState) return; // 🚫 prevent running too early
  // minimal player movement on boss screen: allow left/right, jump ignored
  if (gameState.input.left) gameState.player.x -= 200 * dt;
  if (gameState.input.right) gameState.player.x += 200 * dt;
  gameState.player.x = Math.max(40, Math.min(1200, gameState.player.x));

  gameState.boss.update(dt, t);

  // sweet-spot pulse oscillation
  if (gameState.typingState) {
    gameState.typingState.meterPulse = (Math.sin(t / 250) + 1) * 0.5; // 0–1 oscillation
  }

  // make divine cards hover gently
  if (gameState.typingState?.activeCards) {
    const hoverSpeed = 2;
    const hoverAmplitude = 10;
    gameState.typingState.activeCards.forEach(card => {
      card.yOffset = Math.sin(t * 0.002 * hoverSpeed + card.baseX) * hoverAmplitude;
    });
  }

  // projectiles (falling down)
  gameState.boss.maybeSpawnProjectile(dt * 0.6, gameState.projectiles);
  gameState.projectiles.forEach(p => p.update(dt));
  gameState.projectiles = gameState.projectiles.filter(p => p.y < 720); // remove when off screen

  // collision with player
  for (const p of gameState.projectiles) {
    if (
      p.x < gameState.player.x + gameState.player.width &&
      p.x + p.width > gameState.player.x &&
      p.y + p.height > gameState.player.y - gameState.player.height &&
      p.y < gameState.player.y
    ) {
      // hit
      const taken = gameState.player.takeDamage(5);
      // remove projectile
      p.x = -999;
    }
  }

  // --- Divine Card Meter Attack System ---
  if (!gameState.typingState.cards) {
    // spawn divine cards from collected cards, spaced evenly across the boss arena
    gameState.typingState.cards = gameState.collectedCards.map((c, i) => ({
      def: c,
      baseX: 200 + (i * 120), // spread cards horizontally
      baseY: 420 + Math.sin(i) * 10, // small variation
      yOffset: 0, // for hover effect
      active: true,
      used: false,
      word: gameState.typingState.phrases[i % gameState.typingState.phrases.length]
    }));
    // ensure all divine card defs have valid image path
    gameState.typingState.cards.forEach(c => {
      if (!c.def.low && !c.def.high) {
        console.warn("⚠️ Card missing image field:", c.def);
      }
    });

    gameState.typingState.activeCards = gameState.typingState.cards;
    gameState.typingState.timer = 0;
  }

  // spawn new Divine Cards gradually
  gameState.typingState.timer -= dt;
  if (gameState.typingState.timer <= 0 && gameState.typingState.activeCards.length < 2) {
    const available = gameState.typingState.cards.filter(c => !c.active && !c.used);
    if (available.length > 0) {
      const card = available[Math.floor(Math.random() * available.length)];
      card.active = true;
      gameState.typingState.activeCards.push(card);
      gameState.typingState.timer = Math.random() * 2 + 3; // 3–5s delay
    }
  }

  // handle meter logic
  if (gameState.typingState.meterActive) {
    const speed = 180; // control how fast it moves
    gameState.typingState.meterValue += gameState.typingState.meterDir * speed * dt;
    if (gameState.typingState.meterValue >= 100) {
      gameState.typingState.meterValue = 100;
      gameState.typingState.meterDir = -1;
    } else if (gameState.typingState.meterValue <= 0) {
      gameState.typingState.meterValue = 0;
      gameState.typingState.meterDir = 1;
    }
  }

  // reset when all cards used
  if (gameState.typingState.cards.every(c => c.used)) {
    gameState.typingState.cards.forEach(c => (c.used = false));
  }

  // special heal trigger
  if (gameState.player.hp < 5) {
    // flash white and message (we'll simulate)
    alert("CALL THE AMBULANCE! BUT NOT FOR ME! BECAUSE IT'S ALL ACCORDING TO MY KUNJUMANI KEIKAKU!");
    gameState.player.healFull();
    gameState.boss.takeDamage(69);
  }

  // end condition
  if (gameState.boss.hp <= 0) {
    gameState.boss.bgm.pause();
    alert("🔥 Ste'Vi Ra Have Been Defeated!! You escaped his Rim Job!! 🔥");

    // Force final score to max
    gameState.score = 999999;

    createGameOver(gameState);
  }
}

function drawBoss(gameState) {
  const { ctx, canvas, player, boss, projectiles, typingState } = gameState;
  // static boss bg
  const bg = new Image();
  bg.src = ASSETS.boss.bg;
  ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

  // draw player as idle
  player.draw(ctx);
  // draw boss
  boss.draw(ctx);

  // draw projectiles
  for (const p of projectiles) {
    if (p.img) ctx.drawImage(p.img, p.x, p.y, p.width, p.height);
  }

  // draw UI
  ctx.fillStyle = '#fff';
  ctx.font = '20px monospace';
  ctx.fillText(`BOSS HP: ${boss.hp.toFixed(2)}`, 900, 30);
  ctx.fillText(`PLAYER HP: ${player.hp}`, 20, 30);

  if (typingState && typingState.activeCards) {
    for (const card of typingState.activeCards) {
      if (!card.used) {
        const img = new Image();
        // ✅ use the low-res collectible card image
        img.src = card.def.low || card.def.high || card.def.img || '';
        const y = card.baseY + card.yOffset;
        ctx.drawImage(img, card.baseX, y, 100, 100);
      }
    }
  }

  // ✨ Divine Card Glow Aura + Hint Text ✨
  for (const card of typingState.activeCards) {
    if (card.used) continue;
    const cardX = card.baseX;
    const cardY = card.baseY + card.yOffset;
    const dist = Math.abs(player.x - cardX);

    // within aura range
    if (dist < 100) {
      // pulsing glow effect
      const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 200);
      ctx.beginPath();
      ctx.arc(cardX + 50, cardY + 50, 70, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 100, ${0.15 + 0.25 * pulse})`;
      ctx.fill();

      // glowing outline ring
      ctx.lineWidth = 4;
      ctx.strokeStyle = `rgba(255, 255, 180, ${0.5 + 0.5 * pulse})`;
      ctx.beginPath();
      ctx.arc(cardX + 50, cardY + 50, 70, 0, Math.PI * 2);
      ctx.stroke();

      // floating hint text
      ctx.font = "18px monospace";
      ctx.fillStyle = `rgba(255,255,255,${0.7 + 0.3 * pulse})`;
      ctx.textAlign = "center";
      ctx.fillText("Hold SPACE to charge", cardX + 50, cardY - 20);
      ctx.fillText(`Release on '${card.word.slice(0,3).toUpperCase()}'!`, cardX + 50, cardY - 2);
      ctx.textAlign = "left";
    }
  }

  // --- Divine Meter ---
  if (typingState?.meterActive) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(440, 600, 400, 40);

    // pulsing sweet-spot (green zone)
    const pulse = typingState.meterPulse || 0;
    const baseWidth = 10;
    const expand = 10 * pulse; // 10→20 width
    ctx.fillStyle = '#0f0';
    ctx.fillRect(440 + 200 - (baseWidth/2 + expand/2), 595, baseWidth + expand, 50);

    // moving white bar
    ctx.fillStyle = '#fff';
    ctx.fillRect(440 + typingState.meterValue * 4, 600, 10, 40);

    // prefix hint
    const prefix = typingState.currentCard
      ? typingState.currentCard.word.slice(0,3).toUpperCase()
      : '';
    ctx.fillStyle = '#fff';
    ctx.font = '20px monospace';
    ctx.fillText(prefix, 620, 580);
  }

  // --- Divine Word Flash ---
  if (typingState?.flashWord) {
    ctx.font = '80px Impact';
    ctx.fillStyle = '#ff0';
    ctx.textAlign = 'center';
    ctx.fillText(typingState.flashWord, canvas.width / 2, canvas.height / 2);
    ctx.textAlign = 'left';
  }
}

export { startBossBattle, updateBoss, drawBoss };
