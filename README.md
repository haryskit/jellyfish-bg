# JellyfishBG

A free, dependency-free, animated bioluminescent jellyfish background.
Drop in one script tag, call `JellyfishBG.init()`, done — same idea as
[particles.js](https://particles.js.org), but jellyfish.

Pure vanilla JS. No build step, no npm required to *use* it (only to
re-minify if you edit the source).

---

## 1. Use it right now (before you deploy anything)

```html
<div id="jellyfish-bg" style="position:fixed;inset:0;z-index:-1;"></div>
<script src="dist/jellyfish-bg.min.js"></script>
<script>
  JellyfishBG.init('jellyfish-bg');
</script>
```

That's the whole API surface for the common case. `init(target, options)`
accepts either an element id (string) or a DOM node, plus an optional
options object — see the table in `index.html` for every option
(`jellyfishCount`, `colors`, `driftSpeed`, `pointerStrength`, `godRays`,
`sparks`, `respectReducedMotion`).

It returns a handle so you can clean up later (useful in SPAs):

```js
const field = JellyfishBG.init('jellyfish-bg');
// ...
field.destroy();
```

---

## 2. Deploy it for free, so *anyone* can `<script src="...">` it

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

## 3. Rebuilding the minified file after edits

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
