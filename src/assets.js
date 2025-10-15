// src/assets.js
// Local asset mapping for /assets/images and /assets/audio

const BASE_IMG = "./assets/images";
const BASE_AUDIO = "./assets/audio";

console.log(">>> Sama-Ji assets.js loaded. Using BASE_IMG:", BASE_IMG);

export const ASSETS = {
  players: [
    {
      id: 'player1',
      run: [
        `${BASE_IMG}/player1_run1_low.png`,
        `${BASE_IMG}/player1_run2_low.png`,
        `${BASE_IMG}/player1_run3_low.png`
      ],
      jump: `${BASE_IMG}/player1_jump_low.png`,
      portrait: `${BASE_IMG}/player1_high.jpg`,
      bgm: `${BASE_AUDIO}/player1_bgm.mp3`
    },
    {
      id: 'player2',
      run: [
        `${BASE_IMG}/player2_run1_low.png`,
        `${BASE_IMG}/player2_run2_low.png`,
        `${BASE_IMG}/player2_run3_low.png`
      ],
      jump: `${BASE_IMG}/player2_jump_low.png`,
      portrait: `${BASE_IMG}/player2_high.jpg`,
      bgm: `${BASE_AUDIO}/player2_bgm.mp3`
    },
    {
      id: 'player3',
      run: [
        `${BASE_IMG}/player3_run1_low.png`,
        `${BASE_IMG}/player3_run2_low.png`,
        `${BASE_IMG}/player3_run3_low.png`
      ],
      jump: `${BASE_IMG}/player3_jump_low.png`,
      portrait: `${BASE_IMG}/player3_high.jpg`,
      bgm: `${BASE_AUDIO}/player3_bgm.mp3`
    },
    {
      id: 'player4',
      run: [
        `${BASE_IMG}/player4_run1_low.png`,
        `${BASE_IMG}/player4_run2_low.png`,
        `${BASE_IMG}/player4_run3_low.png`
      ],
      jump: `${BASE_IMG}/player4_jump_low.png`,
      portrait: `${BASE_IMG}/player4_high.jpg`,
      bgm: `${BASE_AUDIO}/player4_bgm.mp3`
    },
    {
      id: 'player5',
      run: [
        `${BASE_IMG}/player5_run1_low.png`,
        `${BASE_IMG}/player5_run2_low.png`,
        `${BASE_IMG}/player5_run3_low.png`
      ],
      jump: `${BASE_IMG}/player5_jump_low.png`,
      portrait: `${BASE_IMG}/player5_high.jpg`,
      bgm: `${BASE_AUDIO}/player5_bgm.mp3`
    }
  ],
  obstacles: [
    `${BASE_IMG}/obstacle_1.png`,
    `${BASE_IMG}/obstacle_2.png`
  ],
  cards: Array.from({ length: 8 }, (_, i) => ({
    id: `card${i + 1}`,
    low: `${BASE_IMG}/card_${i + 1}_low.jpeg`,   // ✅ FIX: jpeg
    high: `${BASE_IMG}/card_${i + 1}_high.jpeg`, // ✅ FIX: jpeg
    bg: `${BASE_IMG}/bg_card${i + 1}.png`
  })),
  hole: `${BASE_IMG}/hole.png`,
  boss: {
    sprites: [
      `${BASE_IMG}/boss_move1.png`,
      `${BASE_IMG}/boss_move2.png`,
      `${BASE_IMG}/boss_move3.png`
    ],
    projectiles: [
      `${BASE_IMG}/proj_beer.png`,
      `${BASE_IMG}/proj_apple.png`,
      `${BASE_IMG}/proj_donkey.png`,
      `${BASE_IMG}/proj_cig.png`,
      `${BASE_IMG}/proj_rim.png`
    ],
    bg: `${BASE_IMG}/bg_boss.png`,
    bgm: `${BASE_AUDIO}/boss_bgm.mp3`
  },
  ui: {
    startBg: `${BASE_IMG}/bg_buto.gif`,
    defaultBg: `${BASE_IMG}/bg_default.png`
  },
  sfx: {
    jump: `${BASE_AUDIO}/jump.wav`,
    card: `${BASE_AUDIO}/card_collect.wav`,
    hit: `${BASE_AUDIO}/hit.wav`
  }
};
