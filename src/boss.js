// src/boss.js
import { loadImage } from './engine.js';

export class Boss {
  constructor(assets) {
    this.assets = assets;
    this.sprites = [];
    this.projectiles = [];
    this.spriteIndex = 0;
    this.spriteTimer = 0;
    this.spriteInterval = 12; // frames per animation switch
    this.x = 640 - 150; // center horizontally (canvas is 1280 wide)
	this.y = 100;       // float near top
    this.width = 300;
    this.height = 300;
    this.hp = 699.99;
    this.playerDamage = 0;
    this.projImgs = [];
    this.lastProj = 0;
    this.bgm = null;
	this.vx = 100; // horizontal patrol speed

  }

  async load() {
    try {
      // Load boss sprites
      if (!this.assets.sprites || this.assets.sprites.length === 0) {
        throw new Error("❌ Boss assets missing sprites array!");
      }
      for (const s of this.assets.sprites) {
        if (!s) throw new Error("❌ Boss sprite path is undefined!");
        const img = await loadImage(s);
        this.sprites.push(img);
      }

      // Load projectiles
      if (!this.assets.projectiles || this.assets.projectiles.length === 0) {
        throw new Error("❌ Boss assets missing projectiles array!");
      }
      for (const p of this.assets.projectiles) {
        if (!p) throw new Error("❌ Boss projectile path is undefined!");
        const img = await loadImage(p);
        this.projImgs.push(img);
      }

      // Load BGM
      if (!this.assets.bgm) throw new Error("❌ Boss assets missing bgm path!");
      this.bgm = new Audio(this.assets.bgm);
      this.bgm.loop = true;

      console.log("✅ Boss assets loaded successfully!");
    } catch (err) {
      console.error("⚠️ Failed to load boss:", err);
      throw err; // so you know if boss fails to spawn
    }
  }

  update(dt, t) {
  // gentle hover + side-to-side patrol
  this.y = 100 + Math.sin(t / 600) * 20; // small vertical sway
  this.x += this.vx * dt;

  // reverse direction on edges
  if (this.x < 100 || this.x + this.width > 1180) {
    this.vx *= -1;
  }

  // sprite animation
  this.spriteTimer++;
  if (this.spriteTimer > this.spriteInterval) {
    this.spriteTimer = 0;
    this.spriteIndex = (this.spriteIndex + 1) % this.sprites.length;
  }

  this.lastProj += dt;
}


  maybeSpawnProjectile(dt, projectiles) {
	this.lastProj += dt;
	// spawn only every 1.5–3 seconds randomly
	if (this.lastProj > (Math.random() * 2.5 + 2.5)) {
		this.lastProj = 0;

		const img = this.projImgs[Math.floor(Math.random() * this.projImgs.length)];
		if (!img) return;

		projectiles.push({
			img,
			x: this.x + this.width / 2 - 20,   // drop from center of boss
			y: this.y + this.height / 2,
			vy: 150 + Math.random() * 200,     // downward velocity
			width: 40,
			height: 40,
			update(dt) { this.y += this.vy * dt; }
		});
	}
}


  draw(ctx) {
    const sprite = this.sprites[this.spriteIndex];
    if (sprite) {
      ctx.drawImage(sprite, this.x, this.y, this.width, this.height);
    } else {
      console.warn("⚠️ No boss sprite to draw at index", this.spriteIndex);
    }
  }

  takeDamage(amount) {
    this.hp = Math.max(0, +(this.hp - amount).toFixed(2));
  }
}
