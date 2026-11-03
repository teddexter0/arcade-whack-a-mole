// Shared browser infrastructure. Game rules live elsewhere and do not import the DOM.
export const $ = (selector, root = document) => root.querySelector(selector);
export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key.startsWith('on')) node.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key === 'text') node.textContent = value;
    else if (key === 'class') node.className = value;
    else node.setAttribute(key, value);
  }
  for (const child of children) node.append(typeof child === 'string' ? document.createTextNode(child) : child);
  return node;
}
export const button = (text, fn, primary = false) => el('button', { text, onClick: fn, class: primary ? 'primary' : '' });
export const random = n => Math.floor(Math.random() * n);
export const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
export const store = {
  get(key, fallback) { try { return JSON.parse(localStorage.getItem('dex.' + key)) ?? fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem('dex.' + key, JSON.stringify(value)); return true; } catch { return false; } }
};
export function session() {
  const controller = new AbortController(); const cleanups = [];
  return {
    on(target, event, fn, options = {}) { target.addEventListener(event, fn, { ...options, signal: controller.signal }); },
    interval(fn, ms) { const id = setInterval(fn, ms); cleanups.push(() => clearInterval(id)); return id; },
    timeout(fn, ms) { const id = setTimeout(fn, ms); cleanups.push(() => clearTimeout(id)); return id; },
    cleanup(fn) { cleanups.push(fn); },
    dispose() { controller.abort(); cleanups.forEach(fn => fn()); }
  };
}
export function layout(root, instructions) {
  const stage = el('section'); const side = el('aside', { class: 'game-panel' }, [el('h3', { text: 'The controls' }), el('p', { text: instructions })]);
  root.append(el('div', { class: 'game-layout' }, [stage, side])); return { stage, side };
}
export function canvas(stage, width = 600, height = 440) {
  const c = el('canvas', { width, height, tabindex: '0', role: 'img', 'aria-label': 'Game area. Controls are listed beside the game.' });
  stage.append(el('div', { class: 'canvas-wrap' }, [c])); return { c, ctx: c.getContext('2d') };
}
export function directions(stage, scope, handler) {
  const keys = { ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right', ArrowUp: 'up', w: 'up', ArrowDown: 'down', s: 'down' };
  scope.on(window, 'keydown', e => {
    if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (keys[e.key]) { e.preventDefault(); handler(keys[e.key]); }
  });
  const row = el('div', { class: 'touch-controls direction-pad', role: 'group', 'aria-label': 'Directional controls' });
  for (const [dir, label] of [['up', 'Up'], ['left', 'Left'], ['down', 'Down'], ['right', 'Right']]) {
    const key = button(label, () => handler(dir));
    key.classList.add('direction-key', 'direction-' + dir);
    row.append(key);
  }
  stage.append(row);
  let start;
  scope.on(stage, 'pointerdown', e => { if (e.target.tagName === 'CANVAS' || e.target.classList.contains('merge-grid') || e.target.closest?.('.merge-grid')) start = [e.clientX, e.clientY]; });
  scope.on(stage, 'pointerup', e => { if (!start) return; const dx = e.clientX-start[0], dy=e.clientY-start[1]; start=null; if (Math.max(Math.abs(dx), Math.abs(dy)) > 25) handler(Math.abs(dx)>Math.abs(dy) ? dx>0?'right':'left' : dy>0?'down':'up'); });
  scope.on(stage, 'pointercancel', () => {start=null;});
}
export function loop(scope, update, draw) {
  let frame, previous, paused = false, hidden = !!document.hidden;
  const tick = time => { const dt = previous == null ? 0 : Math.min((time - previous) / 1000, .035); previous=time; if(!paused&&!hidden) update(dt); if(!hidden)draw(); frame=requestAnimationFrame(tick); };
  frame=requestAnimationFrame(tick); scope.cleanup(() => cancelAnimationFrame(frame));
  scope.on(document, 'visibilitychange', () => { hidden=document.hidden; previous=undefined; });
  return { toggle() { paused=!paused; previous=undefined; return paused; } };
}
const scoreCache = new Map();
export function bestScore(key, value) {
  if (!scoreCache.has(key)) scoreCache.set(key, store.get('best.'+key, 0));
  const before = scoreCache.get(key), best = Math.max(before, value);
  if (best > before) { scoreCache.set(key, best); store.set('best.'+key,best); }
  return best;
}
