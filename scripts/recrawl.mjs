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

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
};

const TOKEN = flag('--token') ?? process.env.FB_ACCESS_TOKEN;
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

async function main() {
  const urls = await urlsFromSitemap();
  console.log(`${urls.length} URL dont l'aperçu a changé.\n`);

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
      const image = await rescrape(url);
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
  if (failures.length) {
    console.log(`${failures.length} échec(s) :`);
    for (const f of failures) console.log(`  ${f.url} — ${f.message}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
