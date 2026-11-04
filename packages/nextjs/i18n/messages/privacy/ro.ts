import type { PrivacyMessages } from "./shared";
import { plural } from "~~/i18n/format";

const ATTRIBUTION_QUESTION_RO = "„Cum ai aflat de Tokenping?”";

export const MESSAGES: PrivacyMessages = {
  metaTitle: "Confidențialitate și date",
  metaDescription:
    "Ce stochează Tokenping când setezi o alertă de health factor pentru Aave, ce nu stochează, ce servicii îți prelucrează datele și cum le ștergi.",
  crumbHome: "Acasă",
  crumbPrivacy: "Confidențialitate",
  title: "Confidențialitate: ce stochează Tokenping și cine prelucrează datele",
  lastUpdated: "Ultima actualizare",
  intro:
    "Această pagină descrie ce face aplicația astăzi. Tokenping este în beta și actualizăm această pagină când se schimbă ce colectăm.",
  withoutUs: {
    title: "Ce poți face fără să ne dai nimic",
    text: "Citirea site-ului și a blogului și vizualizarea pozițiilor tale în panou nu adaugă nimic în baza noastră de date. Ca să-ți arate pozițiile, browserul tău cere datele Aave ale portofelului de la furnizori RPC (enumerați mai jos), așa că aceștia văd adresa portofelului tău.",
    morpho:
      "În panoul Morpho, browserul tău trimite adresa portofelului și către API-ul Morpho, care găsește piețele Morpho în care te împrumuți, și îți citește pozițiile Morpho de la aceiași furnizori RPC.",
  },
  stored: {
    title: "Ce stocăm când salvezi o alertă",
    items: [
      "Adresa portofelului tău.",
      "Rețeaua pentru care este alerta și pragul tău.",
      "Canalele pe care le-ai ales și limba fiecăruia.",
      "Adresa ta de e-mail, dacă ai ales e-mail.",
      "Numele tău de utilizator Signal, dacă ai ales Signal.",
      "Când a fost creată alerta și când a fost modificată ultima dată.",
      "Când ai trimis ultima dată un mesaj de test pe fiecare canal, ca să permitem un test pe canal la fiecare 15 minute.",
    ],
    telegram:
      "Dacă alegi Telegram, stocăm numele de utilizator Telegram pe care îl scrii în alertă. Când acel cont apasă Start în botul Tokenping, stocăm și ID-ul chatului și momentul în care a apăsat Start, ca alertele să poată ajunge la el. Oricine poate verifica dacă un nume de utilizator Telegram a apăsat Start în bot.",
    attribution: `Dacă răspunzi la întrebarea opțională ${ATTRIBUTION_QUESTION_RO} după ce salvezi o alertă, stocăm răspunsul tău și momentul, împreună cu adresa portofelului.`,
  },
  notStored: {
    title: "Ce nu stocăm",
    items: [
      "Pozițiile tale sau un istoric al health factor-ului tău. Sunt citite pe loc și nu sunt salvate.",
      "Un jurnal al alertelor pe care le-am trimis.",
      `Pixeli de urmărire sau cookie-uri de publicitate: site-ul nu folosește niciunul. Când te autentifici cu portofelul, Tokenping setează un cookie care spune doar ce portofel s-a autentificat; durează 7 zile sau până deconectezi portofelul pe acest site. Cât timp te autentifici, un al doilea cookie păstrează cererea de autentificare timp de cinci minute. Browserul tău păstrează în propria stocare locală alegerea temei, conexiunea portofelului, ce portofele s-au autentificat în el și dacă ți-a arătat deja întrebarea ${ATTRIBUTION_QUESTION_RO}.`,
      "Adrese IP în baza noastră de date. Vercel prelucrează totuși fiecare cerere, așa cum este descris mai jos. Când o verificare a alertei sau un mesaj eșuează, eroarea, care poate include adresa portofelului tău și destinatarul, ajunge în jurnalele serverului nostru.",
    ],
  },
  whoCanSee: {
    title: "Cine îți poate vedea setările alertelor",
    tiedToWallet:
      "Setările alertelor sunt legate de o adresă de portofel, nu de un cont cu parolă. Ca să le vezi sau să le modifici, semnezi un mesaj cu acel portofel, ceea ce dovedește că adresa este a ta. Nu este o tranzacție și nu costă gas, iar o semnătură durează 7 zile în acel browser.",
    anyone: hasTelegram =>
      `Doar cineva care poate semna cu portofelul tău poate vedea adresa de e-mail${hasTelegram ? ", numele de utilizator Signal și numele de utilizator Telegram" : " și numele de utilizator Signal"} salvate pentru el sau îi poate modifica ori șterge alertele. Înregistrările publice ale plăților, descrise mai jos, arată totuși ce portofele au plătit.`,
    dontEnter:
      "Nu introduce o adresă de e-mail sau un nume de utilizator Signal pe care nu ai vrea să le vezi legate de adresa portofelului tău.",
  },
  processors: {
    title: "Cine îți prelucrează datele",
    list: ({ minutes, hasTelegram }) => [
      {
        name: "Vercel",
        role: `Găzduiește acest site și rulează verificarea alertelor ${plural("ro", minutes, {
          one: "în fiecare minut",
          few: `la fiecare ${minutes} minute`,
          other: `la fiecare ${minutes} de minute`,
        })}.`,
        receives: "Fiecare cerere către site, inclusiv adresa ta IP, și jurnalele serverului nostru.",
      },
      {
        name: "Vercel Web Analytics",
        role: "Numără vizitele pe pagini, fără cookie-uri.",
        receives:
          "Pentru fiecare vizită pe o pagină: adresa paginii, site-ul de pe care ai venit, locația ta aproximativă, precum și browserul, sistemul de operare și tipul dispozitivului. Un vizitator este un hash al cererii care se schimbă la fiecare 24 de ore, așa că vizitele nu pot fi legate între zile sau între site-uri.",
      },
      { name: "Supabase", role: "Baza noastră de date.", receives: "Setările alertelor enumerate mai sus." },
      { name: "Resend", role: "Trimite e-mailurile cu alerte.", receives: "Adresa ta de e-mail și textul alertei." },
      {
        name: "Fly.io (releul nostru Signal)",
        role: "Găzduiește serverul signal-cli-rest-api pe care îl rulăm noi, care predă alertele Signal către Signal.",
        receives: "Numele tău de utilizator Signal și textul alertei (le primește și Signal).",
      },
      ...(hasTelegram
        ? [
            {
              name: "Telegram",
              role: "Livrează alertele Telegram prin Bot API.",
              receives: "ID-ul chatului tău Telegram și textul alertei.",
            },
          ]
        : []),
      {
        name: "Furnizori RPC (PublicNode, Alchemy și endpointurile publice ale rețelelor)",
        role: "Răspund la citirile din blockchain: din browserul tău pentru panou și de pe serverul nostru pentru verificarea alertelor și pentru verificarea semnăturilor de autentificare ale portofelelor smart.",
        receives:
          "Adresa portofelului citit (și, când te autentifici, semnătura ta) și adresa ta IP pentru citirile făcute din browserul tău.",
      },
      {
        name: "API-ul Morpho",
        role: "Găsește piețele Morpho listate în care se împrumută portofelul tău, pentru panoul Morpho, și îi spune serverului nostru dacă o piață este listată când salvezi o alertă Morpho.",
        receives: "Adresa portofelului tău și adresa ta IP pentru căutările făcute de browserul tău.",
      },
      {
        name: "WalletConnect",
        role: "Transmite conexiunea dintre acest site și aplicația portofelului tău, dacă te conectezi cu WalletConnect.",
        receives:
          "Ce schimbă aplicația portofelului tău și acest site ca să se conecteze, de exemplu adresa portofelului.",
      },
    ],
    receives: receives => `Primește: ${receives}`,
    ownPolicy: "Fiecare dintre aceste servicii prelucrează datele conform propriei politici de confidențialitate.",
  },
  onChain: {
    title: "Ce este public pe blockchain",
    text: paymentChainName =>
      `Plata pentru alerte se face pe ${paymentChainName ?? "rețeaua de plată"}. Fiecare plată înregistrează adresa plătitoare, tokenul, suma, momentul, perioada cumpărată și noua dată de expirare într-un eveniment public pe care oricine îl poate citi și nimeni nu îl poate șterge. Setările alertelor tale nu sunt scrise niciodată într-un blockchain.`,
  },
  retention: {
    title: "Cât timp le păstrăm și cum le ștergi",
    settings:
      "Setările alertei rămân până ștergi alerta din panou. Ștergerea elimină setările pentru acea rețea, inclusiv adresa de e-mail și numele de utilizator Signal, și necesită acces activ.",
    telegramStop:
      "Dacă trimiți /stop botului Tokenping în Telegram, chatul tău este deconectat și alertele Telegram se opresc.",
    contact: {
      before: `Dacă accesul tău a expirat sau vrei să fie șters răspunsul tău la ${ATTRIBUTION_QUESTION_RO}, scrie-ne pe`,
      x: "X",
      middle: "sau în comunitatea noastră de pe",
      telegram: "Telegram",
      or: "sau",
      signal: "Signal",
      after: "și ne ocupăm de ștergere.",
    },
    payments: "Plățile de pe blockchain nu pot fi șterse de nimeni.",
  },
  homepage: {
    before: "Întrebările despre cum funcționează alertele au răspuns pe ",
    link: "pagina principală",
    after: ".",
  },
};
