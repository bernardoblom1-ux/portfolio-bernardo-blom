/* Shared by decks.html (index of decks) and deck.html (slide viewer).
   Slides are PNGs rendered from the source decks: the originals are never
   published, so there is no file for a visitor to download. */

const DECKS = [
  {
    client: "CLA Brasil",
    note: "CliftonLarsonAllen's Brazilian arm. Three decks covering the institutional story and the go-to-market narrative for its tax, BPO and technology platform.",
    items: [
      {
        slug: "cla-institucional",
        title: "Institutional Presentation",
        meta: "14 slides, Portuguese",
        desc: "Institutional deck positioning tax, BPO and technology as a single platform, with the narrative built around complying, forecasting and generating cash through Brazil's tax reform.",
        pages: 14
      },
      {
        slug: "cla-tax-overview",
        title: "Business Presentation: Scalable Platform",
        meta: "18 slides, English, June 2026",
        desc: "Business presentation making the case for CLA as the leading scalable tax platform in Brazil, built on the firm's photographic and modular-block visual language.",
        pages: 18
      },
      {
        slug: "cla-brazil-us",
        title: "Brazil–US International Tax Platform",
        meta: "13 slides, Bilingual, July 2026",
        desc: "Deck setting out a shared vision for a Brazil–US international tax platform, laid out in parallel English and Portuguese columns so one document serves stakeholders in both markets.",
        pages: 13
      }
    ]
  },
  {
    client: "Stine",
    note: "Agricultural seed company. A full brand guidelines manual, also shown as a project with every page viewable.",
    items: [
      {
        title: "Brand Guidelines Manual",
        meta: "32 pages, 2025",
        desc: "Complete identity manual covering the logo system, colour palette, typography and brand applications across every touchpoint, documented page by page.",
        cover: "assets/Projects/stine/pages/page-01.png",
        href: "project-stine.html",
        cta: "View all 32 pages"
      }
    ]
  },
  {
    client: "ESA Advogados",
    note: "Brazilian law firm. A technical deck translating a dense tax argument into something a client's finance team can follow.",
    items: [
      {
        slug: "esa-perse",
        title: "PERSE Tax Opportunity",
        meta: "15 slides, English",
        desc: "Technical deck on the tax opportunity arising from the temporal application of the PERSE benefit, aimed at companies whose activities were eligible as of March 2022, set in the firm's dark editorial slide system.",
        pages: 15
      }
    ]
  }
];

const DECK_INDEX = {};
DECKS.forEach(g => g.items.forEach(it => {
  if (!it.slug) return;
  it.client = g.client;
  it.dir = 'assets/presentations/' + it.slug;
  it.cover = it.dir + '/page-01.png';
  it.href = 'deck.html?id=' + it.slug;
  it.cta = 'View all ' + it.pages + ' slides';
  DECK_INDEX[it.slug] = it;
}));

/* Access gate.
   A deterrent, not security: this check runs in the visitor's browser and the
   slide images stay fetchable at their own URLs. Real protection belongs at the
   server (on Apache hosts, cPanel Directory Privacy over the slide folders). */
const DECK_KEY = 'bb-decks-unlocked';
const DECK_SHA = '093c066bee5f61f40a70d4834c4218b9f0e4205343d5f5833b8b2a9861e08d9c';
const DECK_FNV = 'b0b8df13';   // used only where crypto.subtle is missing (e.g. file://)

function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

async function deckCodeOk(pw) {
  if (window.crypto && crypto.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw));
    return Array.from(new Uint8Array(buf))
      .map(b => b.toString(16).padStart(2, '0')).join('') === DECK_SHA;
  }
  return fnv1a(pw) === DECK_FNV;
}

function deckUnlocked() {
  try { return sessionStorage.getItem(DECK_KEY) === '1'; } catch (_) { return false; }
}
function deckRemember() {
  try { sessionStorage.setItem(DECK_KEY, '1'); } catch (_) {}
}

/* Renders the lock card into `el`, calling onPass() once the code checks out. */
function renderDeckGate(el, onPass) {
  el.innerHTML = `
    <div class="deck-gate" id="deckGate">
      <div class="deck-gate-icon">
        <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="3" y="7" width="10" height="7" rx="1.6" stroke="currentColor" stroke-width="1.4"/>
          <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
        </svg>
      </div>
      <h3>Protected section</h3>
      <p>These are client decks, shared on request. Enter the access code to view them.</p>
      <form class="deck-gate-form" id="deckGateForm">
        <input class="deck-gate-input" id="deckGateInput" type="password"
               inputmode="numeric" autocomplete="off"
               placeholder="Access code" aria-label="Access code" />
        <button class="deck-gate-btn" type="submit">Unlock</button>
      </form>
      <p class="deck-gate-err" id="deckGateErr" hidden>That code is not right.</p>
    </div>`;

  document.getElementById('deckGateForm').addEventListener('submit', async e => {
    e.preventDefault();
    if (await deckCodeOk(document.getElementById('deckGateInput').value.trim())) {
      deckRemember();
      onPass();
    } else {
      const gate = document.getElementById('deckGate');
      document.getElementById('deckGateErr').hidden = false;
      gate.classList.remove('shake');
      void gate.offsetWidth;            // restart the animation
      gate.classList.add('shake');
    }
  });
}
