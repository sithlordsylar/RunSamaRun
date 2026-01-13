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
import { createMenu, hideMenu, stopMenuBgm } from './ui.js';
import { fetchTopScores } from './supabaseClient.js';
import { ATTACK_SOUNDS } from './constants.js';
import { loop, createGameOver } from './gameLoop.js';


// DOM elements
const menuRoot = document.getElementById('menu-root');
const canvas = document.getElementById('gameCanvas');
const { ctx } = setupCanvas(canvas);

const gameState = {
  currentState: 'menu',
  speedMultiplier: 1.0,
  targetMultiplier: 1.0,
  player: null,
  obstacles: [],
  cards: [],
  bgX: 0,
  globalSpeed: 2.0,
  score: 0,
  spawnTimer: 0,
  cardSpawnCooldown: 3,
  collectedCards: [],
  availableCards: [...ASSETS.cards],
  currentBg: ASSETS.ui.defaultBg,
  bgImage: null,
  hole: null,
  boss: null,
  bossStage: false,
  projectiles: [],
  typingState: null,
  typingInput: '',
  ctx,
  canvas
};

// helper load default bg
async function loadBg(url, gameState) { gameState.bgImage = await loadImage(url); }



// Character select: simple inline modal for vanilla
function showCharacterSelect() {
  gameState.currentState = 'characterSelect';
  const sel = document.createElement('div');
  sel.className = 'overlay menu';
  sel.innerHTML = `
    <div class="panel center" style="flex-direction:column;">
      <h2>Select Character</h2>
      <div class="char-frame">
        <img id="charPortrait" class="char-portrait" src="">
      </div>
      <h3 id="charName"></h3>
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
  const nameEl = sel.querySelector('#charName');
  const loreEl = sel.querySelector('#charLore');
  let previewAudio = null;

  function updateCharacter() {
  const char = ASSETS.players[idx];
  portraitEl.src = char.portrait;
  nameEl.textContent = char.name;

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
  gameState.currentState = 'play';
  gameState.score = 0;
  gameState.obstacles = [];
  gameState.cards = [];
  gameState.collectedCards = [];
  gameState.availableCards = [...ASSETS.cards];
  gameState.globalSpeed = 2.0;
  gameState.spawnTimer = 0;
  gameState.cardSpawnCooldown = 3;
  gameState.hole = null;
  gameState.bossStage = false;
  gameState.projectiles = [];

  // load bg
  try {
    await loadBg(ASSETS.ui.defaultBg, gameState);
    console.log("Background loaded:", ASSETS.ui.defaultBg, gameState.bgImage);
  } catch (e) {
    console.error("Failed to load background:", ASSETS.ui.defaultBg, e);
  }

  // instantiate player
  try {
    gameState.player = new Player(ASSETS.players[idx]);
    gameState.player.assets.sfxJump = ASSETS.sfx.jump;
    await gameState.player.load();
    console.log("Player loaded:", gameState.player);
  } catch (e) {
    console.error("Failed to load player:", e);
  }

  // start background music
  try {
    if (gameState.player.bgm) {
      await gameState.player.bgm.play();
      console.log("BGM started");
    } else {
      console.warn("No BGM for this player:", ASSETS.players[idx]);
    }
  } catch (e) {
    console.error("BGM play failed:", e);
  }

  // start game loop
  console.log(">>> Game loop starting");
  window.requestAnimationFrame((t) => loop(t, gameState));
}


// simple leaderboard UI
async function showLeaderboard() {
  gameState.currentState = 'leaderboard';
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
gameState.input = input;

window.addEventListener('keydown', e => {
  if (e.code === 'ArrowLeft') input.left = true;
  if (e.code === 'ArrowRight') input.right = true;

  // normal jump (only active in runner mode)
  if (gameState.currentState === 'play' && e.code === 'Space') input.jump = true;

  // boss-battle charge start
  if (gameState.currentState === 'boss' && e.code === 'Space' && !gameState.typingState?.meterActive) {
    const nearCard = gameState.typingState?.activeCards?.find(c =>
      !c.used && Math.abs(gameState.player.x - c.baseX) < 100
    );
    if (nearCard) {
      gameState.typingState.meterActive = true;
      gameState.typingState.currentCard = nearCard;
      gameState.typingState.meterValue = 0;
      gameState.typingState.meterDir = 1;
      gameState.typingState.meterPulse = 0;
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
if (gameState.currentState === 'boss' && gameState.typingState?.meterActive) {
  const card = gameState.typingState.currentCard;
  const threshold = 50;                       // sweet spot center
  const margin = 10 + 5 * Math.sin(Date.now()/200); // pulsating margin
  const word = card.word;

  if (Math.abs(gameState.typingState.meterValue - threshold) <= margin) {
    // ✅ SUCCESSFUL HIT
    gameState.boss.takeDamage(150);
	gameState.player.jumpFlash = true;
	gameState.player.jumpFlashTimer = 0.3; // ~300ms visual jump


    // play correct unique sound file
    const sfxFile = ATTACK_SOUNDS[word];
    if (sfxFile) {
      try { new Audio(`./assets/audio/${sfxFile}`).play().catch(()=>{}); } catch {}
    }

    // show divine word flash
    gameState.typingState.flashWord = word.toUpperCase();
    setTimeout(() => (gameState.typingState.flashWord = null), 1000);
  } else {
    // ❌ MISSED ATTACK
    gameState.typingState.flashWord = "MISS!";
    setTimeout(() => (gameState.typingState.flashWord = null), 600);
  }

  // 💠 Consume card on both hit/miss
  card.used = true;
  card.active = false;
  gameState.typingState.activeCards = gameState.typingState.activeCards.filter(c => c !== card);

  // 💫 Respawn the same card after 8 seconds
  setTimeout(() => {
    card.used = false;
    card.active = true;
    gameState.typingState.activeCards.push(card);
  }, 8000);

  // reset meter
  gameState.typingState.meterActive = false;
  gameState.typingState.currentCard = null;
} // ✅ closes the Divine Attack Release logic
}
});

// initial load: show menu
(async function init() {
  await loadImage(ASSETS.ui.startBg).catch(()=>{});
  createMenu(menuRoot, () => { hideMenu(menuRoot); showCharacterSelect(); }, showLeaderboard);
})();
