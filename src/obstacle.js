// src/obstacle.js
import { loadImage, ASSET_SCALE } from './engine.js';

export class Obstacle {
  constructor(url, x) {
    this.url = url;
    this.x = x;
    // Align obstacle baseline to where the player actually stands (520)
    // This mirrors the player's landing value so obstacles no longer look "floating".
    this.y = 520;
    this.width = 60;
    this.height = 60;
  }

  async load() {
    if (!this.url) throw new Error("Obstacle image URL is undefined!");
    this.img = await loadImage(this.url);

    // Slightly enlarge obstacles to be more visible in-game.
    // We keep the global ASSET_SCALE but multiply it a bit for obstacles only.
    const obstacleScale = ASSET_SCALE * 1.4;
    this.width = Math.round(this.img.width * obstacleScale);
    this.height = Math.round(this.img.height * obstacleScale);
  }

  update(dt, speed) {
    this.x -= 300 * speed * dt;
  }

  draw(ctx) {
    if (!this.img) return;
    ctx.drawImage(this.img, this.x, this.y - this.height, this.width, this.height);
  }

  collidesWith(player) {
    const p = player.getHitbox();
    const o = {
      x: this.x,
      y: this.y - this.height, // obstacle bottom-aligned
      width: this.width,
      height: this.height
    };

    return (
      p.x < o.x + o.width &&
      p.x + p.width > o.x &&
      p.y < o.y + o.height &&
      p.y + p.height > o.y
    );
  }
}
