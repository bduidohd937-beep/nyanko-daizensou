'use strict';

/* ================================================================
   냥코대전쟁 사운드 시스템 (외부 오디오 파일 없음 — 전부 합성)
   - BGM: 코드 시퀀서 (스케일/화음 기반 생성, 트랙별 템포·스타일)
   - SFX: 오실레이저 + 노이즈 합성
   - 브라우저 자동재생 정책: 첫 제스처에서 AudioContext 재개
   ================================================================ */
const Sound = (() => {
  let ac = null, master, musicBus, sfxBus;
  let noiseBuf = null;
  let wantTrack = null;          // 재생 요청된 트랙
  let seqTimer = null, nextStepTime = 0, step = 0, leadIdx = 0, leadDir = 1;
  let bgmOn = localStorage.getItem('nyanko_bgm') !== '0';
  let sfxOn = localStorage.getItem('nyanko_sfx') !== '0';
  const lastSfxAt = {};

  /* ---------------- 초기화 ---------------- */
  function ensure() {
    if (ac) return ac;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ac = new AC(); } catch (e) { return null; }
    master = ac.createGain(); master.gain.value = 0.9; master.connect(ac.destination);
    musicBus = ac.createGain(); musicBus.gain.value = bgmOn ? 0.32 : 0; musicBus.connect(master);
    sfxBus = ac.createGain(); sfxBus.gain.value = sfxOn ? 0.55 : 0; sfxBus.connect(master);
    // 공통 노이즈 버퍼 (1초)
    const len = Math.ceil(ac.sampleRate);
    noiseBuf = ac.createBuffer(1, len, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return ac;
  }
  function resume() {
    const c = ensure();
    if (!c) return Promise.resolve(null);
    if (c.state === 'suspended') return c.resume().then(() => c).catch(() => c);
    return Promise.resolve(c);
  }
  // 첫 상호작용에서 오디오 시작
  const kick = () => { resume().then(() => { if (wantTrack && !seqTimer) startSeq(wantTrack); }); };
  window.addEventListener('pointerdown', kick, { once: false });
  window.addEventListener('keydown', kick, { once: false });

  const f = n => 440 * Math.pow(2, (n - 69) / 12);

  /* ---------------- 기본 합성기 ---------------- */
  function tone(freq, t, dur, type, vol, bus, slideTo) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + Math.min(0.02, dur * 0.2));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bus);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(t, dur, vol, type, f0, f1, bus) {
    const src = ac.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    const flt = ac.createBiquadFilter();
    flt.type = type;
    flt.frequency.setValueAtTime(f0, t);
    if (f1) flt.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
    const g = ac.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(flt); flt.connect(g); g.connect(bus || sfxBus);
    src.start(t); src.stop(t + dur + 0.05);
  }

  /* ---------------- 효과음 라이브러리 ---------------- */
  const SFX = {
    click(t)   { tone(660, t, .06, 'square', .12, sfxBus); tone(990, t + .03, .05, 'square', .08, sfxBus); },
    error(t)   { tone(180, t, .18, 'sawtooth', .16, sfxBus, 120); },
    tick(t)    { tone(900, t, .03, 'sine', .1, sfxBus); },
    buy(t)     { tone(523, t, .1, 'sine', .16, sfxBus); tone(784, t + .07, .14, 'sine', .14, sfxBus); },
    upgrade(t) { [523, 659, 784, 1047].forEach((n, i) => tone(n, t + i * .05, .16, 'triangle', .13, sfxBus)); },
    summon(t)  { noise(t, .22, .14, 'bandpass', 400, 2200, sfxBus); tone(392, t, .18, 'triangle', .1, sfxBus, 784); },
    hit(t)     { noise(t, .07, .16, 'lowpass', 1400, 300, sfxBus); tone(170, t, .09, 'sine', .16, sfxBus, 70); },
    crit(t)    { noise(t, .08, .2, 'lowpass', 2400, 500, sfxBus); tone(1400, t, .1, 'square', .1, sfxBus, 400); },
    shot(t)    { noise(t, .05, .09, 'highpass', 2500, 4000, sfxBus); },
    boom(t)    { noise(t, .5, .5, 'lowpass', 500, 60, sfxBus); tone(95, t, .45, 'sine', .3, sfxBus, 38); },
    rumble(t)  { noise(t, .7, .32, 'lowpass', 320, 45, sfxBus); tone(60, t, .6, 'sine', .26, sfxBus, 30); },
    zap(t)     { noise(t, .14, .22, 'highpass', 3200, 6000, sfxBus); tone(2400, t, .13, 'square', .1, sfxBus, 300); },
    fire(t)    { noise(t, .4, .16, 'lowpass', 900, 350, sfxBus); noise(t + .08, .3, .1, 'bandpass', 1600, 900, sfxBus); },
    splash(t)  { noise(t, .3, .18, 'lowpass', 1600, 350, sfxBus); tone(300, t, .2, 'sine', .1, sfxBus, 140); },
    heal(t)    { [660, 880, 1100].forEach((n, i) => tone(n, t + i * .06, .2, 'sine', .1, sfxBus)); },
    whoosh(t)  { noise(t, .3, .16, 'bandpass', 300, 1800, sfxBus); },
    phase(t)   { tone(220, t, .5, 'sawtooth', .14, sfxBus, 440); [220, 277, 330].forEach(n => tone(n, t + .1, .4, 'square', .07, sfxBus)); },
    boss(t)    { tone(130, t, .9, 'sawtooth', .24, sfxBus, 48); noise(t, .8, .2, 'lowpass', 400, 60, sfxBus); },
    summonBig(t){ [110, 165, 220].forEach((n, i) => tone(n, t + i * .04, .5, 'sawtooth', .1, sfxBus)); noise(t, .4, .16, 'bandpass', 300, 1400, sfxBus); },
    rescue(t)  { [784, 988, 1175].forEach((n, i) => tone(n, t + i * .07, .22, 'sine', .12, sfxBus)); },
    lost(t)    { tone(392, t, .3, 'triangle', .13, sfxBus, 311); tone(196, t + .1, .4, 'sine', .12, sfxBus, 155); },
    skill(t)   { noise(t, .35, .2, 'bandpass', 500, 3000, sfxBus); [440, 554, 659, 880].forEach((n, i) => tone(n, t + .1 + i * .04, .4, 'triangle', .11, sfxBus)); },
    win(t)     { [69, 72, 76, 81, 88].forEach((n, i) => tone(f(n), t + i * .13, .3, 'triangle', .15, sfxBus)); [57, 64, 69].forEach(n => tone(f(n), t + .65, 1.1, 'sine', .1, sfxBus)); },
    lose(t)    { [57, 55, 53, 52, 45].forEach((n, i) => tone(f(n), t + i * .24, .5, 'triangle', .13, sfxBus)); },
  };

  const THROTTLE = { hit: .07, crit: .1, tick: .06, click: .05, shot: .06 };

  function sfx(name) {
    if (!sfxOn) return;
    if (!ensure() || ac.state !== 'running') return;
    const fn = SFX[name];
    if (!fn) return;
    const now = ac.currentTime;
    const gap = THROTTLE[name];
    if (gap) {
      if (lastSfxAt[name] && now - lastSfxAt[name] < gap) return;
      lastSfxAt[name] = now;
    }
    try { fn(now); } catch (e) { /* 사운드 실패는 게임에 영향주지 않음 */ }
  }

  /* ---------------- BGM 시퀀서 ---------------- */
  const P = {
    none:   [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    sparse: [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,1,0],
    quarter:[1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
    drive:  [1,0,0,1, 0,0,1,0, 1,0,0,1, 0,1,0,0],
    eight:  [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
    arp:    [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
    sync:   [1,0,0,1, 0,1,0,0, 1,0,0,1, 0,0,1,0],
    bell:   [1,0,0,0, 0,0,1,0, 0,1,0,0, 0,0,0,1],
    kick:   [1,0,0,0, 0,0,1,0, 1,0,0,0, 0,0,1,0],
    kickB:  [1,0,0,1, 0,0,1,0, 1,0,0,1, 1,0,1,0],
    snare:  [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,1],
    hat:    [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
    hatB:   [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
  };
  // 화음: b = 베이스 MIDI, l = 리드 화음 MIDI
  const AM = { b: 33, l: [57, 60, 64] };
  const F  = { b: 29, l: [53, 57, 60] };
  const C  = { b: 36, l: [52, 55, 60] };
  const G  = { b: 31, l: [55, 59, 62] };
  const DM = { b: 38, l: [50, 53, 57] };
  const E  = { b: 28, l: [52, 56, 59] };

  const TRACKS = {
    menu:   { bpm: 84,  chords: [AM, F, C, G],     bass: 'sparse', lead: 'bell',  kick: 'none',  snare: 'none',  hat: 'none',  leadType: 'sine',     leadVol: .17, padVol: .10, bassVol: .28, bassOct: 12 },
    story:  { bpm: 72,  chords: [AM, DM, F, E],    bass: 'sparse', lead: 'bell',  kick: 'none',  snare: 'none',  hat: 'none',  leadType: 'sine',     leadVol: .14, padVol: .12, bassVol: .22, bassOct: 12 },
    battle: { bpm: 122, chords: [AM, F, C, G],     bass: 'drive',  lead: 'arp',   kick: 'kick',  snare: 'snare', hat: 'hat',   leadType: 'square',   leadVol: .11, padVol: .05, bassVol: .32, bassOct: 12 },
    boss:   { bpm: 144, chords: [AM, DM, F, E],    bass: 'eight',  lead: 'sync',  kick: 'kickB', snare: 'snare', hat: 'hatB',  leadType: 'sawtooth', leadVol: .10, padVol: .06, bassVol: .36, bassOct: 12 },
  };

  function drum(kind, t) {
    // 드럼은 BGM 버스 (BGM 토글로 함께 켜짐/꺼짐)
    if (kind === 'kick' || kind === 'kickB') {
      tone(150, t, .12, 'sine', .4, musicBus, 45);
    } else if (kind === 'snare') {
      noise(t, .11, .18, 'highpass', 1600, 3000, musicBus);
      tone(210, t, .09, 'triangle', .14, musicBus, 160);
    } else if (kind === 'hat') {
      noise(t, .04, .07, 'highpass', 7000, 9000, musicBus);
    } else if (kind === 'hatB') {
      noise(t, .03, .05, 'highpass', 8000, 10000, musicBus);
    }
  }

  function scheduleStep(tr, t, stepDur) {
    const bar = Math.floor(step / 16) % tr.chords.length;
    const s = step % 16;
    const ch = tr.chords[bar];
    // 베이스
    if (P[tr.bass][s]) tone(f(ch.b + tr.bassOct), t, stepDur * 1.7, 'triangle', tr.bassVol, musicBus);
    // 리드 (화음톤 산책 + 마디마다 방향 전환)
    if (P[tr.lead][s]) {
      const n = ch.l[leadIdx % 3] + 12;
      tone(f(n), t, stepDur * 1.6, tr.leadType, tr.leadVol, musicBus);
      leadIdx += leadDir;
      if (leadIdx >= 5) { leadIdx = 4; leadDir = -1; }
      if (leadIdx < 0)  { leadIdx = 0; leadDir = 1; }
    }
    // 패드 (마디 시작)
    if (s === 0 && tr.padVol > 0) {
      const dur = stepDur * 16;
      ch.l.forEach(nn => tone(f(nn), t, dur, 'sine', tr.padVol / 3, musicBus));
    }
    // 드럼
    if (P[tr.kick][s])  drum(tr.kick === 'none' ? '' : tr.kick, t);
    if (P[tr.snare][s]) drum(tr.snare, t);
    if (P[tr.hat][s])   drum(tr.hat, t);
  }

  function tick() {
    if (!ac || ac.state !== 'running' || !wantTrack) { stopSeq(); return; }
    const tr = TRACKS[wantTrack];
    if (!tr) { stopSeq(); return; }
    const stepDur = 60 / tr.bpm / 4;
    while (nextStepTime < ac.currentTime + 0.12) {
      if (nextStepTime < ac.currentTime) nextStepTime = ac.currentTime + 0.02;
      scheduleStep(tr, nextStepTime, stepDur);
      nextStepTime += stepDur;
      step = (step + 1) % (tr.chords.length * 16);
      if (step === 0) leadIdx = 0;
    }
  }
  function startSeq(name) {
    if (!TRACKS[name]) return;
    wantTrack = name;
    if (!ensure()) return;
    if (ac.state !== 'running') return;   // 제스처 후 kick()에서 재시도
    if (seqTimer) return;                 // 같은 트랙 유지
    step = 0; leadIdx = 0; leadDir = 1;
    nextStepTime = ac.currentTime + 0.08;
    seqTimer = setInterval(tick, 30);
    tick();
  }
  function stopSeq() {
    if (seqTimer) { clearInterval(seqTimer); seqTimer = null; }
  }
  function music(name) {
    if (name === 'off') { wantTrack = null; stopSeq(); return; }
    if (!TRACKS[name]) return;
    if (wantTrack === name && seqTimer) return;
    if (seqTimer) stopSeq();   // 트랙 교체
    startSeq(name);
  }

  /* ---------------- 토글 ---------------- */
  function setBGM(on) {
    bgmOn = on;
    localStorage.setItem('nyanko_bgm', on ? '1' : '0');
    if (musicBus) musicBus.gain.value = on ? 0.32 : 0;
    if (on) { if (wantTrack) startSeq(wantTrack); }
    else stopSeq();
  }
  function setSFX(on) {
    sfxOn = on;
    localStorage.setItem('nyanko_sfx', on ? '1' : '0');
    if (sfxBus) sfxBus.gain.value = on ? 0.55 : 0;
  }

  return {
    sfx, music,
    toggleBGM() { setBGM(!bgmOn); return bgmOn; },
    toggleSFX() { setSFX(!sfxOn); return sfxOn; },
    bgmOn: () => bgmOn,
    sfxOn: () => sfxOn,
    info() {
      return {
        ctx: ac ? ac.state : 'none',
        want: wantTrack,
        playing: !!seqTimer,
        step,
        bgmOn, sfxOn,
        tracks: Object.keys(TRACKS),
        sfxNames: Object.keys(SFX),
      };
    },
  };
})();
