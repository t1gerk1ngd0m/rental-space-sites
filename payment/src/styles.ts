// メインサイト (smart-hometheater/src/styles/global.css) の :root トークンを転記。
// トークンを変更する場合は両方を更新すること。
export const CSS = `
@import url("https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;900&display=swap");

*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

:root {
  --bg-base: #0E0E12;
  --bg-secondary: #16161D;
  --bg-card: #1C1C24;
  --text-primary: #FFFFFF;
  --text-secondary: #E5E3DF;
  --text-muted: #7A7A85;
  --accent: #F5C518;
  --accent-soft: rgba(245, 197, 24, .12);
  --line: #06C755;
  --divider: rgba(255, 255, 255, .08);
  --yokohama: #CE863F;
  --ofuna: #20AAD8;
  --radius: 16px;
  --radius-sm: 10px;
  --radius-pill: 999px;
  --shadow-card: 0 10px 30px rgba(0, 0, 0, .4);
  --transition: .2s ease;
  --accent-space: var(--accent);
}

body[data-space="yokohama"] { --accent-space: var(--yokohama); }
body[data-space="ofuna"] { --accent-space: var(--ofuna); }

body {
  font-family: "Noto Sans JP", sans-serif;
  background: var(--bg-base);
  color: var(--text-primary);
  line-height: 1.7;
  -webkit-font-smoothing: antialiased;
  min-height: 100vh;
}

.wrap { max-width: 560px; margin: 0 auto; padding: 32px 20px 64px; }

.site-head {
  border-bottom: 3px solid var(--accent-space);
  padding-bottom: 16px;
  margin-bottom: 28px;
}
.site-head h1 { font-size: 20px; font-weight: 700; letter-spacing: .02em; }
.site-head .space-name {
  display: inline-block;
  margin-top: 8px;
  padding: 3px 12px;
  border-radius: var(--radius-pill);
  background: var(--accent-space);
  color: #0E0E12;
  font-size: 13px;
  font-weight: 700;
}
.lead { color: var(--text-secondary); font-size: 14px; margin-bottom: 28px; }

.card {
  background: var(--bg-card);
  border-radius: var(--radius);
  box-shadow: var(--shadow-card);
  padding: 24px 20px;
  margin-bottom: 20px;
}
.card > h2 {
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 4px;
}
.card > .hint { font-size: 12.5px; color: var(--text-muted); margin-bottom: 16px; }

label { display: block; font-size: 14px; }

.field { margin-bottom: 18px; }
.field:last-child { margin-bottom: 0; }
.field > label.field-label {
  font-weight: 500;
  margin-bottom: 8px;
}

select, input[type="number"] {
  width: 100%;
  padding: 12px 14px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--divider);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-family: inherit;
  font-size: 16px;
  transition: border-color var(--transition);
}
select:focus, input[type="number"]:focus {
  outline: none;
  border-color: var(--accent-space);
}

.amount-row { position: relative; }
.amount-row input { padding-left: 32px; }
.amount-row .yen {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  font-size: 16px;
  pointer-events: none;
}

.choice {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 12px 14px;
  border: 1px solid var(--divider);
  border-radius: var(--radius-sm);
  background: var(--bg-secondary);
  cursor: pointer;
  transition: border-color var(--transition), background var(--transition);
  margin-bottom: 10px;
}
.choice:last-child { margin-bottom: 0; }
.choice:has(input:checked) {
  border-color: var(--accent-space);
  background: var(--accent-soft);
}
.choice input { margin-top: 5px; accent-color: var(--accent-space); flex-shrink: 0; }
.choice .body { flex: 1; }
.choice .name { font-weight: 500; font-size: 14px; }
.choice .desc { font-size: 12.5px; color: var(--text-muted); }
.choice .price { font-size: 14px; font-weight: 700; white-space: nowrap; }

.total {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  border-top: 1px solid var(--divider);
  margin-top: 4px;
  padding-top: 16px;
}
.total .label { font-size: 14px; color: var(--text-secondary); }
.total .value { font-size: 26px; font-weight: 900; color: var(--accent-space); }

button[type="submit"] {
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: var(--radius-pill);
  background: var(--accent-space);
  color: #0E0E12;
  font-family: inherit;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity var(--transition);
}
button[type="submit"]:hover { opacity: .85; }

.note { font-size: 12px; color: var(--text-muted); margin-top: 14px; text-align: center; }

.pin-box {
  text-align: center;
  padding: 28px 20px;
  border: 2px dashed var(--accent-space);
  border-radius: var(--radius);
  background: var(--accent-soft);
}
.pin-box .pin {
  font-size: 40px;
  font-weight: 900;
  letter-spacing: .3em;
  padding-left: .3em;
  color: var(--accent-space);
}

.status { font-size: 14px; color: var(--text-secondary); }
.back-link {
  display: inline-block;
  margin-top: 20px;
  color: var(--text-muted);
  font-size: 13px;
}

@media (max-width: 480px) {
  .wrap { padding: 24px 16px 48px; }
  .site-head h1 { font-size: 18px; }
}
`;
