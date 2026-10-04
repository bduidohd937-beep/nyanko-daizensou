'use strict';

/* ================================================================
   냥코대전쟁 — CHAPTER 1 : 퓨어월드  (콘텐츠 데이터)
   스토리 / 유닛 / 보스 / 액트 정의. 엔진은 game.js 가 참조합니다.
   이미지: assets/units/<id>.png, assets/bosses/<id>.png,
           assets/portraits/<who>.png  (없으면 이모지로 대체)
   ================================================================ */

const ELEMENT_COLORS = {
  light:     '#ffd54f',
  earth:     '#c8a57a',
  water:     '#4fc3f7',
  fire:      '#ff7043',
  lightning: '#ffee58',
  void:      '#b388ff',
  chaos:     '#ff4081',
};

const PORTRAIT_FALLBACK = {
  arthur: '👑', mage: '🧙', soldier: '🛡️',
  villager: '🧑‍🌾',
  gigantos: '⛰️', aqua: '🌊', ignis: '🔥', voltas: '⚡', arkanon: '🌀',
};

/* ---------------- 아군 유닛 (왕국군) ---------------- */
const PLAYER_UNITS = [
  { id: 'guard', name: '왕국 보병', icon: '⚔️', element: 'light',
    cost: 75, cd: 1.2, hp: 950, atk: 100, range: 46, speed: 62, size: 18, atkInt: 0.9,
    desc: '기본 근접 병사. 물량의 시작.' },
  { id: 'archer', name: '왕국 궁수', icon: '🏹', element: 'light',
    cost: 160, cd: 2.5, hp: 700, atk: 175, range: 220, speed: 55, size: 17, atkInt: 1.1,
    desc: '원거리 화살. 앞을 막아주면 안정적.' },
  { id: 'paladin', name: '성기사', icon: '🛡️', element: 'light',
    cost: 320, cd: 5, hp: 3500, atk: 135, range: 52, speed: 40, size: 24, atkInt: 1.2,
    ability: { type: 'auraShield', radius: 150, reduce: 0.4 },
    desc: '주변 아군이 받는 피해 -35%.' },
  { id: 'charger', name: '백마기사', icon: '🐴', element: 'light',
    cost: 420, cd: 7, hp: 2000, atk: 380, range: 56, speed: 115, size: 22, atkInt: 1.0,
    ability: { type: 'chargeKnock', power: 150 },
    desc: '돌진 공격. 적을 크게 넉백.' },
  { id: 'shadow', name: '그림자 암살자', icon: '🗡️', element: 'light',
    cost: 560, cd: 9, hp: 950, atk: 445, range: 46, speed: 125, size: 17, atkInt: 0.8,
    ability: { type: 'assassinate', chance: 0.3, mult: 5 },
    desc: '30% 확률 치명타 5배 + 넉백.' },
  { id: 'dragonian', name: '화염용기사', icon: '🐉', element: 'fire',
    cost: 650, cd: 10, hp: 4200, atk: 300, range: 150, speed: 55, size: 24, atkInt: 1.4,
    ability: { type: 'flameBreath', reach: 250, burn: 45, burnDur: 3 },
    desc: '용의 숨결. 전방 250px 광역 화염 + 화상.' },
  { id: 'merlin', name: '대마법사 멀린', icon: '🔮', element: 'light', main: true,
    cost: 750, cd: 12, hp: 1280, atk: 580, range: 280, speed: 45, size: 20, atkInt: 2.0,
    ability: { type: 'meteor', splash: 120, burn: 40, burnDur: 4 },
    desc: '기본공격에 별 강하. 광역 + 화상.' },
  { id: 'frostblade', name: '서리검사', icon: '❄️', element: 'water',
    cost: 880, cd: 12, hp: 2600, atk: 420, range: 60, speed: 92, size: 21, atkInt: 1.1,
    ability: { type: 'frostHit', mul: .45, dur: 2.5, stunChance: .15, stun: .8 },
    desc: '피격한 적을 2.5초 둔화. 15% 확률 스턴.' },
  { id: 'priestess', name: '성녀', icon: '✨', element: 'light',
    cost: 1050, cd: 14, hp: 1600, atk: 240, range: 240, speed: 45, size: 19, atkInt: 1.8,
    ability: { type: 'smiteHeal', heal: 2.5 },
    desc: '성빛으로 공격하며 가장 아픈 아군을 치유.' },
  { id: 'tempest', name: '폭풍검사', icon: '⚡', element: 'lightning',
    cost: 1450, cd: 18, hp: 6800, atk: 780, range: 66, speed: 78, size: 27, atkInt: 1.1,
    ability: { type: 'stormChain', jump: 210, jumps: 2, mult: .6 },
    desc: '검에 번개가 실려 주변 적 2명에게 연쇄.' },
  { id: 'colossus', name: '황금 거수', icon: '🗿', element: 'earth',
    cost: 1900, cd: 25, hp: 18000, atk: 1450, range: 120, speed: 32, size: 38, atkInt: 1.5,
    ability: { type: 'quakeSlam', splash: 200, knock: 190, stun: .7 },
    desc: '철퇴를 내리쳐 지진. 광역 넉백 + 스턴.' },
  { id: 'arthur', name: '아서왕', icon: '👑', element: 'light', main: true,
    cost: 2200, cd: 30, hp: 24000, atk: 1750, range: 110, speed: 42, size: 36, atkInt: 1.3,
    ability: { type: 'handOfGod', splash: 170, stun: 0.9, mult: 1.8 },
    desc: '기본공격 — 신의 손을 소환해 광역 스턴.' },

  /* ---- 가챠 한정 영웅 (뽑기로 영입) ---- */
  { id: 'berserker', name: '광전사', icon: '🪓', element: 'fire',
    cost: 620, cd: 9, hp: 1600, atk: 640, range: 50, speed: 100, size: 21, atkInt: 0.7,
    ability: { type: 'lastStand', hpPct: 0.35, mult: 2.2 },
    desc: '체력 35% 이하에서 공격력 2.2배.' },
  { id: 'sniper', name: '왕국 명사수', icon: '🎯', element: 'light',
    cost: 500, cd: 8, hp: 680, atk: 540, range: 480, speed: 40, size: 17, atkInt: 2.1,
    ability: { type: 'chargeKnock', power: 70 },
    desc: '초장거리 저격 + 넉백.' },
  { id: 'ninja', name: '그림자 닌자', icon: '🥷', element: 'void',
    cost: 780, cd: 10, hp: 1100, atk: 520, range: 46, speed: 145, size: 16, atkInt: 0.55,
    ability: { type: 'assassinate', chance: 0.45, mult: 6 },
    desc: '45% 확률 치명타 6배.' },
  { id: 'bard', name: '음유시인', icon: '🎻', element: 'light',
    cost: 950, cd: 13, hp: 2400, atk: 220, range: 230, speed: 45, size: 18, atkInt: 1.6,
    ability: { type: 'warcry', radius: 190, mult: 0.35 },
    desc: '주변 아군 공격력 +35%.' },
  { id: 'valkyrie', name: '발키리', icon: '🪽', element: 'lightning',
    cost: 1400, cd: 16, hp: 4600, atk: 660, range: 140, speed: 95, size: 23, atkInt: 1.0,
    ability: { type: 'stormChain', jump: 230, jumps: 3, mult: 0.5 },
    desc: '번개 연쇄 3명.' },
  { id: 'phoenix', name: '불사조', icon: '🦅', element: 'fire',
    cost: 1600, cd: 20, hp: 4200, atk: 640, range: 160, speed: 70, size: 25, atkInt: 1.3,
    ability: { type: 'flameBreath', reach: 260, burn: 60, burnDur: 4, rebirth: true },
    desc: '화염 숨결 + 한 번 부활.' },
  { id: 'voidwalker', name: '공허의 인도자', icon: '🌑', element: 'void',
    cost: 2100, cd: 26, hp: 9000, atk: 980, range: 300, speed: 40, size: 28, atkInt: 1.7,
    ability: { type: 'voidNova', radius: 260, dmgPct: 0.9, slow: 0.5, dur: 2.5, cd: 7 },
    desc: '주기적 공허 폭발 — 광역 피해 + 둔화.' },
  { id: 'legendcat', name: '전설의 냥코', icon: '🌟', element: 'light',
    cost: 2800, cd: 35, hp: 30000, atk: 2400, range: 130, speed: 38, size: 38, atkInt: 1.4,
    ability: { type: 'quakeSlam', splash: 230, knock: 220, stun: 0.9 },
    desc: '전설의 강타. 광역 넉백 + 스턴.' },
];

/* ---------------- 가챠 (뽑기) ----------------
   rar: R 70% / SR 24% / SSR 6% — 10연차는 SR 이상 1개 보장
   중복 획득 시 ★ 돌파(+5% 스탯/별, 최대 5성) */
const GACHA = {
  costSingle: 150, costMulti: 1500,
  rates: { R: 0.70, SR: 0.24, SSR: 0.06 },
  pool: [
    { id: 'berserker', rar: 'R' },
    { id: 'sniper',    rar: 'R' },
    { id: 'ninja',     rar: 'R' },
    { id: 'bard',      rar: 'SR' },
    { id: 'valkyrie',  rar: 'SR' },
    { id: 'phoenix',   rar: 'SR' },
    { id: 'voidwalker', rar: 'SSR' },
    { id: 'legendcat', rar: 'SSR' },
  ],
};
const RARITY_COLORS = { R: '#4fc3f7', SR: '#b388ff', SSR: '#ffd54f' };

/* ---------------- 레벨업 ----------------
   xpCost(lv) = 8·lv^1.2 (1→30 총 약 6000 XP)
   스탯 배율 = 1 + 0.04·(lv-1) + 0.05·★   (Lv30 = 2.16배) */
const LEVEL = {
  max: 30,
  xpCost: lv => Math.round(8 * Math.pow(lv, 1.2)),
  statMult: (lv, star) => (1 + 0.04 * (Math.max(1, lv) - 1)) * (1 + 0.05 * star),
};

/* ---------------- 적 유닛 (원소 세력) ---------------- */
const ENEMY_UNITS = [
  // 대지
  { id: 'pebble', name: '자갈 전사', icon: '🪨', element: 'earth', faction: 'earth',
    hp: 340, atk: 60, range: 42, speed: 55, size: 17, atkInt: 1.0, bounty: 30 },
  { id: 'tremor', name: '지진 벌레', icon: '🪱', element: 'earth', faction: 'earth',
    hp: 950, atk: 140, range: 44, speed: 80, size: 19, atkInt: 1.1, bounty: 70 },
  { id: 'golem', name: '바위 골렘', icon: '🗿', element: 'earth', faction: 'earth',
    hp: 2400, atk: 220, range: 52, speed: 26, size: 30, atkInt: 1.6, knockResist: 0.7, bounty: 140 },
  // 물
  { id: 'slime', name: '물 슬라임', icon: '💧', element: 'water', faction: 'water',
    hp: 700, atk: 80, range: 42, speed: 58, size: 18, atkInt: 1.0, regen: true, bounty: 45 },
  { id: 'siren', name: '물의 정령', icon: '🧜‍♀️', element: 'water', faction: 'water',
    hp: 800, atk: 150, range: 200, speed: 45, size: 19, atkInt: 1.4, bounty: 90 },
  { id: 'whirl', name: '소용돌이', icon: '🌊', element: 'water', faction: 'water',
    hp: 1800, atk: 200, range: 60, speed: 55, size: 26, atkInt: 1.3,
    ability: { type: 'waterPush', power: 70 }, bounty: 130 },
  // 불
  { id: 'ember', name: '불티', icon: '🔥', element: 'fire', faction: 'fire',
    hp: 460, atk: 90, range: 44, speed: 115, size: 15, atkInt: 0.8,
    ability: { type: 'burnHit', dps: 25, dur: 3 }, bounty: 50 },
  { id: 'pyre', name: '화염술사', icon: '☄️', element: 'fire', faction: 'fire',
    hp: 1200, atk: 240, range: 240, speed: 38, size: 20, atkInt: 1.8,
    ability: { type: 'burnHit', dps: 35, dur: 4 }, bounty: 110 },
  { id: 'lavaman', name: '용암 거인', icon: '🌋', element: 'fire', faction: 'fire',
    hp: 4600, atk: 360, range: 56, speed: 22, size: 34, atkInt: 1.8, knockResist: 0.7,
    ability: { type: 'burnHit', dps: 40, dur: 4 }, bounty: 190 },
  // 번개
  { id: 'spark', name: '스파크', icon: '⚡', element: 'lightning', faction: 'lightning',
    hp: 520, atk: 130, range: 42, speed: 170, size: 15, atkInt: 0.7, bounty: 60 },
  { id: 'storm', name: '뇌격술사', icon: '🌩️', element: 'lightning', faction: 'lightning',
    hp: 1400, atk: 280, range: 260, speed: 50, size: 20, atkInt: 1.6,
    ability: { type: 'chain', jumps: 2, dmg: 120 }, bounty: 130 },
  { id: 'volt', name: '뇌전기사', icon: '🌀', element: 'lightning', faction: 'lightning',
    hp: 3000, atk: 340, range: 50, speed: 95, size: 26, atkInt: 1.2, blink: 6, bounty: 180 },
  /* ----- CHAPTER 2 : 그림자 세력 (void) ----- */
  { id: 'shade', name: '그림자 병사', icon: '👥', element: 'void', faction: 'void',
    hp: 1500, atk: 240, range: 46, speed: 90, size: 18, atkInt: 1.0, bounty: 90 },
  { id: 'stalker', name: '그림자 추적자', icon: '🌑', element: 'void', faction: 'void',
    hp: 2600, atk: 420, range: 52, speed: 130, size: 21, atkInt: 0.9, blink: 7, bounty: 150 },
  { id: 'voidMage', name: '공허 술사', icon: '🔮', element: 'void', faction: 'void',
    hp: 3400, atk: 560, range: 300, speed: 42, size: 20, atkInt: 1.9,
    ability: { type: 'chain', jumps: 3, dmg: 260 }, bounty: 210 },
  { id: 'gloombrute', name: '암울한 거수', icon: '🦍', element: 'void', faction: 'void',
    hp: 14000, atk: 900, range: 70, speed: 30, size: 36, atkInt: 1.7, knockResist: 0.75, bounty: 380 },
  /* ----- CHAPTER 3 : 혼돈 세력 (chaos) ----- */
  { id: 'chaosSpawn', name: '혼돈의 개체', icon: '🐙', element: 'chaos', faction: 'chaos',
    hp: 6500, atk: 700, range: 54, speed: 85, size: 24, atkInt: 1.1, bounty: 240 },
  { id: 'hexKnight', name: '주문 기사', icon: '⚔️', element: 'chaos', faction: 'chaos',
    hp: 11000, atk: 980, range: 58, speed: 70, size: 27, atkInt: 1.2,
    ability: { type: 'burnHit', dps: 60, dur: 4 }, bounty: 330 },
  { id: 'riftArcher', name: '균열 궁수', icon: '🏹', element: 'chaos', faction: 'chaos',
    hp: 7800, atk: 1250, range: 340, speed: 48, size: 21, atkInt: 1.8, bounty: 360 },
  { id: 'annihilator', name: '소멸자', icon: '💀', element: 'chaos', faction: 'chaos',
    hp: 30000, atk: 1600, range: 80, speed: 34, size: 44, atkInt: 1.8, knockResist: 0.85, bounty: 700 },
];

/* ---------------- 주민 (구출 대상) ---------------- */
const VILLAGER_DEF = { id: 'villager', name: '퓨어월드 주민', icon: '🧑‍🌾', hp: 7000, speed: 80, size: 16 };

/* ---------------- 보스 ----------------
   script: 주기적으로 순환하는 패턴. cd는 초.
   phases: 체력 구간마다 적용되는 원소/ mods                                 */
const BOSSES = {
  gigantos: {
    id: 'gigantos', name: '대지룡 기간토스', icon: '⛰️', element: 'earth',
    hp: 20000, atk: 320, range: 110, speed: 15, size: 80, atkInt: 1.9, knockResist: 0.85,
    bounty: 800,
    script: [
      { id: 'quake',      cd: 7 },
      { id: 'rockwall',   cd: 9 },
      { id: 'summon',     cd: 11, unit: 'golem', n: 1 },
      { id: 'advance',    cd: 8, dur: 4 },
    ],
    phases: [
      { pct: 1,    name: '대지' },
      { pct: 0.55, name: '대지 · 격분', mods: { atkSpd: 0.8, atk: 1.2 } },
    ],
  },
  aqua: {
    id: 'aqua', name: '물의 정령 아쿠아', icon: '🌊', element: 'water',
    hp: 30000, atk: 380, range: 120, speed: 22, size: 76, atkInt: 1.7, knockResist: 0.6,
    bounty: 1000,
    script: [
      { id: 'floodRise',  cd: 12 },
      { id: 'waterWave',  cd: 8 },
      { id: 'summon',     cd: 12, unit: 'siren', n: 2 },
      { id: 'heal',       cd: 10 },
    ],
    phases: [
      { pct: 1,    name: '물' },
      { pct: 0.5,  name: '물 · 성역', mods: { regen: 0.004 } },
    ],
  },
  ignis: {
    id: 'ignis', name: '염제 이그니스', icon: '🔥', element: 'fire',
    hp: 42000, atk: 450, range: 130, speed: 20, size: 78, atkInt: 1.6, knockResist: 0.7,
    bounty: 1300,
    script: [
      { id: 'fireZones',  cd: 9 },
      { id: 'explosion',  cd: 11 },
      { id: 'burnWave',   cd: 13 },
      { id: 'advance',    cd: 10, dur: 4 },
    ],
    phases: [
      { pct: 1,    name: '불' },
      { pct: 0.6,  name: '불 · 백화', mods: { rangeGrow: true, atk: 1.15 } },
      { pct: 0.3,  name: '불 · 폭주', mods: { rangeGrow: true, atk: 1.3, atkSpd: 0.8 } },
    ],
  },
  voltas: {
    id: 'voltas', name: '번개의 볼트라스', icon: '⚡', element: 'lightning',
    hp: 55000, atk: 520, range: 100, speed: 45, size: 74, atkInt: 1.3, knockResist: 0.75,
    bounty: 1600,
    script: [
      { id: 'blink',      cd: 9 },
      { id: 'chainBoss',  cd: 8 },
      { id: 'dash',       cd: 12, dur: 1.6 },
      { id: 'summon',     cd: 14, unit: 'spark', n: 3 },
    ],
    phases: [
      { pct: 1,    name: '번개' },
      { pct: 0.45, name: '번개 · 과충전', mods: { atkSpd: 0.65, haste: true } },
    ],
  },
  arkanon: {
    id: 'arkanon', name: '원소포식자 아르카논', icon: '🌀', element: 'void',
    hp: 150000, atk: 500, range: 135, speed: 26, size: 96, atkInt: 1.6, knockResist: 0.95,
    bounty: 5000,
    script: [
      { id: 'quake',      cd: 6 },
      { id: 'waterWave',  cd: 6 },
      { id: 'fireZones',  cd: 7 },
      { id: 'chainBoss',  cd: 6 },
      { id: 'summon',     cd: 10, unit: 'golem', n: 1 },
    ],
    phases: [
      { pct: 1,    name: '대지', element: 'earth',     mods: { dmgTaken: 0.85 } },
      { pct: 0.75, name: '물',   element: 'water',     mods: { regen: 0.002 } },
      { pct: 0.5,  name: '불',   element: 'fire',      mods: { burnAura: 30 } },
      { pct: 0.25, name: '번개', element: 'lightning', mods: { atkSpd: 0.6, haste: true } },
      { pct: 0.1,  name: '혼돈', element: 'void',      mods: { atkSpd: 0.5, atk: 1.3, dmgTaken: 0.9 } },
    ],
  },
  /* ---------- CHAPTER 2 ---------- */
  umbra: {
    id: 'umbra', name: '그림자 군주 움브라', icon: '🌑', element: 'void',
    hp: 260000, atk: 720, range: 130, speed: 30, size: 86, atkInt: 1.5, knockResist: 0.85,
    bounty: 9000,
    script: [
      { id: 'blink',      cd: 8 },
      { id: 'chainBoss',  cd: 7 },
      { id: 'summon',     cd: 12, unit: 'stalker', n: 2 },
      { id: 'advance',    cd: 10, dur: 4 },
      { id: 'quake',      cd: 9 },
    ],
    phases: [
      { pct: 1,    name: '그림자' },
      { pct: 0.6,  name: '그림자 · 포식', mods: { atkSpd: 0.75, haste: true } },
      { pct: 0.25, name: '그림자 · 분열', mods: { atk: 1.3, atkSpd: 0.7 } },
    ],
  },
  nyx: {
    id: 'nyx', name: '황혼의 닉스', icon: '🌘', element: 'void',
    hp: 480000, atk: 900, range: 140, speed: 26, size: 90, atkInt: 1.6, knockResist: 0.9,
    bounty: 15000,
    script: [
      { id: 'floodRise',  cd: 13 },
      { id: 'waterWave',  cd: 8 },
      { id: 'summon',     cd: 12, unit: 'voidMage', n: 2 },
      { id: 'heal',       cd: 11 },
      { id: 'blink',      cd: 9 },
    ],
    phases: [
      { pct: 1,    name: '황혼' },
      { pct: 0.7,  name: '황혼 · 어둠', mods: { regen: 0.003, dmgTaken: 0.9 } },
      { pct: 0.35, name: '황혼 · 월식', mods: { atkSpd: 0.6, atk: 1.25, haste: true } },
    ],
  },
  /* ---------- CHAPTER 3 ---------- */
  chaothos: {
    id: 'chaothos', name: '혼돈의 대마왕 카오토스', icon: '🐙', element: 'chaos',
    hp: 950000, atk: 1200, range: 150, speed: 30, size: 98, atkInt: 1.5, knockResist: 0.92,
    bounty: 25000,
    script: [
      { id: 'explosion',  cd: 10 },
      { id: 'fireZones',  cd: 8 },
      { id: 'summon',     cd: 13, unit: 'hexKnight', n: 2 },
      { id: 'chainBoss',  cd: 7 },
      { id: 'advance',    cd: 11, dur: 4 },
    ],
    phases: [
      { pct: 1,    name: '혼돈' },
      { pct: 0.65, name: '혼돈 · 변이', mods: { atk: 1.2, regen: 0.002 } },
      { pct: 0.3,  name: '혼돈 · 심연', mods: { atkSpd: 0.55, atk: 1.35, haste: true } },
    ],
  },
  finality: {
    id: 'finality', name: '종말의 존재 피날레', icon: '🌌', element: 'chaos',
    hp: 1300000, atk: 1800, range: 160, speed: 24, size: 110, atkInt: 1.5, knockResist: 0.95,
    bounty: 50000,
    script: [
      { id: 'quake',      cd: 6 },
      { id: 'explosion',  cd: 7 },
      { id: 'chainBoss',  cd: 6 },
      { id: 'fireZones',  cd: 7 },
      { id: 'summon',     cd: 11, unit: 'annihilator', n: 1 },
      { id: 'blink',      cd: 8 },
    ],
    phases: [
      { pct: 1,    name: '종말', element: 'chaos',   mods: { dmgTaken: 1.0 } },
      { pct: 0.7,  name: '공허', element: 'void',    mods: { regen: 0.002, dmgTaken: 1.05 } },
      { pct: 0.4,  name: '대재앙', element: 'fire',  mods: { burnAura: 60, atk: 1.2, dmgTaken: 1.1 } },
      { pct: 0.15, name: '최후', element: 'void',    mods: { atkSpd: 0.5, atk: 1.4, haste: true, regen: 0.004, dmgTaken: 1.2 } },
    ],
  },
};

/* ---------------- 액티브 스킬 (유닛 필드에서 사용) ---------------- */
const ULTIMATES = [
  { id: 'excalibur', name: '엑스칼리버', icon: '⚔️', unit: 'arthur', cd: 24,
    desc: '아서왕이 있을 때: 하늘의 빛의 검으로 전 적에게 대미지 + 넉백.' },
  { id: 'meteorCall', name: '대운석 낙하', icon: '☄️', unit: 'merlin', cd: 18,
    desc: '멀린이 있을 때: 운석을 떨어뜨려 광역 대미지 + 화상.' },
];

/* ================================================================
   CHAPTER 1 — 퓨어월드 액트 구성
   story type: narr(내레이션) / who(화자) / objective / boss
   battle.objective.type: survive | destroy | rescue | defend | boss
   ================================================================ */
const CHAPTER_1 = {
  title: 'CHAPTER 1',
  subtitle: '퓨어월드',
  desc: '퓨어월드에 처음 발생한 균열과 원소 세력의 침공을 막아라. 최종적으로 원소포식자 아르카논을 격파하고 퓨어월드를 지킨다.',
  acts: [
    /* ---------- ACT 1 ---------- */
    {
      id: 'act1', kind: 'ACT 1', title: '첫 균열',
      intro: [
        { narr: '평화롭던 퓨어월드 외곽. 순찰대가 공중에 생긴 균열을 발견한다.' },
        { narr: '빛이 새어나오고 풀은 시들며 돌이 갈라진다. 근처 짐승 하나가 쓰러진다.' },
        { narr: '곧 대지 계열 생명체들이 균열에서 나온다. 경보가 울린다.' },
        { who: 'arthur', text: '막는다.' },
        { objective: '국경을 방어하라.' },
      ],
      battle: {
        theme: 'plains', playerHp: 10000, riftHp: 14000, income: 14, startMoney: 350,
        objective: { type: 'survive', time: 80 },
        waves: [
          { at: 6,  unit: 'pebble', n: 2 },
          { at: 16, unit: 'pebble', n: 3 },
          { at: 28, unit: 'golem',  n: 1 },
          { at: 40, unit: 'tremor', n: 2 },
          { at: 54, unit: 'pebble', n: 3, scale: 1.1 },
          { at: 66, unit: 'golem',  n: 1, scale: 1.1 },
        ],
        trickle: { every: 11, unit: 'pebble', scale: 1.15 },
      },
      outro: [
        { narr: '공중 균열이 잠잠히 준다. 왕국군은 국경선을 확보했다.' },
      ],
    },

    /* ---------- ACT 2 ---------- */
    {
      id: 'act2', kind: 'ACT 2', title: '대지의 군세',
      intro: [
        { narr: '대지 세력은 공격하는 것이 아니라 거대한 구조물을 세우며 퓨어월드의 지형 자체를 바꾼다.' },
        { narr: '왕국군은 점령지를 다시 탈환한다. 균열 주변에 퓨어월드 주민들이 붙잡혀 있다.' },
        { who: 'soldier', text: '폐하, 주민들이 구조물에 갇혀 있습니다!' },
        { objective: '점령지를 탈환하고 주민을 구출하라.' },
      ],
      battle: {
        theme: 'ruins', playerHp: 15000, riftHp: 30000, income: 16, startMoney: 450,
        objective: { type: 'rescue', n: 4, destroy: true, maxLost: 2 },
        waves: [
          { at: 5,  unit: 'pebble', n: 3, scale: 1.15 },
          { at: 18, unit: 'golem',  n: 1, scale: 1.15 },
          { at: 32, unit: 'tremor', n: 3, scale: 1.2 },
          { at: 48, unit: 'golem',  n: 2, scale: 1.2 },
          { at: 66, unit: 'pebble', n: 4, scale: 1.25 },
          { at: 84, unit: 'golem',  n: 2, scale: 1.3 },
        ],
        trickle: { every: 12, unit: 'tremor', scale: 1.25 },
        villagers: { every: 16, count: 4 },
      },
      outro: [
        { narr: '왕국군은 주민들을 구출한다. 대지 세력이 데려온 생명체는 갈라진 몸을 끌며 무너진다.' },
        { narr: '그런데 같은 공간에 붙잡혀 있던 퓨어월드 주민들은 서 있을 수 있고 움직일 수도 있다.' },
      ],
    },

    /* ---------- BOSS 1 ---------- */
    {
      id: 'boss1', kind: 'BOSS 1', title: '대지룡 기간토스',
      intro: [
        { narr: '점령지 깊은 곳. 대지 구조물이 전장 자체를 대지 영역으로 바꾸기 시작한다.' },
        { who: 'mage', text: '전진하는 거대한 형체... 대지룡 기간토스입니다!' },
        { boss: 'gigantos', name: 'BOSS — 대지룡 기간토스' },
        { objective: '대지룡 기간토스를 격파하라.' },
      ],
      battle: {
        theme: 'ruins', playerHp: 18000, riftHp: 40000, income: 30, startMoney: 700,
        objective: { type: 'boss' },
        boss: 'gigantos', bossAt: 14, bossScale: 1,
        waves: [
          { at: 6,  unit: 'pebble', n: 3, scale: 1.15 },
          { at: 24, unit: 'golem',  n: 1, scale: 1.15 },
          { at: 44, unit: 'tremor', n: 3, scale: 1.2 },
          { at: 70, unit: 'golem',  n: 2, scale: 1.25 },
        ],
        trickle: { every: 15, unit: 'pebble', scale: 1.25 },
      },
      outro: [
        { narr: '기간토스가 쓰러지자 주변의 대지 결정들이 빠르게 빛을 잃는다.' },
        { who: 'mage', text: '비어 있습니다.' },
        { narr: '원인은 알 수 없다.' },
      ],
    },

    /* ---------- ACT 3 ---------- */
    {
      id: 'act3', kind: 'ACT 3', title: '두 번째 침공',
      intro: [
        { narr: '대지 전선이 완전히 정리되기 전, 수로와 저수지 쪽에서 긴급 보고가 들어온다.' },
        { narr: '물의 정령들이 강과 저장 수로를 장악하고, 물 자원을 자신들의 흐름으로 끌어간다.' },
        { objective: '수로를 확보하라.' },
      ],
      battle: {
        theme: 'aqua', playerHp: 17000, riftHp: 45000, income: 18, startMoney: 550,
        objective: { type: 'destroy' },
        flood: 0.25,
        waves: [
          { at: 5,  unit: 'slime', n: 3, scale: 1.1 },
          { at: 18, unit: 'siren', n: 2, scale: 1.1 },
          { at: 34, unit: 'whirl', n: 1, scale: 1.15 },
          { at: 50, unit: 'slime', n: 4, scale: 1.2 },
          { at: 68, unit: 'siren', n: 2, scale: 1.25 },
          { at: 86, unit: 'whirl', n: 2, scale: 1.3 },
        ],
        trickle: { every: 12, unit: 'slime', scale: 1.3 },
      },
      outro: [
        { narr: '확보한 수로를 따라 왕국군이 침수된 마을로 진입한다.' },
      ],
    },

    /* ---------- ACT 4 ---------- */
    {
      id: 'act4', kind: 'ACT 4', title: '아쿠아',
      intro: [
        { narr: '왕국군은 침수된 마을에서 주민들을 구조하며 수로를 따라 진입한다.' },
        { narr: '이동이 느려지고, 물 계열의 적은 물속에서 회복한다. 물살이 병사를 밀어낸다.' },
        { objective: '주민 6명을 대피시켜라.' },
      ],
      battle: {
        theme: 'flood', playerHp: 18000, riftHp: 60000, income: 20, startMoney: 600,
        objective: { type: 'rescue', n: 6, maxLost: 3 },
        flood: 0.5,
        waves: [
          { at: 5,  unit: 'slime', n: 3, scale: 1.2 },
          { at: 20, unit: 'whirl', n: 1, scale: 1.25 },
          { at: 36, unit: 'siren', n: 3, scale: 1.3 },
          { at: 56, unit: 'slime', n: 4, scale: 1.35 },
          { at: 78, unit: 'whirl', n: 2, scale: 1.4 },
        ],
        trickle: { every: 11, unit: 'slime', scale: 1.4 },
        villagers: { every: 13, count: 6 },
      },
      outro: [
        { narr: '구출된 주민들이 수로 서쪽으로 대피한다.' },
        { narr: '수로 중심에서 거대한 물의 흐름이 솟아오른다.' },
      ],
    },

    /* ---------- BOSS 2 ---------- */
    {
      id: 'boss2', kind: 'BOSS 2', title: '아쿠아',
      intro: [
        { narr: '수로 중심에서 물의 정령 아쿠아와 충돌한다.' },
        { boss: 'aqua', name: 'BOSS — 물의 정령 아쿠아' },
        { objective: '아쿠아를 격파하라.' },
      ],
      battle: {
        theme: 'flood', playerHp: 20000, riftHp: 70000, income: 34, startMoney: 900,
        objective: { type: 'boss' },
        boss: 'aqua', bossAt: 12,
        flood: 0.35,
        waves: [
          { at: 6,  unit: 'slime', n: 4, scale: 1.2 },
          { at: 30, unit: 'whirl', n: 2, scale: 1.25 },
          { at: 58, unit: 'siren', n: 3, scale: 1.3 },
        ],
        trickle: { every: 14, unit: 'slime', scale: 1.3 },
      },
      outro: [
        { narr: '아쿠아가 쓰러지자 연결된 수로가 무너지고 물이 빠진다.' },
        { narr: '멀리 대지 전선의 균열과 현재 균열이 거의 동시에 반응한다.' },
        { narr: '두 전장에 남은 원소 에너지가 잠깐 같은 방향으로 흔들렸다가 멈춘다.' },
      ],
    },

    /* ---------- ACT 5 ---------- */
    {
      id: 'act5', kind: 'ACT 5', title: '이그니스',
      intro: [
        { narr: '새로운 불의 균열이 열린다. 불의 군세는 숲과 주거 외곽을 태우며 생명을 불꽃과 에너지로 바꾼다.' },
        { narr: '불길은 성벽으로 접근하고 주민들이 고립된다.' },
        { who: 'arthur', text: '전선으로 들어간다. 주민이 빠져나올 때까지 붙잡는다.' },
        { objective: '90초 동안 성벽을 지키고 주민을 탈출시켜라.' },
      ],
      battle: {
        theme: 'burn', playerHp: 24000, riftHp: 80000, income: 24, startMoney: 800,
        objective: { type: 'defend', time: 90, rescue: 5, maxLost: 4 },
        hazard: { type: 'fire', interval: 7 },
        waves: [
          { at: 5,  unit: 'ember', n: 4, scale: 1.15 },
          { at: 22, unit: 'pyre',  n: 2, scale: 1.2 },
          { at: 42, unit: 'ember', n: 5, scale: 1.25 },
          { at: 62, unit: 'lavaman', n: 1, scale: 1.2 },
          { at: 80, unit: 'pyre',  n: 3, scale: 1.3 },
        ],
        trickle: { every: 10, unit: 'ember', scale: 1.35 },
        villagers: { every: 9, count: 5 },
      },
      outro: [
        { narr: '주민이 빠져나갈 때까지 불의 군세를 막아낸다.' },
        { narr: '아서왕이 직접 전선으로 들어가 무너진 건물 아래의 병사를 끌어낸다.' },
      ],
    },

    /* ---------- BOSS 3 ---------- */
    {
      id: 'boss3', kind: 'BOSS 3', title: '염제 이그니스',
      intro: [
        { narr: '불의 전장 중심, 염제 이그니스가 모습을 드러낸다.' },
        { boss: 'ignis', name: 'BOSS — 염제 이그니스' },
        { objective: '염제 이그니스를 격파하라.' },
      ],
      battle: {
        theme: 'burn', playerHp: 26000, riftHp: 90000, income: 38, startMoney: 1100,
        objective: { type: 'boss' },
        boss: 'ignis', bossAt: 12,
        hazard: { type: 'fire', interval: 14 },
        waves: [
          { at: 6,  unit: 'ember', n: 5, scale: 1.1 },
          { at: 34, unit: 'pyre',  n: 3, scale: 1.15 },
          { at: 64, unit: 'lavaman', n: 2, scale: 1.2 },
        ],
        trickle: { every: 18, unit: 'ember', scale: 1.1 },
      },
      outro: [
        { narr: '이그니스가 쓰러지자 거대한 화염 에너지가 폭발한다. 이번에는 사라지지 않는다.' },
        { narr: '대지, 물, 불의 잔류 에너지가 동시에 반응한다.' },
        { narr: '각기 다른 빛이 하나의 방향으로 휘어진다.' },
      ],
    },

    /* ---------- ACT 6 ---------- */
    {
      id: 'act6', kind: 'ACT 6', title: '번개의 침공',
      intro: [
        { narr: '하늘 곳곳에 균열이 열린다. 번개의 군세는 정면 전선을 우회해 왕국 내부로 침투한다.' },
        { narr: '고속 적, 후방 기습, 순간 이동, 연쇄 번개.' },
        { who: 'soldier', text: '뒷문 쪽에서도 균열이! 병력이 없습니다!' },
        { who: 'arthur', text: '내가 나간다. 거점을 부숴라.' },
        { objective: '침투한 균열 거점을 파괴하라.' },
      ],
      battle: {
        theme: 'storm', playerHp: 28000, riftHp: 90000, income: 26, startMoney: 950,
        objective: { type: 'destroy' },
        hazard: { type: 'storm', interval: 8 },
        waves: [
          { at: 5,  unit: 'spark', n: 4, scale: 1.1 },
          { at: 14, unit: 'spark', n: 3, scale: 1.1, side: 'ally' },
          { at: 30, unit: 'storm', n: 2, scale: 1.15 },
          { at: 46, unit: 'volt',  n: 1, scale: 1.15 },
          { at: 58, unit: 'spark', n: 4, scale: 1.2, side: 'ally' },
          { at: 76, unit: 'storm', n: 3, scale: 1.2 },
          { at: 96, unit: 'volt',  n: 2, scale: 1.25 },
        ],
        trickle: { every: 12, unit: 'spark', scale: 1.25 },
      },
      outro: [
        { narr: '전투 중 부상자를 구하려 접근한 왕국 병사. 근처의 번개 병사가 전기가 불안정해져 무너진다.' },
        { narr: '왕국 병사 역시 압박을 받지만 움직임을 유지해 부상자를 구출한다.' },
        { narr: '아서왕이 직접 그 장면을 확인한다.' },
      ],
    },

    /* ---------- BOSS 4 ---------- */
    {
      id: 'boss4', kind: 'BOSS 4', title: '번개의 볼트라스',
      intro: [
        { narr: '번개의 볼트라스가 다중 균열을 넘어 전장을 가른다.' },
        { boss: 'voltas', name: 'BOSS — 번개의 볼트라스' },
        { objective: '볼트라스를 격파하라.' },
      ],
      battle: {
        theme: 'storm', playerHp: 32000, riftHp: 100000, income: 40, startMoney: 1200,
        objective: { type: 'boss' },
        boss: 'voltas', bossAt: 12,
        hazard: { type: 'storm', interval: 13 },
        waves: [
          { at: 6,  unit: 'spark', n: 5, scale: 1.1 },
          { at: 20, unit: 'spark', n: 4, scale: 1.1, side: 'ally' },
          { at: 48, unit: 'volt',  n: 2, scale: 1.15 },
          { at: 74, unit: 'storm', n: 3, scale: 1.2 },
        ],
        trickle: { every: 16, unit: 'spark', scale: 1.15 },
      },
      outro: [
        { narr: '대지, 물, 불, 번개의 잔류 에너지가 모두 끌려가기 시작한다. 볼트라스의 번개까지 통제를 잃는다.' },
        { narr: '거대한 균열이 열리고, 그 안에서 거대한 형체가 모습을 드러낸다.' },
        { who: 'arthur', text: '거리 벌려.' },
      ],
    },

    /* ---------- ACT 7 : WORLD BOSS ---------- */
    {
      id: 'act7', kind: 'ACT 7', title: '원소포식자 아르카논',
      intro: [
        { narr: '아르카논이 모습을 드러내자 전장에 남은 대지, 물, 불, 번개의 힘이 몸 안으로 흡수된다.' },
        { narr: '주변 원소 병사들의 힘까지 빨려 들어간다.' },
        { boss: 'arkanon', name: 'WORLD BOSS — 원소포식자 아르카논' },
        { objective: '원소포식자 아르카논을 격파하라.' },
      ],
      battle: {
        theme: 'rift', playerHp: 45000, riftHp: 150000, income: 50, startMoney: 2000,
        objective: { type: 'boss' },
        boss: 'arkanon', bossAt: 10,
        waves: [
          { at: 6,  unit: 'golem',  n: 2, scale: 1.3 },
          { at: 30, unit: 'whirl',  n: 3, scale: 1.3 },
          { at: 60, unit: 'lavaman', n: 2, scale: 1.3 },
          { at: 90, unit: 'volt',   n: 2, scale: 1.3 },
          { at: 120,unit: 'golem',  n: 3, scale: 1.4 },
        ],
        trickle: { every: 14, unit: 'tremor', scale: 1.4 },
      },
      outro: [
        { narr: '아르카논의 몸이 무너진다. 몸 안에 압축되어 있던 네 원소의 에너지가 한꺼번에 폭발한다.' },
      ],
    },

    /* ---------- ACT 8 : 엔딩 (전투 없음) ---------- */
    {
      id: 'act8', kind: 'ACT 8', title: '끝나지 않은 균열',
      noBattle: true,
      intro: [
        { narr: '전장 중앙의 균열이 다시 흔들리고 빠르게 팽창한다. 경계는 수도 방향으로 번져간다.' },
        { narr: '주변의 원소 생명체들이 균열 가까이에서 형태를 유지하지 못하고 무너진다.' },
        { narr: '왕국 병사들이 부상자를 회수하기 위해 접근한다.' },
        { narr: '그 순간 그들이 접근한 방향의 균열 경계가 잠깐 흔들리며 팽창 속도가 느려진다.' },
        { narr: '병사들이 물러나자 다시 빨라진다.' },
        { who: 'soldier', text: '폐하.' },
        { who: 'arthur', text: '전군 후퇴.' },
        { narr: '아서왕은 균열 중심으로 들어간다. 공간이 뒤틀리고 갑주가 흔들린다.' },
        { narr: '아서왕이 검을 바닥에 꽂는다. 균열의 팽창이 느려진다. 수도 방향 확장이 멈춘다.' },
        { narr: '왕국군이 후퇴한다. 잠깐의 정적.' },
        { narr: '곧 원소 흐름이 무너지고 역류한다. 강한 흡입이 발생한다.' },
        { narr: '돌과 무기, 주변 병사들이 균열 쪽으로 끌려간다.' },
        { narr: '아서왕과 일부 왕국군이 균열 안으로 빨려 들어간다. 빛이 사라진다.' },
        { narr: '전장에는 거대한 균열의 흔적만 남는다.' },
        { black: '암전.' },
        { black: '금속이 돌바닥에 부딪히는 소리.' },
        { narr: '아서왕이 눈을 뜬다. 낯선 하늘. 무너진 성벽. 불탄 건물. 폐허 사이의 검은 공백.' },
        { clear: 'CHAPTER 1 CLEAR — 퓨어월드' },
      ],
    },
  ],
};

/* ================================================================
   CHAPTER 2 — 그림자 균열
   ================================================================ */
const CHAPTER_2 = {
  title: 'CHAPTER 2',
  subtitle: '그림자 균열',
  desc: '빛을 먹는 그림자 세력이 국경을 침공한다. 그림자 군주 움브라와 황혼의 닉스를 격파하고 하늘을 되찾아라.',
  acts: [
    {
      id: 'c2a1', kind: 'ACT 1', title: '빛이 꺼진 국경',
      intro: [
        { narr: '아르카논 격파 후 3일. 퓨어월드의 하늘이 한쪽에서부터 시커멓게 물들기 시작한다.' },
        { narr: '빛이 사라진 자리에 새로운 균열이 열리고, 그림자로 이루어진 병력이 걸어 나온다.' },
        { who: 'mage', text: '원소와 다릅니다. 빛을 먹고 자라는 존재들….' },
        { who: 'arthur', text: '다시 세운 성벽. 이번에는 무너지지 않는다.' },
        { objective: '그림자 강하를 85초 동안 막아내라.' },
      ],
      battle: {
        theme: 'storm', playerHp: 60000, riftHp: 160000, income: 55, startMoney: 2400,
        objective: { type: 'survive', time: 85 },
        waves: [
          { at: 6,  unit: 'shade', n: 3, scale: 1.2 },
          { at: 20, unit: 'stalker', n: 2, scale: 1.2 },
          { at: 36, unit: 'shade', n: 4, scale: 1.3 },
          { at: 52, unit: 'voidMage', n: 2, scale: 1.3 },
          { at: 68, unit: 'gloombrute', n: 1, scale: 1.1 },
        ],
        trickle: { every: 13, unit: 'shade', scale: 1.4 },
      },
      outro: [
        { narr: '그림자의 공세가 잠깐 꺾인다. 하지만 하늘의 그림자는 걷히지 않는다.' },
      ],
    },
    {
      id: 'c2a2', kind: 'ACT 2', title: '암살자의 통로',
      intro: [
        { narr: '그림자 병력은 정면이 아니라 성벽 아래 옛 빗물 통로로 침투한다.' },
        { who: 'soldier', text: '지하 통로 쪽에서 발소리가… 수가 많습니다!' },
        { objective: '침투 병력을 막고 균열 통로를 붕괴시켜라.' },
      ],
      battle: {
        theme: 'ruins', playerHp: 65000, riftHp: 210000, income: 58, startMoney: 2600,
        objective: { type: 'destroy' },
        waves: [
          { at: 5,  unit: 'stalker', n: 3, scale: 1.25 },
          { at: 22, unit: 'shade', n: 5, scale: 1.35 },
          { at: 42, unit: 'voidMage', n: 3, scale: 1.4 },
          { at: 64, unit: 'gloombrute', n: 2, scale: 1.2 },
          { at: 90, unit: 'stalker', n: 4, scale: 1.5 },
        ],
        trickle: { every: 12, unit: 'shade', scale: 1.5 },
      },
      outro: [
        { narr: '통로가 무너지자 그림자 병력의 보급이 끊긴다.' },
      ],
    },
    {
      id: 'c2b1', kind: 'BOSS 1', title: '그림자 군주 움브라',
      intro: [
        { narr: '꺼진 빛의 중심. 그림자들이 한곳으로 모여 거대한 형체를 이룬다.' },
        { boss: 'umbra', name: 'BOSS — 그림자 군주 움브라' },
        { objective: '그림자 군주 움브라를 격파하라.' },
      ],
      battle: {
        theme: 'storm', playerHp: 70000, riftHp: 240000, income: 65, startMoney: 3200,
        objective: { type: 'boss' },
        boss: 'umbra', bossAt: 14,
        waves: [
          { at: 8,  unit: 'shade', n: 4, scale: 1.35 },
          { at: 40, unit: 'stalker', n: 3, scale: 1.45 },
          { at: 76, unit: 'voidMage', n: 3, scale: 1.5 },
        ],
        trickle: { every: 17, unit: 'stalker', scale: 1.5 },
      },
      outro: [
        { narr: '움브라가 분해되며 검은 안개로 흩어진다.' },
        { narr: '안개 사이로 더 깊은 어둠이 모습을 비춘다 — 황혼의 닉스.' },
      ],
    },
    {
      id: 'c2a3', kind: 'ACT 3', title: '황혼의 진격',
      intro: [
        { narr: '움브라가 쓰러지자 그림자 세력의 지휘권이 황혼의 닉스에게 넘어간다.' },
        { narr: '닉스는 병력을 모으는 대신, 그림자를 직접 전장에 흘려보낸다.' },
        { objective: '황혼의 공세를 100초 동안 버텨내라.' },
      ],
      battle: {
        theme: 'rift', playerHp: 75000, riftHp: 280000, income: 70, startMoney: 3400,
        objective: { type: 'survive', time: 100 },
        waves: [
          { at: 6,  unit: 'shade', n: 5, scale: 1.4 },
          { at: 24, unit: 'voidMage', n: 3, scale: 1.5 },
          { at: 44, unit: 'stalker', n: 4, scale: 1.55 },
          { at: 66, unit: 'gloombrute', n: 2, scale: 1.3 },
          { at: 86, unit: 'voidMage', n: 4, scale: 1.6 },
        ],
        trickle: { every: 12, unit: 'shade', scale: 1.6 },
      },
      outro: [
        { narr: '100초. 왕국군은 황혼의 공세를 막아낸다.' },
      ],
    },
    {
      id: 'c2a4', kind: 'ACT 4', title: '빛을 빼앗긴 마을',
      intro: [
        { narr: '그림자에 삼켜진 마을. 주민들은 빛을 잃고 제자리에서 얼어있다.' },
        { who: 'soldier', text: '주민들이 움직이지 않습니다… 그림자가 발을 붙잡고 있습니다!' },
        { objective: '주민 6명을 그림자에서 구출하라.' },
      ],
      battle: {
        theme: 'rift', playerHp: 80000, riftHp: 300000, income: 72, startMoney: 3600,
        objective: { type: 'rescue', n: 6, maxLost: 3 },
        waves: [
          { at: 5,  unit: 'stalker', n: 3, scale: 1.5 },
          { at: 24, unit: 'shade', n: 5, scale: 1.6 },
          { at: 46, unit: 'voidMage', n: 3, scale: 1.65 },
          { at: 70, unit: 'gloombrute', n: 2, scale: 1.4 },
        ],
        trickle: { every: 13, unit: 'stalker', scale: 1.65 },
        villagers: { every: 12, count: 6 },
      },
      outro: [
        { narr: '주민들이 빛을 되찾으며 마을에 불이 다시 켜진다.' },
        { narr: '하지만 하늘의 그림자는 아직 걷히지 않았다.' },
      ],
    },
    {
      id: 'c2b2', kind: 'BOSS 2', title: '황혼의 닉스',
      intro: [
        { narr: '그림자 세력의 심장부. 황혼의 닉스가 달처럼 걸어 나온다.' },
        { boss: 'nyx', name: 'BOSS — 황혼의 닉스' },
        { objective: '황혼의 닉스를 격파하라.' },
      ],
      battle: {
        theme: 'rift', playerHp: 90000, riftHp: 340000, income: 80, startMoney: 4200,
        objective: { type: 'boss' },
        boss: 'nyx', bossAt: 13,
        flood: 0.3,
        waves: [
          { at: 8,  unit: 'shade', n: 5, scale: 1.5 },
          { at: 40, unit: 'voidMage', n: 3, scale: 1.6 },
          { at: 74, unit: 'gloombrute', n: 2, scale: 1.45 },
        ],
        trickle: { every: 16, unit: 'shade', scale: 1.7 },
      },
      outro: [
        { narr: '닉스가 무너지며 하늘의 그림자가 얇아진다.' },
        { narr: '그리고 그 틈으로, 전혀 다른 색의 균열이 열린다 — 혼돈.' },
        { who: 'arthur', text: '이건… 그림자와 다른 무언가다.' },
      ],
    },
    {
      id: 'c2a5', kind: 'ACT 5', title: '그림자와 혼돈 사이',
      intro: [
        { narr: '두 균열이 동시에 열린다. 그림자와 혼돈의 세력이 서로를 밀어내며 진격한다.' },
        { narr: '왕국군은 두 진영의 협공을 받아야 한다.' },
        { objective: '혼합 공세를 110초 동안 막아내라.' },
      ],
      battle: {
        theme: 'storm', playerHp: 95000, riftHp: 380000, income: 85, startMoney: 4600,
        objective: { type: 'survive', time: 110 },
        hazard: { type: 'storm', interval: 10 },
        waves: [
          { at: 6,  unit: 'shade', n: 5, scale: 1.6 },
          { at: 26, unit: 'chaosSpawn', n: 3, scale: 1.2 },
          { at: 48, unit: 'stalker', n: 4, scale: 1.7 },
          { at: 70, unit: 'voidMage', n: 4, scale: 1.7 },
          { at: 90, unit: 'hexKnight', n: 2, scale: 1.2 },
        ],
        trickle: { every: 12, unit: 'shade', scale: 1.75 },
      },
      outro: [
        { narr: '그림자 세력의 마지막 거점이 붕괴한다. 남은 것은 혼돈뿐.' },
        { clear: 'CHAPTER 2 CLEAR — 그림자 균열' },
      ],
    },
  ],
};

/* ================================================================
   CHAPTER 3 — 혼돈의 왕궁
   ================================================================ */
const CHAPTER_3 = {
  title: 'CHAPTER 3',
  subtitle: '혼돈의 왕궁',
  desc: '혼돈의 왕궁이 퓨어월드 위로 내려앉았다. 대마왕 카오토스와 종말의 존재 피날레를 무너뜨리고 균열의 끝을 막아라.',
  acts: [
    {
      id: 'c3a1', kind: 'ACT 1', title: '재편된 균열',
      intro: [
        { narr: '그림자 균열이 닫히자마자, 왕국 상공의 모든 균열이 하나의 방향으로 정렬한다.' },
        { narr: '균열 너머의 세계가 가까워지고 있다. 혼돈의 왕궁이 퓨어월드 위로 내려앉는다.' },
        { who: 'mage', text: '공간 자체가 접히고 있습니다. 저 뒤에 있는 세계가….' },
        { objective: '혼돈 선봉을 100초 동안 격퇴하라.' },
      ],
      battle: {
        theme: 'rift', playerHp: 120000, riftHp: 460000, income: 95, startMoney: 5400,
        objective: { type: 'survive', time: 100 },
        hazard: { type: 'fire', interval: 9 },
        waves: [
          { at: 6,  unit: 'chaosSpawn', n: 4, scale: 1.3 },
          { at: 24, unit: 'riftArcher', n: 3, scale: 1.3 },
          { at: 44, unit: 'hexKnight', n: 3, scale: 1.35 },
          { at: 66, unit: 'chaosSpawn', n: 5, scale: 1.5 },
          { at: 86, unit: 'annihilator', n: 1, scale: 1.0 },
        ],
        trickle: { every: 13, unit: 'chaosSpawn', scale: 1.55 },
      },
      outro: [
        { narr: '혼돈 선봉이 물러선다. 하지만 왕궁은 아직 낮게 내려오고 있다.' },
      ],
    },
    {
      id: 'c3a2', kind: 'ACT 2', title: '봉인의 의식',
      intro: [
        { narr: '왕국 마법사들이 균열을 닫기 위해 사방에 봉인석을 세운다.' },
        { who: 'mage', text: '의식이 끝날 때까지 봉인석을 지켜주세요. 부서지면 처음부터 다시 시작합니다.' },
        { objective: '혼돈의 개체들이 봉인석을 파괴하기 전에 균열을 봉인하라.' },
      ],
      battle: {
        theme: 'ruins', playerHp: 125000, riftHp: 560000, income: 100, startMoney: 5800,
        objective: { type: 'destroy' },
        waves: [
          { at: 5,  unit: 'chaosSpawn', n: 4, scale: 1.4 },
          { at: 26, unit: 'hexKnight', n: 3, scale: 1.5 },
          { at: 50, unit: 'riftArcher', n: 4, scale: 1.5 },
          { at: 76, unit: 'chaosSpawn', n: 5, scale: 1.65 },
          { at: 104, unit: 'annihilator', n: 1, scale: 1.15 },
        ],
        trickle: { every: 13, unit: 'hexKnight', scale: 1.5 },
      },
      outro: [
        { narr: '봉인석이 빛을 뿜는다. 하지만 의식은 완전히 끝나지 않았다.' },
      ],
    },
    {
      id: 'c3b1', kind: 'BOSS 1', title: '혼돈의 대마왕',
      intro: [
        { narr: '왕궁의 문이 열린다. 혼돈의 대마왕 카오토스가 직접 걸어 나온다.' },
        { boss: 'chaothos', name: 'BOSS — 혼돈의 대마왕 카오토스' },
        { objective: '카오토스를 격파하고 봉인 의식을 완료하라.' },
      ],
      battle: {
        theme: 'rift', playerHp: 135000, riftHp: 600000, income: 110, startMoney: 6600,
        objective: { type: 'boss' },
        boss: 'chaothos', bossAt: 14,
        hazard: { type: 'fire', interval: 13 },
        waves: [
          { at: 8,  unit: 'chaosSpawn', n: 5, scale: 1.5 },
          { at: 44, unit: 'hexKnight', n: 3, scale: 1.6 },
          { at: 82, unit: 'riftArcher', n: 4, scale: 1.65 },
        ],
        trickle: { every: 17, unit: 'chaosSpawn', scale: 1.7 },
      },
      outro: [
        { narr: '카오토스가 무너진다. 하지만 왕궁 깊은 곳에서 더 무거운 기척이 올라온다.' },
        { who: 'soldier', text: '폐하… 저건 뭐죠?' },
      ],
    },
    {
      id: 'c3a3', kind: 'ACT 3', title: '소멸의 땅',
      intro: [
        { narr: '왕궁이 퓨어월드에 완전히 내려앉는다. 땅이 혼돈에 물들어 생명을 삼킨다.' },
        { narr: '왕국군은 마지막 주민들을 대피시키며 후위를 지킨다.' },
        { objective: '90초 동안 성벽을 지키고 주민을 대피시켜라.' },
      ],
      battle: {
        theme: 'burn', playerHp: 145000, riftHp: 680000, income: 115, startMoney: 7200,
        objective: { type: 'defend', time: 90, rescue: 5, maxLost: 4 },
        hazard: { type: 'fire', interval: 8 },
        waves: [
          { at: 5,  unit: 'hexKnight', n: 4, scale: 1.6 },
          { at: 26, unit: 'riftArcher', n: 4, scale: 1.6 },
          { at: 50, unit: 'chaosSpawn', n: 6, scale: 1.75 },
          { at: 74, unit: 'annihilator', n: 1, scale: 1.3 },
        ],
        trickle: { every: 11, unit: 'hexKnight', scale: 1.7 },
        villagers: { every: 10, count: 5 },
      },
      outro: [
        { narr: '마지막 주민이 성문을 넘는다. 이제 남은 것은 왕궁 심부뿐이다.' },
      ],
    },
    {
      id: 'c3a4', kind: 'ACT 4', title: '왕궁 돌파',
      intro: [
        { narr: '왕국군이 왕궁 내부로 진입한다. 혼돈의 엘리트들이 복도를 지킨다.' },
        { who: 'arthur', text: '끝까지 간다. 모두 나를 따르라.' },
        { objective: '왕궁 수비대를 격파하고 최심부로 진입하라.' },
      ],
      battle: {
        theme: 'rift', playerHp: 155000, riftHp: 820000, income: 125, startMoney: 8200,
        objective: { type: 'destroy' },
        hazard: { type: 'storm', interval: 9 },
        waves: [
          { at: 5,  unit: 'hexKnight', n: 5, scale: 1.7 },
          { at: 28, unit: 'riftArcher', n: 4, scale: 1.75 },
          { at: 52, unit: 'annihilator', n: 1, scale: 1.4 },
          { at: 78, unit: 'chaosSpawn', n: 6, scale: 1.9 },
          { at: 106, unit: 'annihilator', n: 2, scale: 1.45 },
        ],
        trickle: { every: 13, unit: 'hexKnight', scale: 1.8 },
      },
      outro: [
        { narr: '왕궁 최심부의 문이 열린다. 문 너머의 존재가 눈을 뜬다.' },
        { who: 'arthur', text: '이 세계의 끝이… 저것이다.' },
      ],
    },
    {
      id: 'c3b2', kind: 'WORLD BOSS', title: '종말의 존재',
      intro: [
        { narr: '혼돈과 공허, 그리고 재앙의 힘이 한 존재 안으로 모인다.' },
        { boss: 'finality', name: 'FINAL BOSS — 종말의 존재 피날레' },
        { objective: '종말의 존재 피날레를 격파하라.' },
      ],
      battle: {
        theme: 'rift', playerHp: 180000, riftHp: 1000000, income: 140, startMoney: 10000,
        objective: { type: 'boss' },
        boss: 'finality', bossAt: 12,
        hazard: { type: 'fire', interval: 11 },
        waves: [
          { at: 8,  unit: 'chaosSpawn', n: 6, scale: 1.8 },
          { at: 44, unit: 'riftArcher', n: 5, scale: 1.9 },
          { at: 84, unit: 'annihilator', n: 1, scale: 1.6 },
          { at: 126, unit: 'hexKnight', n: 5, scale: 2.0 },
        ],
        trickle: { every: 16, unit: 'chaosSpawn', scale: 2.0 },
      },
      outro: [
        { narr: '피날레의 몸이 균열처럼 갈라진다. 혼돈이 빠져나가려는 순간,' },
        { narr: '아서왕이 검을 들어 그 틈을 막는다.' },
      ],
    },
    {
      id: 'c3end', kind: 'ACT 5', title: '균열의 끝',
      noBattle: true,
      intro: [
        { narr: '균열이 닫히려는 순간 강한 흡입이 발생한다. 돌과 무기, 병사들이 끌려간다.' },
        { who: 'soldier', text: '폐하! 나오십시오!' },
        { who: 'arthur', text: '이 검이 이 세계의 마지막 문이다.' },
        { narr: '아서왕이 검을 빛나는 틈에 꽂는다. 혼돈의 흐름이 끊긴다.' },
        { narr: '왕궁이 붕괴하고, 그림자와 혼돈의 균열이 함께 닫힌다.' },
        { narr: '퓨어월드의 하늘이 다시 맑아진다.' },
        { black: '암전.' },
        { narr: '몇 달 뒤. 왕국은 다시 세워지고, 주민들이 돌아온다.' },
        { narr: '성벽 위에 놓인 검에는 균열의 흔적이 남아 있다 — 다음을 위해.' },
        { clear: 'CHAPTER 3 CLEAR — 혼돈의 왕궁' },
      ],
    },
  ],
};

/* 챕터 목록 (게임 엔진이 순회) */
const CHAPTERS = [CHAPTER_1, CHAPTER_2, CHAPTER_3];
/* 하위 호환: 기본 챕터 */
const CHAPTER = CHAPTER_1;
