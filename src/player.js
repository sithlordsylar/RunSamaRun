// src/player.js
import { loadImage } from './engine.js';
import { ASSET_SCALE } from './engine.js';
import { GROUND_Y } from './engine.js';
export class Player {
  constructor(assets) {
    this.assets = assets;
    console.log(">>> Player assets received:", JSON.stringify(assets, null, 2));

    this.x = 200;
	this.y = GROUND_Y;
    this.width = 60;
    this.height = 60;
    this.hp = 100;
    this.invulnerable = false;
    this.speedY = 0;
    this.gravity = 1200;
    this.jumpStrength = -600;
    this.bgm = new Audio(assets.bgm);
	this.bgm.loop = true;          // <- ensure gameplay music loops
	this.bgm.preload = 'auto';
	this.bgm.volume = 0.9;         // optional: tweak to taste
	this.inBossBattle = false;  // ✅ flag to disable jump physics during boss



    // animation state
    this.frameIndex = 0;
    this.frameTimer = 0;
    this.frameInterval = 0.1; // 100ms per frame
	this.facing = 'right'; // track direction
    this.jumpFlash = false; // show jump sprite briefly after boss hit
    this.jumpFlashTimer = 0;

  }

	getHitbox() {
	return {
		x: this.x + this.width * 0.1,      // shrink horizontally a bit
		y: this.y - this.height * 0.3,     // ignore top 30% of sprite
		width: this.width * 0.8,
		height: this.height * 0.7
	};
	}


  async load() {
    try {
      console.log("Loading player run frames:", this.assets.run);
      this.runFrames = await Promise.all(
        (this.assets.run || []).map(url => {
          if (!url) throw new Error("Run frame is undefined");
          return loadImage(url);
        })
      );

      console.log("Loading player jump frame:", this.assets.jump);
      if (!this.assets.jump) throw new Error("Jump image is undefined");
      this.jumpImg = await loadImage(this.assets.jump);

      // set default sprite to first run frame
      this.sprite = this.runFrames[0];
      this.width = this.sprite.width * ASSET_SCALE;
      this.height = this.sprite.height * ASSET_SCALE;
    } catch (e) {
      console.error("Player.load() failed:", e);
      throw e;
    }
  }

      update(input, dt) {
    // 🌑 Boss Battle Mode
    if (this.inBossBattle) {
      const moveSpeed = 250;

      // Movement and facing
      if (input.left) {
        this.x -= moveSpeed * dt;
        this.facing = 'left';
      } else if (input.right) {
        this.x += moveSpeed * dt;
        this.facing = 'right';
      }

      // Clamp to screen
      this.x = Math.max(0, Math.min(1280 - this.width, this.x));

      // 🎯 Jump flash (triggered when boss takes damage)
      if (this.jumpFlash) {
        this.jumpFlashTimer -= dt;
        if (this.jumpFlashTimer <= 0) this.jumpFlash = false;

        // 🕊️ Hop motion (20px)
        const progress = 1 - this.jumpFlashTimer / 0.3;
        const hopOffset = Math.sin(progress * Math.PI) * 20;
        this.sprite = this.jumpImg;
        this.y = GROUND_Y - hopOffset; // hop up & down
        return;
      }

      // reset Y when not hopping
      this.y = GROUND_Y;

      // 🧍 Idle vs moving sprite
      if (!input.left && !input.right) {
        this.sprite = this.runFrames[0]; // idle front-facing
      } else {
        this.sprite = this.runFrames[1]; // moving side-frame
      }

      return;
    }

    // 🏃 Normal Runner Mode
    if (input.jump && this.y >= 520) {
      this.speedY = this.jumpStrength;
      try { new Audio(this.assets.sfxJump).play().catch(() => {}); } catch (e) {}
    }

    this.y += this.speedY * dt;
    this.speedY += this.gravity * dt;

    if (this.y >= 520) {
      this.y = 520;
      this.speedY = 0;
    }

    if (this.y < 520) {
      this.sprite = this.jumpImg;
    } else {
      const runFrames = [this.runFrames[1], this.runFrames[2]];
      this.frameTimer += dt;
      if (this.frameTimer >= this.frameInterval) {
        this.frameTimer = 0;
        this.frameIndex = (this.frameIndex + 1) % runFrames.length;
      }
      this.sprite = runFrames[this.frameIndex];
    }
  }



  draw(ctx) {
    if (!this.sprite) return; // not loaded yet
    ctx.save();

if (this.facing === 'left') {
  ctx.scale(-1, 1);
  ctx.drawImage(
    this.sprite,
    -this.x - this.width,
    this.y - this.height,
    this.width,
    this.height
  );
} else {
  ctx.drawImage(
    this.sprite,
    this.x,
    this.y - this.height,
    this.width,
    this.height
  );
}

ctx.restore();

  }

  takeDamage(amount) {
    if (!this.invulnerable) {
      this.hp -= amount;
      if (this.hp < 0) this.hp = 0;
      this.invulnerable = true;
      setTimeout(() => { this.invulnerable = false; }, 1000);
    }
  }

  healFull() {
    this.hp = 100;
  }

  activateCardPower() {
    this.invulnerable = true;
    setTimeout(() => { this.invulnerable = false; }, 5000);
  }
}
