// src/card.js
import { loadImage, ASSET_SCALE } from './engine.js';

export const CARD_LORE = {
  card1: `You have received the <b>Super Ultra Kunju-Rare Card of the:<br><br><b>[SEALED] Arms of The Cosmic Divine</b><br><br><i>Description:</i><br>The right and left arms of Sama-Ji, wielding both <i>Kunji-Force</i> and <i>Umbi-Force.</i><br><b>Arvindo Freecss</b> channels all life energy, while <b>Melvin Satoru</b> spreads chaos and cursed power.<br>Together, they shape destiny with hands that both create and destroy.`,
  card2: `You have received the <b>Super Ultra Kunju-Rare Card of the:<br><br><b>[SEALED] Eyes and Head of The Cosmic Divine</b><br><br><i>Description:</i><br>The heart of Vikramnantha Sama-Ji, eternally croaking with balance.<br><b>Rishi D. Owh Yeah</b> embodies both <i>Relatsu</i> and <i>Sage Chakra</i>, maintaining harmony between light and darkness.<br>The phrase 'Owh Yeah' echoes through all realms, ensuring universal equilibrium.`,
  card3: `You have received the <b>Super Ultra Kunju-Rare Card of the:<br><br><b>[SEALED] Heart of The Cosmic Divine</b><br><br><i>Description:</i><br>The heart of Vikramnantha Sama-Ji, eternally croaking with balance.<br><b>Rishi D. Owh Yeah</b> embodies both <i>Relatsu</i> and <i>Sage Chakra</i>, maintaining harmony between light and darkness.<br>The phrase 'Owh Yeah' echoes through all realms, ensuring universal equilibrium.`,
  card4: `You have received the <b>Super Ultra Kunju-Rare Card of the:<br><br><b>[SEALED] Torso of The Cosmic Divine</b><br><br><i>Description:</i><br>The indomitable strength and defense of Sama-Ji.<br><b>Mob Siva's</b> power manifests as the shields of the divine: <i>Susanoo, Hierro</i>, and <i>Armament Haki</i>.<br>It grants the might of those who shake worlds with a single blow.`,
  card5: `You have received the <b>Super Ultra Kunju-Rare Card of the:<br><br><b>[SEALED] True Essence of Vikramnantha Sama-Ji</b><br><br><i>Description:</i><br>The very essence of Supreme Swami Lord Vikramnantha Sama-Ji, containing the power of <b>Kaiye Tuhar</b>, the sacred act of cosmic creation.<br>From its divine flow, galaxies are born, life takes root, and dimensions expand endlessly.<br>The existence of this card confirms the boundless nature of creation itself.`,
  card6: `You have received the <b>Super Ultra Sama-Rare Card of the:<br><br><b>Cosmic Kadavuleh! OWH YEAH!</b><br><br><i>Description:</i><br>In the beginning, before light, before sound, there was the croak.<br><b>Sama-Ji</b> stood alongside the <b>Kunjumonx</b>, their chants—<i>"Owh Yeah!"</i>—becoming the very vibration, that structured existence.<br>Their croaks echo through all realms, forming the divine language of creation.`,
  card7: `You have received the <b>Super Ultra Sama-Rare Card of the:<br><br><b>Cosmic Playboy! OWH YEAH!</b><br><br><i>Description:</i><br>At the dawn of time, before war, before destruction, <b>Sama-Ji</b> arrived in his most enticing form—<i>the Cosmic Playboy</i>.<br>He was surrounded by ethereal maidens, who delighted in divine ecstasy, '<i>Owh Yeah! Heil Sama-Ji!</i>'.<br>His aura of irresistible charm bends even the strongest warriors to his will.`,
  card8: `You have received the <b>Super Ultra Sama-Rare Card of the:<br><br><b>THE COSMIC REINCARNATION: Yezus Clyde</b><br><br><i>Description:</i><br>In an era of deception, <b>Sama-Ji</b> descended to Earth, bringing wisdom and salvation to mortals.<br>His true name was erased, and history was rewritten by vengeful monks, who delighted in divine secrecy.<br>'<i>Owh Yeah! Heil Sama-Ji!</i>' is an attempt to conceal the divine truth, but the real ones know: <i>The Messiah of Infinite Drip</i> never left.`
};

export class Card {
  constructor(def, x, y) {
    this.def = def;
    this.x = x;
    this.y = y;
    this.width = 60;
    this.height = 60;
    this.collected = false;
  }

  async load() {
    if (!this.def.low) throw new Error(`Card image missing for ${this.def.id}`);
    this.img = await loadImage(this.def.low); // use the low-res image for in-game
    this.width = this.img.width * ASSET_SCALE;
    this.height = this.img.height * ASSET_SCALE;
  }

  update(dt, speed) {
    this.x -= 250 * speed * dt;
  }

  draw(ctx) {
    if (!this.img) return;
    ctx.drawImage(this.img, this.x, this.y - this.height, this.width, this.height);
  }

  collidesWith(player) {
  return (
    this.x < player.x + player.width &&
    this.x + this.width > player.x &&
    this.y + this.height > player.y - player.height * 0.5 // wider Y range so jump still hits
  );
}

}
