'use strict';

/* ================================================================
   냥코대전쟁 — CHAPTER 1 : 퓨어월드  (게임 엔진)
   스토리 컷신 / 캠페인 맵 / 전투(유닛·보스·목표) 통합 엔진
   ================================================================ */

/* ================= DOM ================= */
const $ = id => document.getElementById(id);
const canvas = $('game');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;
const GROUND = H - 70;
const PLAYER_BASE_X = 100, ENEMY_BASE_X = W - 100;
const WORLD_LEFT = 50, WORLD_RIGHT = W - 50;

const overlay = $('overlay'), ovTitle = $('ovTitle'), ovSub = $('ovSub'),
      ovDesc = $('ovDesc'), actList = $('actList'), ovBtns = $('ovBtns');
const storyOverlay = $('storyOverlay'), storyScene = $('storyScene'),
      storySpeaker = $('storySpeaker'), storyText = $('storyText');

/* ================= 이미지 로딩 (없으면 이모지) ================= */
const IMG_CACHE = {};
function getImage(path) {
  if (path in IMG_CACHE) return IMG_CACHE[path];
  const img = new Image();
  img.src = path;
  IMG_CACHE[path] = img;
  return img;
}
function tryDraw(img, x, y, size) {
  if (img && img.complete && img.naturalWidth > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, size, 0, 7);
    ctx.clip();
    ctx.drawImage(img, x - size, y - size, size * 2, size * 2);
    ctx.restore();
    return true;
  }
  return false;
}

/* ================= 진행 상황 ================= */
let unlocked = Number(localStorage.getItem('pw_unlocked') || 1);
let clearedSet = new Set(JSON.parse(localStorage.getItem('pw_cleared') || '[]'));
function saveProgress() {
  localStorage.setItem('pw_unlocked', String(unlocked));
  localStorage.setItem('pw_cleared', JSON.stringify([...clearedSet]));
}

/* ================= 화자 ================= */
const SPEAKERS = { arthur: '아서왕', mage: '왕국 마법사', soldier: '왕국 병사', villager: '퓨어월드 주민' };

/* ================= 상태 ================= */
let state = null;          // 전투 상태
let currentAct = 0;
let paused = false, speed = 1;
let rafId = null, lastTs = 0;
let mode = 'map';          // map | story | battle
let storyQueue = [], storyDone = null, typeTimer = null;

/* ================= 전투 상태 생성 ================= */
let uidSeq = 1;
function newBattle(actIdx) {
  const act = CHAPTER.acts[actIdx];
  const b = act.battle;
  return {
    act, actIdx, t: 0,
    money: b.startMoney || 300,
    incomeRate: b.income, incomeLv: 1, incomeCost: 150,
    playerHp: b.playerHp, playerMaxHp: b.playerHp,
    riftHp: b.riftHp, riftMaxHp: b.riftHp,
    objective: b.objective,
    units: [], walls: [], fireZones: [], particles: [], fx: [], tele: [],
    cds: {}, skillCds: { excalibur: 0, meteorCall: 0 },
    waveIdx: 0, trickleT: b.trickle ? b.trickle.every : 999,
    villagerT: b.villagers ? 4 : 999,
    villagerSpawned: 0,
    villagerTotal: b.villagers
      ? Math.max(b.villagers.count, (b.objective.rescue || b.objective.n || 0) + (b.objective.maxLost || 0))
      : 0,
    rescued: 0, lost: 0,
    flood: b.flood || 0,
    hazard: b.hazard || null, hazardT: b.hazard ? b.hazard.interval : 999,
    boss: null, bossDef: null, bossPhase: 0, bossPending: b.boss ? (b.bossAt || 10) : null,
    over: null, shake: 0,
  };
}

/* ================= 스폰 ================= */
function spawnUnit(team, def, opts = {}) {
  let x;
  if (opts.x !== undefined) x = opts.x;
  else if (team === 'player') x = PLAYER_BASE_X + 45;
  else x = ENEMY_BASE_X - 45;
  const scale = opts.scale || 1;
  const u = {
    uid: uidSeq++, team, def,
    x, y: GROUND - def.size,
    hp: def.hp * scale, maxHp: def.hp * scale,
    atk: def.atk * scale,
    atkCd: Math.random() * 0.4, stun: 0, burn: null, knock: 0,
    hitFlash: 0, wob: Math.random() * 6.28,
    speedBuff: 0, speedMul: 1,
    isBoss: !!opts.boss, phaseMods: {},
  };
  state.units.push(u);
  if (opts.boss) { state.boss = u; state.bossDef = def; state.bossPhase = 0; }
  return u;
}
function spawnPlayer(id) { const d = PLAYER_UNITS.find(u => u.id === id); if (d) return spawnUnit('player', d); }
function spawnEnemy(id, opts) { const d = ENEMY_UNITS.find(u => u.id === id); if (d) return spawnUnit('enemy', d, opts); }
function spawnVillager() {
  const u = spawnUnit('civ', VILLAGER_DEF, { x: ENEMY_BASE_X - 90 });
  u.y = GROUND - VILLAGER_DEF.size;
  return u;
}

/* ================= 이펙트 ================= */
function burst(x, y, color, n = 8) {
  for (let i = 0; i < n; i++) state.particles.push({
    x, y, vx: (Math.random() - .5) * 240, vy: -Math.random() * 170 - 30,
    life: .5 + Math.random() * .4, color, r: 2 + Math.random() * 3.5,
  });
}
function floatText(x, y, text, color = '#fff') {
  state.fx.push({ x, y, text, color, t: 1 });
}
function telegraph(x, r, delay, color, onDone) {
  state.tele.push({ x, r, t: 0, delay, color, onDone });
}

/* ================= 데미지 ================= */
function applyDamage(target, amount, opts = {}) {
  if (target.hp <= 0) return;
  // 성기사 오러: 주변 아군 피해 감소
  if (target.team === 'player' && !target.isBoss) {
    for (const a of state.units) {
      if (a.team === 'player' && a.def.ability && a.def.ability.type === 'auraShield') {
        if (Math.abs(a.x - target.x) <= a.def.ability.radius) {
          amount *= (1 - a.def.ability.reduce);
          break;
        }
      }
    }
  }
  // 보스 페이즈 피해 조정
  if (target.isBoss && target.phaseMods.dmgTaken) amount *= target.phaseMods.dmgTaken;

  target.hp -= amount;
  target.hitFlash = .12;
  if (opts.burn) target.burn = { dps: opts.burn.dps, t: opts.burn.dur };
  if (opts.stun) target.stun = Math.max(target.stun, opts.stun);
  if (opts.knock) {
    const resist = target.def.knockResist || (target.isBoss ? (target.def.knockResist ?? .8) : 0);
    target.knock = opts.knock * (1 - resist);
  }
  if (amount >= 1) floatText(target.x, target.y - target.def.size - 12, String(Math.round(amount)), opts.crit ? '#ffd54f' : '#fff');
  burst(target.x, target.y + target.def.size * .4, opts.color || '#ffcc80', 4);

  if (target.hp <= 0) {
    target.hp = 0;
    burst(target.x, target.y + target.def.size * .5, '#ef5350', 16);
    if (target.team === 'enemy' && target.def.bounty) {
      state.money += target.def.bounty;
      floatText(target.x, target.y - 30, '+' + target.def.bounty, '#ffe082');
    }
    if (target.isBoss) onBossDeath();
    if (target.team === 'civ') {
      state.lost++;
      floatText(target.x, target.y - 30, '주민 사망', '#ff5252');
    }
  }
}

/* ================= 보스 AI ================= */
function onBossDeath() {
  if (state.objective.type === 'boss' && state.over === null) endGame(true);
}
function bossMods(b) { return b.phaseMods; }

function updateBoss(b, dt) {
  const def = state.bossDef;
  const hpPct = b.hp / b.maxHp;

  // 페이즈 전환
  const phases = def.phases;
  while (state.bossPhase < phases.length - 1 && hpPct <= phases[state.bossPhase + 1].pct) {
    state.bossPhase++;
    const ph = phases[state.bossPhase];
    b.phaseMods = Object.assign({}, ph.mods || {});
    state.shake = .4;
    floatText(b.x, b.y - b.def.size - 40, 'PHASE — ' + ph.name, '#ffd54f');
    burst(b.x, b.y, ELEMENT_COLORS[ph.element || def.element] || '#ffd54f', 30);
  }
  if (state.bossPhase === 0) b.phaseMods = Object.assign({}, phases[0].mods || {});

  // 페이즈 패시브
  const m = bossMods(b);
  if (m.regen) b.hp = Math.min(b.maxHp, b.hp + b.maxHp * m.regen * dt);
  if (m.burnAura) {
    for (const u of state.units) {
      if (u.team === 'player' && Math.abs(u.x - b.x) < 260) {
        u.hp -= m.burnAura * dt;
        if (Math.random() < dt * 3) burst(u.x, u.y, '#ff7043', 2);
        if (u.hp <= 0) { u.hp = 0; burst(u.x, u.y, '#ef5350', 12); }
      }
    }
  }

  // 스크립트 순환
  b.atkCd -= dt;
  b._scriptT = (b._scriptT || 2.5) - dt;
  if (b._scriptT <= 0) {
    const sc = def.script;
    b._scriptIdx = ((b._scriptIdx || 0)) % sc.length;
    const move = sc[b._scriptIdx];
    b._scriptIdx++;
    b._scriptT = move.cd * (m.atkSpd ? Math.min(1, m.atkSpd + .2) : 1);
    bossAbility(b, move);
  }
}

function bossAbility(b, move) {
  const players = state.units.filter(u => u.team === 'player' && u.hp > 0);
  switch (move.id) {
    case 'quake': { // 지진: 보스 근처 아군에 지연 폭발 + 스턴
      const near = players.filter(u => Math.abs(u.x - b.x) < 450);
      const picks = near.length ? near.slice().sort(() => Math.random() - .5).slice(0, 2)
        : [{ x: b.x - 200 }];
      for (const p of picks) {
        telegraph(p.x, 110, 1.2, '#c8a57a', () => {
          state.shake = .5;
          burst(p.x, GROUND, '#c8a57a', 26);
          for (const u of state.units) {
            if (u.team === 'player' && Math.abs(u.x - p.x) < 110) {
              applyDamage(u, 300, { stun: 0.8, color: '#c8a57a' });
            }
          }
        });
      }
      floatText(b.x, b.y - b.def.size - 40, '지진!', '#c8a57a');
      break;
    }
    case 'rockwall': { // 바위벽: 아군 진격을 막는 장벽
      for (let i = 0; i < 2; i++) {
        const x = Math.max(PLAYER_BASE_X + 140, b.x - 220 - i * 170);
        state.walls.push({ x, hp: 900, maxHp: 900, t: 16 });
      }
      floatText(b.x - 150, GROUND - 80, '바위벽!', '#c8a57a');
      break;
    }
    case 'summon': {
      for (let i = 0; i < (move.n || 1); i++) {
        setTimeout(() => { if (state && !state.over) spawnEnemy(move.unit, { x: b.x - 50 - i * 40 }); }, i * 350);
      }
      burst(b.x, b.y, '#b39ddb', 18);
      break;
    }
    case 'advance': { // 지속 전진
      b.speedMul = 1.6; b.speedBuff = move.dur || 4; b.glideT = (move.dur || 4) + 2;
      floatText(b.x, b.y - b.def.size - 40, '전진!', '#ff8a65');
      break;
    }
    case 'floodRise': {
      state.flood = Math.min(1, state.flood + .25);
      state.shake = .3;
      floatText(W / 2, GROUND - 100, '수위 상승!', '#4fc3f7');
      break;
    }
    case 'waterWave': { // 물살 밀치기
      for (const u of players) {
        if (Math.abs(u.x - b.x) < 340) applyDamage(u, 300, { knock: -70, color: '#4fc3f7' });
      }
      state.fx.push({ x: b.x, y: GROUND - 40, text: '물살!', color: '#4fc3f7', t: 1 });
      burst(b.x, GROUND, '#4fc3f7', 24);
      break;
    }
    case 'heal': {
      b.hp = Math.min(b.maxHp, b.hp + b.maxHp * .06);
      floatText(b.x, b.y - b.def.size - 40, '+10%', '#66bb6a');
      burst(b.x, b.y, '#66bb6a', 20);
      break;
    }
    case 'fireZones': { // 화염 지대 설치
      for (let i = 0; i < 3; i++) {
        const x = 240 + Math.random() * (W - 540);
        state.fireZones.push({ x, w: 150, t: 8 });
      }
      floatText(W / 2, GROUND - 110, '화염 지대!', '#ff7043');
      break;
    }
    case 'explosion': {
      state.shake = .5;
      burst(b.x, b.y, '#ff7043', 40);
      for (const u of players) {
        if (Math.abs(u.x - b.x) < 320) applyDamage(u, 450, { knock: (u.x < b.x ? -1 : 1) * 80, color: '#ff7043' });
      }
      floatText(b.x, b.y - b.def.size - 40, '폭발!', '#ff7043');
      break;
    }
    case 'burnWave': {
      for (const u of players) {
        if (Math.abs(u.x - b.x) < 300) applyDamage(u, 350, { burn: { dps: 50, dur: 5 }, knock: -60, color: '#ff7043' });
      }
      burst(b.x, GROUND, '#ff7043', 30);
      break;
    }
    case 'blink': { // 순간 이동(전진)
      b.x = Math.max(PLAYER_BASE_X + 160, b.x - 280);
      b.glideT = 6;
      burst(b.x, b.y, '#ffee58', 26);
      floatText(b.x, b.y - b.def.size - 40, '순간이동!', '#ffee58');
      break;
    }
    case 'chainBoss': {
      const near = players.filter(u => Math.abs(u.x - b.x) < 600);
      const picks = near.sort((a, c) => Math.abs(a.x - b.x) - Math.abs(c.x - b.x)).slice(0, 3);
      for (const p of picks) {
        state.fx.push({ x: p.x, y: p.y - 60, text: '⚡', color: '#ffee58', t: .8, icon: true });
        applyDamage(p, 400, { stun: .5, color: '#ffee58' });
        burst(p.x, p.y, '#ffee58', 14);
      }
      floatText(b.x, b.y - b.def.size - 40, '연쇄 번개!', '#ffee58');
      break;
    }
    case 'dash': {
      b.speedMul = 3; b.speedBuff = move.dur || 1.6; b.glideT = (move.dur || 1.6) + 3;
      floatText(b.x, b.y - b.def.size - 40, '돌진!', '#ffee58');
      break;
    }
  }
}

/* ================= 유닛 업데이트 ================= */
function effectiveAtkInt(u) {
  const m = u.isBoss ? u.phaseMods : null;
  return u.def.atkInt * (m && m.atkSpd ? m.atkSpd : 1);
}
function effectiveAtk(u) {
  const m = u.isBoss ? u.phaseMods : null;
  return u.atk * (m && m.atk ? m.atk : 1);
}
function effectiveRange(u) {
  const m = u.isBoss ? u.phaseMods : null;
  if (m && m.rangeGrow) return u.def.range * (1 + (1 - u.hp / u.maxHp) * .8);
  return u.def.range;
}
function effectiveSpeed(u) {
  let s = u.def.speed;
  if (u.isBoss) {
    const m = u.phaseMods;
    if (m && m.haste) s *= 1.6;
  }
  if (u.speedBuff > 0) s *= u.speedMul;
  // 침수: 아군 감속, 물 속 적 회복은 elsewhere
  if (u.team === 'player' && state.flood > 0) s *= (1 - .4 * state.flood);
  if (u.team === 'civ' && state.flood > 0) s *= (1 - .3 * state.flood);
  return s;
}

function isEnemyOf(a, b) {
  if (a.team === b.team) return false;
  if (a.team === 'civ') return b.team === 'enemy' || b.team === 'boss';
  if (b.team === 'civ') return a.team === 'enemy';
  return true; // player vs enemy
}

function updateUnit(u, dt) {
  if (u.hp <= 0) return;
  // 보스 방어선: 돌진/순간이동이 끝나면 균열 방어선까지 후퇴
  if (u.isBoss) {
    if (u.glideT > 0) u.glideT -= dt;
    else {
      const holdX = ENEMY_BASE_X - 430;
      if (u.x < holdX) u.x = Math.min(holdX, u.x + u.def.speed * 2 * dt);
    }
  }
  u.hitFlash = Math.max(0, u.hitFlash - dt);
  u.wob += dt * 8;
  if (u.speedBuff > 0) { u.speedBuff -= dt; if (u.speedBuff <= 0) u.speedMul = 1; }

  // 화상
  if (u.burn) {
    u.burn.t -= dt;
    u.hp -= u.burn.dps * dt;
    if (Math.random() < dt * 5) burst(u.x, u.y, '#ff7043', 1);
    if (u.burn.t <= 0) u.burn = null;
    if (u.hp <= 0) {
      u.hp = 0;
      burst(u.x, u.y, '#ef5350', 14);
      if (u.team === 'enemy' && u.def.bounty) state.money += u.def.bounty;
      if (u.team === 'civ') state.lost++;
      return;
    }
  }
  // 물 속 물계열 적 / 아쿠아 성역 회복
  if ((u.team === 'enemy' && u.def.element === 'water' && state.flood > .2) ||
      (u.team === 'enemy' && u.def.element === 'water' && u.isBoss && state.flood > .3)) {
    u.hp = Math.min(u.maxHp, u.hp + u.maxHp * .01 * dt);
  }

  // 넉백
  if (u.knock) {
    u.x += u.knock * dt;
    u.knock *= Math.pow(.02, dt);
    if (Math.abs(u.knock) < 5) u.knock = 0;
    u.x = Math.max(WORLD_LEFT, Math.min(WORLD_RIGHT, u.x));
  }

  // 스턴
  if (u.stun > 0) { u.stun -= dt; return; }

  // 주민: 왕국 성으로 도주
  if (u.team === 'civ') {
    u.x -= effectiveSpeed(u) * dt;
    if (u.x <= PLAYER_BASE_X + 30) {
      u.hp = 0;
      state.rescued++;
      floatText(u.x, u.y - 30, '구출!', '#66bb6a');
      burst(u.x, u.y, '#66bb6a', 12);
    }
    return;
  }

  u.atkCd -= dt;
  const dir = u.team === 'player' ? 1 : -1;

  // 대상 탐색 (가장 가까운 적)
  let target = null, best = Infinity, targetWall = null;
  for (const e of state.units) {
    if (e.hp <= 0 || !isEnemyOf(u, e)) continue;
    const d = Math.abs(e.x - u.x) - (e.def.size + u.def.size) * .5;
    if (d <= effectiveRange(u) && d < best) { best = d; target = e; }
  }
  // 벽 (아군만 방해받음)
  if (u.team === 'player') {
    for (const w of state.walls) {
      if (w.hp <= 0) continue;
      const d = w.x - u.x - u.def.size * .5;
      if (d <= effectiveRange(u) && d < 60) { targetWall = w; break; }
    }
  }

  // 본부/균열 판정
  const baseX = u.team === 'player' ? ENEMY_BASE_X : PLAYER_BASE_X;
  const baseDist = Math.abs(baseX - u.x) - u.def.size * .5 - 40;
  const canHitBase = baseDist <= effectiveRange(u);

  if (target && u.atkCd <= 0) {
    u.atkCd = effectiveAtkInt(u);
    unitAttack(u, target);
  } else if (targetWall && u.atkCd <= 0) {
    u.atkCd = effectiveAtkInt(u);
    targetWall.hp -= effectiveAtk(u);
    burst(targetWall.x, GROUND - 30, '#c8a57a', 5);
    if (targetWall.hp <= 0) burst(targetWall.x, GROUND - 30, '#c8a57a', 20);
    floatText(targetWall.x, GROUND - 60, String(Math.round(effectiveAtk(u))), '#ffd54f');
  } else if (!target && !targetWall && canHitBase && u.atkCd <= 0) {
    u.atkCd = effectiveAtkInt(u);
    if (u.team === 'player') {
      state.riftHp -= effectiveAtk(u);
      state.shake = .15;
      burst(baseX, GROUND - 60, '#ffd54f', 7);
      floatText(baseX, GROUND - 90, String(Math.round(effectiveAtk(u))), '#ffd54f');
      if (state.riftHp <= 0) {
        state.riftHp = 0;
        if (state.objective.type !== 'boss') endGame(true);
      }
    } else {
      state.playerHp -= effectiveAtk(u);
      state.shake = .15;
      burst(baseX, GROUND - 60, '#ff8a65', 7);
      floatText(baseX, GROUND - 90, String(Math.round(effectiveAtk(u))), '#ff8a65');
      if (state.playerHp <= 0) { state.playerHp = 0; endGame(false); }
    }
  } else if (!target && !targetWall) {
    // 진격 (본부에 닿으면 정지)
    let nx = u.x + dir * effectiveSpeed(u) * dt;
    const limit = u.team === 'player'
      ? Math.min(ENEMY_BASE_X - 50, WORLD_RIGHT - u.def.size)
      : Math.max(PLAYER_BASE_X + 50, WORLD_LEFT + u.def.size);
    if (u.team === 'player') nx = Math.min(nx, limit);
    else nx = Math.max(nx, limit);
    // 아군은 바위벽에 막힘
    if (u.team === 'player') {
      for (const w of state.walls) {
        if (w.hp > 0 && nx > w.x - u.def.size * .5 - 4) { nx = Math.min(nx, w.x - u.def.size * .5 - 4); break; }
      }
    }
    u.x = nx;
  }
}

/* 유닛 공격 + 특수 능력 */
function unitAttack(u, target) {
  const ab = u.def.ability;
  const dir = u.team === 'player' ? 1 : -1;
  let dmg = effectiveAtk(u);
  let crit = false;

  if (u.team === 'player' && ab) {
    switch (ab.type) {
      case 'assassinate':
        if (Math.random() < ab.chance) { dmg *= ab.mult; crit = true; }
        break;
      case 'chargeKnock':
        applyDamage(target, dmg, { knock: dir * ab.power, color: '#ffe082' });
        burst(target.x, target.y, '#ffe082', 12);
        return;
      case 'meteor': { // 멀린: 별 강하 → 광역 + 화상
        telegraphX(target.x, 0.5, () => {
          burst(target.x, GROUND, '#b388ff', 24);
          for (const e of state.units) {
            if (isEnemyOf(u, e) && Math.abs(e.x - target.x) <= ab.splash) {
              applyDamage(e, dmg, { burn: { dps: ab.burn, dur: ab.burnDur }, color: '#b388ff' });
            }
          }
        });
        return;
      }
      case 'handOfGod': { // 아서왕: 신의 손
        telegraphX(target.x, 0.6, () => {
          state.shake = .4;
          burst(target.x, GROUND, '#ffd54f', 34);
          state.fx.push({ x: target.x, y: GROUND - 120, text: '🖐️', color: '#ffd54f', t: 1, icon: true, big: true });
          for (const e of state.units) {
            if (isEnemyOf(u, e) && Math.abs(e.x - target.x) <= ab.splash) {
              applyDamage(e, dmg * ab.mult, { stun: ab.stun, color: '#ffd54f' });
            }
          }
          if (state.riftHp > 0 && Math.abs(target.x - ENEMY_BASE_X) <= ab.splash && u.team === 'player') {
            // 균열은 별도
          }
        });
        return;
      }
    }
  }
  if (u.team === 'enemy' && ab) {
    switch (ab.type) {
      case 'burnHit':
        applyDamage(target, dmg, { burn: { dps: ab.dps, dur: ab.dur }, color: '#ff7043' });
        return;
      case 'waterPush':
        applyDamage(target, dmg, { knock: -ab.power, color: '#4fc3f7' });
        return;
      case 'chain': {
        applyDamage(target, dmg, { color: '#ffee58' });
        const others = state.units.filter(e => e.team === 'player' && e !== target && Math.abs(e.x - target.x) < 200)
          .slice(0, ab.jumps);
        for (const o of others) { applyDamage(o, ab.dmg, { color: '#ffee58' }); burst(o.x, o.y, '#ffee58', 6); }
        return;
      }
    }
  }

  applyDamage(target, dmg, {
    crit, color: crit ? '#ffd54f' : (u.team === 'player' ? '#ffe082' : '#ff8a65'),
    knock: crit ? dir * 90 : 0,
  });
}
function telegraphX(x, delay, onDone) { telegraph(x, 90, delay, '#ffd54f', onDone); }

/* ================= 겹침 방지 ================= */
function separate() {
  const arr = state.units;
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      const a = arr[i], b = arr[j];
      if (a.hp <= 0 || b.hp <= 0) continue;
      if (a.team === b.team) continue;
      if (!isEnemyOf(a, b)) continue;
      const min = (a.def.size + b.def.size) * .55;
      const d = b.x - a.x;
      if (Math.abs(d) < min && Math.abs(d) > 0.01) {
        const push = (min - Math.abs(d)) * .5 * Math.sign(d);
        a.x -= push; b.x += push;
        a.x = Math.max(WORLD_LEFT, Math.min(WORLD_RIGHT, a.x));
        b.x = Math.max(WORLD_LEFT, Math.min(WORLD_RIGHT, b.x));
      }
    }
  }
}

/* ================= 목표 판정 ================= */
function objectiveText() {
  const o = state.objective;
  const t = Math.max(0, Math.ceil((o.time || 0) - state.t));
  switch (o.type) {
    case 'survive': return `⏱ 방어까지 ${t}초 남음`;
    case 'destroy': return `🎯 균열 파괴  ${Math.round(state.riftHp / state.riftMaxHp * 100)}%`;
    case 'rescue': {
      let s = `🧑‍🌾 주민 구출 ${state.rescued}/${o.n}` + (state.lost ? `  ·  실종 ${state.lost}` : '');
      if (o.destroy) s += `  ·  균열 ${Math.round(state.riftHp / state.riftMaxHp * 100)}%`;
      return s;
    }
    case 'defend': {
      let s = `⏱ 방어 ${Math.min(state.t, o.time | 0)}/${o.time}초  ·  🧑‍🌾 ${state.rescued}/${o.rescue}`;
      if (state.lost) s += `  ·  실종 ${state.lost}`;
      return s;
    }
    case 'boss': {
      const b = state.boss;
      if (!b || b.hp <= 0) return '🎯 보스 격파!';
      return `⚔ 보스 처치  ${Math.round(b.hp / b.maxHp * 100)}%`;
    }
  }
  return '';
}
function checkObjective() {
  const o = state.objective;
  if (state.over) return;
  if (state.lost > (o.maxLost || 99)) { endGame(false); return; }
  switch (o.type) {
    case 'survive': if (state.t >= o.time) endGame(true); break;
    case 'destroy': if (state.riftHp <= 0) endGame(true); break;
    case 'rescue':
      if (state.rescued >= o.n && (!o.destroy || state.riftHp <= 0)) endGame(true);
      break;
    case 'defend':
      if (state.t >= o.time && state.rescued >= o.rescue) endGame(true);
      break;
    case 'boss':
      if (state.boss && state.boss.hp <= 0) endGame(true);
      break;
  }
  // 구출 가능 여부: 남은 주민 수가 목표 미달이면 패배
  if ((o.type === 'rescue' || o.type === 'defend') && !state.over) {
    const need = o.type === 'rescue' ? o.n : o.rescue;
    const remaining = (state.villagerTotal - state.villagerSpawned) +
      state.units.filter(u => u.team === 'civ' && u.hp > 0).length;
    if (state.rescued + remaining < need) endGame(false);
  }
}

function endGame(win) {
  if (state.over) return;
  state.over = win ? 'win' : 'lose';
  setTimeout(() => {
    if (win) {
      clearedSet.add(state.act.id);
      unlocked = Math.max(unlocked, Math.min(CHAPTER.acts.length, state.actIdx + 2));
      saveProgress();
      if (state.act.outro && state.act.outro.length) {
        playStory(state.act.outro, () => showResult(true));
      } else showResult(true);
    } else {
      showResult(false);
    }
  }, 900);
}

/* ================= 업데이트 루프 ================= */
function update(dt) {
  if (!state || state.over) return;
  state.t += dt;
  const b = state.act.battle;

  // 수입
  state.money += state.incomeRate * dt;

  // 웨이브
  while (state.waveIdx < b.waves.length && b.waves[state.waveIdx].at <= state.t) {
    const w = b.waves[state.waveIdx++];
    for (let i = 0; i < w.n; i++) {
      const delay = i * 450;
      setTimeout(() => {
        if (!state || state.over) return;
        spawnEnemy(w.unit, w.side === 'ally' ? { x: PLAYER_BASE_X + 130 } : { scale: w.scale || 1 });
      }, delay);
    }
  }
  // 지속 증원
  if (b.trickle && state.waveIdx >= b.waves.length) {
    state.trickleT -= dt;
    if (state.trickleT <= 0) {
      state.trickleT = b.trickle.every;
      spawnEnemy(b.trickle.unit, { scale: b.trickle.scale || 1 });
    }
  }

  // 주민 소환
  if (b.villagers && state.villagerSpawned < state.villagerTotal) {
    state.villagerT -= dt;
    if (state.villagerT <= 0) {
      state.villagerT = b.villagers.every;
      const alive = state.units.filter(u => u.team === 'civ' && u.hp > 0).length;
      if (alive < 3) { spawnVillager(); state.villagerSpawned++; }
    }
  }

  // 보스 등장
  if (state.bossPending !== null && state.t >= state.bossPending) {
    state.bossPending = null;
    const def = BOSSES[b.boss];
    const boss = spawnUnit('enemy', def, { boss: true, x: ENEMY_BASE_X - 70 });
    boss.y = GROUND - def.size;
    state.shake = .6;
    floatText(boss.x, boss.y - def.size - 50, def.name + ' 등장!', '#ff8a65');
    burst(boss.x, boss.y, '#ff7043', 40);
    $('bossBar').classList.remove('hidden');
  }

  // 위험 지형
  if (state.hazard) {
    state.hazardT -= dt;
    if (state.hazardT <= 0) {
      state.hazardT = state.hazard.interval;
      if (state.hazard.type === 'fire') {
        const x = 240 + Math.random() * (W - 540);
        state.fireZones.push({ x, w: 160, t: 8 });
      } else if (state.hazard.type === 'storm') {
        const players = state.units.filter(u => u.team === 'player' && u.hp > 0);
        if (players.length) {
          const p = players[Math.floor(Math.random() * players.length)];
          telegraph(p.x, 70, 1, '#ffee58', () => {
            burst(p.x, p.y, '#ffee58', 18);
            applyDamage(p, 600, { stun: .6, color: '#ffee58' });
          });
        }
      }
    }
  }

  // 화염 지대: 아군 피해
  for (const f of state.fireZones) {
    f.t -= dt;
    for (const u of state.units) {
      if (u.team === 'player' && Math.abs(u.x - f.x) < f.w / 2) {
        u.hp -= 50 * dt;
        if (Math.random() < dt * 4) burst(u.x, u.y, '#ff7043', 1);
        if (u.hp <= 0) { u.hp = 0; burst(u.x, u.y, '#ef5350', 12); }
      }
    }
  }
  state.fireZones = state.fireZones.filter(f => f.t > 0);

  // 벽 감쇠
  for (const w of state.walls) w.t -= dt;
  state.walls = state.walls.filter(w => w.hp > 0 && w.t > 0);

  // 쿨다운
  for (const k in state.cds) state.cds[k] = Math.max(0, state.cds[k] - dt);
  for (const k in state.skillCds) state.skillCds[k] = Math.max(0, state.skillCds[k] - dt);

  // 유닛
  if (state.boss && state.boss.hp > 0) updateBoss(state.boss, dt);
  for (const u of state.units) updateUnit(u, dt);
  separate();
  state.units = state.units.filter(u => u.hp > 0);

  // 텔레그라프
  for (const t of state.tele) {
    t.t += dt;
    if (t.t >= t.delay && !t.fired) { t.fired = true; t.onDone && t.onDone(); }
  }
  state.tele = state.tele.filter(t => t.t < t.delay + .1);

  // 파티클 / 플로팅 텍스트
  for (const p of state.particles) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 520 * dt; }
  state.particles = state.particles.filter(p => p.life > 0);
  for (const f of state.fx) f.t -= dt;
  state.fx = state.fx.filter(f => f.t > 0);
  state.shake = Math.max(0, state.shake - dt);

  $('objectiveText').textContent = objectiveText();
  checkObjective();
}

/* ================================================================
   렌더링
   ================================================================ */
const THEMES = {
  plains:  { sky: ['#8ed6ff', '#e3f6ff'], hill: '#a5d6a7', ground: '#7cb342', path: '#d7c89b' },
  ruins:   { sky: ['#9e9e9e', '#d7ccc8'], hill: '#8d8178', ground: '#7d7267', path: '#b0a597' },
  aqua:    { sky: ['#81d4fa', '#e0f7fa'], hill: '#80cbc4', ground: '#4db6ac', path: '#b2dfdb' },
  flood:   { sky: ['#4dd0e1', '#b2ebf2'], hill: '#4db6ac', ground: '#26a69a', path: '#80cbc4' },
  burn:    { sky: ['#4e342e', '#ff8a65'], hill: '#5d4037', ground: '#4e342e', path: '#6d4c41' },
  storm:   { sky: ['#1a1a2e', '#4a4a6a'], hill: '#2c2c44', ground: '#232338', path: '#3a3a55' },
  rift:    { sky: ['#12061f', '#3d1b5e'], hill: '#2a1145', ground: '#1d0c33', path: '#35195c' },
};

function drawBackground() {
  const theme = THEMES[state ? state.act.battle.theme : 'plains'] || THEMES.plains;
  const t = state ? state.t : 0;
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, theme.sky[0]); g.addColorStop(1, theme.sky[1]);
  ctx.fillStyle = g; ctx.fillRect(-10, -10, W + 20, H + 20);

  // 구름/배경 장식
  ctx.fillStyle = 'rgba(255,255,255,.7)';
  if (theme === THEMES.plains || theme === THEMES.aqua) {
    for (let i = 0; i < 4; i++) {
      const cx = ((i * 330 + t * 8) % (W + 200)) - 100, cy = 46 + (i % 2) * 42;
      ctx.beginPath();
      ctx.arc(cx, cy, 22, 0, 7); ctx.arc(cx + 24, cy + 6, 17, 0, 7); ctx.arc(cx - 24, cy + 7, 16, 0, 7);
      ctx.fill();
    }
  }
  if (state && (state.act.battle.theme === 'burn')) {
    // 불티
    for (let i = 0; i < 14; i++) {
      const x = (i * 97 + Math.sin(t * 2 + i) * 40 + t * 30) % W;
      const y = (H - ((i * 53 + t * 60) % H));
      ctx.fillStyle = `rgba(255,${120 + i * 8},60,.7)`;
      ctx.beginPath(); ctx.arc(x, y, 2 + (i % 3), 0, 7); ctx.fill();
    }
  }
  if (state && state.act.battle.theme === 'storm') {
    ctx.strokeStyle = 'rgba(160,170,255,.35)'; ctx.lineWidth = 1;
    for (let i = 0; i < 30; i++) {
      const x = (i * 61 + t * 320) % (W + 100) - 50;
      const y = (i * 97 + t * 560) % H;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 8, y + 22); ctx.stroke();
    }
    if (Math.sin(t * 1.7) > .985) { ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(-10, -10, W + 20, H + 20); }
  }
  if (state && state.act.battle.theme === 'rift') {
    for (let i = 0; i < 12; i++) {
      const x = (i * 113 + Math.sin(t + i) * 30) % W;
      const y = 40 + (i * 67) % (GROUND - 80);
      ctx.fillStyle = `rgba(179,136,255,${.25 + .15 * Math.sin(t * 3 + i)})`;
      ctx.beginPath(); ctx.arc(x, y, 3 + (i % 4), 0, 7); ctx.fill();
    }
  }

  // 언덕
  ctx.fillStyle = theme.hill;
  ctx.beginPath();
  ctx.ellipse(W * .3, GROUND + 12, 340, 88, 0, Math.PI, 0);
  ctx.ellipse(W * .75, GROUND + 22, 300, 78, 0, Math.PI, 0);
  ctx.fill();

  // 지면 + 길
  ctx.fillStyle = theme.ground; ctx.fillRect(-10, GROUND, W + 20, H - GROUND + 10);
  ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.fillRect(-10, GROUND, W + 20, 7);
  ctx.fillStyle = theme.path;
  ctx.fillRect(PLAYER_BASE_X - 40, GROUND + 24, ENEMY_BASE_X - PLAYER_BASE_X + 80, 28);

  // 침수
  if (state && state.flood > 0) {
    const lvl = GROUND + 30 - state.flood * 46;
    ctx.fillStyle = 'rgba(79,195,247,.45)';
    ctx.fillRect(-10, lvl, W + 20, H - lvl + 10);
    ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = -10; x <= W + 10; x += 10) ctx.lineTo(x, lvl + Math.sin(x * .05 + t * 3) * 3);
    ctx.stroke();
  }
}

function drawCastle(x) {
  ctx.save(); ctx.translate(x, GROUND);
  ctx.fillStyle = '#eceff1'; ctx.strokeStyle = '#546e7a'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.rect(-38, -118, 76, 118); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#37474f';
  ctx.beginPath(); ctx.rect(-14, -46, 28, 46); ctx.fill();
  // 첨탑
  ctx.fillStyle = '#cfd8dc';
  for (const tx of [-38, -8, 22]) { ctx.beginPath(); ctx.rect(tx, -140, 16, 24); ctx.fill(); ctx.stroke(); }
  ctx.fillStyle = '#e53935';
  ctx.beginPath(); ctx.moveTo(-4, -140); ctx.lineTo(-4, -168); ctx.lineTo(26, -152); ctx.closePath(); ctx.fill();
  // 문장
  ctx.fillStyle = '#ffd54f'; ctx.beginPath(); ctx.arc(0, -80, 13, 0, 7); ctx.fill();
  ctx.fillStyle = '#37474f'; ctx.font = 'bold 14px serif'; ctx.textAlign = 'center'; ctx.fillText('⚜', 0, -75);
  ctx.restore();
}
function drawRift(x) {
  const t = state ? state.t : 0;
  ctx.save(); ctx.translate(x, GROUND - 60);
  // 균열 발광
  const glow = ctx.createRadialGradient(0, 0, 6, 0, 0, 90);
  glow.addColorStop(0, 'rgba(179,136,255,.9)');
  glow.addColorStop(.5, 'rgba(120,60,220,.5)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(0, 0, 90, 0, 7); ctx.fill();
  // 찢긴 틈
  ctx.strokeStyle = '#e1bee7'; ctx.lineWidth = 4;
  ctx.beginPath();
  for (let i = 0; i <= 12; i++) {
    const a = -Math.PI / 2 + (i / 12) * Math.PI;
    const r = 46 + Math.sin(t * 3 + i * 2.1) * 7;
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r * 1.5);
  }
  ctx.closePath();
  ctx.fillStyle = '#1a0b2e'; ctx.fill(); ctx.stroke();
  ctx.restore();
  // 바닥 균열선
  ctx.strokeStyle = 'rgba(179,136,255,.7)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x - 60, GROUND + 6);
  for (let i = 0; i < 6; i++) ctx.lineTo(x - 60 + i * 24, GROUND + 6 + ((i % 2) ? 8 : -4));
  ctx.stroke();
}

function drawWall(w) {
  const h = 74;
  ctx.fillStyle = '#6d5b4a'; ctx.strokeStyle = '#3e2b1f'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(w.x - 30, GROUND); ctx.lineTo(w.x - 24, GROUND - h);
  ctx.lineTo(w.x + 24, GROUND - h); ctx.lineTo(w.x + 30, GROUND); ctx.closePath();
  ctx.fill(); ctx.stroke();
  // hp
  ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(w.x - 26, GROUND - h - 12, 52, 6);
  ctx.fillStyle = '#c8a57a'; ctx.fillRect(w.x - 26, GROUND - h - 12, 52 * Math.max(0, w.hp / w.maxHp), 6);
}

function drawUnit(u) {
  const s = u.def.size;
  const bounce = Math.sin(u.wob) * 2;
  ctx.save();
  ctx.translate(u.x, u.y + bounce);
  if (u.team === 'enemy' || u.team === 'civ') { /* 방향 표시는 눈으로 */ }

  // 그림자
  ctx.fillStyle = 'rgba(0,0,0,.25)';
  ctx.beginPath(); ctx.ellipse(0, s + 4 - bounce, s * .9, 5, 0, 0, 7); ctx.fill();

  // 원소 링
  const elem = u.def.element;
  if (elem && ELEMENT_COLORS[elem]) {
    ctx.strokeStyle = ELEMENT_COLORS[elem];
    ctx.lineWidth = u.isBoss ? 5 : 2.5;
    ctx.beginPath(); ctx.arc(0, 0, s + 3, 0, 7); ctx.stroke();
  }

  // 몸통
  const teamFill = u.hitFlash > 0 ? '#ffffff'
    : u.team === 'player' ? '#fff8e1'
    : u.team === 'civ' ? '#dcedc8' : '#7e57c2';
  ctx.fillStyle = teamFill;
  ctx.strokeStyle = u.team === 'player' ? '#5d4037' : u.team === 'civ' ? '#33691e' : '#311b92';
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(0, 0, s, 0, 7); ctx.fill(); ctx.stroke();

  // 이미지 또는 이모지
  const folder = u.isBoss ? 'bosses' : 'units';
  const img = getImage(`assets/${folder}/${u.def.id}.png`);
  const drewImg = tryDraw(img, 0, 0, s - 1);
  if (!drewImg) {
    ctx.font = `${Math.floor(s * 1.1)}px serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(u.def.icon, 0, 1);
  }

  // 상태 표시
  if (u.stun > 0) { ctx.font = `${Math.floor(s * .8)}px serif`; ctx.fillText('💫', 0, -s - 8); }
  if (u.burn) { ctx.font = `${Math.floor(s * .7)}px serif`; ctx.fillText('🔥', s * .7, -s - 4); }

  // 체력바
  const bw = Math.max(30, s * 1.9);
  const ratio = Math.max(0, u.hp / u.maxHp);
  ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(-bw / 2, -s - 5, bw, 5);
  ctx.fillStyle = u.team === 'player' ? '#4fc3f7' : u.team === 'civ' ? '#aed581' : '#ff7043';
  ctx.fillRect(-bw / 2, -s - 5, bw * ratio, 5);

  ctx.restore();
}

function drawEffects() {
  // 텔레그라프
  for (const t of state.tele) {
    const p = Math.min(1, t.t / t.delay);
    ctx.strokeStyle = t.color; ctx.lineWidth = 3;
    ctx.globalAlpha = .4 + .6 * Math.sin(t.t * 14) ** 2;
    ctx.beginPath(); ctx.arc(t.x, GROUND, t.r, Math.PI, 0); ctx.stroke();
    ctx.globalAlpha = .15; ctx.fillStyle = t.color;
    ctx.beginPath(); ctx.arc(t.x, GROUND, t.r * p, Math.PI, 0); ctx.fill();
    ctx.globalAlpha = 1;
  }
  // 화염 지대
  for (const f of state.fireZones) {
    const a = Math.min(1, f.t / 2);
    ctx.fillStyle = `rgba(255,87,34,${.3 * a})`;
    ctx.fillRect(f.x - f.w / 2, GROUND - 8, f.w, 60);
    for (let i = 0; i < 5; i++) {
      const fx = f.x - f.w / 2 + (i + .5) * (f.w / 5);
      const fh = 22 + Math.sin(state.t * 8 + i) * 8;
      ctx.fillStyle = `rgba(255,160,60,${.75 * a})`;
      ctx.beginPath();
      ctx.moveTo(fx - 9, GROUND);
      ctx.quadraticCurveTo(fx, GROUND - fh, fx + 9, GROUND);
      ctx.fill();
    }
  }
  // 파티클
  for (const p of state.particles) {
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 2));
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
  }
  ctx.globalAlpha = 1;
  // 플로팅 텍스트
  ctx.textAlign = 'center';
  for (const f of state.fx) {
    ctx.globalAlpha = Math.max(0, f.t);
    if (f.icon) {
      ctx.font = (f.big ? '72px' : '34px') + ' serif';
      ctx.fillText(f.text, f.x, f.y - (1 - f.t) * 40);
    } else {
      ctx.font = 'bold 16px sans-serif';
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y - (1 - f.t) * 36);
    }
  }
  ctx.globalAlpha = 1;
}

function render() {
  ctx.save();
  if (state && state.shake > 0) {
    ctx.translate((Math.random() - .5) * 8, (Math.random() - .5) * 8);
  }
  drawBackground();
  if (state) {
    drawCastle(PLAYER_BASE_X);
    drawRift(ENEMY_BASE_X);
    for (const w of state.walls) drawWall(w);
    const sorted = [...state.units].sort((a, b) => a.def.size - b.def.size);
    for (const u of sorted) drawUnit(u);
    drawEffects();
  }
  ctx.restore();
}

/* ================================================================
   UI : 유닛 바 / 스킬 바 / HP
   ================================================================ */
const unitBar = $('unitBar'), skillBar = $('skillBar');

function buildUnitBar() {
  unitBar.innerHTML = '';
  PLAYER_UNITS.forEach((u, i) => {
    const b = document.createElement('button');
    b.className = 'unit-btn' + (u.main ? ' main' : '');
    b.dataset.id = u.id;
    b.innerHTML = `<span class="ukey">${i + 1}</span><span class="icon">${u.icon}</span>` +
      `<span class="uname">${u.name}</span><span class="ucost">✦${u.cost}</span><div class="cool"></div>`;
    b.title = u.desc;
    b.addEventListener('click', () => buyUnit(u.id));
    unitBar.appendChild(b);
  });
}
function buildSkillBar() {
  skillBar.innerHTML = '';
  ULTIMATES.forEach((s, i) => {
    const b = document.createElement('button');
    b.className = 'skill-btn';
    b.dataset.id = s.id;
    b.innerHTML = `<span class="skey">${i === 0 ? 'Q' : 'W'}</span>` +
      `<span class="sicon">${s.icon}</span>` +
      `<span class="sinfo"><span class="sname">${s.name}</span><span class="sdesc">${s.desc}</span></span>` +
      `<div class="cool"></div>`;
    b.addEventListener('click', () => useSkill(s.id));
    skillBar.appendChild(b);
  });
}

function buyUnit(id) {
  if (!state || state.over || mode !== 'battle') return;
  const def = PLAYER_UNITS.find(u => u.id === id);
  if (!def || (state.cds[id] || 0) > 0) return;
  if (state.money < def.cost) { flashWallet(); return; }
  state.money -= def.cost;
  state.cds[id] = def.cd;
  spawnPlayer(id);
}

function useSkill(id) {
  if (!state || state.over || mode !== 'battle') return;
  const sk = ULTIMATES.find(s => s.id === id);
  if (!sk || state.skillCds[id] > 0) return;
  const casterAlive = state.units.some(u => u.team === 'player' && u.def.id === sk.unit && u.hp > 0);
  if (!casterAlive) return;

  if (id === 'excalibur') {
    state.shake = .6;
    for (const e of state.units) {
      if (e.team === 'enemy' || e.team === 'boss') {
        applyDamage(e, 9000, { knock: 200, color: '#ffd54f' });
      }
    }
    for (let i = 0; i < 5; i++) {
      state.fx.push({ x: 200 + i * 200, y: GROUND - 130, text: '⚔', color: '#ffd54f', t: 1.2, icon: true, big: true });
    }
    burst(W / 2, GROUND - 60, '#ffd54f', 60);
    floatText(W / 2, 120, '엑스칼리버!', '#ffd54f');
  } else if (id === 'meteorCall') {
    const enemies = state.units.filter(e => e.team === 'enemy' || e.team === 'boss');
    const spots = enemies.length
      ? enemies.map(e => e.x)
      : [ENEMY_BASE_X - 150, ENEMY_BASE_X - 300];
    for (const x of spots.slice(0, 10)) {
      telegraph(x, 95, .7, '#b388ff', () => {
        burst(x, GROUND, '#b388ff', 26);
        for (const e of state.units) {
          if ((e.team === 'enemy') && Math.abs(e.x - x) < 110) {
            applyDamage(e, 5000, { burn: { dps: 60, dur: 4 }, color: '#b388ff' });
          }
        }
      });
    }
    floatText(W / 2, 120, '대운석 낙하!', '#b388ff');
  }
  state.skillCds[id] = sk.cd;
}

function flashWallet() {
  const w = $('wallet');
  w.style.color = '#ff5252';
  setTimeout(() => (w.style.color = ''), 300);
}
function upgradeIncome() {
  if (!state || state.over || mode !== 'battle') return;
  if (state.money < state.incomeCost) { flashWallet(); return; }
  state.money -= state.incomeCost;
  state.incomeLv++;
  state.incomeRate += 8;
  state.incomeCost = Math.round(state.incomeCost * 1.55);
}

function updateUI() {
  if (!state) return;
  $('money').textContent = Math.floor(state.money);
  $('upgradeCost').textContent = `✦${state.incomeCost} (+8/s)`;
  $('playerHp').style.width = (state.playerHp / state.playerMaxHp * 100) + '%';
  $('playerHpText').textContent = `${Math.ceil(state.playerHp)}/${state.playerMaxHp}`;
  $('enemyHp').style.width = Math.max(0, state.riftHp / state.riftMaxHp * 100) + '%';
  $('enemyHpText').textContent = `${Math.ceil(state.riftHp)}/${state.riftMaxHp}`;
  $('actKind').textContent = state.act.kind;
  $('actTitle').textContent = state.act.title;
  const t = Math.floor(state.t);
  $('timer').textContent = `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;

  // 보스 바
  const boss = state.boss;
  if (boss && boss.hp > 0 && state.bossPending === null) {
    $('bossBar').classList.remove('hidden');
    $('bossIcon').textContent = boss.def.icon;
    $('bossName').textContent = boss.def.name;
    const ph = state.bossDef.phases[state.bossPhase];
    $('bossPhase').textContent = 'PHASE — ' + ph.name;
    $('bossHp').style.width = (boss.hp / boss.maxHp * 100) + '%';
    $('bossHpText').textContent = `${Math.ceil(boss.hp)}/${Math.ceil(boss.maxHp)}`;
  } else if (state.bossPending === null) {
    $('bossBar').classList.add('hidden');
  }

  for (const b of unitBar.children) {
    const def = PLAYER_UNITS.find(u => u.id === b.dataset.id);
    const cd = state.cds[def.id] || 0;
    b.classList.toggle('cooling', cd > 0);
    b.classList.toggle('locked', cd <= 0 && state.money < def.cost);
    if (cd > 0) b.querySelector('.cool').textContent = cd.toFixed(1);
  }
  for (const b of skillBar.children) {
    const id = b.dataset.id;
    const sk = ULTIMATES.find(s => s.id === id);
    const cd = state.skillCds[id] || 0;
    const casterAlive = state.units.some(u => u.team === 'player' && u.def.id === sk.unit && u.hp > 0);
    b.classList.toggle('cooling', cd > 0);
    b.classList.toggle('locked', cd <= 0 && !casterAlive);
    if (cd > 0) b.querySelector('.cool').textContent = Math.ceil(cd);
  }
}

/* ================================================================
   스토리 컷신
   ================================================================ */
function playStory(lines, onDone) {
  mode = 'story';
  storyQueue = lines.slice();
  storyDone = onDone;
  storyOverlay.classList.add('show');
  nextStoryLine();
}
function nextStoryLine() {
  clearTimeout(typeTimer);
  if (!storyQueue.length) {
    storyOverlay.classList.remove('show');
    mode = state ? 'battle' : 'map';
    const cb = storyDone; storyDone = null;
    if (cb) cb();
    return;
  }
  const line = storyQueue.shift();
  storySpeaker.className = '';
  storyText.className = '';

  // 장면
  let char = '📜';
  if (line.who) char = PORTRAIT_FALLBACK[line.who] || '📜';
  else if (line.boss) char = BOSSES[line.boss].icon;
  else if (line.narr) char = '🏰';
  if (line.black) char = '🖤';
  if (line.clear) char = '🏆';
  const img = line.who ? getImage(`assets/portraits/${line.who}.png`) : null;
  storyScene.innerHTML = img && img.complete && img.naturalWidth
    ? `<img src="${img.src}" style="height:80%;border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,.6)">`
    : `<div class="big-char">${char}</div>`;

  // 텍스트
  let speaker = '', text = '';
  if (line.narr) { speaker = '내레이션'; text = line.narr; }
  else if (line.who) { speaker = SPEAKERS[line.who] || line.who; text = line.text || ''; }
  else if (line.objective) {
    speaker = '— OBJECTIVE —'; storySpeaker.className = 'objective';
    text = line.objective; storyText.className = 'objective';
  } else if (line.boss) { speaker = '⚠ 경보'; text = line.name; }
  else if (line.black) { speaker = ''; text = line.black; storyScene.style.filter = 'brightness(.15)'; }
  else if (line.clear) { speaker = ''; text = line.clear; storyText.className = 'clear'; }
  if (!line.black) storyScene.style.filter = '';

  storySpeaker.textContent = speaker;
  storyText.textContent = '';
  // 타이핑 효과
  let i = 0;
  const type = () => {
    storyText.textContent = text.slice(0, ++i);
    if (i < text.length) typeTimer = setTimeout(type, 18);
  };
  storyText.dataset.full = text;
  type();
}
function advanceStory() {
  // 타이핑 중이면 완성
  if (storyText.textContent.length < (storyText.dataset.full || '').length) {
    clearTimeout(typeTimer);
    storyText.textContent = storyText.dataset.full;
    return;
  }
  nextStoryLine();
}
storyOverlay.addEventListener('click', e => {
  if (e.target.id === 'storySkip') return;
  advanceStory();
});
$('storySkip').addEventListener('click', () => {
  clearTimeout(typeTimer);
  storyQueue = [];
  nextStoryLine();
});

/* ================================================================
   캠페인 맵 / 결과
   ================================================================ */
function showMap() {
  mode = 'map';
  state = null;
  $('bossBar').classList.add('hidden');
  overlay.classList.add('show');
  storyOverlay.classList.remove('show');
  ovTitle.textContent = '냥코대전쟁';
  ovSub.textContent = `${CHAPTER.title} — ${CHAPTER.subtitle}`;
  ovDesc.textContent = '퓨어월드에 처음 발생한 균열과 원소 세력의 침공을 막아라. 최종적으로 원소포식자 아르카논을 격파하고 퓨어월드를 지킨다.';
  buildActList();
  ovBtns.innerHTML = '';
}
function buildActList() {
  actList.innerHTML = '';
  CHAPTER.acts.forEach((a, i) => {
    const row = document.createElement('button');
    const isBoss = a.kind.includes('BOSS');
    row.className = 'act-row' + (isBoss ? ' boss' : '') + (clearedSet.has(a.id) ? ' cleared' : '');
    const locked = i + 1 > unlocked;
    row.disabled = locked;
    row.innerHTML = `<span class="kind">${a.kind}</span><span class="title">${a.title}</span>` +
      `<span class="mark">${locked ? '🔒' : clearedSet.has(a.id) ? '✅' : '▶'}</span>`;
    row.addEventListener('click', () => startAct(i));
    actList.appendChild(row);
  });
}

function startAct(idx) {
  currentAct = idx;
  const act = CHAPTER.acts[idx];
  overlay.classList.remove('show');
  state = null;
  $('bossBar').classList.add('hidden');

  const beginBattle = () => {
    if (act.noBattle) {
      // 엔딩 액트: 스토리 종료 후 맵
      clearedSet.add(act.id);
      unlocked = Math.max(unlocked, Math.min(CHAPTER.acts.length, idx + 2));
      saveProgress();
      showMap();
      return;
    }
    state = newBattle(idx);
    mode = 'battle';
    paused = false; speed = 1;
    $('pauseBtn').textContent = '일시정지';
    $('speedBtn').textContent = '×1';
    $('objectiveText').textContent = objectiveText();
    if (rafId === null) { lastTs = performance.now(); loop(lastTs); }
  };

  if (act.intro && act.intro.length) playStory(act.intro, beginBattle);
  else beginBattle();
}

function showResult(win) {
  mode = 'map';
  overlay.classList.add('show');
  const act = CHAPTER.acts[currentAct];
  const isFinal = win && currentAct >= CHAPTER.acts.length - 1;
  ovTitle.textContent = isFinal ? 'CHAPTER 1 CLEAR' : win ? '임무 완료!' : '임무 실패...';
  ovSub.textContent = `${act.kind} — ${act.title}`;
  ovDesc.textContent = win
    ? (isFinal ? '아르카논 격파. 아서왕과 일부 왕국군은 균열 안으로 사라졌다. 퓨어월드의 균열은 아직 끝나지 않았다.'
               : '다음 액트가 열렸습니다. 캠페인 맵에서 계속 진행하세요.')
    : '전선이 무너졌다. 유닛 조합과 워커 강화 타이밍을 다시 생각해보세요.';
  buildActList();
  ovBtns.innerHTML = '';
  const retry = document.createElement('button');
  retry.className = 'big alt';
  retry.textContent = '다시 도전';
  retry.addEventListener('click', () => startAct(currentAct));
  ovBtns.appendChild(retry);
  if (win && currentAct + 1 < CHAPTER.acts.length) {
    const next = document.createElement('button');
    next.className = 'big';
    next.textContent = '다음 액트 ▶';
    next.addEventListener('click', () => startAct(currentAct + 1));
    ovBtns.appendChild(next);
  }
}

/* ================================================================
   루프 / 입력
   ================================================================ */
function loop(ts) {
  const dt = Math.min(.05, (ts - lastTs) / 1000);
  lastTs = ts;
  if (mode === 'battle' && state && !paused && !state.over) {
    for (let i = 0; i < speed; i++) update(dt);
  }
  if (mode === 'battle' && state) { render(); updateUI(); }
  else if (state) { render(); }
  rafId = requestAnimationFrame(loop);
}

document.addEventListener('keydown', e => {
  if (e.repeat) return;
  if (mode === 'story') {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); advanceStory(); }
    return;
  }
  if (mode !== 'battle') return;
  const n = Number(e.key);
  if (n >= 1 && n <= PLAYER_UNITS.length) buyUnit(PLAYER_UNITS[n - 1].id);
  else if (e.key === 'q' || e.key === 'Q') useSkill('excalibur');
  else if (e.key === 'w' || e.key === 'W') useSkill('meteorCall');
  else if (e.key === 'u' || e.key === 'U') upgradeIncome();
  else if (e.key === ' ') { e.preventDefault(); togglePause(); }
  else if (e.key === 'f' || e.key === 'F') toggleSpeed();
});

function togglePause() {
  if (!state || state.over) return;
  paused = !paused;
  $('pauseBtn').textContent = paused ? '재개' : '일시정지';
}
function toggleSpeed() {
  speed = speed === 1 ? 2 : 1;
  $('speedBtn').textContent = '×' + speed;
}
$('upgradeBtn').addEventListener('click', upgradeIncome);
$('pauseBtn').addEventListener('click', togglePause);
$('speedBtn').addEventListener('click', toggleSpeed);
$('menuBtn').addEventListener('click', () => { if (mode === 'battle') showMap(); });

/* ================= 시작 ================= */
buildUnitBar();
buildSkillBar();
showMap();
render();
