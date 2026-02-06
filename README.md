# JYSK CyberSafe

Kompletní webový projekt pro mikro-vzdělávání kyberbezpečnosti zaměstnanců prodejny (18–60+), s anonymním měřením zlepšení, admin panelem a exportem certifikátu do PDF.

## Zvolené technologie (a proč)
- **Backend + frontend:** Node.js + Express + EJS (SSR)
  - jednoduché nasazení, nízká složitost, rychlý rendering i na slabších zařízeních.
- **DB:** SQLite (souborová DB)
  - minimální provozní režie, vhodné pro VPS a menší tým.
- **PDF:** PDFKit
  - server-side generování certifikátu bez třetích služeb.
- **Auth:** admin username/password + Argon2 hash
- **Deployment:** Docker Compose + Nginx + Certbot

## Rozumné předpoklady
- Kurz je anonymní; session ID je náhodný identifikátor v cookie.
- Jméno/přezdívka pro certifikát je volitelná a **neukládá se** do DB.
- Obsah je fiktivní („centrála“, „IT podpora“) a bez interních systémů.

## Architektura

### Komponenty
1. **Express app**
   - veřejné stránky kurzu, testy, výsledek, certifikát
   - admin panel (login + CRUD + statistiky)
2. **SQLite**
   - otázky, moduly, anonymní sessions, odpovědi, audit log
3. **Nginx reverse proxy**
   - TLS terminace, forwarding na app
4. **Certbot**
   - Let's Encrypt certifikáty

### Bezpečnostní prvky
- Helmet (CSP, HSTS v produkci, X-Frame-Options)
- Rate limiting (veřejné + admin cesty)
- CSRF tokeny pro admin formuláře
- Validace vstupů přes Zod
- Argon2 hash hesel adminů
- HTTP-only cookies, sameSite
- Audit log admin akcí (bez PII)
- Žádné ukládání IP, žádné třetí strany/trackery

## Datový model
- `modules`: obsah mikro-kurzu
- `questions`: otázky pre/post testu
- `sessions`: anonymní relace, pre/post skóre, zlepšení
- `answers`: jednotlivé odpovědi pro pre/post
- `admins`: admin účty
- `audit_logs`: log CRUD/login akcí

## Struktura projektu
```text
.
├── src
│   ├── config/db.js
│   ├── data/seed-content.json
│   ├── middleware/
│   ├── routes/
│   ├── scripts/
│   ├── services/
│   ├── public/styles.css
│   ├── views/
│   └── server.js
├── docker/init-letsencrypt.sh
├── nginx/default.conf
├── docker-compose.yml
├── Dockerfile
├── .env.example
└── docs/prezentace.md
```

## Lokální spuštění
```bash
npm install
npm run migrate
npm run seed
npm run create-admin -- admin SilneHeslo123!
npm run dev
```
Aplikace poběží na `http://localhost:3000`.

## VPS / Docker nasazení
1) Clone a příprava:
```bash
git clone <repo>
cd JYSK-CyberSafe
cp .env.example .env
```
2) Build/start:
```bash
docker compose up -d --build
```
3) Inicializace certifikátu:
```bash
./docker/init-letsencrypt.sh vase-domena.cz admin@vasedomena.cz
```
4) Uprav `nginx/default.conf`:
- nastav `server_name vase-domena.cz`
- cesty certifikátu na `.../live/vase-domena.cz/...`

5) Restart:
```bash
docker compose up -d
```

## Admin panel
- URL: `/admin`
- V DEMO režimu (`DEMO_MODE=true`) je admin read-only bez loginu.
- CSV export statistik: `/admin/stats.csv`

## API/flow kurzu
1. Landing
2. Pre-test (6 otázek)
3. 5 modulů
4. Post-test (6 otázek)
5. Výsledek + doporučení podle chyb
6. Certifikát PDF
7. „Bezpečně i doma“

## Obsah
- 12 otázek A/B/C + vysvětlení
- 5 modulů (cca 1–2 min každý)
- 5 pravidel bezpečné směny
- 6 tipů „Bezpečně i doma"
- Podklady k 25–30 min prezentaci: `docs/prezentace.md`

## Aktualizace
```bash
git pull
docker compose up -d --build
```
