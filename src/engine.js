// src/engine.js
export const ASSET_SCALE = 1.5;
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
export const GROUND_Y = 600; // baseline ground level for player/obstacles

export function setupCanvas(canvas) {
  const ctx = canvas.getContext('2d');

  // Set fixed internal resolution
  canvas.width = GAME_WIDTH;
  canvas.height = GAME_HEIGHT;

  // Scale canvas to fit window while keeping aspect ratio
  function resizeCanvas() {
    const scaleX = window.innerWidth / GAME_WIDTH;
    const scaleY = window.innerHeight / GAME_HEIGHT;
    const scale = Math.min(scaleX, scaleY);

    canvas.style.width = `${GAME_WIDTH * scale}px`;
    canvas.style.height = `${GAME_HEIGHT * scale}px`;
    canvas.style.margin = '0 auto';
    canvas.style.display = 'block';
    canvas.style.transformOrigin = 'top center';
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas(); // run once on init

  return { ctx };
}

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => {
      console.error("❌ Failed to load image:", url, e);
      reject(new Error("Failed to load image: " + url));
    };
    img.src = url;
  });
}
