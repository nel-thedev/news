const API = import.meta.env.VITE_API_BASE_URL ?? '/api';

const form = document.querySelector<HTMLFormElement>('#form')!;
const result = document.querySelector<HTMLElement>('#result')!;

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  result.innerHTML = '<p>Analyzing…</p>';

  const data = new FormData(form);
  const url = String(data.get('url') ?? '');
  const mode = String(data.get('mode') ?? 'summary');
  const lang = String(data.get('lang') ?? 'en');
  const key = String(data.get('key') ?? '');

  try {
    const r = await fetch(`${API}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'x-lang': lang,
      },
      body: JSON.stringify({ url, mode }),
    });

    if (r.status === 429) {
      const body = await safeJson(r);
      result.innerHTML = `<div class="alert">Rate limited. ${
        body?.message ?? 'Please retry in ~60s.'
      }</div>`;
      return;
    }
    if (!r.ok) {
      const body = await safeJson(r);
      result.innerHTML = `<div class="alert">Error: ${
        body?.error ?? r.statusText
      }</div>`;
      return;
    }

    const body = await r.json();
    const md = String(body.data || '');
    result.innerHTML = renderMarkdown(md);
  } catch (err: any) {
    result.innerHTML = `<div class="alert">Network error: ${
      err?.message ?? err
    }</div>`;
  }
});

async function safeJson(r: Response) {
  try {
    return await r.json();
  } catch {
    return null;
  }
}

// Minimal Markdown renderer placeholder: escape + basic newlines.
// We’ll replace with a safer renderer later; for now just pre-style.
function renderMarkdown(md: string) {
  const esc = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return `<pre class="markdown">${esc}</pre>`;
}
