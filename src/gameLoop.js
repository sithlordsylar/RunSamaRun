// src/gameLoop.js
import { LERP_FACTOR, BASE_OBSTACLE_SPAWN_DELAY } from './constants.js';
import { startBossBattle, updateBoss, drawBoss } from './bossLoop.js';
import { Card, CARD_LORE } from './card.js';
import { Obstacle } from './obstacle.js';
import { ASSETS } from './assets.js';
import { showCardModal } from './ui.js';
import { showGameOverModal } from './modal.js';
import { submitScore } from './supabaseClient.js';

let lastTime = 0;
let gameOverShown = false;

function loop(t, gameState) {
  const dt = Math.min(1/30, (t - lastTime)/1000) || 0.016;
  lastTime = t;

  if (gameState.currentState === 'play') {
    updateGame(dt, gameState);
    drawGame(gameState);
  } else if (gameState.currentState === 'boss') {
    updateBoss(dt, t, gameState);
    drawBoss(gameState);
  } else if (gameState.currentState === 'cardModal') {
    // Keep drawing but skip updates
    drawGame(gameState);
  }

  window.requestAnimationFrame((t) => loop(t, gameState));
}

function updateGame(dt, gameState) {
  // 👉 Pause all updates if we’re in card modal
  if (gameState.currentState === 'cardModal') return;

  // smoothly interpolate speedMultiplier toward targetMultiplier
  gameState.speedMultiplier += (gameState.targetMultiplier - gameState.speedMultiplier) * LERP_FACTOR;
  // speed progression
  gameState.globalSpeed += 0.0003;
  gameState.bgX -= 100 * gameState.globalSpeed * gameState.speedMultiplier * dt;

  // update player
  gameState.player.update(gameState.input, dt);

  // obstacles
  gameState.spawnTimer += dt;
  const speedFactor = Math.max(0.7, 1.5 - gameState.globalSpeed * 0.1); // smooth curve
  const spawnInterval = BASE_OBSTACLE_SPAWN_DELAY * speedFactor + Math.random() * 0.8; // add some randomness

  if (gameState.spawnTimer > spawnInterval) {
    gameState.spawnTimer = 0;
    spawnObstacle(gameState);
  }

  gameState.obstacles.forEach(o => o.update(dt, gameState.globalSpeed * gameState.speedMultiplier));
  gameState.obstacles = gameState.obstacles.filter(o => o.x > -200);

  // collisions
  for (const o of gameState.obstacles) {
    if (o.collidesWith(gameState.player)) {
      // only if not invulnerable
      if (!gameState.player.invulnerable) {
        gameState.player.takeDamage(10);
        // play hit sfx
        try { new Audio(ASSETS.sfx.hit).play().catch(()=>{}); } catch(e){}

        // check for death
        if (gameState.player.hp <= 0) {
          createGameOver(gameState);
          return; // stop further update
        }
      }
    }
  }

  // cards spawn cooldown
  if (gameState.cards.filter(c => !c.collected).length === 0) {
    gameState.cardSpawnCooldown -= dt;
    if (gameState.cardSpawnCooldown <= 0) {
      spawnCard(gameState);
      gameState.cardSpawnCooldown = Math.random() * 5 + 5;
    }
  }

  // update cards and detection
  for (const c of gameState.cards) {
    c.update(dt, gameState.globalSpeed * gameState.speedMultiplier);
    // If player missed card (card moves past player’s X position), respawn it later
    if (!c.collected && c.x + c.width < gameState.player.x - 50) {
      console.log("Missed card detected, will respawn another soon");
      c.collected = true; // mark it gone so we don't process twice
      // Respawn another after a short delay
      setTimeout(() => {
        spawnCard(gameState);
      }, 5000 + Math.random() * 5000); // respawn after 5–10s
    }

    if (!c.collected && c.collidesWith(gameState.player)) {
      // pause game and show modal
      c.collected = true;
      gameState.collectedCards.push(c.def);
      // change background to card bg (load and fade)
      gameState.currentBg = c.def.bg;

      // Switch to card modal state (pause game updates)
      gameState.currentState = 'cardModal';

      // Show modal
      const lore = CARD_LORE[c.def.id] || "Unknown lore";
      showCardModal(c.def, lore, async () => {
        // load the new background immediately
        try {
          await loadBg(gameState.currentBg, gameState);
          console.log("Background changed to:", gameState.currentBg);
        } catch (e) {
          console.error("Failed to load new card background:", gameState.currentBg, e);
        }

        // on close: 3s countdown then grant boost and immunity
        let countdown = 3;

        // create countdown overlay
        const cdOverlay = document.createElement('div');
        cdOverlay.style.position = 'absolute';
        cdOverlay.style.top = '40%';
        cdOverlay.style.left = '50%';
        cdOverlay.style.transform = 'translate(-50%, -50%)';
        cdOverlay.style.fontSize = '60px';
        cdOverlay.style.color = 'white';
        cdOverlay.style.fontFamily = 'monospace';
        cdOverlay.style.textShadow = '0 0 10px #000';
        cdOverlay.style.zIndex = 9999;
        cdOverlay.innerText = `${countdown}`;
        document.body.appendChild(cdOverlay);

        const cdInterval = setInterval(() => {
          countdown--;
          cdOverlay.innerText = `${countdown}`;
          if (countdown <= 0) {
            clearInterval(cdInterval);
            document.body.removeChild(cdOverlay);

            // smooth speed boost
            gameState.targetMultiplier = 4.0;
            gameState.player.activateCardPower();

            // play sfx
            try { new Audio(ASSETS.sfx.card).play().catch(()=>{}); } catch(e){}

            // restore speed after 3s
            setTimeout(() => { gameState.targetMultiplier = 1.0; }, 3000);

            // if all 8 cards collected, spawn the hole
            if (gameState.collectedCards.length >= 8) {
              setTimeout(() => {
                gameState.hole = { x: 1100, y: 560, img: ASSETS.hole };
              }, Math.random()*8000);
            }

            // resume game
            gameState.currentState = 'play';
          }
        }, 1000);
      });
    }
  }

  // hole collision (if present)
  if (gameState.hole) {
    // move hole left with background illusion
    gameState.hole.x -= 260 * gameState.globalSpeed * gameState.speedMultiplier * dt;

    // ✅ collision trigger (ignore Y axis)
    const holeHitbox = { x: gameState.hole.x, width: 160 }; // slightly wider than visual hole
    const playerHitbox = { x: gameState.player.x, width: gameState.player.width };

    if (
      playerHitbox.x + playerHitbox.width > holeHitbox.x &&
      playerHitbox.x < holeHitbox.x + holeHitbox.width
    ) {
      if (!gameState.bossStage) {
        gameState.bossStage = true;
        gameState.currentState = 'transition';
        console.log("⚡ Entering final boss battle ⚡");

        // ⚡ Cinematic impact effect
        const flash = document.createElement('div');
        flash.style.position = 'absolute';
        flash.style.top = 0;
        flash.style.left = 0;
        flash.style.width = '100%';
        flash.style.height = '100%';
        flash.style.background = 'white';
        flash.style.opacity = 0.8;
        flash.style.zIndex = 99998;
        document.body.appendChild(flash);
        setTimeout(() => flash.style.opacity = 0, 150);
        setTimeout(() => document.body.removeChild(flash), 400);

        // brief camera shake
        let shake = 10;
        const shakeInterval = setInterval(() => {
          gameState.canvas.style.transform = `translate(${(Math.random()-0.5)*shake}px, ${(Math.random()-0.5)*shake}px)`;
          shake *= 0.9;
          if (shake < 1) {
            clearInterval(shakeInterval);
            gameState.canvas.style.transform = '';
          }
        }, 30);

        // fade to black transition
        const fade = document.createElement('div');
        fade.style.position = 'absolute';
        fade.style.top = 0;
        fade.style.left = 0;
        fade.style.width = '100%';
        fade.style.height = '100%';
        fade.style.background = 'black';
        fade.style.opacity = 0;
        fade.style.transition = 'opacity 2s';
        fade.style.zIndex = 99999;
        document.body.appendChild(fade);
        setTimeout(() => { fade.style.opacity = 1; }, 10);

        // stop player BGM gracefully
        try {
          gameState.player.bgm.pause();
          gameState.player.bgm.currentTime = 0;
        } catch (e) {}

        // wait for fade, then start boss battle
        // ⏸️ Wait for fade, then play transition sound before boss loads
        setTimeout(async () => {
          document.body.removeChild(fade);

          try {
            // 🎧 Play GoGoGo transition first
            const goAudio = new Audio('./assets/audio/gogogo.wav');
            await goAudio.play();
            console.log("GoGoGo SFX started.");

            // Wait for the 1-second clip to finish before boss loads
            setTimeout(() => {
              startBossBattle(gameState);
            }, 1000);
          } catch (e) {
            console.warn("Failed to play GoGoGo SFX, starting boss anyway.", e);
            startBossBattle(gameState);
          }
        }, 2200);
      }
    }
  }

  // score increases
  gameState.score += 1 * gameState.globalSpeed * gameState.speedMultiplier;

  // DEBUG: log score occasionally so we can verify it increases during play.
  // This will print every ~1 second to avoid spamming the console.
  if (Math.floor(gameState.score) % 100 === 0 && Math.floor(gameState.score) !== 0) {
    console.log("DEBUG score:", Math.floor(gameState.score));
  }
}

function drawGame(gameState) {
  const { ctx, canvas, bgImage, bgX, obstacles, cards, hole, player, score, collectedCards } = gameState;
  ctx.fillStyle = '#000';
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // draw background (panoramic repeat)
  if (bgImage) {
    // scale bg to canvas height
    const scale = canvas.height / bgImage.height;
    const bw = bgImage.width * scale;
    let x = (bgX % bw);
    // draw 3 copies to fill
    for (let i=-1;i<4;i++) {
      ctx.drawImage(bgImage, x + i*bw, 0, bw, canvas.height);
    }
  }

  // draw obstacles
  obstacles.forEach(o => o.draw(ctx));
  // draw cards
  cards.forEach(c => c.draw(ctx));
  // draw hole
  if (hole) {
    // simple draw using raw URL
    const img = new Image();
    img.src = hole.img;
    ctx.drawImage(img, hole.x, hole.y - 50, 120, 50);
  }

  // player
  player.draw(ctx);

  // HUD
  ctx.fillStyle = '#fff';
  ctx.font = '20px monospace';
  ctx.fillText(`SCORE: ${Math.floor(score)}`, 20, 30);
  ctx.fillText(`HP: ${player.hp}`, 20, 60);
  ctx.fillText(`CARDS: ${collectedCards.length}/8`, 20, 90);
}

// spawn obstacle helper
function spawnObstacle(gameState) {
  const url = ASSETS.obstacles[Math.floor(Math.random()*ASSETS.obstacles.length)];
  const o = new Obstacle(url, 1400);
  o.load().then(()=>{}).catch(()=>{});
  gameState.obstacles.push(o);
}

// spawn card
function spawnCard(gameState) {
  if (gameState.availableCards.length === 0) return;
  const idx = Math.floor(Math.random()*gameState.availableCards.length);
  const def = gameState.availableCards.splice(idx,1)[0];
  const c = new Card(def, 1400, 540);
  c.load().then(()=>{});
  gameState.cards.push(c);
}

function createGameOver(gameState) {
  if (gameOverShown) return; // stop repeats
  gameOverShown = true;

  showGameOverModal(Math.floor(gameState.score), ({ name, message }) => {
    const payload = {
      name: name || 'Player',
      message: message || '',
      score: Math.floor(gameState.score),
      created_at: new Date().toISOString()
    };

    submitScore(payload).then(res => {
      if (res.error) {
        alert('⚠️ Failed to submit score. Please check your kunju connection or try again later.');
        console.error('Submit error:', res.error);
      } else {
        alert('✅ Score submitted successfully! Heil Vikramnantha Sama-Ji! Heil the 4th Reich!');
      }
      setTimeout(() => location.reload(), 500);
    });
  });
}

async function loadBg(url, gameState) { gameState.bgImage = await loadImage(url); }

export { loop, createGameOver };
