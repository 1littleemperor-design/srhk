/* =========================================================
   妈，生日快乐！—— 行为脚本
   开场 / 蜡烛 + 麦克风 / 纸屑气球 / 八音盒歌 / 抽签 / 灯箱
   改文字去 index.html，这里不用动
   ========================================================= */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clampi = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  document.documentElement.classList.add('locked');
  document.body.classList.add('locked');

  /* =====================================================
     1. 开场：撕开封面
     ===================================================== */
  var gate = $('#gate');
  var openBtn = $('#openBtn');
  var opened = false;

  function openGate() {
    if (opened) return;
    opened = true;
    gate.classList.add('gone');
    document.documentElement.classList.remove('locked');
    document.body.classList.remove('locked');
    window.scrollTo(0, 0);
    ensureAudio();
    startMusic();
    setTimeout(function () { gate.setAttribute('hidden', ''); }, 500);
    setTimeout(burstConfetti, 260);
  }
  openBtn.addEventListener('click', openGate);
  gate.addEventListener('click', openGate);

  /* =====================================================
     2. 八音盒版《生日快乐》（WebAudio 合成）
     ===================================================== */
  var actx = null, master = null, musicOn = false, loopTimer = null;
  var musicBtn = $('#musicBtn');
  var BEAT = 0.42;
  var FREQ = {
    G4: 392.00, A4: 440.00, B4: 493.88, C5: 523.25,
    D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99
  };
  var SONG = [
    ['G4', .5], ['G4', .5], ['A4', 1], ['G4', 1], ['C5', 1], ['B4', 2],
    ['G4', .5], ['G4', .5], ['A4', 1], ['G4', 1], ['D5', 1], ['C5', 2],
    ['G4', .5], ['G4', .5], ['G5', 1], ['E5', 1], ['C5', 1], ['B4', 1], ['A4', 1.5],
    ['F5', .5], ['F5', .5], ['E5', 1], ['C5', 1], ['D5', 1], ['C5', 2]
  ];

  function ensureAudio() {
    if (!actx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      actx = new AC();
      master = actx.createGain();
      master.gain.value = 0.0001;
      master.connect(actx.destination);
    }
    if (actx.state === 'suspended') actx.resume();
  }

  function noteAt(freq, when, dur) {
    if (!actx) return;
    var o = actx.createOscillator(), g = actx.createGain();
    o.type = 'triangle';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, when);
    g.gain.linearRampToValueAtTime(0.85, when + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g); g.connect(master);
    o.start(when); o.stop(when + dur + 0.03);

    var o2 = actx.createOscillator(), g2 = actx.createGain();
    o2.type = 'sine';
    o2.frequency.value = freq * 2;
    g2.gain.setValueAtTime(0.0001, when);
    g2.gain.linearRampToValueAtTime(0.2, when + 0.03);
    g2.gain.exponentialRampToValueAtTime(0.0001, when + dur * .8);
    o2.connect(g2); g2.connect(master);
    o2.start(when); o2.stop(when + dur + 0.03);
  }

  function playSong() {
    if (!actx || !musicOn) return;
    var t = actx.currentTime + 0.18, start = t;
    SONG.forEach(function (n) {
      var dur = n[1] * BEAT;
      noteAt(FREQ[n[0]], t, Math.max(0.12, dur * 0.9));
      t += dur;
    });
    clearTimeout(loopTimer);
    loopTimer = setTimeout(function () { if (musicOn) playSong(); }, (t - start + 1.6) * 1000);
  }

  function startMusic() {
    if (!actx) return;
    musicOn = true;
    musicBtn.setAttribute('aria-pressed', 'true');
    master.gain.setTargetAtTime(0.16, actx.currentTime, 0.5);
    playSong();
  }

  musicBtn.addEventListener('click', function () {
    ensureAudio();
    if (!actx) return;
    musicOn = !musicOn;
    musicBtn.setAttribute('aria-pressed', musicOn ? 'true' : 'false');
    if (musicOn) {
      master.gain.setTargetAtTime(0.16, actx.currentTime, 0.2);
      playSong();
    } else {
      master.gain.setTargetAtTime(0.0001, actx.currentTime, 0.06);
      clearTimeout(loopTimer);
    }
  });

  /* =====================================================
     3. 蜡烛
     ===================================================== */
  var candles = $$('.candle');
  var cakeHint = $('#cakeHint');
  var micBtn = $('#micBtn');
  var micNote = $('#micNote');
  var remaining = candles.length;

  function updateHint() {
    if (remaining <= 0) { cakeHint.textContent = '全灭了。愿望我收到了。'; return; }
    if (remaining === candles.length) { cakeHint.textContent = '点一下蜡烛，或者对着屏幕吹'; return; }
    cakeHint.textContent = '还剩 ' + remaining + ' 根';
  }

  function putOut(c) {
    if (c.classList.contains('out')) return;
    c.classList.add('out');
    c.setAttribute('aria-label', '已吹灭');
    remaining--;
    updateHint();
    if (remaining <= 0) setTimeout(doneWish, 420);
  }

  candles.forEach(function (c) {
    c.addEventListener('click', function () { putOut(c); });
  });

  function doneWish() {
    if (document.body.classList.contains('wished')) return;
    document.body.classList.add('wished');
    stopMic();
    micBtn.setAttribute('disabled', 'disabled');
    micNote.textContent = '';
    burstConfetti();
    setTimeout(spawnBalloons, 400);
    setTimeout(function () {
      var w = $('#wish');
      if (w) w.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    }, 360);
  }

  $('#relight').addEventListener('click', function () {
    candles.forEach(function (c) {
      c.classList.remove('out');
      c.setAttribute('aria-label', '吹灭这根蜡烛');
    });
    remaining = candles.length;
    updateHint();
    document.body.classList.remove('wished');
    micBtn.removeAttribute('disabled');
    micNote.textContent = '';
    $('#hero').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
  });

  /* ---------- 麦克风吹气 ---------- */
  var micCtx = null, micStream = null, listening = false;

  function stopMic() {
    listening = false;
    micBtn.classList.remove('listening');
    if (micStream) { micStream.getTracks().forEach(function (t) { t.stop(); }); micStream = null; }
    if (micCtx) { try { micCtx.close(); } catch (e) { } micCtx = null; }
  }

  micBtn.addEventListener('click', function () {
    if (listening) { stopMic(); micNote.textContent = '停了。点蜡烛也一样算数。'; return; }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      micNote.textContent = '这个浏览器不给麦克风，点蜡烛吧。';
      return;
    }
    navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
    }).then(function (stream) {
      micStream = stream;
      var AC = window.AudioContext || window.webkitAudioContext;
      micCtx = new AC();
      var src = micCtx.createMediaStreamSource(stream);
      var an = micCtx.createAnalyser();
      an.fftSize = 1024;
      an.smoothingTimeConstant = 0.55;
      src.connect(an);
      var buf = new Float32Array(an.fftSize);
      listening = true;
      micBtn.classList.add('listening');
      micNote.textContent = '听着呢，吹吧';
      var hits = 0, t0 = performance.now();

      (function loop() {
        if (!listening) return;
        an.getFloatTimeDomainData(buf);
        var sum = 0;
        for (var i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
        var rms = Math.sqrt(sum / buf.length);
        if (rms > 0.075) hits++; else hits = Math.max(0, hits - 1);
        if (hits >= 3 && remaining > 0) {
          stopMic();
          micNote.textContent = '呼——听到了';
          candles.filter(function (c) { return !c.classList.contains('out'); })
            .forEach(function (c, i) { setTimeout(function () { putOut(c); }, i * 140); });
          return;
        }
        if (performance.now() - t0 > 15000) {
          stopMic();
          micNote.textContent = '没听到风声，直接点蜡烛也一样。';
          return;
        }
        requestAnimationFrame(loop);
      })();
    }).catch(function () {
      micNote.textContent = '麦克风没打开（权限被拒了）。点蜡烛也一样。';
    });
  });

  updateHint();

  /* =====================================================
     4. 粒子：纸屑 / 气球 / 爱心
     ===================================================== */
  var fx = $('#fx'), ctx = fx.getContext('2d');
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0, parts = [], running = false, lastT = 0;

  var PALETTE = ['#a9513c', '#c39a5a', '#6f8a76', '#708494', '#c0705a', '#8e7f6d', '#b9a58e'];

  function resizeFx() {
    W = window.innerWidth; H = window.innerHeight;
    fx.width = Math.floor(W * dpr);
    fx.height = Math.floor(H * dpr);
    fx.style.width = W + 'px';
    fx.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resizeFx();
  window.addEventListener('resize', resizeFx);

  function push(p) { parts.push(p); startFx(); }

  function startFx() {
    if (running) return;
    running = true;
    lastT = performance.now();
    requestAnimationFrame(tick);
  }

  function burstConfetti() {
    if (reduced) return;
    var n = Math.round(clampi(W / 9, 70, 150));
    for (var i = 0; i < n; i++) {
      var left = i % 2 === 0;
      push({
        k: 'confetti',
        x: left ? -8 : W + 8,
        y: H * (0.5 + Math.random() * 0.25),
        vx: (left ? 1 : -1) * (5 + Math.random() * 7),
        vy: -3 - Math.random() * 6,
        rot: Math.random() * 6.28,
        vr: (Math.random() - 0.5) * 0.45,
        w: 6 + Math.random() * 6,
        h: 9 + Math.random() * 7,
        c: PALETTE[(Math.random() * PALETTE.length) | 0],
        life: 1
      });
    }
  }

  function spawnBalloons() {
    if (reduced) return;
    var n = Math.round(clampi(W / 110, 7, 16));
    for (var i = 0; i < n; i++) {
      push({
        k: 'balloon',
        x: Math.random() * W,
        y: H + 30 + Math.random() * 140,
        vy: -(0.4 + Math.random() * 0.55),
        ph: Math.random() * 6.28,
        t: 0,
        s: 0.7 + Math.random() * 0.8,
        c: PALETTE[(Math.random() * PALETTE.length) | 0],
        life: 1
      });
    }
  }

  function burstHearts(n) {
    n = n || 40;
    for (var i = 0; i < n; i++) {
      push({
        k: 'heart',
        x: Math.random() * W,
        y: H + 20 + Math.random() * 110,
        vy: 0.55 + Math.random() * 1.1,
        ph: Math.random() * 6.28,
        t: 0,
        s: 0.5 + Math.random() * 0.9,
        c: PALETTE[(Math.random() * 3) | 0],
        life: 1
      });
    }
  }

  function step(p, dt) {
    if (p.k === 'confetti') {
      p.vy += 0.11 * dt;
      p.vx *= 0.993;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      if (p.y > H + 50) p.life = 0;
    } else if (p.k === 'balloon') {
      p.t += dt;
      p.y += p.vy * dt;
      p.x += Math.sin(p.t / 52 + p.ph) * 0.6 * dt;
      if (p.y < -140) p.life = 0;
    } else {
      p.t += dt;
      p.y -= p.vy * dt;
      p.x += Math.sin(p.t / 36 + p.ph) * 0.7 * dt;
      if (p.y < -50) p.life = 0;
    }
  }

  function heartPath(c, x, y, s) {
    c.beginPath();
    c.moveTo(x, y + s * 0.35);
    c.bezierCurveTo(x, y - s * 0.15, x - s, y - s * 0.15, x - s, y + s * 0.35);
    c.bezierCurveTo(x - s, y + s * 0.85, x, y + s * 1.15, x, y + s * 1.45);
    c.bezierCurveTo(x, y + s * 1.15, x + s, y + s * 0.85, x + s, y + s * 0.35);
    c.bezierCurveTo(x + s, y - s * 0.15, x, y - s * 0.15, x, y + s * 0.35);
    c.closePath();
  }

  function draw(p) {
    ctx.save();
    if (p.k === 'confetti') {
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.c;
      ctx.globalAlpha = 0.95;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    } else if (p.k === 'balloon') {
      var r = 13 * p.s;
      ctx.globalAlpha = 0.9;
      ctx.strokeStyle = 'rgba(58,42,34,.45)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y + r * 1.25);
      ctx.quadraticCurveTo(p.x + 4, p.y + r * 1.9, p.x - 2, p.y + r * 2.6);
      ctx.stroke();

      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, r * 0.82, r, 0, 0, 6.2832);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.55)';
      ctx.beginPath();
      ctx.ellipse(p.x - r * 0.28, p.y - r * 0.35, r * 0.18, r * 0.26, -0.5, 0, 6.2832);
      ctx.fill();
    } else {
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = p.c;
      heartPath(ctx, p.x, p.y, 7 * p.s);
      ctx.fill();
    }
    ctx.restore();
  }

  function tick(now) {
    var dt = Math.min(3, (now - lastT) / 16.67);
    lastT = now;
    ctx.clearRect(0, 0, W, H);
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      step(p, dt);
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      draw(p);
    }
    if (parts.length) {
      requestAnimationFrame(tick);
    } else {
      running = false;
      ctx.clearRect(0, 0, W, H);
    }
  }

  /* =====================================================
     5. 六张贺卡
     ===================================================== */
  var deck = $('#deck');
  if (deck) {
    var cards = $$('.card', deck);
    var reset = $('#deckReset');
    var dealt = 0;

    function shuffle(arr) {
      var a = arr.slice();
      for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = a[i]; a[i] = a[j]; a[j] = t;
      }
      return a;
    }

    /* 打乱顺序、重新叠好 */
    function arrange() {
      shuffle(cards).forEach(function (c) {
        c.classList.remove('dealt', 'flipped', 'top');
        c.classList.add('stacked');
        c.style.removeProperty('--slot');
        deck.appendChild(c);
      });

      Array.prototype.forEach.call(deck.children, function (c, i) {
        c.style.setProperty('--i', i);
      });

      deck.children[deck.children.length - 1].classList.add('top');
      dealt = 0;
      deck.style.setProperty('--shift', cards.length / 2);
      deck.classList.remove('done');
      if (reset) reset.classList.remove('show');
    }

    function topmost() {
      var top = null, max = -1;
      cards.forEach(function (c) {
        if (!c.classList.contains('stacked')) return;
        var i = parseInt(c.style.getPropertyValue('--i'), 10) || 0;
        if (i > max) { max = i; top = c; }
      });
      return top;
    }

    function deal(card) {
      card.classList.remove('stacked', 'top');
      card.classList.add('dealt');
      card.style.setProperty('--slot', dealt);
      dealt++;
      /* 已翻出的那几张整体居中，翻满六张时正好铺满一行 */
      deck.style.setProperty('--shift', (cards.length - dealt) / 2);
      card.classList.add('flipped');

      var next = topmost();
      if (next) next.classList.add('top');

      if (dealt === cards.length) {
        deck.classList.add('done');
        burstConfetti();
        if (reset) setTimeout(function () { reset.classList.add('show'); }, 620);
      }
    }

    cards.forEach(function (card) {
      card.addEventListener('click', function () {
        if (!card.classList.contains('top')) return;
        deal(card);
      });
    });

    if (reset) {
      reset.addEventListener('click', function () {
        arrange();
        deck.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }

    arrange();
  }

  /* =====================================================
     6. 灯箱 / 结尾 / 日期
     ===================================================== */
  var lightbox = $('#lightbox'), lbImg = $('#lbImg'), lbClose = $('#lbClose');

  function closeLb() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }

  $$('.polaroid').forEach(function (fig) {
    fig.addEventListener('click', function () {
      var img = fig.querySelector('img');
      if (!img) return;
      lbImg.src = img.currentSrc || img.src;
      lbImg.alt = img.alt || '';
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });
  lbClose.addEventListener('click', closeLb);
  lightbox.addEventListener('click', function (e) { if (e.target === lightbox) closeLb(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeLb(); if (listening) stopMic(); }
  });

  $('#heartBtn').addEventListener('click', function () {
    burstHearts(46);
    spawnBalloons();
  });

  var now = new Date();
  var todayEl = $('#today');
  if (todayEl) {
    var iso = (todayEl.getAttribute('data-date') || '').trim();
    var d = /^\d{4}-\d{1,2}-\d{1,2}$/.test(iso) ? new Date(iso + 'T12:00:00') : now;
    if (isNaN(d.getTime())) d = now;
    todayEl.textContent = d.getFullYear() + ' 年 ' + (d.getMonth() + 1) + ' 月 ' + d.getDate() + ' 日';
  }
})();
