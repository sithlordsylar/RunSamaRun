// src/ui.js
import { ASSETS } from './assets.js';

let menuBgm = null;

export function stopMenuBgm() {
  if (menuBgm) {
    menuBgm.pause();
    menuBgm.currentTime = 0;
  }
}

export function createMenu(rootEl, startCallback, leaderboardCallback) {
  rootEl.classList.remove('hidden');
  rootEl.innerHTML = `
    <div class="menu" style="background:url('${ASSETS.ui.startBg}') center/cover no-repeat;">
      <div class="panel">
        <h1>Sama-Ji Runner</h1>
        <div class="row center">
          <button id="startBtn" class="btn">Start Game</button>
          <button id="leaderBtn" class="btn">Leaderboard</button>
          <button id="howBtn" class="btn">How to Play</button>
          <button id="loreBtn" class="btn">Lore</button>
        </div>
        <p class="small">Inspired by the great Lord Vikramnantha Sama-Ji! Player can now experience his Holiness as a 2nd Dimension Character and defeat the Accursed One!</p>
      </div>
    </div>
  `;

  // 🎵 Menu BGM fix (global instance)
	if (!menuBgm) {
		menuBgm = new Audio('../assets/audio/menu_bgm.mp3');
		menuBgm.loop = true;
	}

	// Play once user interacts (browser security)
	const tryPlay = () => {
	if (menuBgm.paused) {
		menuBgm.play().catch(() => {});
	}
	window.removeEventListener('click', tryPlay);
};
window.addEventListener('click', tryPlay);


  rootEl.querySelector('#startBtn').onclick = () => {
    rootEl.querySelector('#startBtn').disabled = true; // lock button
    menuBgm.pause(); // stop menu bgm when game starts
    startCallback();
  };

  rootEl.querySelector('#leaderBtn').onclick = leaderboardCallback;
  rootEl.querySelector('#howBtn').onclick = () => {
    alert('Space to jump. Collect cards. In boss fight: move to highlighted card and type the Divine Words!');
  };
  rootEl.querySelector('#loreBtn').onclick = () => {
    window.location.href = 'https://sithlordsylar.github.io/artificialbaktha/';
  };
}

export function hideMenu(rootEl) {
  rootEl.classList.add('hidden');
  rootEl.innerHTML = '';
}

export function showCardModal(cardDef, loreText, onClose) {
  const modal = document.createElement('div');
  modal.className = 'card-modal';
  modal.innerHTML = `
    <div class="card-wrap">
      <img src="${cardDef.high}">
      <div class="msg-box">
        <div class="typewriter">${loreText}</div>
        <div class="msg-countdown small">Press SPACE to close and begin countdown</div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  function closeHandler(e) {
    if (e.code === 'Space') {
      document.body.removeChild(modal);
      window.removeEventListener('keydown', closeHandler);
      onClose();
    }
  }
  window.addEventListener('keydown', closeHandler);
}
