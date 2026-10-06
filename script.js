document.documentElement.classList.add('js');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Header: glass over the dark hero, solid after it
const header = document.querySelector('.site-header');
const hero = document.getElementById('hero');
const onScroll = () => header.classList.toggle('solid', scrollY > hero.offsetHeight - 80);
addEventListener('scroll', onScroll, { passive: true });
onScroll();

// 1. Split headings into words so they can rise one after another
document.querySelectorAll('.split').forEach(el => {
  let i = 0;
  const words = el.textContent.trim().replace(/&/g, '&amp;').replace(/</g, '&lt;').split(/\s+/);
  el.setAttribute('aria-label', el.textContent.trim());
  el.innerHTML = words.map(w => `<span class="w" aria-hidden="true"><span style="--i:${i++}">${w}</span></span>`).join(' ');
});

// Reveal headings, photos (2. church-door open) and sections as they scroll in
const io = new IntersectionObserver(entries => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}, { rootMargin: '0px 0px -10% 0px' });
document.querySelectorAll('[data-reveal], [data-door], .split, .draw').forEach(el => io.observe(el));
requestAnimationFrame(() => document.querySelector('.hero .split').classList.add('in'));

// Background videos: play only while on screen, never for reduced motion
const vids = document.querySelectorAll('video[data-autoplay]');
const vio = new IntersectionObserver(entries => {
  for (const e of entries) {
    const v = e.target;
    if (e.isIntersecting && !reduce) v.play().catch(() => {});
    else if (v.muted) v.pause();       // keep the music going if someone is listening
  }
}, { threshold: .15 });
vids.forEach(v => vio.observe(v));

// 4. "Hear us sing": unmute the hero performance; the wave follows the music
const video = document.getElementById('hero-video');
const listen = document.getElementById('listen');
const label = listen.querySelector('.listen-label');
const bars = [...listen.querySelectorAll('.wave i')];
let analyser, data;

function meter() {
  if (!listen.classList.contains('playing')) return;
  analyser.getByteFrequencyData(data);
  bars.forEach((b, i) => b.style.setProperty('--h', Math.max(.15, data[i * 2 + 1] / 255).toFixed(2)));
  requestAnimationFrame(meter);
}

listen.addEventListener('click', async () => {
  const on = video.muted;
  if (on && !analyser) {
    try {
      const ctx = new AudioContext();
      analyser = ctx.createAnalyser();
      analyser.fftSize = 32;
      data = new Uint8Array(analyser.frequencyBinCount);
      ctx.createMediaElementSource(video).connect(analyser).connect(ctx.destination);
      video.currentTime = 0;          // start at the top of the phrase
    } catch { listen.classList.add('no-analyser'); }
  }
  video.muted = !on;
  if (on) { await analyser?.context.resume(); video.play().catch(() => {}); }
  listen.classList.toggle('playing', on);
  listen.setAttribute('aria-pressed', on);
  label.textContent = on ? 'Mute' : 'Hear us sing';
  bars.forEach(b => b.style.removeProperty('--h'));
  if (on && analyser) meter();
});

// Booking form: compose an email, nothing is sent from the page
document.getElementById('book-form').addEventListener('submit', e => {
  e.preventDefault();
  const f = new FormData(e.target);
  const body = [
    `Name: ${f.get('name')}`,
    `Event: ${f.get('event')}`,
    `Date: ${f.get('date') || 'TBC'}`,
    `Venue: ${f.get('venue') || 'TBC'}`,
    '',
    f.get('message') || '',
  ].join('\n');
  location.href = 'mailto:theassumptionistchoir.ph@gmail.com'
    + '?subject=' + encodeURIComponent(`Booking inquiry: ${f.get('event')}`)
    + '&body=' + encodeURIComponent(body);
});

document.getElementById('year').textContent = new Date().getFullYear();
