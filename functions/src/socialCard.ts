import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { Resvg } from '@resvg/resvg-js';
import { buildTemplate, CardPayload, CardFormat } from './templates';

/**
 * satori / satori-html sont ESM-only ; functions compile en CommonJS.
 * On force un vrai import() dynamique que tsc ne transpile PAS en require().
 */
// eslint-disable-next-line @typescript-eslint/no-implied-eval
const dynamicImport = new Function('m', 'return import(m)') as (m: string) => Promise<unknown>;

const FORMATS: Record<CardFormat, { w: number; h: number }> = {
  '1:1': { w: 1080, h: 1080 },
  '4:5': { w: 1080, h: 1350 },
  '9:16': { w: 1080, h: 1920 },
};

function inter(weight: number): Buffer {
  return fs.readFileSync(require.resolve(`@fontsource/inter/files/inter-latin-${weight}-normal.woff`));
}
function merriweather(weight: number): Buffer {
  return fs.readFileSync(require.resolve(`@fontsource/merriweather/files/merriweather-latin-${weight}-normal.woff`));
}

// Monogramme de marque (embarqué en data URI, chargé une fois).
let LOGO_CACHE: string | undefined;
function logoDataUri(): string {
  if (LOGO_CACHE === undefined) {
    try {
      const buf = fs.readFileSync(path.join(__dirname, '..', 'assets', 'monogramme.png'));
      // Garde-fou : un data URI trop volumineux fait s'étrangler satori-html (parsing O(n²)).
      // Le monogramme s'affiche en 64px → il doit rester léger (< ~40 Ko).
      LOGO_CACHE = buf.length > 40_000 ? '' : `data:image/png;base64,${buf.toString('base64')}`;
    } catch {
      LOGO_CACHE = '';
    }
  }
  return LOGO_CACHE;
}

/** Télécharge un fond (image IA) et le convertit en data URI pour Satori. */
async function fetchBackground(url?: string): Promise<string | undefined> {
  if (!url) return undefined;
  try {
    const res = await fetch(url);
    if (!res.ok) return undefined;
    const buf = Buffer.from(await res.arrayBuffer());
    const type = res.headers.get('content-type') || 'image/png';
    return `data:${type};base64,${buf.toString('base64')}`;
  } catch {
    return undefined;
  }
}

/** Cœur du rendu : payload -> PNG (testable sans Firebase). */
export async function renderCardPng(payload: CardPayload): Promise<Buffer> {
  const t0 = Date.now();
  const step = (s: string) => console.log(`[render] ${s} +${Date.now() - t0}ms`);
  const { w, h } = FORMATS[payload.format] || FORMATS['4:5'];
  const bg = await fetchBackground(payload.backgroundUrl);
  step('bg');

  const satoriMod = (await dynamicImport('satori')) as { default: (...a: unknown[]) => Promise<string> };
  const htmlMod = (await dynamicImport('satori-html')) as { html: (s: string) => unknown };
  step('satori imported');

  const logo = logoDataUri() || undefined;
  step(`logo ${logo ? logo.length + 'b' : 'none'}`);
  const markup = buildTemplate(payload, w, h, bg, logo);
  step(`buildTemplate ${markup.length}b`);
  const vdom = htmlMod.html(markup);
  step('satori-html');

  const svg = await satoriMod.default(vdom, {
    width: w,
    height: h,
    fonts: [
      { name: 'Inter', weight: 400, style: 'normal', data: inter(400) },
      { name: 'Inter', weight: 700, style: 'normal', data: inter(700) },
      { name: 'Inter', weight: 900, style: 'normal', data: inter(900) },
      { name: 'Merriweather', weight: 700, style: 'normal', data: merriweather(700) },
      { name: 'Merriweather', weight: 900, style: 'normal', data: merriweather(900) },
    ],
  });
  step('satori svg');

  const png = Buffer.from(new Resvg(svg, { fitTo: { mode: 'width', value: w } }).render().asPng());
  step('resvg png');
  return png;
}

/**
 * POST /renderSocialCard
 * Body: { template, format, title, body?, cta?, accent?, backgroundUrl? }
 * Auth: header X-Render-Key === env RENDER_KEY (si défini).
 * Retour: { url } (PNG public dans Storage).
 */
export const renderSocialCard = onRequest(
  { region: 'europe-west1', memory: '2GiB', cpu: 2, timeoutSeconds: 120, cors: false },
  async (req, res) => {
    try {
      const key = process.env.RENDER_KEY;
      if (key && req.get('X-Render-Key') !== key) {
        res.status(401).json({ error: 'unauthorized' });
        return;
      }
      if (req.method !== 'POST') {
        res.status(405).json({ error: 'POST only' });
        return;
      }
      const payload = req.body as CardPayload;
      if (!payload || !payload.template || !payload.format || !payload.title) {
        res.status(400).json({ error: 'template, format et title sont requis' });
        return;
      }

      const png = await renderCardPng(payload);
      const id = randomUUID();
      const file = admin.storage().bucket().file(`social-cards/${id}.png`);
      await file.save(png, {
        contentType: 'image/png',
        metadata: { cacheControl: 'public, max-age=31536000' },
      });
      await file.makePublic();
      const url = `https://storage.googleapis.com/${file.bucket.name}/${file.name}`;

      res.status(200).json({ url, format: payload.format, bytes: png.length });
    } catch (error: unknown) {
      console.error('renderSocialCard error:', error);
      res.status(500).json({ error: 'render failed', detail: error instanceof Error ? error.message : String(error) });
    }
  },
);
