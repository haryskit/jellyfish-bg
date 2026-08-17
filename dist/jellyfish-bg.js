/*!
 * JellyfishBG v1.2.0
 * A self-contained, dependency-free animated bioluminescent underwater
 * background. Drop the script in, call JellyfishBG.init(), done.
 *
 * https://github.com/haryskit/jellyfish-bg
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

  var ALL_ELEMENTS = ['jellyfish', 'bubbles', 'fish', 'godRays', 'motes'];

  var DEFAULTS = {
    elements: ALL_ELEMENTS.slice(),
    jellyfishCount: 8,
    particleCount: 140,
    bubbleCount: 26,
    fishCount: 18,
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
    sparks: true,
    cursorGlow: true,
    clickBursts: true,
    adaptiveQuality: true,
    respectReducedMotion: true
  };

  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function swimEase(t) {
    var x = t % 1;
    return x < 0.28 ? (1 - Math.pow(1 - x / 0.28, 2)) : (1 - (x - 0.28) / 0.72);
  }
  function has(list, key) { return list.indexOf(key) !== -1; }
  // draws a smooth curve through points [[x,y], ...] via quadratic
  // midpoint chaining - much smoother than lineTo through the same points
  function smoothPath(cx, pts, close, continueFrom) {
    // continueFrom: connect from the current pen position with a lineTo
    // instead of starting a fresh subpath - lets two point sets (e.g. a
    // dome curve and a hem curve) join into one continuous, correctly
    // auto-closing outline instead of two separate auto-closed shapes.
    if (continueFrom) cx.lineTo(pts[0][0], pts[0][1]);
    else cx.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length - 1; i++) {
      var p0 = pts[i], p1 = pts[i + 1];
      cx.quadraticCurveTo(p0[0], p0[1], (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2);
    }
    var last = pts[pts.length - 1];
    cx.lineTo(last[0], last[1]);
    if (close) cx.closePath();
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

  function Ripple(x, y, color) {
    this.x = x; this.y = y; this.color = color;
    this.r = 0; this.maxR = 260; this.life = 1;
  }
  Ripple.prototype.update = function (dt) {
    this.r += 260 * dt;
    this.life = 1 - this.r / this.maxR;
  };
  Ripple.prototype.draw = function (cx) {
    if (this.life <= 0) return;
    var c = this.color;
    cx.globalCompositeOperation = 'lighter';
    cx.strokeStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (clamp(this.life, 0, 1) * 0.55) + ')';
    cx.lineWidth = 1.5;
    cx.beginPath(); cx.arc(this.x, this.y, this.r, 0, Math.PI * 2); cx.stroke();
    cx.globalCompositeOperation = 'source-over';
  };

  // ---------------------------------------------------------------- Jelly
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
    this.excite = 0;
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

    var pushX = 0, pushY = 0, exciteTarget = 0;
    if (p.active && !f.reduceMotion) {
      var dx = this.x - p.x, dy = this.y - p.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var R = opt.pointerInfluence;
      if (dist < R && dist > 0.001) {
        var force = (1 - dist / R) * opt.pointerStrength;
        pushX = (dx / dist) * force; pushY = (dy / dist) * force;
        exciteTarget = 1 - dist / R;
      } else if (dist < R * 2.4 && dist > 0.001) {
        var curiosity = (1 - (dist - R) / (R * 1.4)) * opt.pointerStrength * 0.16;
        pushX = -(dx / dist) * curiosity; pushY = -(dy / dist) * curiosity;
        exciteTarget = (1 - (dist - R) / (R * 1.4)) * 0.4;
      }
    }
    this.excite += (exciteTarget - this.excite) * 0.08;

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
    var bellR = this.bell * (0.82 + this.pulse * 0.28) * (1 + this.excite * 0.12);
    // depth cue is opacity + a smaller/softer halo, not a per-frame filter
    // blur - canvas `filter` has no fast path and rasterizes the whole
    // bounding box on the CPU every draw, which was the single biggest
    // cost in the whole render loop.
    var alpha = this.alpha * (1 + this.excite * 0.7) * (0.72 + this.depth * 0.28);
    var haloR = bellR * (2.0 + (1 - this.depth) * 0.7);

    cx.save();
    cx.translate(this.x, this.y);
    cx.rotate(this.tilt * 0.3);

    cx.globalCompositeOperation = 'lighter';
    var halo = cx.createRadialGradient(0, 0, bellR * 0.15, 0, 0, haloR);
    halo.addColorStop(0, 'rgba(' + r + ',' + g + ',' + b + ',' + (0.20 * alpha) + ')');
    halo.addColorStop(1, 'rgba(' + r + ',' + g + ',' + b + ',0)');
    cx.fillStyle = halo;
    cx.beginPath(); cx.arc(0, 0, haloR, 0, Math.PI * 2); cx.fill();

    // oral arms: soft wide pass + a brighter thin core for a glassy taper
    for (var a = 0; a < this.armCount; a++) {
      var baseOffset = (a - (this.armCount - 1) / 2) * bellR * 0.28;
      var armPts = [[baseOffset, bellR * 0.1]];
      var segs = 10;
      for (var s = 1; s <= segs; s++) {
        var h = this.historyAt(Math.floor(s * 1.6));
        var localX = (h.x - this.x) * 0.5 + baseOffset + Math.sin(this.t * 1.3 + s * 0.6 + a) * bellR * 0.12 * (s / segs);
        var localY = bellR * 0.1 + (s / segs) * bellR * 2.0 + (h.y - this.y) * 0.15;
        armPts.push([localX, localY]);
      }
      cx.lineCap = 'round';
      cx.beginPath();
      cx.strokeStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + (0.24 * alpha) + ')';
      cx.lineWidth = bellR * 0.09;
      smoothPath(cx, armPts, false);
      cx.stroke();
      cx.beginPath();
      cx.strokeStyle = 'rgba(255,255,255,' + (0.16 * alpha) + ')';
      cx.lineWidth = bellR * 0.025;
      smoothPath(cx, armPts, false);
      cx.stroke();
    }

    for (var i = 0; i < this.tentacleCount; i++) {
      var tx = -bellR * 0.75 + (bellR * 1.5 / (this.tentacleCount - 1)) * i;
      var tPts = [[tx, bellR * 0.05]];
      var pX = tx, pY = bellR * 0.05;
      var segs2 = 8;
      for (var s2 = 1; s2 <= segs2; s2++) {
        var h2 = this.historyAt(Math.floor(s2 * 2.2 + i));
        var wob = Math.sin(this.t * (1.4 + i * 0.11) + s2 * 0.8) * bellR * 0.22 * (s2 / segs2);
        var lX = tx * (1 - (s2 / segs2) * 0.3) + wob + (h2.x - this.x) * 0.35;
        var lY = bellR * 0.05 + (s2 / segs2) * bellR * 2.6 + (h2.y - this.y) * 0.1;
        tPts.push([lX, lY]);
        pX = lX; pY = lY;
      }
      cx.beginPath();
      cx.strokeStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + (0.22 * alpha) + ')';
      cx.lineWidth = 1;
      smoothPath(cx, tPts, false);
      cx.stroke();
    }

    // bell dome: smooth bezier-chained silhouette instead of faceted lineTo
    var domePts = [];
    var domeCount = 14;
    for (var tp = 0; tp <= domeCount; tp++) {
      var ang2 = Math.PI + (Math.PI * tp / domeCount);
      var wob2 = Math.sin(this.t * 1.7 + tp * 0.8) * bellR * 0.03 * (1 - this.pulse * 0.4);
      var rad = bellR * (1 + wob2 / bellR);
      domePts.push([Math.cos(ang2) * rad, Math.sin(ang2) * rad * 1.18 - bellR * 0.05]);
    }
    var hemPts = [];
    var hemCount = 16;
    for (var hp = 0; hp <= hemCount; hp++) {
      var hx = bellR - (bellR * 2 / hemCount) * hp;
      var frill = bellR * 0.15 + Math.sin(hp * 1.7 + this.t * 2.3) * bellR * 0.05;
      hemPts.push([hx, frill]);
    }

    cx.globalCompositeOperation = 'lighter';
    var bellGrad = cx.createRadialGradient(0, -bellR * 0.35, bellR * 0.1, 0, 0, bellR * 1.15);
    bellGrad.addColorStop(0, 'rgba(' + r + ',' + g + ',' + b + ',' + (0.9 * alpha) + ')');
    bellGrad.addColorStop(0.55, 'rgba(' + r + ',' + g + ',' + b + ',' + (0.4 * alpha) + ')');
    bellGrad.addColorStop(1, 'rgba(' + r + ',' + g + ',' + b + ',0)');
    cx.fillStyle = bellGrad;
    cx.beginPath();
    smoothPath(cx, domePts, false, false);
    smoothPath(cx, hemPts, false, true);
    cx.closePath();
    cx.fill();

    // bright rim along the dome - gives the bell a defined glassy edge
    cx.globalCompositeOperation = 'source-over';
    cx.strokeStyle = 'rgba(255,255,255,' + (0.22 * alpha) + ')';
    cx.lineWidth = 1;
    cx.beginPath();
    smoothPath(cx, domePts, false);
    cx.stroke();

    // faint radial canals fanning from the apex - the detail that reads as
    // "jellyfish" rather than "blob"
    cx.globalCompositeOperation = 'lighter';
    cx.strokeStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + (0.14 * alpha) + ')';
    cx.lineWidth = 0.7;
    var ribCount = 5;
    for (var rb = 0; rb < ribCount; rb++) {
      var rt = rb / (ribCount - 1);
      var rang = Math.PI * (0.18 + 0.64 * rt);
      cx.beginPath();
      cx.moveTo(0, -bellR * 0.08);
      cx.quadraticCurveTo(Math.cos(rang) * bellR * 0.55, -bellR * 0.02, Math.cos(rang) * bellR * 0.88, Math.sin(rang) * bellR * 0.42 - bellR * 0.05);
      cx.stroke();
    }

    var coreA = 0.35 * alpha * (0.4 + this.pulse * 0.6);
    var core = cx.createRadialGradient(0, -bellR * 0.15, 0, 0, -bellR * 0.15, bellR * 0.7);
    core.addColorStop(0, 'rgba(255,255,255,' + coreA + ')');
    // a mid stop softens the falloff so it doesn't read as a hard ring
    // where it overlaps the bell gradient's own falloff underneath
    core.addColorStop(0.5, 'rgba(' + r + ',' + g + ',' + b + ',' + (coreA * 0.35) + ')');
    core.addColorStop(1, 'rgba(' + r + ',' + g + ',' + b + ',0)');
    cx.fillStyle = core;
    cx.beginPath(); cx.arc(0, -bellR * 0.15, bellR * 0.7, 0, Math.PI * 2); cx.fill();

    cx.globalCompositeOperation = 'source-over';
    cx.restore();
  };

  // --------------------------------------------------------------- Mote
  function Mote(field) { this.field = field; this.reset(true); }
  Mote.prototype.reset = function (initial) {
    var f = this.field;
    this.x = rand(0, f.W); this.y = initial ? rand(0, f.H) : f.H + rand(0, 40);
    this.r = rand(0.4, 1.6); this.speed = rand(0.04, 0.16); this.drift = rand(-0.08, 0.08);
    this.twinklePhase = rand(0, Math.PI * 2); this.twinkleSpeed = rand(0.3, 0.9);
    this.alpha = rand(0.12, 0.45);
    this.excite = 0;
  };
  Mote.prototype.update = function (dt) {
    var f = this.field, p = f.pointer;
    this.y -= this.speed * dt * 60;
    this.x += this.drift * dt * 60;
    var exciteTarget = 0;
    if (p.active && !f.reduceMotion) {
      var dx = this.x - p.x, dy = this.y - p.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 160 && dist > 0.001) {
        var force = (1 - dist / 160) * 0.6;
        var tangent = (1 - dist / 160) * 0.35;
        this.x += (dx / dist) * force - (dy / dist) * tangent;
        this.y += (dy / dist) * force + (dx / dist) * tangent;
        exciteTarget = 1 - dist / 160;
      }
    }
    this.excite += (exciteTarget - this.excite) * 0.1;
    this.twinklePhase += dt * this.twinkleSpeed;
    if (this.y < -10) this.reset(false);
  };
  Mote.prototype.draw = function (cx) {
    var tw = (Math.sin(this.twinklePhase) + 1) / 2;
    var a = this.alpha * (0.4 + tw * 0.6) * (1 + this.excite * 1.6);
    var rr = this.r * (1 + this.excite * 0.8);
    cx.fillStyle = 'rgba(220,238,242,' + clamp(a, 0, 1) + ')';
    cx.beginPath(); cx.arc(this.x, this.y, rr, 0, Math.PI * 2); cx.fill();
  };

  // ------------------------------------------------------------- Bubble
  function Bubble(field) { this.field = field; this.reset(true); }
  Bubble.prototype.reset = function (initial) {
    var f = this.field;
    this.x = rand(0.02, 0.98) * f.W;
    this.y = initial ? rand(0, f.H) : f.H + rand(10, 60);
    this.r = rand(2, 7);
    this.speed = rand(0.3, 0.8) * (1 - this.r / 12);
    this.wobFreq = rand(0.6, 1.4);
    this.wobAmp = rand(4, 14);
    this.phase = rand(0, Math.PI * 2);
    this.t = 0;
  };
  Bubble.prototype.update = function (dt) {
    var f = this.field, p = f.pointer;
    this.t += dt;
    this.y -= this.speed * dt * 60;
    this.x += Math.sin(this.t * this.wobFreq + this.phase) * this.wobAmp * dt;
    if (p.active && !f.reduceMotion) {
      var dx = this.x - p.x, dy = this.y - p.y, dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 90 && dist > 0.001) {
        var force = (1 - dist / 90) * 0.8;
        this.x += (dx / dist) * force; this.y += (dy / dist) * force;
      }
    }
    if (this.y < -this.r - 10) this.reset(false);
  };
  Bubble.prototype.draw = function (cx) {
    cx.globalCompositeOperation = 'lighter';
    cx.strokeStyle = 'rgba(210,240,250,0.35)';
    cx.lineWidth = 1;
    cx.beginPath(); cx.arc(this.x, this.y, this.r, 0, Math.PI * 2); cx.stroke();
    cx.fillStyle = 'rgba(210,240,250,0.10)';
    cx.beginPath(); cx.arc(this.x, this.y, this.r, 0, Math.PI * 2); cx.fill();
    // specular highlight - the detail that reads as "glass" rather than "dot"
    cx.fillStyle = 'rgba(255,255,255,0.55)';
    cx.beginPath();
    cx.arc(this.x - this.r * 0.35, this.y - this.r * 0.35, Math.max(0.5, this.r * 0.28), 0, Math.PI * 2);
    cx.fill();
    cx.globalCompositeOperation = 'source-over';
  };

  // ---------------------------------------------------------- Fish/School
  function School(field, phase) {
    this.field = field;
    this.phase = phase;
    this.x = rand(0.2, 0.8) * field.W;
    this.y = rand(0.25, 0.75) * field.H;
    this.t = rand(0, 100);
  }
  School.prototype.update = function (dt) {
    var f = this.field;
    this.t += dt;
    this.x += Math.cos(this.t * 0.05 + this.phase) * 0.35 * dt * 60;
    this.y += Math.sin(this.t * 0.04 + this.phase * 1.4) * 0.16 * dt * 60;
    if (this.x < -80) this.x = f.W + 80; if (this.x > f.W + 80) this.x = -80;
    this.y = clamp(this.y, f.H * 0.12, f.H * 0.85);
  };

  function Fish(field, school) {
    this.field = field; this.school = school;
    this.color = pick(field.options.colors);
    this.size = rand(4.5, 10);
    this.offX = rand(-50, 50); this.offY = rand(-40, 40);
    this.wiggle = rand(0, Math.PI * 2);
    this.wiggleSpeed = rand(5, 8.5);
    this.speed = rand(0.6, 1);
    this.vx = 0.3; this.vy = 0;
    this.x = school.x + this.offX; this.y = school.y + this.offY;
  }
  Fish.prototype.update = function (dt) {
    var f = this.field, s = this.school, p = f.pointer;
    var tx = s.x + this.offX, ty = s.y + this.offY;
    var dx = tx - this.x, dy = ty - this.y;
    var d = Math.sqrt(dx * dx + dy * dy) || 1;
    var ax = (dx / d) * this.speed, ay = (dy / d) * this.speed * 0.5;
    if (p.active && !f.reduceMotion) {
      var pdx = this.x - p.x, pdy = this.y - p.y, pd = Math.sqrt(pdx * pdx + pdy * pdy);
      if (pd < 110 && pd > 0.001) {
        var fo = (1 - pd / 110) * 2.2;
        ax += (pdx / pd) * fo; ay += (pdy / pd) * fo;
      }
    }
    this.vx += (ax - this.vx) * 0.04;
    this.vy += (ay - this.vy) * 0.04;
    this.x += this.vx * dt * 60;
    this.y += this.vy * dt * 60;
    this.wiggle += dt * this.wiggleSpeed * (0.6 + Math.abs(this.vx) * 0.6);
  };
  Fish.prototype.draw = function (cx) {
    var c = this.color, sz = this.size, dir = this.vx < -0.02 ? -1 : 1;
    cx.save();
    cx.translate(this.x, this.y);
    cx.scale(dir, 1);
    cx.globalCompositeOperation = 'lighter';
    cx.fillStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',0.20)';
    cx.strokeStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',0.6)';
    cx.lineWidth = 0.8;
    cx.beginPath();
    cx.moveTo(sz * 1.3, 0);
    cx.quadraticCurveTo(sz * 0.2, -sz * 0.6, -sz * 1.0, 0);
    cx.quadraticCurveTo(sz * 0.2, sz * 0.6, sz * 1.3, 0);
    cx.closePath();
    cx.fill(); cx.stroke();
    var tailWag = Math.sin(this.wiggle) * sz * 0.35;
    cx.beginPath();
    cx.moveTo(-sz * 0.95, 0);
    cx.lineTo(-sz * 1.8, -sz * 0.5 + tailWag);
    cx.lineTo(-sz * 1.8, sz * 0.5 + tailWag);
    cx.closePath();
    cx.fill();
    cx.globalCompositeOperation = 'source-over';
    cx.restore();
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

  // Applied in order, once each, the first time sustained frame time is
  // too slow. Never upgrades back - avoids visible thrashing.
  var DOWNGRADES = [
    function (f) { f.show.godRays = false; },
    function (f) { f.options.sparks = false; f.sparks.length = 0; },
    function (f) { f.bubbles.length = Math.ceil(f.bubbles.length * 0.5); },
    function (f) { f.motes.length = Math.ceil(f.motes.length * 0.55); },
    function (f) { f.fish.length = Math.ceil(f.fish.length * 0.5); },
    function (f) { if (f.jellies.length > 4) f.jellies.length -= 2; },
    function (f) { f.options.cursorGlow = false; }
  ];

  function Field(container, options) {
    this.container = container;
    this.options = Object.assign({}, DEFAULTS, options || {});
    if (!this.options.elements || !this.options.elements.length) this.options.elements = ['jellyfish'];
    this.reduceMotion = this.options.respectReducedMotion &&
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var els = this.options.elements;
    this.show = {
      jellyfish: has(els, 'jellyfish'),
      bubbles: has(els, 'bubbles'),
      fish: has(els, 'fish'),
      godRays: has(els, 'godRays'),
      motes: has(els, 'motes')
    };

    this.pointer = { x: -9999, y: -9999, vx: 0, vy: 0, active: false };
    this.sparks = [];
    this.ripples = [];
    this._destroyed = false;
    this._inView = true;
    this._frameMs = 16;
    this._sinceCheck = 0;
    this._downgradeStep = 0;

    this._buildDOM();
    this._bind();
    this.resize();

    this.jellies = [];
    this.motes = [];
    this.bubbles = [];
    this.fish = [];
    this.schools = [];
    this._populate();

    this._lastT = performance.now();
    this._raf = requestAnimationFrame(this._loop.bind(this));
  }

  Field.prototype._populate = function () {
    var opt = this.options;
    if (this.show.jellyfish) {
      for (var i = 0; i < opt.jellyfishCount; i++) this.jellies.push(new Jelly(this));
      this.jellies.sort(function (a, b) { return a.depth - b.depth; });
    }
    if (this.show.motes) {
      for (var j = 0; j < opt.particleCount; j++) this.motes.push(new Mote(this));
    }
    if (this.show.bubbles) {
      for (var k = 0; k < opt.bubbleCount; k++) this.bubbles.push(new Bubble(this));
    }
    if (this.show.fish) {
      var schoolCount = Math.max(1, Math.min(3, Math.round(opt.fishCount / 8)));
      for (var sc = 0; sc < schoolCount; sc++) this.schools.push(new School(this, sc * 2.1));
      for (var fi = 0; fi < opt.fishCount; fi++) this.fish.push(new Fish(this, this.schools[fi % this.schools.length]));
    }
  };

  /**
   * Swap which element systems are running without tearing down the
   * canvas or event listeners. Missing systems are (re)populated on
   * demand; removed ones are simply cleared.
   */
  Field.prototype.setElements = function (elements) {
    if (!elements || !elements.length) return;
    var self = this, opt = this.options;
    this.options.elements = elements;
    this.show = {
      jellyfish: has(elements, 'jellyfish'),
      bubbles: has(elements, 'bubbles'),
      fish: has(elements, 'fish'),
      godRays: has(elements, 'godRays'),
      motes: has(elements, 'motes')
    };
    if (this.show.jellyfish && !this.jellies.length) {
      for (var i = 0; i < opt.jellyfishCount; i++) this.jellies.push(new Jelly(self));
    }
    if (this.show.motes && !this.motes.length) {
      for (var j = 0; j < opt.particleCount; j++) this.motes.push(new Mote(self));
    }
    if (this.show.bubbles && !this.bubbles.length) {
      for (var k = 0; k < opt.bubbleCount; k++) this.bubbles.push(new Bubble(self));
    }
    if (this.show.fish && !this.fish.length) {
      if (!this.schools.length) {
        var schoolCount = Math.max(1, Math.min(3, Math.round(opt.fishCount / 8)));
        for (var sc = 0; sc < schoolCount; sc++) this.schools.push(new School(self, sc * 2.1));
      }
      for (var fi = 0; fi < opt.fishCount; fi++) this.fish.push(new Fish(self, this.schools[fi % this.schools.length]));
    }
    if (!this.show.jellyfish) this.jellies.length = 0;
    if (!this.show.motes) this.motes.length = 0;
    if (!this.show.bubbles) this.bubbles.length = 0;
    if (!this.show.fish) this.fish.length = 0;
  };

  Field.prototype._buildDOM = function () {
    var cs = getComputedStyle(this.container);
    if (cs.position === 'static') this.container.style.position = 'relative';
    this.container.style.overflow = this.container.style.overflow || 'hidden';

    this.cv = document.createElement('canvas');
    this.cv.style.position = 'absolute';
    this.cv.style.inset = '0';
    this.cv.style.display = 'block';
    this.cv.style.pointerEvents = 'none';
    // own compositing layer, so scroll/paint elsewhere on the page
    // doesn't force the browser to re-rasterize the canvas
    this.cv.style.willChange = 'transform';
    this.cv.style.transform = 'translateZ(0)';
    this.container.appendChild(this.cv);
    this.cx = this.cv.getContext('2d', { alpha: false });
  };

  Field.prototype._bind = function () {
    var self = this;
    this._onResize = function () { self.resize(); };
    this._onMove = function (e) {
      var rect = self.container.getBoundingClientRect();
      var nx = e.clientX - rect.left, ny = e.clientY - rect.top;
      self.pointer.vx = self.pointer.active ? nx - self.pointer.x : 0;
      self.pointer.vy = self.pointer.active ? ny - self.pointer.y : 0;
      self.pointer.x = nx; self.pointer.y = ny;
      self.pointer.active = true;
    };
    this._onLeave = function () { self.pointer.active = false; };
    this._onDown = function (e) {
      if (!self.options.clickBursts || self.reduceMotion) return;
      var rect = self.container.getBoundingClientRect();
      var x = e.clientX - rect.left, y = e.clientY - rect.top;
      var color = pick(self.options.colors);
      self.ripples.push(new Ripple(x, y, color));
      for (var i = 0; i < 14; i++) {
        var ang = rand(0, Math.PI * 2), sp = rand(0.4, 2.2);
        var sp2 = new Spark(x, y, color);
        sp2.vx = Math.cos(ang) * sp; sp2.vy = Math.sin(ang) * sp;
        self.sparks.push(sp2);
      }
      for (var j = 0; j < self.jellies.length; j++) {
        var jl = self.jellies[j];
        var dx = jl.x - x, dy = jl.y - y, dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 300 && dist > 0.001) {
          var force = (1 - dist / 300) * 4;
          jl.vx += (dx / dist) * force; jl.vy += (dy / dist) * force;
        }
      }
    };
    this._onVisibility = function () {
      if (!document.hidden) self._lastT = performance.now();
    };

    // Bound to window/document, not the container: page content sitting on
    // top of the background container would otherwise swallow the pointer
    // events and the field would only react near the viewport edges.
    window.addEventListener('resize', this._onResize);
    window.addEventListener('pointermove', this._onMove, { passive: true });
    window.addEventListener('pointerdown', this._onDown, { passive: true });
    document.documentElement.addEventListener('mouseleave', this._onLeave);
    window.addEventListener('blur', this._onLeave);
    document.addEventListener('visibilitychange', this._onVisibility);

    if (window.ResizeObserver) {
      this._ro = new ResizeObserver(this._onResize);
      this._ro.observe(this.container);
    }
    if (window.IntersectionObserver) {
      this._io = new IntersectionObserver(function (entries) {
        self._inView = entries[entries.length - 1].isIntersecting;
        if (self._inView) self._lastT = performance.now();
      }, { threshold: 0 });
      this._io.observe(this.container);
    }
  };

  Field.prototype.resize = function () {
    var rect = this.container.getBoundingClientRect();
    var W = rect.width || window.innerWidth;
    var H = rect.height || window.innerHeight;
    // Mobile browsers fire resize/ResizeObserver on scroll (address-bar
    // show/hide); skip the (expensive) canvas reallocation when the size
    // didn't actually change.
    if (W === this.W && H === this.H) return;
    this.W = W; this.H = H;
    var DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    this.cv.width = this.W * DPR; this.cv.height = this.H * DPR;
    this.cv.style.width = this.W + 'px'; this.cv.style.height = this.H + 'px';
    this.cx.setTransform(DPR, 0, 0, DPR, 0, 0);
  };

  Field.prototype._loop = function (now) {
    if (this._destroyed) return;
    var dt = Math.min((now - this._lastT) / 1000, 0.05);
    this._lastT = now;

    // Tab hidden or container scrolled out of view: skip all drawing but
    // keep the rAF chain alive so it resumes instantly, with no dt spike.
    if (document.hidden || !this._inView) {
      this._raf = requestAnimationFrame(this._loop.bind(this));
      return;
    }

    var frameStart = now;
    var opt = this.options, cx = this.cx;

    cx.clearRect(0, 0, this.W, this.H);
    var bg = cx.createLinearGradient(0, 0, 0, this.H);
    bg.addColorStop(0, opt.background[0]);
    bg.addColorStop(0.6, opt.background[1]);
    bg.addColorStop(1, opt.background[2]);
    cx.fillStyle = bg;
    cx.fillRect(0, 0, this.W, this.H);

    if (this.show.godRays) drawGodRays(cx, this.W, this.H, now / 1000);

    for (var m = 0; m < this.motes.length; m++) {
      if (!this.reduceMotion) this.motes[m].update(dt);
      this.motes[m].draw(cx);
    }
    for (var bu = 0; bu < this.bubbles.length; bu++) {
      if (!this.reduceMotion) this.bubbles[bu].update(dt);
      this.bubbles[bu].draw(cx);
    }
    for (var sc = 0; sc < this.schools.length; sc++) {
      if (!this.reduceMotion) this.schools[sc].update(dt);
    }
    for (var fi = 0; fi < this.fish.length; fi++) {
      if (!this.reduceMotion) this.fish[fi].update(dt);
      this.fish[fi].draw(cx);
    }
    for (var j = 0; j < this.jellies.length; j++) {
      if (!this.reduceMotion) this.jellies[j].update(dt);
      this.jellies[j].draw(cx);
    }

    if (opt.cursorGlow && this.pointer.active && !this.reduceMotion) {
      var pulse = 0.7 + Math.sin(now / 420) * 0.15;
      var speedBoost = clamp(Math.sqrt(this.pointer.vx * this.pointer.vx + this.pointer.vy * this.pointer.vy) * 0.05, 0, 0.6);
      var gr = 60 + speedBoost * 40;
      var glow = cx.createRadialGradient(this.pointer.x, this.pointer.y, 0, this.pointer.x, this.pointer.y, gr);
      glow.addColorStop(0, 'rgba(220,245,255,' + (0.16 * pulse + speedBoost * 0.12) + ')');
      glow.addColorStop(0.5, 'rgba(150,220,235,' + (0.06 * pulse) + ')');
      glow.addColorStop(1, 'rgba(150,220,235,0)');
      cx.globalCompositeOperation = 'lighter';
      cx.fillStyle = glow;
      cx.beginPath(); cx.arc(this.pointer.x, this.pointer.y, gr, 0, Math.PI * 2); cx.fill();
      cx.globalCompositeOperation = 'source-over';
    }

    for (var r = this.ripples.length - 1; r >= 0; r--) {
      var rp = this.ripples[r];
      if (!this.reduceMotion) rp.update(dt);
      rp.draw(cx);
      if (rp.life <= 0) this.ripples.splice(r, 1);
    }

    for (var i = this.sparks.length - 1; i >= 0; i--) {
      var s = this.sparks[i];
      if (!this.reduceMotion) s.update(dt);
      s.draw(cx);
      if (s.life <= 0) this.sparks.splice(i, 1);
    }
    if (this.sparks.length > 400) this.sparks.splice(0, this.sparks.length - 400);

    if (opt.adaptiveQuality && this._downgradeStep < DOWNGRADES.length) {
      var frameMs = performance.now() - frameStart;
      this._frameMs += (frameMs - this._frameMs) * 0.05;
      this._sinceCheck++;
      if (this._sinceCheck > 90) {
        this._sinceCheck = 0;
        if (this._frameMs > 20) {
          DOWNGRADES[this._downgradeStep](this);
          this._downgradeStep++;
        }
      }
    }

    this._raf = requestAnimationFrame(this._loop.bind(this));
  };

  Field.prototype.destroy = function () {
    this._destroyed = true;
    cancelAnimationFrame(this._raf);
    window.removeEventListener('resize', this._onResize);
    window.removeEventListener('pointermove', this._onMove);
    window.removeEventListener('pointerdown', this._onDown);
    document.documentElement.removeEventListener('mouseleave', this._onLeave);
    window.removeEventListener('blur', this._onLeave);
    document.removeEventListener('visibilitychange', this._onVisibility);
    if (this._ro) this._ro.disconnect();
    if (this._io) this._io.disconnect();
    if (this.cv.parentNode) this.cv.parentNode.removeChild(this.cv);
  };

  return {
    /**
     * Initialize the underwater field inside a container.
     * @param {string|HTMLElement} target - element id or element itself
     * @param {object} [options] - see README for full list
     * @returns {{destroy: function, setElements: function}} instance handle
     */
    init: function (target, options) {
      var el = typeof target === 'string' ? document.getElementById(target) : target;
      if (!el) throw new Error('JellyfishBG.init: target element not found');
      return new Field(el, options);
    },
    elements: ALL_ELEMENTS.slice(),
    defaults: DEFAULTS
  };
}));
