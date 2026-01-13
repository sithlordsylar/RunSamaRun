// src/ui.js
import { ASSETS } from './assets.js';

let menuBgm = null;

// CONFIG: Path to your README. 
// NOTE: Ensure README.md is in the same folder as index.html (e.g. public/) 
// or adjust this path (e.g. '../README.md' if index.html is in src/ but that usually fails on web).
const README_URL = './README.md';

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
    menuBgm = new Audio('./assets/audio/menu_bgm.mp3'); // Ensure this path matches your structure
    menuBgm.loop = true;
  }
  
  // Try to play BGM (browsers might block it until interaction)
  menuBgm.play().catch(e => console.log("Click to play BGM"));

  // --- Event Listeners ---

  // 1. Start Button
  rootEl.querySelector('#startBtn').onclick = () => {
    rootEl.querySelector('#startBtn').disabled = true; // lock button
    menuBgm.pause(); // stop menu bgm when game starts
    startCallback();
  };

  // 2. Leaderboard Button
  rootEl.querySelector('#leaderBtn').onclick = leaderboardCallback;

  // 3. How to Play Button (UPDATED)
  rootEl.querySelector('#howBtn').onclick = () => {
    showHowToModal(); 
  };

  // 4. Lore Button
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

  const closeHandler = (e) => {
    if (e.code === 'Space') {
      window.removeEventListener('keydown', closeHandler);
      document.body.removeChild(modal);
      onClose();
    }
  };
  window.addEventListener('keydown', closeHandler);
}

// ... existing imports and createMenu code ...

// --- NEW FUNCTIONALITY: README Modal ---

async function showHowToModal() {
  // 1. Create the Modal Structure
  const modal = document.createElement('div');
  modal.className = 'overlay menu';
  // Added 'readme-panel' class for CSS control
  // Added inline styles to Title to ensure it wraps and doesn't stretch container
  modal.innerHTML = `
    <div class="panel readme-panel">
      <h2 id="rm-title" style="
        color:var(--accent); 
        margin-bottom:5px; 
        word-wrap: break-word; 
        white-space: normal;
        line-height: 1.2;
      ">Loading Sacred Texts...</h2>
      
      <div id="rm-content" class="readme-content">
        Fetching the Divine Scriptures...
      </div>

      <div class="modal-nav">
        <button id="rm-prev" class="btn nav-btn" disabled>&lt;</button>
        <span id="rm-indicator" class="small">Page 1/1</span>
        <button id="rm-next" class="btn nav-btn" disabled>&gt;</button>
      </div>
      
      <div style="margin-top:15px;">
        <button id="rm-close" class="btn" style="border-color: #fff;">Close</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // 2. State
  let sections = [];
  let currentIdx = 0;

  const titleEl = modal.querySelector('#rm-title');
  const contentEl = modal.querySelector('#rm-content');
  const prevBtn = modal.querySelector('#rm-prev');
  const nextBtn = modal.querySelector('#rm-next');
  const indicator = modal.querySelector('#rm-indicator');

  // 3. Render Function
  const render = () => {
    if (sections.length === 0) return;
    const section = sections[currentIdx];
    
    titleEl.innerText = section.title || "Lore";
    contentEl.innerHTML = formatMarkdown(section.content);
    contentEl.scrollTop = 0; // Reset scroll

    // Update buttons
    prevBtn.disabled = currentIdx === 0;
    nextBtn.disabled = currentIdx === sections.length - 1;
    indicator.innerText = `${currentIdx + 1} / ${sections.length}`;
  };

  // 4. Fetch and Parse
  try {
    const text = await fetch(README_URL).then(r => {
      if (!r.ok) throw new Error("File not found");
      return r.text();
    });
    sections = parseMarkdownSections(text);
    render();
  } catch (err) {
    console.error(err);
    titleEl.innerText = "Error";
    contentEl.innerHTML = `<p style="color:red">Could not load README.md.</p>
    <p>Please ensure <b>README.md</b> is in the same folder as index.html.</p>`;
  }

  // 5. Button Logic
  prevBtn.onclick = () => { if (currentIdx > 0) { currentIdx--; render(); } };
  nextBtn.onclick = () => { if (currentIdx < sections.length - 1) { currentIdx++; render(); } };
  modal.querySelector('#rm-close').onclick = () => { document.body.removeChild(modal); };
}

// Helper: Split Markdown by "## Header"
function parseMarkdownSections(text) {
  const lines = text.split('\n');
  const sections = [];
  
  let currentTitle = "Intro / Start";
  let currentLines = [];

  lines.forEach(line => {
    const trim = line.trim();
    if (trim.startsWith('## ')) {
      if (currentLines.length > 0) {
        sections.push({ title: currentTitle, content: currentLines.join('\n') });
      }
      currentTitle = trim.replace('## ', '').replace(/\*/g, '').trim();
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  });

  if (currentLines.length > 0) {
    sections.push({ title: currentTitle, content: currentLines.join('\n') });
  }

  return sections;
}

// Helper: Better Markdown Formatter (Handles Tables & Inline Styles)
function formatMarkdown(text) {
  const lines = text.split('\n');
  let html = '';
  let inTable = false;
  let isHeaderRow = false;

  lines.forEach(line => {
    let trim = line.trim();

    // 1. Table Detection
    if (trim.startsWith('|')) {
      if (!inTable) {
        inTable = true;
        html += '<table class="md-table">';
        isHeaderRow = true; // First row is header
      }

      // Check for separator row (e.g. |---|---|)
      if (trim.includes('---')) {
        isHeaderRow = false; // Next rows are body
        return; // Skip this line
      }

      const cells = trim.split('|').filter(c => c.trim() !== '');
      const tag = isHeaderRow ? 'th' : 'td';
      
      html += '<tr>';
      cells.forEach(cell => {
        html += `<${tag}>${parseInline(cell.trim())}</${tag}>`;
      });
      html += '</tr>';

    } else {
      // Close table if we were in one
      if (inTable) {
        html += '</table>';
        inTable = false;
      }
      
      // 2. Standard Blocks
      if (trim.startsWith('### ')) {
        html += `<h3>${trim.replace('### ', '')}</h3>`;
      } else if (trim.startsWith('> ')) {
        html += `<blockquote>${parseInline(trim.replace('> ', ''))}</blockquote>`;
      } else if (trim === '---') {
        html += `<hr>`;
      } else if (trim.length > 0) {
        html += `<p>${parseInline(trim)}</p>`;
      }
    }
  });

  if (inTable) html += '</table>';
  return html;
}

// Helper: Parse Bold, Italic, Code
function parseInline(text) {
  return text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") // Escape HTML
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')         // Bold
    .replace(/\*(.*?)\*/g, '<i>$1</i>')             // Italic
    .replace(/`(.*?)`/g, '<code class="inline-code">$1</code>'); // Inline Code
}
