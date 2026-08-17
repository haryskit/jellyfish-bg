/*!
 * JellyfishBG v1.0.0
 * A self-contained, dependency-free animated bioluminescent jellyfish
 * background. Drop the script in, call JellyfishBG.init(), done.
 *
 * https://github.com/YOUR_USERNAME/jellyfish-bg
 * MIT License
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.JellyfishBG = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var DEFAULTS = {
    jellyfishCount: 8,
    particleCount: 160,
    sparkChance: 0.35,
    colors: [
      [94, 234, 212],   // cyan
      [167, 139, 250],  // violet
      [244, 114, 182],  // rose
      [125, 211, 252],  // pale blue
      [253, 224, 138]   // gold
    ],
    driftSpeed: 0.15,
    pointerInfluence: 220,
    pointerStrength: 0.9,
    background: ['rgba(6,20,34,1)', 'rgba(3,10,18,1)', 'rgba(2,4,9,1)'],
    godRays: true,
    sparks: true,
    respectReducedMotion: true
  };

  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function swimEase(t) {
    var x = t % 1;
    return x < 0.28 ? (1 - Math.pow(1 - x / 0.28, 2)) : (1 - (x - 0.28) / 0.72);
  }

  function Spark(x, y, color) {
    this.x = x; this.y = y; this.color = color;
    this.vx = rand(-0.3, 0.3); this.vy = rand(-0.5, -0.1);
    this.life = 1; this.decay = rand(0.006, 0.016);
    this.r = rand(0.8, 2.2);
  }
  Spark.prototype.update = function (dt) {
    this.x += this.vx * dt * 60; this.y += this.vy * dt * 60;
    this.vy -= 0.002 * dt * 60;
    this.life -= this.decay * dt * 60;
  };
  Spark.prototype.draw = function (cx) {
    if (this.life <= 0) return;
    var c = this.color;
    cx.globalCompositeOperation = 'lighter';
    cx.fillStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (clamp(this.life, 0, 1) * 0.9) + ')';
    cx.beginPath(); cx.arc(this.x, this.y, this.r, 0, Math.PI * 2); cx.fill();
    cx.globalCompositeOperation = 'source-over';
  };

  function Jelly(field) {
    this.field = field;
    this.depth = rand(0, 1);
    this.reset(true);
  }
  Jelly.prototype.reset = function (initial) {
    var f = this.field, opt = f.options;
    var depthScale = 0.55 + this.depth * 0.9;
    this.x = rand(0.08, 0.92) * f.W;
    this.y = initial ? rand(0, f.H) : f.H + rand(60, 220);
    this.bell = rand(24, 50) * depthScale;
    this.color = pick(opt.colors);
    this.tentacleCount = (rand(6, 9) | 0);
    this.armCount = 4;
    this.phase = rand(0, Math.PI * 2);
    this.pulseSpeed = rand(0.38, 0.6);
    this.riseSpeed = opt.driftSpeed * rand(0.55, 1.3) * (0.6 + this.depth * 0.8);
    this.swayFreq = rand(0.12, 0.28);
    this.swayAmp = rand(0.2, 0.5);
    this.vx = 0; this.vy = 0;
    this.alpha = (0.35 + this.depth * 0.55);
    this.t = rand(0, 100);
    this.history = [];
    this.maxHistory = 48;
    this.tilt = 0;
    this.lastPulse = undefined;
  };
  Jelly.prototype.update = function (dt) {
    var f = this.field, opt = f.options, p = f.pointer;
    this.t += dt;
    var pulse = swimEase(this.t * this.pulseSpeed);
    var pulseVel = pulse - (this.lastPulse === undefined ? pulse : this.lastPulse);
    this.lastPulse = pulse;
    this.pulse = pulse;

    var thrust = Math.max(0, -pulseVel) * 1.4;
    var sway = Math.sin(this.t * this.swayFreq + this.phase) * this.swayAmp;

    var pushX = 0, pushY = 0;
    if (p.active && !f.reduceMotion) {
      var dx = this.x - p.x, dy = this.y - p.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var R = opt.pointerInfluence;
      if (dist < R && dist > 0.001) {
        var force = (1 - dist / R) * opt.pointerStrength;
        pushX = (dx / dist) * force; pushY = (dy / dist) * force;
      }
    }

    this.vx += (sway * 0.02 + pushX * 0.05 - this.vx) * 0.05;
    this.vy += (-(this.riseSpeed + thrust * 0.35) + pushY * 0.05 - this.vy) * 0.05;
    this.tilt = clamp(this.vx * 6, -0.35, 0.35);

    this.x += this.vx * dt * 60;
    this.y += this.vy * dt * 60;

    this.history.unshift({ x: this.x, y: this.y });
    if (this.history.length > this.maxHistory) this.history.pop();

    if (opt.sparks && !f.reduceMotion && pulseVel < -0.05 && Math.random() < opt.sparkChance * 0.15) {
      for (var i = 0; i < 2; i++) {
        var ang = rand(0, Math.PI * 2);
        var rr = this.bell * rand(0.6, 1.1);
        f.sparks.push(new Spark(this.x + Math.cos(ang) * rr, this.y + this.bell * 0.6 + Math.sin(ang) * rr * 0.4, this.color));
      }
    }

    if (this.y < -160 || this.x < -140 || this.x > f.W + 140) this.reset(false);
  };
  Jelly.prototype.historyAt = function (delaySteps) {
    var idx = Math.min(delaySteps, this.history.length - 1);
    return this.history[idx] || { x: this.x, y: this.y };
  };
  Jelly.prototype.draw = function (cx) {
    var c = this.color, r = c[0], g = c[1], b = c[2];
    var bellR = this.bell * (0.82 + this.pulse * 0.28);
    var alpha = this.alpha;
    var blur = (1 - this.depth) * 3;

    cx.save();
    cx.translate(this.x, this.y);
    cx.rotate(this.tilt * 0.3);
    if (blur > 0.3) cx.filter = 'blur(' + blur.toFixed(1) + 'px)';

    cx.globalCompositeOperation = 'lighter';
    var halo = cx.createRadialGradient(0, 0, bellR * 0.15, 0, 0, bellR * 3.6);
    halo.addColorStop(0, 'rgba(' + r + ',' + g + ',' + b + ',' + (0.20 * alpha) + ')');
    halo.addColorStop(1, 'rgba(' + r + ',' + g + ',' + b + ',0)');
    cx.fillStyle = halo;
    cx.beginPath(); cx.arc(0, 0, bellR * 3.6, 0, Math.PI * 2); cx.fill();

    for (var a = 0; a < this.armCount; a++) {
      var baseOffset = (a - (this.armCount - 1) / 2) * bellR * 0.28;
      cx.beginPath();
      cx.strokeStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + (0.28 * alpha) + ')';
      cx.lineWidth = bellR * 0.09;
      cx.lineCap = 'round';
      var prevX = baseOffset, prevY = bellR * 0.1;
      cx.moveTo(prevX, prevY);
      var segs = 10;
      for (var s = 1; s <= segs; s++) {
        var h = this.historyAt(Math.floor(s * 1.6));
        var localX = (h.x - this.x) * 0.5 + baseOffset + Math.sin(this.t * 1.3 + s * 0.6 + a) * bellR * 0.12 * (s / segs);
        var localY = bellR * 0.1 + (s / segs) * bellR * 2.0 + (h.y - this.y) * 0.15;
        cx.quadraticCurveTo(prevX, prevY, (localX + prevX) / 2, (localY + prevY) / 2);
        prevX = localX; prevY = localY;
      }
      cx.stroke();
    }

    for (var i = 0; i < this.tentacleCount; i++) {
      var tx = -bellR * 0.75 + (bellR * 1.5 / (this.tentacleCount - 1)) * i;
      cx.beginPath();
      cx.strokeStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + (0.22 * alpha) + ')';
      cx.lineWidth = 1;
      var pX = tx, pY = bellR * 0.05;
      cx.moveTo(pX, pY);
      var segs2 = 8;
      for (var s2 = 1; s2 <= segs2; s2++) {
        var h2 = this.historyAt(Math.floor(s2 * 2.2 + i));
        var wob = Math.sin(this.t * (1.4 + i * 0.11) + s2 * 0.8) * bellR * 0.22 * (s2 / segs2);
        var lX = tx * (1 - (s2 / segs2) * 0.3) + wob + (h2.x - this.x) * 0.35;
        var lY = bellR * 0.05 + (s2 / segs2) * bellR * 2.6 + (h2.y - this.y) * 0.1;
        cx.quadraticCurveTo(pX, pY, (lX + pX) / 2, (lY + pY) / 2);
        pX = lX; pY = lY;
      }
      cx.stroke();
    }

    cx.globalCompositeOperation = 'lighter';
    var bellGrad = cx.createRadialGradient(0, -bellR * 0.35, bellR * 0.1, 0, 0, bellR * 1.15);
    bellGrad.addColorStop(0, 'rgba(' + r + ',' + g + ',' + b + ',' + (0.9 * alpha) + ')');
    bellGrad.addColorStop(0.55, 'rgba(' + r + ',' + g + ',' + b + ',' + (0.4 * alpha) + ')');
    bellGrad.addColorStop(1, 'rgba(' + r + ',' + g + ',' + b + ',0)');
    cx.fillStyle = bellGrad;

    cx.beginPath();
    var topPoints = 12;
    cx.moveTo(-bellR, 0);
    for (var tp = 0; tp <= topPoints; tp++) {
      var ang2 = Math.PI + (Math.PI * tp / topPoints);
      var wob2 = Math.sin(this.t * 2 + tp * 0.9) * bellR * 0.04 * (1 - this.pulse * 0.5);
      var rad = bellR * (1 + wob2 / bellR);
      var px = Math.cos(ang2) * rad;
      var py = Math.sin(ang2) * rad * 1.15 - bellR * 0.05;
      cx.lineTo(px, py);
    }
    var scallops = 7;
    for (var sc = 0; sc < scallops; sc++) {
      var x1 = bellR - (bellR * 2 / scallops) * (sc + 0.5);
      var x2 = bellR - (bellR * 2 / scallops) * (sc + 1);
      cx.quadraticCurveTo(x1, bellR * 0.2, x2, 0);
    }
    cx.closePath();
    cx.fill();

    var core = cx.createRadialGradient(0, -bellR * 0.15, 0, 0, -bellR * 0.15, bellR * 0.7);
    core.addColorStop(0, 'rgba(255,255,255,' + (0.35 * alpha * (0.4 + this.pulse * 0.6)) + ')');
    core.addColorStop(1, 'rgba(' + r + ',' + g + ',' + b + ',0)');
    cx.fillStyle = core;
    cx.beginPath(); cx.arc(0, -bellR * 0.15, bellR * 0.7, 0, Math.PI * 2); cx.fill();

    cx.globalCompositeOperation = 'source-over';
    cx.strokeStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + (0.4 * alpha) + ')';
    cx.lineWidth = 1;
    cx.beginPath();
    cx.moveTo(-bellR * 0.9, -bellR * 0.05);
    cx.quadraticCurveTo(0, -bellR * 1.1, bellR * 0.9, -bellR * 0.05);
    cx.stroke();

    cx.restore();
  };

  function Mote(field) { this.field = field; this.reset(true); }
  Mote.prototype.reset = function (initial) {
    var f = this.field;
    this.x = rand(0, f.W); this.y = initial ? rand(0, f.H) : f.H + rand(0, 40);
    this.r = rand(0.4, 1.6); this.speed = rand(0.04, 0.16); this.drift = rand(-0.08, 0.08);
    this.twinklePhase = rand(0, Math.PI * 2); this.twinkleSpeed = rand(0.3, 0.9);
    this.alpha = rand(0.12, 0.45);
  };
  Mote.prototype.update = function (dt) {
    var f = this.field, p = f.pointer;
    this.y -= this.speed * dt * 60;
    this.x += this.drift * dt * 60;
    if (p.active && !f.reduceMotion) {
      var dx = this.x - p.x, dy = this.y - p.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 140 && dist > 0.001) {
        var force = (1 - dist / 140) * 0.6;
        this.x += (dx / dist) * force; this.y += (dy / dist) * force;
      }
    }
    this.twinklePhase += dt * this.twinkleSpeed;
    if (this.y < -10) this.reset(false);
  };
  Mote.prototype.draw = function (cx) {
    var tw = (Math.sin(this.twinklePhase) + 1) / 2;
    cx.fillStyle = 'rgba(220,238,242,' + (this.alpha * (0.4 + tw * 0.6)) + ')';
    cx.beginPath(); cx.arc(this.x, this.y, this.r, 0, Math.PI * 2); cx.fill();
  };

  function drawGodRays(cx, W, H, t) {
    cx.save();
    cx.globalCompositeOperation = 'lighter';
    var rays = 4;
    for (var i = 0; i < rays; i++) {
      var cx0 = W * (0.15 + i * 0.24) + Math.sin(t * 0.05 + i) * 40;
      var grad = cx.createLinearGradient(cx0, -40, cx0 + 120, H * 0.9);
      grad.addColorStop(0, 'rgba(150,210,220,0.05)');
      grad.addColorStop(1, 'rgba(150,210,220,0)');
      cx.fillStyle = grad;
      cx.beginPath();
      cx.moveTo(cx0 - 70, -40);
      cx.lineTo(cx0 + 70, -40);
      cx.lineTo(cx0 + 220, H * 0.9);
      cx.lineTo(cx0 - 220, H * 0.9);
      cx.closePath();
      cx.fill();
    }
    cx.restore();
  }

  function Field(container, options) {
    this.container = container;
    this.options = Object.assign({}, DEFAULTS, options || {});
    this.reduceMotion = this.options.respectReducedMotion &&
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.pointer = { x: -9999, y: -9999, active: false };
    this.sparks = [];
    this._destroyed = false;

    this._buildDOM();
    this._bind();
    this.resize();
    this.jellies = [];
    for (var i = 0; i < this.options.jellyfishCount; i++) this.jellies.push(new Jelly(this));
    this.jellies.sort(function (a, b) { return a.depth - b.depth; });
    this.motes = [];
    for (var j = 0; j < this.options.particleCount; j++) this.motes.push(new Mote(this));

    this._lastT = performance.now();
    this._raf = requestAnimationFrame(this._loop.bind(this));
  }

  Field.prototype._buildDOM = function () {
    var cs = getComputedStyle(this.container);
    if (cs.position === 'static') this.container.style.position = 'relative';
    this.container.style.overflow = this.container.style.overflow || 'hidden';

    this.fieldCv = document.createElement('canvas');
    this.fxCv = document.createElement('canvas');
    [this.fieldCv, this.fxCv].forEach(function (cv) {
      cv.style.position = 'absolute';
      cv.style.inset = '0';
      cv.style.display = 'block';
      cv.style.pointerEvents = 'none';
    });
    this.container.appendChild(this.fieldCv);
    this.container.appendChild(this.fxCv);
    this.fieldCx = this.fieldCv.getContext('2d');
    this.fxCx = this.fxCv.getContext('2d');
  };

  Field.prototype._bind = function () {
    var self = this;
    this._onResize = function () { self.resize(); };
    this._onMove = function (e) {
      var rect = self.container.getBoundingClientRect();
      self.pointer.x = e.clientX - rect.left;
      self.pointer.y = e.clientY - rect.top;
      self.pointer.active = true;
    };
    this._onLeave = function () { self.pointer.active = false; };

    window.addEventListener('resize', this._onResize);
    this.container.addEventListener('pointermove', this._onMove);
    this.container.addEventListener('pointerleave', this._onLeave);

    if (window.ResizeObserver) {
      this._ro = new ResizeObserver(this._onResize);
      this._ro.observe(this.container);
    }
  };

  Field.prototype.resize = function () {
    var rect = this.container.getBoundingClientRect();
    this.W = rect.width || window.innerWidth;
    this.H = rect.height || window.innerHeight;
    var DPR = Math.min(window.devicePixelRatio || 1, 2);
    var self = this;
    [this.fieldCv, this.fxCv].forEach(function (cv) {
      cv.width = self.W * DPR; cv.height = self.H * DPR;
      cv.style.width = self.W + 'px'; cv.style.height = self.H + 'px';
    });
    this.fieldCx.setTransform(DPR, 0, 0, DPR, 0, 0);
    this.fxCx.setTransform(DPR, 0, 0, DPR, 0, 0);
  };

  Field.prototype._loop = function (now) {
    if (this._destroyed) return;
    var dt = Math.min((now - this._lastT) / 1000, 0.05);
    this._lastT = now;
    var opt = this.options;

    this.fieldCx.clearRect(0, 0, this.W, this.H);
    var bg = this.fieldCx.createLinearGradient(0, 0, 0, this.H);
    bg.addColorStop(0, opt.background[0]);
    bg.addColorStop(0.6, opt.background[1]);
    bg.addColorStop(1, opt.background[2]);
    this.fieldCx.fillStyle = bg;
    this.fieldCx.fillRect(0, 0, this.W, this.H);

    if (opt.godRays) drawGodRays(this.fieldCx, this.W, this.H, now / 1000);

    for (var m = 0; m < this.motes.length; m++) {
      if (!this.reduceMotion) this.motes[m].update(dt);
      this.motes[m].draw(this.fieldCx);
    }
    for (var j = 0; j < this.jellies.length; j++) {
      if (!this.reduceMotion) this.jellies[j].update(dt);
      this.jellies[j].draw(this.fieldCx);
    }

    this.fxCx.clearRect(0, 0, this.W, this.H);
    for (var i = this.sparks.length - 1; i >= 0; i--) {
      var s = this.sparks[i];
      if (!this.reduceMotion) s.update(dt);
      s.draw(this.fxCx);
      if (s.life <= 0) this.sparks.splice(i, 1);
    }
    if (this.sparks.length > 400) this.sparks.splice(0, this.sparks.length - 400);

    this._raf = requestAnimationFrame(this._loop.bind(this));
  };

  Field.prototype.destroy = function () {
    this._destroyed = true;
    cancelAnimationFrame(this._raf);
    window.removeEventListener('resize', this._onResize);
    this.container.removeEventListener('pointermove', this._onMove);
    this.container.removeEventListener('pointerleave', this._onLeave);
    if (this._ro) this._ro.disconnect();
    if (this.fieldCv.parentNode) this.fieldCv.parentNode.removeChild(this.fieldCv);
    if (this.fxCv.parentNode) this.fxCv.parentNode.removeChild(this.fxCv);
  };

  return {
    /**
     * Initialize the jellyfish field inside a container.
     * @param {string|HTMLElement} target - element id or element itself
     * @param {object} [options] - see README for full list
     * @returns {{destroy: function}} instance handle
     */
    init: function (target, options) {
      var el = typeof target === 'string' ? document.getElementById(target) : target;
      if (!el) throw new Error('JellyfishBG.init: target element not found');
      return new Field(el, options);
    },
    defaults: DEFAULTS
  };
}));
