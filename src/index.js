window.addEventListener("error", e => {
  console.error("Runtime error:", e.message, e.error);
});
window.addEventListener("unhandledrejection", e => {
  console.error("Unhandled promise rejection:", e.reason);
});

// src/index.js
import { ASSETS } from './assets.js';
import { setupCanvas, loadImage } from './engine.js';
import { Player } from './player.js';
import { Obstacle } from './obstacle.js';
import { Card, CARD_LORE } from './card.js';
import { Boss } from './boss.js';
import { createMenu, hideMenu, showCardModal, stopMenuBgm } from './ui.js';
import { submitScore, fetchTopScores } from './supabaseClient.js';

// 🎵 Divine Attack → Audio mapping
const ATTACK_SOUNDS = {
  "Kunju on The Loose!": "kun.wav",
  "Kunida!": "knd.wav",
  "Shinra Tensei!": "shi.wav",
  "Kandara Kawasaki!": "kan.wav",
  "Suthule Choppa!": "sut.wav",
  "Umbe!": "umb.wav",
  "Owh Yeah!": "owh.wav",
  "Kaiye Thunnai!": "kai.wav"
};


// DOM elements
const menuRoot = document.getElementById('menu-root');
const canvas = document.getElementById('gameCanvas');
const { ctx } = setupCanvas(canvas);
const uiOverlay = document.getElementById('ui-overlay');

let currentState = 'menu';
let lastTime = 0;

// game state
let speedMultiplier = 1.0;      // current effective multiplier
let targetMultiplier = 1.0;     // what we want to reach
const LERP_FACTOR = 0.05;       // smoothness: increase for faster ramp
let player, obstacles = [], cards = [], bgX = 0;
let globalSpeed = 2.0;
let score = 0;
let spawnTimer = 0;
let cardSpawnCooldown = 3;
let collectedCards = [];
let availableCards = [...ASSETS.cards];
let currentBg = ASSETS.ui.defaultBg;
let bgImage = null;
let hole = null;
let boss = null;
let bossStage = false;
let projectiles = [];
let typingState = null; // for boss typing
let typingInput = '';

// helper load default bg
async function loadBg(url) { bgImage = await loadImage(url); }



// Character select: simple inline modal for vanilla
function showCharacterSelect() {
  currentState = 'characterSelect';
  const sel = document.createElement('div');
  sel.className = 'overlay menu';
  sel.innerHTML = `
    <div class="panel center" style="flex-direction:column;">
      <h2>Select Character</h2>
      <div class="char-frame">
        <img id="charPortrait" class="char-portrait" src="">
      </div>
      <div class="msg-box" id="charLore">Loading lore...</div>
      <div class="row" style="margin-top:10px;">
        <button id="leftBtn" class="btn">&larr;</button>
        <button id="rightBtn" class="btn">&rarr;</button>
      </div>
      <div class="row" style="margin-top:10px;">
        <button id="previewBtn" class="btn">Preview BGM</button>
      </div>
      <div class="row" style="margin-top:10px;">
        <button id="backBtn" class="btn">Back</button>
        <button id="selectBtn" class="btn">Select & Start</button>
      </div>
    </div>
  `;
  document.body.appendChild(sel);

  let idx = 0;
  const portraitEl = sel.querySelector('#charPortrait');
  const loreEl = sel.querySelector('#charLore');
  let previewAudio = null;

  function updateCharacter() {
  const char = ASSETS.players[idx];
  portraitEl.src = char.portrait;

  // Placeholder dynamic text — you’ll replace these with actual lore later
  const loreSamples = [
    "<b>Lord Vikramnantha Sama-Ji! <i>Creation Mode:</i></b><br><br><b>Lord Vikramnantha Sama-Ji</b> is an immense cosmic power, is a being who predates creation itself.<br>In the beginning when there is no beginning he created <i>The Kunjumonz.</i><br><i>The Kunjumonz's</i> chants of <b><i>'Owh Yeah!'</b></i> are not mere sounds but a fundamental language that structures all of reality.<br>This serene yet formidable being sits in perpetual meditation, a gateway through which new realities can be formed. This was his form when he created everything from nothing and nothing from everything<br><br><b>Stats:</b><br><b>Charisma:</b> <i>Infinite</i><br><b>Wisdom:</b> <i>Infinite</i><br><b>Cosmic Power:</b> <i>Infinite</i>",
    "<b>Lord Vikramnantha Sama-Ji! <i>Loverboy Mode:</i></b><br><br><b>Lord Vikramnantha Sama-Ji</b> in his most enticing form is a being who can bend the strongest wills to his through his 'Kunjimani Keikaku'. His Aura and Charm has no competition. An old legend found from the Scroll of SMKBS says 'Ivan 13 vaiyasuleiye Natalie-yeh pasang pannavan' which scholars of Ancient Sama-Kunju-Lore Expert believes to describe how Sama-Ji is a playa and a renowned <b>Cosmic Playboy</b> who passed down his horniness to <b>Vikna Otsutsuki</b>.<br>His divine aura is so irresistible, that even the most formidable creatures like the <b>Poisonous Rat Bitch Veesus</b> and even the <b><i>Accursed One;</b></i> <b>Ste'Vi Ra</b> were compelled to fall in love and pay tribute to him and allow his <b>Kunju on The Loose</b>.<br><br><b>Stats:</b><br><b>Charisma:</b> <i>Infinite</i><br><b>Gae-ness:</b> <i>Infinite</i><br><b>Kaiyeh Thunnai:</b> <i>Infinite</i>",
	"<b>Lord Vikramnantha Sama-Ji! <i>God of the Annunaki:</i></b><br><br><b>Lord Vikramnantha Sama-Ji</b> is the supreme creator of the entirety of Dimension 69.<br>He crafted the Annunaki from Nibiru's waters through the act of <i>Kaiyeh Thunnai</i>, infusing them with divine wisdom and celestial knowledge to act as his hands across the universe. He commanded them to shape civilization and guide humanity on Earth, teaching them agriculture and metalwork, thereby molding civilizations.<br>Sama-Ji intervened directly by initiating the Great Flood to cleanse the Earth of chaos brought on by the Nephilim and banished Ste'Vi Ra, the Accursed One, to Datorim to restore cosmic balance. Throughout history, he has guided creation through multiple Avatars and MCs to fulfill his divine plan.<br><br><b>Stats:</b><br><b>Creation:</b> <i>Infinite</i><br><b>Destruction:</b> <i>Infinite</i><br><b>Divine Intervention:</b> <i>Infinite</i>",
    "<b>Lord Vikramnantha Sama-Ji! <i>Kunjumani Form:</i></b><br><br><b>Lord Vikramnantha Sama-Ji</b>, in his ultimate <b>Kunjumani Keikaku form</b>, is a being of unparalleled cosmic power, embodying the grand reset itself, signaled by the glowing green <i>Razer Triskellion</i> on his chest.<br>When the prophecy of <i>'The Accursed One'</i> comes to pass, and the universe is tainted beyond repair, especially given how Ste'Vi 'Ra just mated with every animals, zombies, mosters and hagravens before proceeding to <i>Join the Dato</i> and receive <i>Rim Job</i>.<br>Annoyed, Sama-Ji descended from <b>Dimension 69<i>—the highest of all dimensions</b></i>—to set things right. This is not a mere judgment; it is the ultimate war.<br>His final act is to perform the sacred destruction ritual of <b>Shinra Tensei</b> fused with <b>Chibaku Tensei</b> and <b>Final Getsuga Kunju</b>, a final, decisive act of both destruction and creation during the end of time, after <b>Alduin's</b> return.<br>He doesn't just destroy his foe; he 'resets' everything, fulfilling his true purpose as the <b>ultimate destroyer and resetter</b> of all them Kandara Kawasakis!<br><br><b>Stats:</b><br><b>Destruction Nature:</b> <i>Infinite</i><br><b>Resetting Nature:</b> <i>Infinite</i><br><b>Kaiyeh Thunai:</b> <i>Infinite</i>",
    "<b>Lord Vikramnantha Sama-Ji! <i>Owh Yeah Espada!:</i></b><br><br><b>Lord Vikramnantha Sama-Ji</b> is the almighty creator who originated from Dimension 69, the cosmic epicenter of all existence. From his divine breath and essence, he wove the tapestry of the multiverse and descended to the Third Dimension as Yeezus, an avatar tasked with teaching miracles and offering wisdom. This over-powerful being deliver his teachings and guide humanity through his tacos and churros and sombrero with mariachi band made out of the Frog-Like Kunjumonz.<br>It is stated that the Espada receive their power, drip and epic Mexicana OST from this Sama-Ji<br><br><b>Stats:</b><br><b>Owh Yeah:</b> <i>Infinite</i><br><b>Danza Koduro:</b> <i>Infinite</i><br><b>Pitbull/Mr.305:</b> <i>Infinite</i>"
  ];
  loreEl.innerHTML = loreSamples[idx];
  
  if (previewAudio) { previewAudio.pause(); previewAudio = null; }
}

  sel.querySelector('#leftBtn').onclick = () => {
    idx = (idx - 1 + ASSETS.players.length) % ASSETS.players.length;
    updateCharacter();
  };
  sel.querySelector('#rightBtn').onclick = () => {
    idx = (idx + 1) % ASSETS.players.length;
    updateCharacter();
  };

  sel.querySelector('#previewBtn').onclick = () => {
    if (previewAudio) {
      previewAudio.pause();
      previewAudio = null;
    } else {
      previewAudio = new Audio(ASSETS.players[idx].bgm);
      previewAudio.play().catch(()=>{});
    }
	stopMenuBgm(); // ✅ stop the main menu music when starting the game
  };

  sel.querySelector('#backBtn').onclick = () => {
    document.body.removeChild(sel);
    createMenu(menuRoot, () => { hideMenu(menuRoot); showCharacterSelect(); }, showLeaderboard);
  };

  sel.querySelector('#selectBtn').onclick = async () => {
    if (previewAudio) { previewAudio.pause(); previewAudio = null; }
	stopMenuBgm(); // ✅ stop the main menu music when starting the game
    document.body.removeChild(sel);
    await startGameWithCharacter(idx);
  };

  // show first character
  updateCharacter();
}

async function startGameWithCharacter(idx=0) {
  console.log(">>> Starting game with character index:", idx);

  // initialize core game
  currentState = 'play';
  score = 0; obstacles = []; cards = []; collectedCards = []; availableCards = [...ASSETS.cards];
  globalSpeed = 2.0;
  spawnTimer = 0; cardSpawnCooldown = 3; hole = null; bossStage = false; projectiles = [];

  // load bg
  try {
    await loadBg(ASSETS.ui.defaultBg);
    console.log("Background loaded:", ASSETS.ui.defaultBg, bgImage);
  } catch (e) {
    console.error("Failed to load background:", ASSETS.ui.defaultBg, e);
  }

  // instantiate player
  try {
    player = new Player(ASSETS.players[idx]);
    player.assets.sfxJump = ASSETS.sfx.jump;
    await player.load();
    console.log("Player loaded:", player);
  } catch (e) {
    console.error("Failed to load player:", e);
  }

  // start background music
  try {
    if (player.bgm) {
      await player.bgm.play();
      console.log("BGM started");
    } else {
      console.warn("No BGM for this player:", ASSETS.players[idx]);
    }
  } catch (e) {
    console.error("BGM play failed:", e);
  }

  // start game loop
  lastTime = performance.now();
  console.log(">>> Game loop starting");
  window.requestAnimationFrame(loop);
}


// simple leaderboard UI
async function showLeaderboard() {
  currentState = 'leaderboard';
  const wrap = document.createElement('div');
  wrap.className = 'overlay menu';
  wrap.innerHTML = `
    <div class="panel">
      <h2>Leaderboard</h2>
      <div id="scores">Loading...</div>
      <div style="margin-top:12px">
        <button id="back" class="btn">Back</button>
      </div>
    </div>`;
  document.body.appendChild(wrap);

  // Back button
  wrap.querySelector('#back').onclick = () => {
    document.body.removeChild(wrap);
    createMenu(menuRoot, () => { hideMenu(menuRoot); showCharacterSelect(); }, showLeaderboard);
  };

  try {
    const { data, error } = await fetchTopScores(10);
    const scoresEl = wrap.querySelector('#scores');

    if (error || !data) {
      console.error('Leaderboard fetch error:', error);
      scoresEl.innerText = '⚠️ Failed to load leaderboard. Please try again later.';
      return;
    }

    if (data.length === 0) {
      scoresEl.innerHTML = '<div class="small">No scores yet. Be the first!</div>';
      return;
    }

    scoresEl.innerHTML = data.map(d => `
      <div class="small">
        <b>${d.name}</b> (${d.score}) - ${new Date(d.created_at).toLocaleString()}
        <div class="small">${d.message}</div>
      </div>
      <hr>`).join('');

  } catch (err) {
    console.error('Leaderboard error:', err);
    wrap.querySelector('#scores').innerText = '⚠️ Could not connect to server.';
  }
}


// input
const input = { jump: false, left:false, right:false, attack:false };

window.addEventListener('keydown', e => {
  if (e.code === 'ArrowLeft') input.left = true;
  if (e.code === 'ArrowRight') input.right = true;

  // normal jump (only active in runner mode)
  if (currentState === 'play' && e.code === 'Space') input.jump = true;

  // boss-battle charge start
  if (currentState === 'boss' && e.code === 'Space' && !typingState?.meterActive) {
    const nearCard = typingState?.activeCards?.find(c =>
      !c.used && Math.abs(player.x - c.baseX) < 100
    );
    if (nearCard) {
      typingState.meterActive = true;
      typingState.currentCard = nearCard;
      typingState.meterValue = 0;
      typingState.meterDir = 1;
      typingState.meterPulse = 0;
      input.attack = true;
      try { new Audio('../assets/audio/charge.wav').play().catch(()=>{}); } catch {}
    }
  }
});

window.addEventListener('keyup', e => {
  if (e.code === 'ArrowLeft') input.left = false;
  if (e.code === 'ArrowRight') input.right = false;

  if (e.code === 'Space') {
    input.jump = false;
    input.attack = false;

    // --- Divine Attack Release ---
if (currentState === 'boss' && typingState?.meterActive) {
  const card = typingState.currentCard;
  const threshold = 50;                       // sweet spot center
  const margin = 10 + 5 * Math.sin(Date.now()/200); // pulsating margin
  const word = card.word;

  if (Math.abs(typingState.meterValue - threshold) <= margin) {
    // ✅ SUCCESSFUL HIT
    boss.takeDamage(150);
	player.jumpFlash = true;
	player.jumpFlashTimer = 0.3; // ~300ms visual jump


    // play correct unique sound file
    const sfxFile = ATTACK_SOUNDS[word];
    if (sfxFile) {
      try { new Audio(`./assets/audio/${sfxFile}`).play().catch(()=>{}); } catch {}
    }

    // show divine word flash
    typingState.flashWord = word.toUpperCase();
    setTimeout(() => (typingState.flashWord = null), 1000);
  } else {
    // ❌ MISSED ATTACK
    typingState.flashWord = "MISS!";
    setTimeout(() => (typingState.flashWord = null), 600);
  }

  // 💠 Consume card on both hit/miss
  card.used = true;
  card.active = false;
  typingState.activeCards = typingState.activeCards.filter(c => c !== card);

  // 💫 Respawn the same card after 8 seconds
  setTimeout(() => {
    card.used = false;
    card.active = true;
    typingState.activeCards.push(card);
  }, 8000);

  // reset meter
  typingState.meterActive = false;
  typingState.currentCard = null;
} // ✅ closes the Divine Attack Release logic
}
});



// spawn obstacle helper
function spawnObstacle() {
  const url = ASSETS.obstacles[Math.floor(Math.random()*ASSETS.obstacles.length)];
  const o = new Obstacle(url, 1400);
  o.load().then(()=>{}).catch(()=>{});
  obstacles.push(o);
}

// spawn card
function spawnCard() {
  if (availableCards.length === 0) return;
  const idx = Math.floor(Math.random()*availableCards.length);
  const def = availableCards.splice(idx,1)[0];
  const c = new Card(def, 1400, 540);
  c.load().then(()=>{});
  cards.push(c);
}

// main loop
function loop(t) {
  const dt = Math.min(1/30, (t - lastTime)/1000) || 0.016;
  lastTime = t;

  if (currentState === 'play') {
    updateGame(dt);
    drawGame();
  } else if (currentState === 'boss') {
    updateBoss(dt, t);
    drawBoss();
  } else if (currentState === 'cardModal') {
  // Keep drawing but skip updates
  drawGame();
  }

  window.requestAnimationFrame(loop);
}

// Update & Draw functions for Runner
function updateGame(dt) {
	// 👉 Pause all updates if we’re in card modal
	if (currentState === 'cardModal') return;
	
	// smoothly interpolate speedMultiplier toward targetMultiplier
	speedMultiplier += (targetMultiplier - speedMultiplier) * LERP_FACTOR;
  // speed progression
  globalSpeed += 0.0003;
  bgX -= 100 * globalSpeed * speedMultiplier * dt;

  // update player
  player.update(input, dt);

  // obstacles
spawnTimer += dt;
const baseDelay = 2.0;  // average spawn delay
const speedFactor = Math.max(0.7, 1.5 - globalSpeed * 0.1); // smooth curve
const spawnInterval = baseDelay * speedFactor + Math.random() * 0.8; // add some randomness

if (spawnTimer > spawnInterval) {
  spawnTimer = 0;
  spawnObstacle();
}

  obstacles.forEach(o => o.update(dt, globalSpeed * speedMultiplier));
  obstacles = obstacles.filter(o => o.x > -200);

	// collisions
	for (const o of obstacles) {
	if (o.collidesWith(player)) {
		// only if not invulnerable
		if (!player.invulnerable) {
		player.takeDamage(10);
		// play hit sfx
		try { new Audio(ASSETS.sfx.hit).play().catch(()=>{}); } catch(e){}

		// check for death
		if (player.hp <= 0) {
			createGameOver();
			return; // stop further update
      }
    }
  }
}


	// cards spawn cooldown
	if (cards.filter(c => !c.collected).length === 0) {
		cardSpawnCooldown -= dt;
		if (cardSpawnCooldown <= 0) {
			spawnCard();
			cardSpawnCooldown = Math.random() * 5 + 5;
		}
	}

  // update cards and detection
  for (const c of cards) {
    c.update(dt, globalSpeed * speedMultiplier);
	    // If player missed card (card moves past player’s X position), respawn it later
    if (!c.collected && c.x + c.width < player.x - 50) {
      console.log("Missed card detected, will respawn another soon");
      c.collected = true; // mark it gone so we don't process twice
      // Respawn another after a short delay
      setTimeout(() => {
        spawnCard();
      }, 5000 + Math.random() * 5000); // respawn after 5–10s
    }

    if (!c.collected && c.collidesWith(player)) {
      // pause game and show modal
      c.collected = true;
      collectedCards.push(c.def);
      // change background to card bg (load and fade)
currentBg = c.def.bg;

// Switch to card modal state (pause game updates)
currentState = 'cardModal';

// Show modal
const lore = CARD_LORE[c.def.id] || "Unknown lore";
showCardModal(c.def, lore, async () => {
  // load the new background immediately
  try {
    await loadBg(currentBg);
    console.log("Background changed to:", currentBg);
  } catch (e) {
    console.error("Failed to load new card background:", currentBg, e);
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
      targetMultiplier = 4.0;
      player.activateCardPower();

      // play sfx
      try { new Audio(ASSETS.sfx.card).play().catch(()=>{}); } catch(e){}

      // restore speed after 3s
      setTimeout(() => { targetMultiplier = 1.0; }, 3000);

      // if all 8 cards collected, spawn the hole
      if (collectedCards.length >= 8) {
        setTimeout(() => {
          hole = { x: 1100, y: 560, img: ASSETS.hole };
        }, Math.random()*8000);
      }

      // resume game
      currentState = 'play';
    }
  }, 1000);
});

    }
  }

  // hole collision (if present)
if (hole) {
  // move hole left with background illusion
  hole.x -= 260 * globalSpeed * speedMultiplier * dt;

  // ✅ collision trigger (ignore Y axis)
  const holeHitbox = { x: hole.x, width: 160 }; // slightly wider than visual hole
  const playerHitbox = { x: player.x, width: player.width };

  if (
    playerHitbox.x + playerHitbox.width > holeHitbox.x &&
    playerHitbox.x < holeHitbox.x + holeHitbox.width
  ) {
    if (!bossStage) {
      bossStage = true;
      currentState = 'transition';
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
  canvas.style.transform = `translate(${(Math.random()-0.5)*shake}px, ${(Math.random()-0.5)*shake}px)`;
  shake *= 0.9;
  if (shake < 1) {
    clearInterval(shakeInterval);
    canvas.style.transform = '';
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
        player.bgm.pause();
        player.bgm.currentTime = 0;
      } catch (e) {}

      // wait for fade, then start boss battle
      // ⏸️ Wait for fade, then play transition sound before boss loads
setTimeout(async () => {
  document.body.removeChild(fade);

  try {
    // 🎧 Play GoGoGo transition first
    const goAudio = new Audio('../assets/audio/gogogo.wav');
    await goAudio.play();
    console.log("GoGoGo SFX started.");

    // Wait for the 1-second clip to finish before boss loads
    setTimeout(() => {
      startBossBattle();
    }, 1000);
  } catch (e) {
    console.warn("Failed to play GoGoGo SFX, starting boss anyway.", e);
    startBossBattle();
  }
}, 2200);

    }
  }
}

  // score increases
  score += 1 * globalSpeed * speedMultiplier;
  
// DEBUG: log score occasionally so we can verify it increases during play.
// This will print every ~1 second to avoid spamming the console.
if (Math.floor(score) % 100 === 0 && Math.floor(score) !== 0) {
  console.log("DEBUG score:", Math.floor(score));
}
}

function drawGame() {
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

async function startBossBattle() {
  console.log(">>> Boss Battle Initialized");

  bossStage = true;

  // stop and reset any previous bgm cleanly
  try {
    if (player.bgm) {
      player.bgm.pause();
      player.bgm.currentTime = 0;
    }
  } catch (e) {
    console.warn("Error stopping player BGM:", e);
  }

  // create and load boss
  boss = new Boss(ASSETS.boss);
  player.inBossBattle = true;  // ✅ switch to grounded boss movement
  await boss.load();

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
    boss.bgm.loop = true;
    await boss.bgm.play();
    console.log("Boss BGM started.");
  } catch (e) {
    console.error("Failed to start boss BGM:", e);
  }
  
  // ✅ finally switch to boss state
  currentState = 'boss';

  // initialize typing slots
    typingState = {
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


function updateBoss(dt, t) {
	if (!typingState) return; // 🚫 prevent running too early
  // minimal player movement on boss screen: allow left/right, jump ignored
  if (input.left) player.x -= 200 * dt;
  if (input.right) player.x += 200 * dt;
  player.x = Math.max(40, Math.min(1200, player.x));

boss.update(dt, t);

// sweet-spot pulse oscillation
if (typingState) {
  typingState.meterPulse = (Math.sin(t / 250) + 1) * 0.5; // 0–1 oscillation
}


// make divine cards hover gently
if (typingState?.activeCards) {
  const hoverSpeed = 2;
  const hoverAmplitude = 10;
  typingState.activeCards.forEach(card => {
    card.yOffset = Math.sin(t * 0.002 * hoverSpeed + card.baseX) * hoverAmplitude;
  });
}


// projectiles (falling down)
boss.maybeSpawnProjectile(dt * 0.6, projectiles);
projectiles.forEach(p => p.update(dt));
projectiles = projectiles.filter(p => p.y < 720); // remove when off screen


  // collision with player
  for (const p of projectiles) {
    if (
		p.x < player.x + player.width &&
		p.x + p.width > player.x &&
		p.y + p.height > player.y - player.height &&
		p.y < player.y
	)
 {
      // hit
      const taken = player.takeDamage(5);
      // remove projectile
      p.x = -999;
    }
  }

// --- Divine Card Meter Attack System ---
if (!typingState.cards) {
  // spawn divine cards from collected cards, spaced evenly across the boss arena
  typingState.cards = collectedCards.map((c, i) => ({
    def: c,
    baseX: 200 + (i * 120), // spread cards horizontally
    baseY: 420 + Math.sin(i) * 10, // small variation
    yOffset: 0, // for hover effect
    active: true,
    used: false,
    word: typingState.phrases[i % typingState.phrases.length]
  }));
  // ensure all divine card defs have valid image path
typingState.cards.forEach(c => {
  if (!c.def.low && !c.def.high) {
    console.warn("⚠️ Card missing image field:", c.def);
  }
});

  typingState.activeCards = typingState.cards;
  typingState.timer = 0;
}


// spawn new Divine Cards gradually
typingState.timer -= dt;
if (typingState.timer <= 0 && typingState.activeCards.length < 2) {
  const available = typingState.cards.filter(c => !c.active && !c.used);
  if (available.length > 0) {
    const card = available[Math.floor(Math.random() * available.length)];
    card.active = true;
    typingState.activeCards.push(card);
    typingState.timer = Math.random() * 2 + 3; // 3–5s delay
  }
}


// handle meter logic
if (typingState.meterActive) {
  const speed = 180; // control how fast it moves
  typingState.meterValue += typingState.meterDir * speed * dt;
  if (typingState.meterValue >= 100) {
    typingState.meterValue = 100;
    typingState.meterDir = -1;
  } else if (typingState.meterValue <= 0) {
    typingState.meterValue = 0;
    typingState.meterDir = 1;
  }
}


// reset when all cards used
if (typingState.cards.every(c => c.used)) {
  typingState.cards.forEach(c => (c.used = false));
}

  // special heal trigger
  if (player.hp < 5) {
    // flash white and message (we'll simulate)
    alert("CALL THE AMBULANCE! BUT NOT FOR ME! BECAUSE IT'S ALL ACCORDING TO MY KUNJUMANI KEIKAKU!");
    player.healFull();
    boss.takeDamage(69);
  }

  // end condition
  if (boss.hp <= 0) {
  boss.bgm.pause();
  alert("🔥 Ste'Vi Ra Have Been Defeated!! You escaped his Rim Job!! 🔥");

  // Force final score to max
  score = 999999;

  createGameOver();
}

}

function drawBoss() {
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

let gameOverShown = false;
function createGameOver() {
  if (gameOverShown) return; // stop repeats
  gameOverShown = true;

  const name = prompt('Enter name for leaderboard (max 32 chars):', 'Divine Kunju');
  const msg = prompt('Leave a short message (max 140 chars):', 'Owh yeah! Kunju on the loose!');
  const payload = {
  name: name || 'Player',
  message: msg || '',
  score: Math.floor(score),
  created_at: new Date().toISOString() // ✅ include actual timestamp
};


  submitScore(payload).then(res => {
    if (res.error) {
      alert('⚠️ Failed to submit score. Please check your kunju connection or try again later.');
      console.error('Submit error:', res.error);
    } else {
      alert('✅ Score submitted successfully! Heil Vikramnantha Sama-Ji! Heil the 4th Reich!');
    }
    setTimeout(() => location.reload(), 500); // allow Supabase to finish cleanly
  });
}



// initial load: show menu
(async function init() {
  await loadImage(ASSETS.ui.startBg).catch(()=>{});
  createMenu(menuRoot, () => { hideMenu(menuRoot); showCharacterSelect(); }, showLeaderboard);
})();