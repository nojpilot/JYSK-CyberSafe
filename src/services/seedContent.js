const fs = require('fs');
const path = require('path');

// Fallback content so the app can boot even if the JSON file is missing in a container/image.
// The JSON file is still the primary source of truth when present.
const FALLBACK_SEED = {
  course: {
    duration: '7-10 minut',
    storyline: 'Typicka smena v JYSKu. Pet situaci, ktere se opravdu deji.',
    mission: 'Chran BO, StoreFront, pokladnu i zakazniky. Overuj, nespichej, neklikej.',
    teamMotto: 'Kdyz neco tlaci na cas, je to podezrele. Over a mas klid.',
    rules: [
      'Nez kliknes v e-mailu nebo SMS, over odesilatele a adresu webu.',
      'Overovaci kody z SMS nikdy nikomu. Ani "IT podpore".',
      'Nezname USB nebo QR ze skladu neotvirat, nahlasit vedoucimu.',
      'BO/StoreFront i pokladnu vzdy zamknout pri odchodu.',
      'Zakaznicke udaje drzet v soukromi: nemluvit nahlas, neposilat do osobnich chatu.'
    ],
    homeTips: [
      'Zapni overovaci kod vsude, kde to jde.',
      'Aktualizuj telefon i pracovni aplikace jen z oficialnich zdroju.',
      'Fotky dokladu neposilej do chatu.',
      'Na verejne Wi-Fi se neprihlasuj bez zabezpeceni.',
      'Pouzivej dlouha a jedinecna hesla.',
      'Kdyz si nejsi jisty/a, zeptej se vedouciho.'
    ]
  },
  modules: [
    {
      slug: 'phishing-storefront',
      title: 'Phishing e-mail o StoreFront',
      image: '/static/images/ill-phishing.svg',
      story: 'Rano prijde e-mail "JYSK IT podpora": potvrd ucet do 20 minut, jinak bude BO zablokovano.',
      correctAction: 'Neotvirat odkaz. Overit pres vedouciho nebo oficialni kontakt IT podpory/centraly.',
      tip1: 'Kontroluj domenu odesilatele a pravopis.',
      tip2: 'Urgence a hrozby jsou typicke varovne znaky.'
    },
    {
      slug: 'whatsapp-it',
      title: 'WhatsApp od "IT podpory"',
      image: '/static/images/ill-vishing.svg',
      story: 'Na pracovnim telefonu prijde zprava: "Jsem IT, poslete SMS kod kvuli aktualizaci StoreFront."',
      correctAction: 'Kod neposilat. Overit pres oficialni kontakt. Neinstalovat aplikace z odkazu.',
      tip1: 'IT nikdy nechce SMS/2FA kod ani heslo.',
      tip2: 'Interni komunikace jde jen pres oficialni kanaly.'
    },
    {
      slug: 'usb-warehouse',
      title: 'Nezname USB nebo QR',
      image: '/static/images/ill-usb.svg',
      story: 'Na sklade najdes USB "ceniky" nebo QR "seznam rozvozu". Zni to lakave, ale je to past.',
      correctAction: 'USB/QR neotvirat, nahlasit vedoucimu. Dokumenty jsou ve StoreFront/BO.',
      tip1: 'USB/QR muze obsahovat malware nebo podvodny web.',
      tip2: 'Dulezite soubory se sdili jen interne.'
    },
    {
      slug: 'shared-terminal',
      title: 'Sdileny BO a pokladna',
      image: '/static/images/ill-shared.svg',
      story: 'Odchazis od BO/StoreFront nebo pokladny na minutu. Obrazovka zustane otevrena.',
      correctAction: 'Vzdy zamknout obrazovku nebo se odhlasit. I na minutu.',
      tip1: 'Minuta staci ke zneuziti uctu.',
      tip2: 'Zvykni si na rychlou klavesu pro zamykani.'
    },
    {
      slug: 'customer-privacy',
      title: 'Ochrana zakaznickych udaju',
      image: '/static/images/ill-privacy.svg',
      story: 'U pokladny je fronta. Kolega nahlas diktuje cele udaje zakaznika nebo chce poslat fotku dokladu do chatu.',
      correctAction: 'Sdilet jen minimum, potichu. Udaje neposilat do osobnich chatu.',
      tip1: 'Citlive udaje nepatri do WhatsAppu ani SMS.',
      tip2: 'Obrazovku natoc tak, aby ji nevideli ostatni.'
    }
  ],
  games: {
    pre: {
      title: 'Rychla rozcvicka: odhal podezrele',
      intro: 'Kratky rozjezd pred kurzem. Klikni jen na podezrele casti.',
      scenes: [
        {
          id: 'email-bo-reset',
          kind: 'email',
          topic: 'phishing',
          title: 'E-mail o resetu BO',
          lead: 'Prijde e-mail s tvrzenim o incidentu a pozadavkem na rychle potvrzeni.',
          hint: 'Pozor na domenu, tlak na cas, odkaz a prilohu.',
          header: {
            from: 'bo-security@jysk-support.com',
            subject: 'Reset hesla BO: potvrd do 15 minut',
            to: 'prodejna@jysk.cz'
          },
          headerFlags: {
            from: 'flag',
            subject: 'flag'
          },
          lines: [
            { text: 'Kvuli bezpecnostnimu incidentu musis potvrdit reset do 15 minut.', flag: true },
            { text: 'Potvrzeni provedete zde:', safe: true },
            { text: 'https://jysk-support-verify.com/bo-reset', flag: true, link: true },
            { text: 'Reset_form.docm', flag: true, attachment: true },
            { text: 'Pokud je to omyl, over u vedouciho.', safe: true }
          ]
        },
        {
          id: 'whatsapp-bo-access',
          kind: 'chat',
          topic: 'mobile',
          title: 'WhatsApp od \"BO podpory\"',
          lead: 'Na pracovnim telefonu prijde zprava s zadosti o pristup.',
          hint: 'Nikdy neposilej kody, hesla ani neinstaluj z odkazu.',
          header: {
            app: 'WhatsApp',
            from: '+420 776 555 110',
            name: 'BO podpora'
          },
          lines: [
            { text: 'Potrebuju jednorazovy kod, jinak ucet zablokuje.', flag: true },
            { text: 'Posli mi prihlasovaci udaje k BO.', flag: true },
            { text: 'Nainstaluj rychle secure-access.apk z odkazu.', flag: true },
            { text: 'Overim si to pres vedouciho nebo oficialni linku.', safe: true }
          ]
        },
        {
          id: 'stock-break',
          kind: 'screen',
          topic: 'shared_pc',
          title: 'Odbihas na sklad',
          lead: 'Na minutku jdes na sklad, BO zustava otevrene.',
          hint: 'Zamykat vzdy. Nikdy nepredavat prihlaseni.',
          lines: [
            { text: 'Necham BO otevrene, vratim se za minutu.', flag: true },
            { text: 'Zamknu obrazovku (Win+L).', safe: true },
            { text: 'Predam prihlaseni kolegovi.', flag: true },
            { text: 'Odhlasim se pred odchodem.', safe: true }
          ]
        }
      ]
    },
    post: {
      title: 'Zaverecna mise: obstojis v praxi?',
      intro: 'Nove situace z realne smeny. Najdi vsechny podezrele veci.',
      scenes: [
        {
          id: 'email-price-list',
          kind: 'email',
          topic: 'phishing',
          title: 'E-mail o ceniku',
          lead: 'Prijde e-mail o zmenach ceniku. Najdi, co je podezrele.',
          hint: 'Pozor na tlak na cas, divnou domenu a prilohu.',
          header: {
            from: 'pricing@jysk-news.com',
            subject: 'Zmeny ceniku: potvrd do konce smeny',
            to: 'prodejna@jysk.cz'
          },
          headerFlags: {
            from: 'flag',
            subject: 'flag'
          },
          lines: [
            { text: 'Zmeny musi byt potvrzeny do 20 minut, jinak se cenik neuplatni.', flag: true },
            { text: 'Otevrete odkaz:', safe: true },
            { text: 'https://jysk-pricing-portal.com/confirm', flag: true, link: true },
            { text: 'price_list_2024.xlsm', flag: true, attachment: true },
            { text: 'Tym pricingu', safe: true }
          ]
        },
        {
          id: 'whatsapp-courier',
          kind: 'chat',
          topic: 'mobile',
          title: 'WhatsApp od kuryr',
          lead: 'Kuryr posila zpravu ohledne doruceni. Klikni na podezrele vety.',
          hint: 'QR/odkazy z neoverenych cisel jsou riziko.',
          header: {
            app: 'WhatsApp',
            from: '+420 776 900 221',
            name: 'Kuryr'
          },
          lines: [
            { text: 'Mam zasilku, potrebuju potvrdit pres QR.', flag: true },
            { text: 'Tady je QR: jysk-delivery-track.com/qr', flag: true },
            { text: 'Posli mi fotku dodaciho listu do WhatsAppu.', flag: true },
            { text: 'Potvrdim jen pres oficialni system StoreFront/BO.', safe: true }
          ]
        },
        {
          id: 'usb-supplier',
          kind: 'note',
          topic: 'usb',
          title: 'USB od dodavatele',
          lead: 'Ve skladu zustalo USB od dodavatele. Klikni na veci, ktere nepatri otevrit.',
          hint: 'Nezname USB a cizi QR jsou vzdy riziko.',
          lines: [
            { text: 'USB: \"Akcni fotky vyrobku\"', flag: true },
            { text: 'QR: \"novy cenik\" z krabice', flag: true },
            { text: 'Odevzdam vedoucimu a nic neotviram.', safe: true },
            { text: 'Pripojim USB na BO kvuli fotkam.', flag: true }
          ]
        },
        {
          id: 'cash-desk',
          kind: 'screen',
          topic: 'shared_pc',
          title: 'Pokladna behem spicky',
          lead: 'U pokladny je spicka a odbihas. Klikni na nebezpecne moznosti.',
          hint: 'Sdilene zarizeni vzdy zamykat nebo odhlasit.',
          lines: [
            { text: 'Necham pokladnu odemcenou, at fronta nezdrzuje.', flag: true },
            { text: 'Predam prihlaseni kolegyni.', flag: true },
            { text: 'Zamknu obrazovku i na minutu.', safe: true }
          ]
        },
        {
          id: 'return-privacy',
          kind: 'privacy',
          topic: 'privacy',
          title: 'Reklamace a udaje',
          lead: 'Zakaznik resi reklamaci. Klikni na veci, ktere bys delat nemel/a.',
          hint: 'Citlive udaje nepatri do chatu a nemaji se rikat nahlas.',
          lines: [
            { text: 'Poslu fotku uctenky do osobniho chatu.', flag: true },
            { text: 'Nahlas ctu adresu zakaznika.', flag: true },
            { text: 'Pouziju oficialni system a mluvim potichu.', safe: true },
            { text: 'Sdilim jen minimum udaju.', safe: true }
          ]
        }
      ]
    }
  },
  questions: []
};

let cached = null;

function normalizeGame(game, fallback) {
  if (!game || typeof game !== 'object') return fallback;
  return {
    title: game.title || fallback.title,
    intro: game.intro || fallback.intro,
    scenes: Array.isArray(game.scenes) && game.scenes.length ? game.scenes : fallback.scenes
  };
}

function normalizeSeed(seed) {
  const safe = seed && typeof seed === 'object' ? seed : {};
  const course = safe.course && typeof safe.course === 'object' ? safe.course : {};
  const games = safe.games && typeof safe.games === 'object' ? safe.games : {};
  const fallbackGames = FALLBACK_SEED.games || { pre: { title: '', intro: '', scenes: [] }, post: { title: '', intro: '', scenes: [] } };
  const fallbackPost = fallbackGames.post && fallbackGames.post.scenes && fallbackGames.post.scenes.length
    ? fallbackGames.post
    : { ...fallbackGames.pre, title: 'Finalni hra po kurzu' };

  return {
    course: {
      duration: course.duration || FALLBACK_SEED.course.duration,
      storyline: course.storyline || FALLBACK_SEED.course.storyline,
      mission: course.mission || FALLBACK_SEED.course.mission,
      teamMotto: course.teamMotto || FALLBACK_SEED.course.teamMotto,
      rules: Array.isArray(course.rules) ? course.rules : FALLBACK_SEED.course.rules,
      homeTips: Array.isArray(course.homeTips) ? course.homeTips : FALLBACK_SEED.course.homeTips
    },
    modules: Array.isArray(safe.modules) ? safe.modules : FALLBACK_SEED.modules,
    games: {
      pre: normalizeGame(games.pre, fallbackGames.pre),
      post: normalizeGame(games.post, fallbackPost)
    },
    questions: Array.isArray(safe.questions) ? safe.questions : FALLBACK_SEED.questions
  };
}

function candidateSeedPaths() {
  const candidates = [];
  if (process.env.SEED_PATH) candidates.push(process.env.SEED_PATH);

  // Standard in-repo location.
  candidates.push(path.join(__dirname, '../data/seed-content.json'));

  // Useful when working directory is the repo root.
  candidates.push(path.join(process.cwd(), 'src/data/seed-content.json'));

  // Optional external override (for deployments that mount data only).
  candidates.push(path.join(process.cwd(), 'data/seed-content.json'));

  return [...new Set(candidates)];
}

function readJsonIfExists(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    // If the file exists but cannot be read/parsed, fail fast.
    err.message = `Seed file error (${filePath}): ${err.message}`;
    throw err;
  }
}

function getSeed() {
  if (cached) return cached;

  for (const p of candidateSeedPaths()) {
    const parsed = readJsonIfExists(p);
    if (parsed) {
      cached = normalizeSeed(parsed);
      return cached;
    }
  }

  cached = normalizeSeed(FALLBACK_SEED);
  return cached;
}

module.exports = { getSeed };
