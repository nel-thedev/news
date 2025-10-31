import Fastify from 'fastify';
import cors from '@fastify/cors';

const app = Fastify({ logger: false }); // no logs as requested

// CORS: allow your domain and localhost for dev
await app.register(cors, {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);

    const allow = [/localhost:\d+$/, /hexagonlabs\.cloud$/].some((re) =>
      re.test(origin)
    );

    cb(null, allow);
  },
});

// Simple health check
app.get('/healthz', async () => ({ ok: true }));

// Minimal auth (x-api-key must match one of ALLOWED_KEYS values)
function isAuthorized(key?: string | string[]): boolean {
  if (!key) return false;

  const allowed = (process.env.ALLOWED_KEYS ?? '')
    .split('|')
    .map((pair) => pair.split(':')[1])
    .filter(Boolean);

  const k = Array.isArray(key) ? key[0] : key;

  return allowed.includes(k);
}

// Minimal language handling: default EN; accept 'es'
function getLang(h: any): 'en' | 'es' {
  const lang = (h['x-lang'] ?? '').toString().toLowerCase();

  return lang === 'es' ? 'es' : 'en';
}

// Placeholder /api/analyze — returns Markdown stub only
app.post('/api/analyze', async (req, reply) => {
  const headers = req.headers as Record<string, string | string[] | undefined>;

  if (!isAuthorized(headers['x-api-key'])) {
    return reply.code(401).send({ error: 'unauthorized' });
  }

  const lang = getLang(headers);
  const body = (req.body ?? {}) as { url?: string; mode?: string };
  const mode = (body.mode ?? 'summary') as 'summary' | 'bias' | 'background';
  const url = body.url ?? '';

  const sections = {
    en: {
      title: '# News Helper (Stub)',
      tldr: '## TL;DR\nThis is a placeholder response. Real analysis will appear here.',
      key: '## Key Points\n- Paste a valid URL\n- Choose a mode\n- Get Markdown output',
      sources: '## Sources\n- (live search & citations will go here)',
    },
    es: {
      title: '# News Helper (Borrador)',
      tldr: '## Resumen\nEsta es una respuesta de prueba. El análisis real aparecerá aquí.',
      key: '## Puntos clave\n- Pega un URL válido\n- Elige un modo\n- Obtén salida en Markdown',
      sources: '## Fuentes\n- (la búsqueda en vivo y citas irán aquí)',
    },
  }[lang];

  const modeHeading = lang === 'es' ? `## Modo: ${mode}` : `## Mode: ${mode}`;

  const urlLine = url
    ? lang === 'es'
      ? `**Artículo:** ${url}`
      : `**Article:** ${url}`
    : '';

  const md = [
    sections.title,
    modeHeading,
    urlLine,
    sections.tldr,
    sections.key,
    sections.sources,
  ]
    .filter(Boolean)
    .join('\n\n');

  return reply.send({
    meta: { title: null, author: null, published: null, site: null },
    mode,
    data: md,
  });
});

// Port 8787
const port = Number(process.env.PORT ?? 8787);
app.listen({ port, host: '0.0.0.0' }).catch((err) => {
  // still no noisy logs; crash fast
  process.exit(1);
});
