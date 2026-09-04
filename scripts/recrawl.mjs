#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * `recrawl` — FAIRE OUBLIER AUX PLATEFORMES L'ANCIEN APERÇU.
 *
 * Facebook, et donc WhatsApp, mettent en cache l'aperçu d'un lien la première fois que
 * quelqu'un le partage — et ils le gardent. Après un changement d'`og:image` ou de titre, un
 * lien déjà partagé continue d'afficher l'ANCIENNE vignette, parfois des semaines. Le
 * déploiement ne suffit donc pas : il faut demander le re-balayage, URL par URL.
 *
 * Le Sharing Debugger fait ça très bien pour trois liens. Pour les quatre-vingts dont
 * l'aperçu a changé le 03/09/2026 — les pages statiques et les questions de la FAQ, qui
 * partageaient toutes la même photographie —, il faut le même appel, en lot.
 *
 *   node scripts/recrawl.mjs --token <jeton>            # tout ce qui a changé
 *   node scripts/recrawl.mjs --token <jeton> --dry      # affiche la liste, n'appelle rien
 *   node scripts/recrawl.mjs --token <jeton> --only /faq
 *   node scripts/recrawl.mjs --token <jeton> --retry    # seulement les échecs du dernier passage
 *
 * LE PLAFOND DE L'APPLICATION. Facebook compte les appels PAR APPLICATION sur une fenêtre
 * glissante, pas par URL. Une série de quatre-vingts liens la touche en fin de course :
 * l'erreur `(#4) Application request limit reached` ne dit rien de l'URL, elle dit que le
 * quota du jeton est épuisé. Le script attend et retente de lui-même ; s'il échoue quand
 * même, les URL concernées sont écrites dans `.recrawl-failed.txt` et `--retry` les reprend
 * seules, une fois la fenêtre passée.
 *
 * LE JETON. Il vient du Graph API Explorer
 * (https://developers.facebook.com/tools/explorer/) : « Generate Access Token », aucune
 * permission particulière n'est requise pour re-balayer une URL publique. Il expire en une
 * ou deux heures — c'est voulu, et suffisant ici.
 *
 * ⚠️ LinkedIn n'a pas d'équivalent : son Post Inspector est manuel, une URL à la fois. Son
 * cache expire de lui-même en une semaine environ, donc n'y passer que les pages qu'on
 * s'apprête réellement à partager. X, lui, n'a plus d'outil du tout depuis le retrait du Card
 * Validator : il refait la lecture quand le lien est publié, il n'y a rien à faire.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
};

const TOKEN = flag('--token') ?? process.env.FB_ACCESS_TOKEN;
const RETRY = args.includes('--retry');
/** Les URL que le dernier passage n'a pas pu re-balayer. Relu par `--retry`. */
const FAILED_FILE = new URL('../.recrawl-failed.txt', import.meta.url);
const DRY = args.includes('--dry');
const ONLY = flag('--only');
const SITEMAP = flag('--sitemap') ?? 'https://maxmorrys.me/sitemap.xml';

/**
 * Les contenus à couverture d'auteur — article, formation, podcast, vidéo — gardent leur
 * image : leur aperçu n'a pas changé. Les re-balayer consommerait du quota pour rien.
 */
const IMAGE_INCHANGEE = /\/(blog|formations|podcasts|videos|courses)\//;

/** Un robot y verrait une requête automatisée ; Cloudflare refuse les agents par défaut. */
const UA = 'Mozilla/5.0 (compatible; maxmorrys-recrawl/1.0)';

async function urlsFromSitemap() {
  const response = await fetch(SITEMAP, { headers: { 'User-Agent': UA } });
  if (!response.ok) throw new Error(`sitemap : HTTP ${response.status}`);
  const xml = await response.text();
  const all = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  return all.filter((u) => !IMAGE_INCHANGEE.test(u)).filter((u) => !ONLY || u.includes(ONLY));
}

/** L'erreur du plafond d'application, qui n'a rien à voir avec l'URL demandée. */
function estPlafond(message) {
  return /#4\b|request limit|rate limit/i.test(message);
}

/**
 * Demande le re-balayage d'une URL.
 *
 * `scrape=true` force Facebook à refaire la lecture au lieu de rendre son cache. La réponse
 * contient ce qu'il a VU — on en ressort l'image, qui est justement ce qu'on voulait changer :
 * c'est la seule confirmation qui vaille quelque chose.
 */
async function rescrape(url) {
  const endpoint = new URL('https://graph.facebook.com/');
  endpoint.searchParams.set('id', url);
  endpoint.searchParams.set('scrape', 'true');
  endpoint.searchParams.set('access_token', TOKEN);

  const response = await fetch(endpoint, { method: 'POST' });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    // Le message de Facebook est plus utile que le code : jeton expiré, quota, URL refusée.
    throw new Error(body?.error?.message ?? `HTTP ${response.status}`);
  }
  return body?.image?.[0]?.url ?? body?.og_object?.image?.[0]?.url;
}

/**
 * Re-balaie en encaissant le plafond.
 *
 * La fenêtre de Facebook se compte en minutes : attendre est la seule réponse utile, et une
 * pause vaut mieux qu'un échec à faire reprendre à la main. Les autres erreurs — jeton
 * expiré, URL refusée — remontent tout de suite : les retenter ne changerait rien.
 */
async function rescrapePatient(url, onWait) {
  const attentes = [60, 180, 300];
  for (let i = 0; ; i++) {
    try {
      return await rescrape(url);
    } catch (error) {
      if (!estPlafond(error.message) || i >= attentes.length) throw error;
      onWait(attentes[i]);
      await new Promise((r) => setTimeout(r, attentes[i] * 1000));
    }
  }
}

async function main() {
  /*
    `--retry` ne relit PAS le sitemap : il reprend exactement ce qui a échoué. Rejouer les
    quatre-vingts pour quatre manquantes rebrûlerait le quota qui les avait fait échouer.
  */
  const urls = RETRY
    ? (existsSync(FAILED_FILE) ? readFileSync(FAILED_FILE, 'utf8').trim().split('\n').filter(Boolean) : [])
    : await urlsFromSitemap();

  if (RETRY && urls.length === 0) {
    console.log('Aucun échec en attente — rien à reprendre.');
    return;
  }
  console.log(
    RETRY
      ? `${urls.length} URL reprises depuis le dernier passage.\n`
      : `${urls.length} URL dont l'aperçu a changé.\n`,
  );

  if (DRY) {
    for (const u of urls) console.log(`  ${u}`);
    console.log('\n(--dry : rien n’a été appelé)');
    return;
  }

  if (!TOKEN) {
    console.error(
      'Jeton manquant.\n\n' +
        '  1. Ouvrir https://developers.facebook.com/tools/explorer/\n' +
        '  2. « Generate Access Token » (aucune permission particulière)\n' +
        '  3. node scripts/recrawl.mjs --token <le jeton>\n\n' +
        'Pour voir la liste sans jeton : node scripts/recrawl.mjs --dry',
    );
    process.exit(1);
  }

  let ok = 0;
  const failures = [];

  for (const [index, url] of urls.entries()) {
    try {
      const image = await rescrapePatient(url, (secondes) =>
        console.log(`      ⏸ plafond de l'application atteint — pause de ${secondes} s`),
      );
      ok++;
      const seen = image ? image.replace('https://maxmorrys.me', '') : '— aucune image vue';
      console.log(`  ✔ ${String(index + 1).padStart(3)}/${urls.length}  ${url}\n         → ${seen}`);
    } catch (error) {
      failures.push({ url, message: error.message });
      console.log(`  ✖ ${String(index + 1).padStart(3)}/${urls.length}  ${url}\n         → ${error.message}`);
    }
    // Facebook limite les appels par application : un court répit vaut mieux qu'un blocage
    // au soixantième lien, qui obligerait à tout reprendre.
    await new Promise((r) => setTimeout(r, 350));
  }

  console.log(`\n${ok}/${urls.length} re-balayées.`);

  if (failures.length === 0) {
    // Plus rien en attente : ne pas laisser derrière soi une liste d'échecs périmée, que le
    // prochain `--retry` rejouerait pour rien.
    if (existsSync(FAILED_FILE)) unlinkSync(FAILED_FILE);
    return;
  }

  writeFileSync(FAILED_FILE, failures.map((f) => f.url).join('\n') + '\n');
  console.log(`${failures.length} échec(s) :`);
  for (const f of failures) console.log(`  ${f.url} — ${f.message}`);
  console.log(
    failures.every((f) => estPlafond(f.message))
      ? '\nToutes dues au plafond de l’application : la fenêtre se rouvre en une heure environ.\n' +
          '  node scripts/recrawl.mjs --token <jeton> --retry'
      : '\n  node scripts/recrawl.mjs --token <jeton> --retry',
  );
  process.exit(1);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
