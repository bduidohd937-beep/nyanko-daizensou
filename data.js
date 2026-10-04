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
];

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
const CHAPTER = {
  title: 'CHAPTER 1',
  subtitle: '퓨어월드',
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
