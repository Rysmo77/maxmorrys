import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  _reinitialiserLimite, handleGenerateImage, MODELE_IMAGE, promptFinal, SUFFIXE_PROMPT, typeImage, validerDemande,
  type GenerateEnv,
} from '../src/generate';

const CLE = 'secret-de-test-0123456789';
// Un JPEG minimal suffit : seuls les octets de tête sont lus.
const JPEG_B64 = btoa(String.fromCharCode(0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46));

function env(over: Partial<GenerateEnv> = {}) {
  const put = vi.fn(async () => ({}));
  const run = vi.fn(async () => ({ image: JPEG_B64 }));
  const e = {
    AI: { run },
    BUCKET: { put } as unknown as R2Bucket,
    PUBLIC_MEDIA_BASE: 'https://media.maxmorrys.me',
    INTERNAL_UPLOAD_KEY: CLE,
    ...over,
  } as GenerateEnv;
  return { e, put, run };
}

function req(body: unknown, key = CLE): Request {
  return new Request('https://media-api.maxmorrys.me/internal/generate-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Internal-Key': key },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

const OK = { prompt: 'Editorial photo of a fictional entrepreneur in Dakar', width: 1024, height: 832 };

beforeEach(() => _reinitialiserLimite());

describe('validerDemande', () => {
  it('accepte une demande bornée', () => {
    expect(validerDemande(OK)).toEqual(OK);
  });
  it.each([
    [{ ...OK, prompt: '' }, 'prompt'],
    [{ ...OK, prompt: 'x'.repeat(1001) }, '1000'],
    [{ ...OK, width: 1544 }, 'entre'],
    [{ ...OK, height: 128 }, 'entre'],
    [{ ...OK, width: 1000 }, 'multiple de 16'],
    [{ ...OK, width: 1024.5 }, 'entier'],
    [{ ...OK, height: '832' }, 'entier'],
  ])('refuse %j', (corps, attendu) => {
    const r = validerDemande(corps);
    expect('error' in r && r.error).toContain(attendu);
  });
});

describe('promptFinal', () => {
  it('impose le suffixe sans texte', () => {
    expect(promptFinal('A photo')).toBe(`A photo. ${SUFFIXE_PROMPT}`);
    expect(promptFinal('A photo.')).toBe(`A photo. ${SUFFIXE_PROMPT}`);
  });
});

describe('typeImage', () => {
  it('reconnaît JPEG et PNG, refuse le reste', () => {
    expect(typeImage(new Uint8Array([0xff, 0xd8, 0xff, 0]))?.ext).toBe('jpg');
    expect(typeImage(new Uint8Array([0x89, 0x50, 0x4e, 0x47]))?.ext).toBe('png');
    expect(typeImage(new Uint8Array([1, 2, 3, 4]))).toBeNull();
  });
});

describe('handleGenerateImage', () => {
  it('503 sans secret configuré', async () => {
    const { e } = env({ INTERNAL_UPLOAD_KEY: undefined });
    expect((await handleGenerateImage(req(OK), e)).status).toBe(503);
  });

  it('401 avec une mauvaise clé, sans appeler le modèle', async () => {
    const { e, run } = env();
    expect((await handleGenerateImage(req(OK, 'mauvaise-cle-0123456789xx'), e)).status).toBe(401);
    expect(run).not.toHaveBeenCalled();
  });

  it('503 sans binding AI', async () => {
    const { e } = env({ AI: undefined });
    expect((await handleGenerateImage(req(OK), e)).status).toBe(503);
  });

  it('400 sur un corps invalide', async () => {
    const { e, run } = env();
    expect((await handleGenerateImage(req('{pas du json'), e)).status).toBe(400);
    expect((await handleGenerateImage(req({ ...OK, width: 4096 }), e)).status).toBe(400);
    expect(run).not.toHaveBeenCalled();
  });

  it('génère, dépose sous ai-covers/ avec une clé imposée et renvoie l’URL', async () => {
    const { e, run, put } = env();
    const res = await handleGenerateImage(req({ ...OK, key: 'social-cards/ecrase.png' }), e);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { url: string; key: string };
    expect(body.key).toMatch(/^ai-covers\/[0-9a-f-]{36}\.jpg$/);
    expect(body.url).toBe(`https://media.maxmorrys.me/${body.key}`);

    expect(run).toHaveBeenCalledTimes(1);
    const [modele, entree] = run.mock.calls[0] as unknown as [string, { multipart: { body: ReadableStream; contentType: string } }];
    expect(modele).toBe(MODELE_IMAGE);
    expect(entree.multipart.contentType).toMatch(/^multipart\/form-data; boundary=/);
    const form = await new Response(entree.multipart.body, { headers: { 'content-type': entree.multipart.contentType } }).formData();
    expect(form.get('prompt')).toBe(`${OK.prompt}. ${SUFFIXE_PROMPT}`);
    expect(form.get('width')).toBe('1024');
    expect(form.get('height')).toBe('832');

    const [cle, , opts] = put.mock.calls[0] as unknown as [string, Uint8Array, { httpMetadata: { contentType: string } }];
    expect(cle).toBe(body.key);
    expect(opts.httpMetadata.contentType).toBe('image/jpeg');
  });

  it('502 si le modèle échoue ou ne renvoie rien', async () => {
    const a = env({ AI: { run: vi.fn(async () => { throw new Error('3036: quota'); }) } });
    expect((await handleGenerateImage(req(OK), a.e)).status).toBe(502);
    const b = env({ AI: { run: vi.fn(async () => ({})) } });
    expect((await handleGenerateImage(req(OK), b.e)).status).toBe(502);
    expect(b.put).not.toHaveBeenCalled();
  });

  it('429 au-delà de 10 images par minute (repli sans binding)', async () => {
    const { e } = env();
    const t = 1_000_000;
    for (let i = 0; i < 10; i += 1) expect((await handleGenerateImage(req(OK), e, {}, t)).status).toBe(200);
    expect((await handleGenerateImage(req(OK), e, {}, t + 1000)).status).toBe(429);
    expect((await handleGenerateImage(req(OK), e, {}, t + 61_000)).status).toBe(200);
  });

  it('respecte le binding de limite quand il existe', async () => {
    const { e, run } = env({ GENERATE_LIMITER: { limit: vi.fn(async () => ({ success: false })) } });
    expect((await handleGenerateImage(req(OK), e)).status).toBe(429);
    expect(run).not.toHaveBeenCalled();
  });
});
