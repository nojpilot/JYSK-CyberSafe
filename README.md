# JYSK CyberSafe

Kompletní webový projekt pro mikro-vzdělávání kyberbezpečnosti zaměstnanců prodejny (18–60+), s anonymním měřením zlepšení, admin panelem a exportem certifikátu do PDF.

## Zvolené technologie (a proč)
- **Backend:** Node.js + Express
  - jednoduché nasazení, nízká složitost, rychlé API.
- **Frontend:** Next.js (App Router) + Tailwind
  - samostatná UI vrstva, moderní DX, rychlé iterace.
- **Admin:** EJS (SSR)
  - minimalistické a stabilní pro správu obsahu.
- **DB:** SQLite (souborová DB)
  - minimální provozní režie, vhodné pro VPS a menší tým.
- **PDF:** PDFKit
  - server-side generování certifikátu bez třetích služeb.
- **Auth:** admin username/password + Argon2 hash
- **Deployment:** Docker Compose + Nginx + Certbot

## Rozumné předpoklady
- Kurz je anonymní; session ID je náhodný identifikátor v cookie.
- Jméno/přezdívka pro certifikát je volitelná a **neukládá se** do DB.
- Obsah je fiktivní, ale drží se reality prodejny (BO/StoreFront, pokladna, sklad).

## Architektura

### Komponenty
1. **Express API**
   - data, hry, statistiky, certifikát PDF
   - admin panel (login + CRUD + statistiky)
2. **Next.js frontend**
   - veřejné stránky kurzu, hry, výsledek
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
- `sessions`: anonymní relace, pre/post skóre, zlepšení
- `answers`: jednotlivé výsledky z herních situací
- `feedback`: anonymní zpětná vazba po kurzu
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
├── web
│   ├── src
│   ├── public
│   └── next.config.js
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
PORT=3001 npm run dev
```
API poběží na `http://localhost:3001`.

Frontend (Next.js) běží odděleně ve složce `web`:
```bash
cd web
npm install
npm run dev
```
Lokálně:
- `http://localhost:3000` (Next frontend)
- `http://localhost:3001` (Express API)

## VPS / Docker nasazení
1) Clone a příprava:
```bash
git clone <repo>
cd JYSK-CyberSafe
cp .env.example .env
```
2) Nastav doménu v `nginx/default.prod.conf`:
- `server_name vase-domena.cz;`
- cesty certifikátu:
  - `/etc/letsencrypt/live/vase-domena.cz/fullchain.pem`
  - `/etc/letsencrypt/live/vase-domena.cz/privkey.pem`

3) Build/start:
```bash
docker compose up -d --build
```
Lokálně můžeš otevřít:
- `http://localhost:3001` (přímý port na API)
- `http://localhost:3002` (přímý port na frontend)
- `http://localhost` (přes Nginx HTTP proxy)

4) Inicializace certifikátu (Let’s Encrypt):
```bash
./docker/init-letsencrypt.sh vase-domena.cz admin@vasedomena.cz
```
5) Pro VPS s HTTPS nastav v `.env`:
```bash
NGINX_CONF=default.prod.conf
```
6) Restart:
```bash
docker compose up -d
```

## Reset databáze (smazání starých záznamů)
Výchozí režim zachová admin účty:
```bash
npm run reset-db
```
Pokud chceš smazat i adminy:
```bash
KEEP_ADMINS=0 npm run reset-db
```

## Admin panel
- URL: `/admin`
- V DEMO režimu (`DEMO_MODE=true`) je admin read-only bez loginu.
- CSV export statistik: `/admin/stats.csv`

## API/flow kurzu
1. Landing
2. Hra před směnou (klikací podezřelé věci)
3. 5 modulů
4. Hra po kurzu (klikací podezřelé věci)
5. Výsledek + doporučení podle chyb
6. Krátký feedback (4 otázky + volitelný komentář)
7. Certifikát PDF
8. „Bezpečně i doma“

## Obsah
- 5 herních situací s podezřelými věcmi
- 5 modulů (cca 1–2 min každý)
- 5 pravidel bezpečné směny
- 6 tipů „Bezpečně i doma"
- Podklady k 25–30 min prezentaci: `docs/prezentace.md`

## Aktualizace
```bash
git pull
docker compose up -d --build
```
