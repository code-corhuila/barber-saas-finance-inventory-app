/** The prototype's look (dark background, cards a shade lighter, gold), shared by every screen. */
export const PAGE_STYLES = `
  :host { display: block; color: #fff; }
  .page { padding: 1rem 1rem 2rem; max-width: 48rem; margin: 0 auto; }
  h1 { font-size: 1.6rem; font-weight: 700; margin: .5rem 0 .25rem; }
  .sub { color: #888; margin: 0 0 1rem; }
  .head { display: flex; align-items: center; justify-content: space-between; gap: .5rem; }
  .card { background: #1e1e1e; border-radius: 12px; padding: 1rem; margin-bottom: .75rem; display: block;
          color: inherit; text-decoration: none; }
  .card h2 { font-size: 1.05rem; margin: 0 0 .25rem; }
  .muted { color: #aaa; font-size: .9rem; margin: .15rem 0; }
  .gold { color: #d4af37; font-weight: 700; }
  .badge { display: inline-block; border-radius: 999px; padding: .15rem .65rem; font-size: .75rem; font-weight: 700; }
  .badge.TRIAL { background: #2a2416; color: #d4af37; }
  .badge.ACTIVE { background: #16301f; color: #4caf50; }
  .badge.SUSPENDED { background: #3a2a10; color: #ffa726; }
  .badge.CANCELLED { background: #3a1e1e; color: #ff6b6b; }
  .badge.off { background: #2a2a2a; color: #888; }
  .row { display: flex; justify-content: space-between; align-items: flex-start; gap: .75rem; }
  .actions { display: flex; flex-wrap: wrap; gap: .5rem; margin-top: .75rem; }
  .center { text-align: center; color: #888; padding: 2rem 1rem; }
  .error { color: #ff6b6b; }
  .field { margin-bottom: .75rem; }
  .field ion-input, .field ion-select { --background: #1e1e1e; --color: #fff; --placeholder-color: #666;
          --padding-start: 1rem; border-radius: 12px; }
  .hint { color: #888; font-size: .8rem; margin: .25rem .25rem 0; }
  .field-error { color: #ff6b6b; font-size: .8rem; margin: .25rem .25rem 0; }
  .back { color: #d4af37; text-decoration: none; font-weight: 600; display: inline-block; margin-bottom: .5rem; }
  ion-segment { --background: #1e1e1e; margin-bottom: 1rem; }
  ion-segment-button { --color: #888; --color-checked: #d4af37; --indicator-color: #d4af37; }
`;
