# JellyfishBG

A free, dependency-free, animated bioluminescent underwater background —
jellyfish, bubbles, fish, light rays, marine snow, pick any mix. Drop in
one script tag, call `JellyfishBG.init()`, done — same idea as
[particles.js](https://particles.js.org), but jellyfish.

Pure vanilla JS, UMD module. No build step, no npm required to *use* it
(only to re-minify if you edit the source). ~10 KB minified.

---

## 1. Use it right now (before you deploy anything)

```html
<div id="jellyfish-bg" style="position:fixed;inset:0;z-index:-1;"></div>
<script src="dist/jellyfish-bg.min.js"></script>
<script>
  JellyfishBG.init('jellyfish-bg');
</script>
```

`init(target, options)` accepts either an element id (string) or a DOM
node, plus an optional options object (full list below). It returns a
handle so you can clean up later (useful in SPAs):

```js
const field = JellyfishBG.init('jellyfish-bg');
// ...
field.destroy();
```

`elements` picks which systems render — any subset of `'jellyfish'`,
`'bubbles'`, `'fish'`, `'godRays'`, `'motes'`, from one to all five:

```js
JellyfishBG.init('jellyfish-bg', { elements: ['bubbles', 'fish'] });
```

Swap the mix later without tearing anything down:

```js
field.setElements(['jellyfish', 'motes']);
```

---

## 2. Use it inside one container, not the whole page

`init()` works on *any* element — it doesn't have to be a full-page
background. Give the container a real size (width/height, not `fixed`),
JellyfishBG fills exactly that box and clips to it.

```html
<div id="hero" style="position:relative; width:100%; height:480px;">
  <div id="hero-jellyfish" style="position:absolute; inset:0; z-index:0;"></div>
  <h1 style="position:relative; z-index:1;">Your content on top</h1>
</div>

<script src="dist/jellyfish-bg.min.js"></script>
<script>
  JellyfishBG.init('hero-jellyfish', {
    jellyfishCount: 4,
    particleCount: 60
  });
</script>
```

Notes:
- The target container gets `position:relative` and `overflow:hidden`
  set automatically if it's `static` — so any absolutely-positioned
  child (your `<h1>` above, or the jellyfish div itself) stacks inside
  it correctly.
- Lower `jellyfishCount` / `particleCount` for small containers —
  the defaults (8 / 140) are tuned for full-page hero sections.
- Resizing the container (window resize, or the box itself changing
  size) is handled automatically via `ResizeObserver`.

---

## 3. Options reference

All optional, passed as the second argument to `init()`.

| Option | Default | Description |
|---|---|---|
| `elements` | `['jellyfish','bubbles','fish','godRays','motes']` | Which systems render — any subset |
| `jellyfishCount` | `8` | Number of jellyfish on screen |
| `bubbleCount` | `26` | Rising glassy bubbles |
| `fishCount` | `18` | Fish, split across 1–3 schools |
| `particleCount` | `140` | Ambient marine-snow particles |
| `colors` | 5 presets (`[[94,234,212], [167,139,250], [244,114,182], [125,211,252], [253,224,138]]`) | Array of `[r,g,b]` glow colors, picked randomly per creature |
| `driftSpeed` | `0.15` | Base upward swim speed for jellyfish |
| `pointerInfluence` | `220` | Radius (px) of pointer disturbance |
| `pointerStrength` | `0.9` | How strongly the pointer pushes jellyfish |
| `sparkChance` | `0.35` | Chance per tick a jellyfish emits a spark |
| `background` | `['rgba(6,20,34,1)','rgba(3,10,18,1)','rgba(2,4,9,1)']` | Gradient stops for the canvas backdrop |
| `sparks` | `true` | Toggle bioluminescent spark flashes on jellyfish |
| `cursorGlow` | `true` | Soft light halo that follows the pointer |
| `clickBursts` | `true` | Ripple + spark burst on click/tap |
| `adaptiveQuality` | `true` | Automatically lowers effects if a device can't keep up |
| `respectReducedMotion` | `true` | Freezes animation for `prefers-reduced-motion` users |

---

## 4. API reference

```js
JellyfishBG.init(target, options) -> handle
```
- `target`: element id string, or an `HTMLElement`.
- `options`: any subset of the table above.
- Returns a `handle`:
  - `handle.destroy()` — stops the animation, removes listeners and canvas.
  - `handle.setElements(elements)` — swap the active systems live, no teardown.

```js
JellyfishBG.elements   // ['jellyfish','bubbles','fish','godRays','motes']
JellyfishBG.defaults   // the full DEFAULTS object above
```

---

## 5. Framework integrations

Each block below is a ready-to-paste prompt. Copy the one for your stack
and paste it directly into your AI coding tool (Claude, ChatGPT, Cursor,
Copilot Chat, etc.) inside your project — it has everything the AI needs
to wire the integration correctly on its own.

### HTML / vanilla JS

```
Add JellyfishBG, a dependency-free animated background library, to this
project.

1. Add this script tag before </body> in the target HTML page:
   <script src="https://cdn.jsdelivr.net/gh/haryskit/jellyfish-bg@latest/dist/jellyfish-bg.min.js"></script>
2. Add a container element for it, e.g.:
   <div id="jellyfish-bg" style="position:fixed;inset:0;z-index:-1;"></div>
   (use position:fixed + inset:0 + z-index:-1 for a full-page background,
   or position:relative + explicit width/height on a parent + this div
   as position:absolute;inset:0 if it should sit inside one section only)
3. After the script tag, initialize it:
   <script>
     JellyfishBG.init('jellyfish-bg', {
       elements: ['jellyfish', 'bubbles', 'motes'],
       jellyfishCount: 8,
       particleCount: 140
     });
   </script>

API: JellyfishBG.init(targetIdOrElement, options) returns a handle with
.destroy() and .setElements(array). Full options list: elements,
jellyfishCount, bubbleCount, fishCount, particleCount, colors (array of
[r,g,b]), driftSpeed, pointerInfluence, pointerStrength, sparkChance,
background (array of CSS color strings), sparks, cursorGlow, clickBursts,
adaptiveQuality, respectReducedMotion — all optional, sane defaults.
```

### React (CRA / Vite / any client-rendered app)

```
Add JellyfishBG, a dependency-free animated background library, to this
React app.

1. Load the library once at app startup, either:
   a) via a script tag in public/index.html (or index.html for Vite):
      <script src="https://cdn.jsdelivr.net/gh/haryskit/jellyfish-bg@latest/dist/jellyfish-bg.min.js"></script>
      and reference it in code as window.JellyfishBG, or
   b) via npm if it's published: npm install jellyfish-bg, then
      import JellyfishBG from 'jellyfish-bg';

2. Create a reusable component, e.g. src/components/JellyfishBackground.jsx:

   import { useEffect, useRef } from 'react';

   export default function JellyfishBackground({ options, style, className }) {
     const containerRef = useRef(null);
     const fieldRef = useRef(null);

     useEffect(() => {
       const lib = window.JellyfishBG; // or the npm import
       fieldRef.current = lib.init(containerRef.current, options);
       return () => fieldRef.current?.destroy();
       // eslint-disable-next-line react-hooks/exhaustive-deps
     }, []);

     return (
       <div
         ref={containerRef}
         className={className}
         style={{ position: 'fixed', inset: 0, zIndex: -1, ...style }}
       />
     );
   }

3. Use it:
   <JellyfishBackground options={{ elements: ['jellyfish', 'fish'], jellyfishCount: 6 }} />

   For a background scoped to one section instead of the full page, drop
   the fixed/inset:0/zIndex:-1 styles, give the parent a real height, and
   set the container to position:absolute;inset:0 with your content
   rendered after it at a higher z-index.

Notes: init once on mount (empty dependency array); if `options` needs to
change after mount, call fieldRef.current.setElements([...]) rather than
re-running init. Always call .destroy() in the effect cleanup to avoid
leaking the animation loop across re-mounts (React StrictMode double-
invokes effects in dev — destroy() must be idempotent-safe, which it is).

API: JellyfishBG.init(targetIdOrElement, options) returns a handle with
.destroy() and .setElements(array). Full options list: elements,
jellyfishCount, bubbleCount, fishCount, particleCount, colors, driftSpeed,
pointerInfluence, pointerStrength, sparkChance, background, sparks,
cursorGlow, clickBursts, adaptiveQuality, respectReducedMotion.
```

### Next.js (App Router)

```
Add JellyfishBG, a dependency-free animated background library, to this
Next.js (App Router) project. It touches the DOM and canvas directly, so
it must only run on the client — never during SSR.

1. Load the script with next/script in app/layout.tsx (or the layout
   wrapping the pages that need it):

   import Script from 'next/script';

   <Script
     src="https://cdn.jsdelivr.net/gh/haryskit/jellyfish-bg@latest/dist/jellyfish-bg.min.js"
     strategy="beforeInteractive"
   />

2. Create a client component, e.g. components/JellyfishBackground.tsx:

   'use client';
   import { useEffect, useRef } from 'react';

   type JellyfishHandle = { destroy: () => void; setElements: (els: string[]) => void };
   declare global {
     interface Window { JellyfishBG: { init: (t: HTMLElement, o?: object) => JellyfishHandle }; }
   }

   export default function JellyfishBackground({ options, style, className }: {
     options?: Record<string, unknown>;
     style?: React.CSSProperties;
     className?: string;
   }) {
     const containerRef = useRef<HTMLDivElement>(null);
     const fieldRef = useRef<JellyfishHandle | null>(null);

     useEffect(() => {
       if (!containerRef.current || !window.JellyfishBG) return;
       fieldRef.current = window.JellyfishBG.init(containerRef.current, options);
       return () => fieldRef.current?.destroy();
       // eslint-disable-next-line react-hooks/exhaustive-deps
     }, []);

     return (
       <div
         ref={containerRef}
         className={className}
         style={{ position: 'fixed', inset: 0, zIndex: -1, ...style }}
       />
     );
   }

3. Use it inside a page or layout (the component itself is already
   client-only via 'use client', so it's safe to render from a server
   component parent):
   <JellyfishBackground options={{ jellyfishCount: 6, particleCount: 100 }} />

Notes: 'use client' is required on the wrapper — the effect touches
window/canvas which don't exist during server render. Guard on
window.JellyfishBG existing in case the effect fires before the Script
tag finishes loading (or switch Script to strategy="afterInteractive" and
add a small polling/retry if init must run as early as possible).

API: JellyfishBG.init(targetIdOrElement, options) returns a handle with
.destroy() and .setElements(array). Full options list: elements,
jellyfishCount, bubbleCount, fishCount, particleCount, colors, driftSpeed,
pointerInfluence, pointerStrength, sparkChance, background, sparks,
cursorGlow, clickBursts, adaptiveQuality, respectReducedMotion.
```

### Vue 3

```
Add JellyfishBG, a dependency-free animated background library, to this
Vue 3 project.

1. Load it via a script tag in index.html:
   <script src="https://cdn.jsdelivr.net/gh/haryskit/jellyfish-bg@latest/dist/jellyfish-bg.min.js"></script>
   (accessible globally as window.JellyfishBG)

2. Create a component, e.g. src/components/JellyfishBackground.vue:

   <script setup>
   import { ref, onMounted, onBeforeUnmount } from 'vue';

   const props = defineProps({ options: { type: Object, default: () => ({}) } });
   const containerRef = ref(null);
   let field = null;

   onMounted(() => {
     field = window.JellyfishBG.init(containerRef.value, props.options);
   });
   onBeforeUnmount(() => field?.destroy());
   </script>

   <template>
     <div ref="containerRef" style="position:fixed;inset:0;z-index:-1;" />
   </template>

3. Use it:
   <JellyfishBackground :options="{ elements: ['jellyfish', 'bubbles'], jellyfishCount: 6 }" />

API: JellyfishBG.init(targetIdOrElement, options) returns a handle with
.destroy() and .setElements(array). Full options list: elements,
jellyfishCount, bubbleCount, fishCount, particleCount, colors, driftSpeed,
pointerInfluence, pointerStrength, sparkChance, background, sparks,
cursorGlow, clickBursts, adaptiveQuality, respectReducedMotion.
```

### Svelte

```
Add JellyfishBG, a dependency-free animated background library, to this
Svelte project.

1. Load it via a script tag in your app.html (SvelteKit) or index.html
   (plain Svelte):
   <script src="https://cdn.jsdelivr.net/gh/haryskit/jellyfish-bg@latest/dist/jellyfish-bg.min.js"></script>

2. Create a component, e.g. src/lib/JellyfishBackground.svelte:

   <script>
     import { onMount, onDestroy } from 'svelte';
     export let options = {};
     let container;
     let field;

     onMount(() => {
       field = window.JellyfishBG.init(container, options);
     });
     onDestroy(() => field?.destroy());
   </script>

   <div bind:this={container} style="position:fixed;inset:0;z-index:-1;" />

3. Use it:
   <JellyfishBackground options={{ elements: ['jellyfish', 'motes'], jellyfishCount: 6 }} />

If using SvelteKit, wrap the onMount body only (already client-only by
default) — no extra SSR guard needed since onMount never runs server-side.

API: JellyfishBG.init(targetIdOrElement, options) returns a handle with
.destroy() and .setElements(array). Full options list: elements,
jellyfishCount, bubbleCount, fishCount, particleCount, colors, driftSpeed,
pointerInfluence, pointerStrength, sparkChance, background, sparks,
cursorGlow, clickBursts, adaptiveQuality, respectReducedMotion.
```

---

## 6. Deploy it for free, so *anyone* can `<script src="...">` it

You don't need to pay for hosting — a public GitHub repo plus the
**jsDelivr** CDN gives you a permanent, fast, free URL for the script.
This is exactly how particles.js and most small JS libraries do it.

### Step-by-step

1. **Create a free GitHub account** at github.com if you don't have one.
2. **Create a new public repository**, e.g. `jellyfish-bg`.
3. **Push this folder to it:**
   ```bash
   cd jellyfish-bg
   git init
   git add .
   git commit -m "Initial release"
   git branch -M main
   git remote add origin https://github.com/haryskit/jellyfish-bg.git
   git push -u origin main
   ```
4. **That's it — jsDelivr is already serving your file**, free, with no
   sign-up on their side, at:
   ```
   https://cdn.jsdelivr.net/gh/haryskit/jellyfish-bg@main/dist/jellyfish-bg.min.js
   ```
   Anyone can now put that URL in a `<script src="...">` tag on any site.

5. **(Recommended) Tag a release** so the URL is stable and cached hard
   by the CDN forever, instead of tracking a branch that can change:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
   Then use:
   ```
   https://cdn.jsdelivr.net/gh/haryskit/jellyfish-bg@1.0.0/dist/jellyfish-bg.min.js
   ```
   `@latest` also works and always points at your newest tag:
   ```
   https://cdn.jsdelivr.net/gh/haryskit/jellyfish-bg@latest/dist/jellyfish-bg.min.js
   ```

6. **Host the demo page (`index.html`) itself for free with GitHub
   Pages** so you have a `particles.js.org`-style landing page:
   - In your repo: **Settings → Pages → Source → Deploy from branch →
     `main` / `/ (root)`** → Save.
   - After a minute your demo is live at:
     ```
     https://haryskit.github.io/jellyfish-bg/
     ```
   - Before that, update the two `haryskit` placeholders in
     `index.html` to your actual GitHub username.

No credit card, no paid tier, no server to maintain — GitHub Pages and
jsDelivr are both free indefinitely for public repos.

### Alternatives to GitHub Pages (all free, pick any one)

- **Netlify** — drag-and-drop the folder in their dashboard, or connect
  the GitHub repo for auto-deploys.
- **Vercel** — same idea, `vercel.com`, connect the repo.
- **Cloudflare Pages** — connect the repo, deploys on every push.

You only need one of these for the *demo site*. The library file itself
is already served by jsDelivr the moment it's on GitHub — you don't need
any of these just to distribute the script.

### Optional: publish to npm too (also free)

If you want `npm install jellyfish-bg` to work, and to also be available
via `https://cdn.jsdelivr.net/npm/jellyfish-bg` (jsDelivr auto-mirrors
npm packages) and unpkg:

```bash
npm login
npm publish --access public
```

---

## 7. Rebuilding the minified file after edits

```bash
npm install
npx terser dist/jellyfish-bg.js -c -m --comments '/^!/' -o dist/jellyfish-bg.min.js
```

---

## Files

```
jellyfish-bg/
├─ dist/
│  ├─ jellyfish-bg.js       # readable source, UMD module
│  └─ jellyfish-bg.min.js   # minified, ~10 KB — this is what you ship
├─ index.html                # demo / docs landing page
├─ package.json
└─ README.md
```

## License

MIT — use it, fork it, ship it.
