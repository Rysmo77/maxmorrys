"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderSocialCard = void 0;
exports.renderCardPng = renderCardPng;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const crypto_1 = require("crypto");
const resvg_js_1 = require("@resvg/resvg-js");
const templates_1 = require("./templates");
/**
 * satori / satori-html sont ESM-only ; functions compile en CommonJS.
 * On force un vrai import() dynamique que tsc ne transpile PAS en require().
 */
// eslint-disable-next-line @typescript-eslint/no-implied-eval
const dynamicImport = new Function('m', 'return import(m)');
const FORMATS = {
    '1:1': { w: 1080, h: 1080 },
    '4:5': { w: 1080, h: 1350 },
    '9:16': { w: 1080, h: 1920 },
};
function inter(weight) {
    return fs.readFileSync(require.resolve(`@fontsource/inter/files/inter-latin-${weight}-normal.woff`));
}
function merriweather(weight) {
    return fs.readFileSync(require.resolve(`@fontsource/merriweather/files/merriweather-latin-${weight}-normal.woff`));
}
// Monogramme de marque (embarqué en data URI, chargé une fois).
let LOGO_CACHE;
function logoDataUri() {
    if (LOGO_CACHE === undefined) {
        try {
            const buf = fs.readFileSync(path.join(__dirname, '..', 'assets', 'monogramme.png'));
            // Garde-fou : un data URI trop volumineux fait s'étrangler satori-html (parsing O(n²)).
            // Le monogramme s'affiche en 64px → il doit rester léger (< ~40 Ko).
            LOGO_CACHE = buf.length > 40000 ? '' : `data:image/png;base64,${buf.toString('base64')}`;
        }
        catch (_a) {
            LOGO_CACHE = '';
        }
    }
    return LOGO_CACHE;
}
/** Télécharge un fond (image IA) et le convertit en data URI pour Satori. */
async function fetchBackground(url) {
    if (!url)
        return undefined;
    try {
        // User-Agent navigateur obligatoire : Pollinations/Flux (et d'autres CDN d'images)
        // renvoient 403 aux clients non-navigateur → sinon le fond est silencieusement ignoré
        // et la carte retombe en « mode marque » (dégradé nu).
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
                Accept: 'image/avif,image/webp,image/png,image/jpeg,*/*',
            },
        });
        if (!res.ok)
            return undefined;
        const buf = Buffer.from(await res.arrayBuffer());
        const type = res.headers.get('content-type') || 'image/png';
        return `data:${type};base64,${buf.toString('base64')}`;
    }
    catch (_a) {
        return undefined;
    }
}
/** Cœur du rendu : payload -> PNG (testable sans Firebase). */
async function renderCardPng(payload) {
    const t0 = Date.now();
    const step = (s) => console.log(`[render] ${s} +${Date.now() - t0}ms`);
    const { w, h } = FORMATS[payload.format] || FORMATS['4:5'];
    const bg = await fetchBackground(payload.backgroundUrl);
    step('bg');
    const satoriMod = (await dynamicImport('satori'));
    const htmlMod = (await dynamicImport('satori-html'));
    step('satori imported');
    const logo = logoDataUri() || undefined;
    step(`logo ${logo ? logo.length + 'b' : 'none'}`);
    const markup = (0, templates_1.buildTemplate)(payload, w, h, bg, logo);
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
    const png = Buffer.from(new resvg_js_1.Resvg(svg, { fitTo: { mode: 'width', value: w } }).render().asPng());
    step('resvg png');
    return png;
}
/**
 * POST /renderSocialCard
 * Body: { template, format, title, body?, cta?, accent?, backgroundUrl? }
 * Auth: header X-Render-Key === env RENDER_KEY (si défini).
 * Retour: { url } (PNG public dans Storage).
 */
exports.renderSocialCard = (0, https_1.onRequest)({ region: 'europe-west1', memory: '2GiB', cpu: 2, timeoutSeconds: 120, cors: false }, async (req, res) => {
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
        const payload = req.body;
        if (!payload || !payload.template || !payload.format || !payload.title) {
            res.status(400).json({ error: 'template, format et title sont requis' });
            return;
        }
        const png = await renderCardPng(payload);
        const id = (0, crypto_1.randomUUID)();
        const file = admin.storage().bucket().file(`social-cards/${id}.png`);
        await file.save(png, {
            contentType: 'image/png',
            metadata: { cacheControl: 'public, max-age=31536000' },
        });
        await file.makePublic();
        const url = `https://storage.googleapis.com/${file.bucket.name}/${file.name}`;
        res.status(200).json({ url, format: payload.format, bytes: png.length });
    }
    catch (error) {
        console.error('renderSocialCard error:', error);
        res.status(500).json({ error: 'render failed', detail: error instanceof Error ? error.message : String(error) });
    }
});
//# sourceMappingURL=socialCard.js.map