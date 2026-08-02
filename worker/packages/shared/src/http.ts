/** Réponse JSON. */
export function json(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
  });
}

/** Réponse texte, avec le type MIME explicite (XML, CSV, HTML…). */
export function text(
  body: string,
  contentType: string,
  status = 200,
  headers: Record<string, string> = {},
): Response {
  return new Response(body, {
    status,
    headers: { 'Content-Type': contentType, ...headers },
  });
}
