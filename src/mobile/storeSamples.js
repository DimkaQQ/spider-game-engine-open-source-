/*
 * SPIDER GAME ENGINE (OPEN SOURCE) — sample games for the Explore screen
 * Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
 *
 * Demo listings so Explore is not empty before real games exist. They are marked
 * `sample: true`, labelled "Sample" in the UI, never sent anywhere and never block a real game's name.
 */
const svg = (s) => `data:image/svg+xml;utf8,${encodeURIComponent(s)}`;

// Small generated scenes (sky gradient, a grid floor, a few shapes) so the cards and screenshots have art.
function scene(h1, h2, variant) {
  const shapes = [
    `<circle cx="470" cy="110" r="46" fill="hsl(${h2} 90% 70%)" opacity=".9"/><rect x="90" y="190" width="70" height="120" rx="8" fill="hsl(${h1} 70% 30%)"/><rect x="190" y="150" width="90" height="160" rx="8" fill="hsl(${h1} 70% 36%)"/><rect x="320" y="200" width="60" height="110" rx="8" fill="hsl(${h1} 70% 28%)"/>`,
    `<polygon points="300,120 340,200 260,200" fill="hsl(${h2} 90% 66%)"/><circle cx="130" cy="230" r="26" fill="hsl(${h1} 85% 62%)"/><circle cx="470" cy="250" r="18" fill="hsl(${h2} 85% 70%)"/><rect x="380" y="170" width="120" height="14" rx="7" fill="hsl(${h1} 70% 40%)"/>`,
    `<rect x="60" y="230" width="150" height="16" rx="8" fill="hsl(${h1} 70% 42%)"/><rect x="250" y="190" width="150" height="16" rx="8" fill="hsl(${h1} 70% 42%)"/><circle cx="130" cy="205" r="22" fill="hsl(${h2} 95% 66%)"/><circle cx="330" cy="165" r="12" fill="#ffd54a"/><circle cx="440" cy="130" r="12" fill="#ffd54a"/>`,
    `<circle cx="300" cy="170" r="70" fill="none" stroke="hsl(${h2} 90% 68%)" stroke-width="6" opacity=".9"/><circle cx="300" cy="170" r="110" fill="none" stroke="hsl(${h1} 90% 62%)" stroke-width="3" opacity=".6"/><circle cx="300" cy="170" r="22" fill="hsl(${h2} 95% 74%)"/>`,
  ][variant % 4];
  return svg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="hsl(${h1} 65% 22%)"/><stop offset="1" stop-color="hsl(${h2} 70% 42%)"/></linearGradient></defs><rect width="600" height="400" fill="url(#g)"/>${shapes}<rect y="310" width="600" height="90" fill="hsl(${h1} 60% 14%)"/><g stroke="hsl(${h2} 80% 55%)" stroke-opacity=".5" stroke-width="1.5"><path d="M0 335H600M0 362H600M0 392H600"/><path d="M300 310L120 400M300 310L300 400M300 310L480 400M300 310L0 360M300 310L600 360"/></g></svg>`);
}

const mk = (slug, name, developer, category, h1, h2, description, versions) => ({
  slug, name, developer, category, description, sample: true,
  images: [0, 1, 2, 3].map((i) => ({ name: `${slug}-${i}`, dataUrl: scene(h1 + i * 6, h2 + i * 10, i), sha256: `${slug}-${i}` })),
  createdAt: "2026-10-20T10:00:00.000Z", updatedAt: versions[0].createdAt, versions,
});
const ver = (version, createdAt, bytes, notes = "") => ({ version, createdAt, bytes, notes });

export const SAMPLE_GAMES = [
  mk("neon-rift", "Neon Rift", "DarQQ", "Shooter", 280, 320,
    "A neon survival shooter. Move through the arena, auto-fire at swarms, pick an upgrade every level and take down the Rift Warden before your hull runs out.",
    [ver(2, "2026-10-31T12:00:00.000Z", 412000, "Boss bullet rings, three new upgrades, victory screen."), ver(1, "2026-10-28T09:00:00.000Z", 360000)]),
  mk("cyber-knight-runner", "Cyber Knight Runner", "M4SPIDER", "Arcade", 195, 230,
    "Run, jump and slash through an endless cyber city. Chain coins for a combo, dodge drones and beat your own best distance.",
    [ver(1, "2026-10-29T15:30:00.000Z", 288000)]),
  mk("coin-arena", "Coin Arena", "DarQQ", "Adventure", 140, 95,
    "Collect every coin in the arena before the timer ends. Jump across moving blocks, find the shortcuts and unlock the golden coin.",
    [ver(1, "2026-10-30T18:10:00.000Z", 154000)]),
  mk("sky-racer", "Sky Racer", "M4SPIDER", "Racing", 25, 340,
    "Fly a boat through floating gates over a sunset sea. Drift through the turns, grab boosts and race the ghost of your best lap.",
    [ver(1, "2026-10-27T11:00:00.000Z", 236000)]),
];
export const sampleBySlug = (slug) => SAMPLE_GAMES.find((g) => g.slug === slug) || null;
