import type { Plugin, ViteDevServer } from 'vite';
import { config as dotenvConfig } from 'dotenv';
import type { MinimalRequest, MinimalResponse } from './httpTypes.ts';

dotenvConfig();
const envCache: Record<string, string> = process.env as Record<string, string>;

// Gemini's response shape varies per endpoint (embeddings vs. generateContent),
// so callers pick the fields they need off the parsed JSON body.
async function geminiFetch(endpoint: string, body: any): Promise<any> {
  const apiKey = envCache.VITE_GEMINI_API_KEY || envCache.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing VITE_GEMINI_API_KEY in environment");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${endpoint}?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API Error: ${res.status} ${res.statusText} - ${errText}`);
  }

  return res.json();
}

export function attachAiRoutes(app: any) {
  // ─── Embed endpoint ──────────────────────────────────────────────────
  app.use('/api/ai/embed', async (req: MinimalRequest, res: MinimalResponse) => {
        try {
          if (req.method !== 'POST') { res.statusCode = 405; res.end(); return; }
          
          let body = '';
          req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
          req.on('end', async () => {
            try {
              const { text } = JSON.parse(body);
              if (!text) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Missing text parameter' }));
                return;
              }

              let data;
              try {
                data = await geminiFetch('gemini-embedding-001:embedContent', {
                  model: 'models/gemini-embedding-001',
                  content: {
                    parts: [{ text }]
                  }
                });
              } catch (fallbackErr) {
                data = await geminiFetch('gemini-embedding-2-preview:embedContent', {
                  model: 'models/gemini-embedding-2-preview',
                  content: {
                    parts: [{ text }]
                  }
                });
              }

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ embedding: data.embedding.values }));
            } catch (err: any) {
              console.error('[AI Embed Error]', err.message);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        } catch (err: any) {
          console.error('[AI Embed Request Error]', err.message);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message }));
        }
      });

      // ─── Parse Search endpoint ──────────────────────────────────────────────────
      app.use('/api/ai/parse-search', async (req: MinimalRequest, res: MinimalResponse) => {
        try {
          if (req.method !== 'POST') { res.statusCode = 405; res.end(); return; }
          
          let body = '';
          req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
          req.on('end', async () => {
            try {
              const { query } = JSON.parse(body);
              if (!query) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Missing query parameter' }));
                return;
              }

              const prompt = `You are an AI assistant parsing a natural language query into a structured game search query.
User query: "${query}"

Return a JSON object conforming to this schema:
{
  "target": "string", // "igdb" if looking for new games, "library" if referring to owned, played, unplayed, or my games
  "igdbSearchQuery": "string", // Concise keyword search string for IGDB (e.g. "mario", "roguelike") or empty string if purely generic.
  "filters": {
    "genres": ["string"], // e.g. ["Co-op", "Roguelike"]
    "platforms": ["string"], // e.g. ["PC", "Switch"]
    "maxTime": 0, // Number representing max hours to beat, e.g. 20. Omit if not specified.
    "status": "string", // "Wishlist", "Backlog", "Playing", "Played", "Unplayed" (for library targeting). Omit if not specified.
    "minRating": 0 // Minimum user rating (out of 5) if targeting library. Omit if not specified.
  }
}

Do not include any Markdown wrapping like \`\`\`json. Return only raw JSON.`;

              const data = await geminiFetch('gemini-2.5-flash:generateContent', {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                  responseMimeType: "application/json",
                  temperature: 0.1,
                }
              });

              const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
              if (!text) {
                throw new Error("No text response from Gemini");
              }

              res.setHeader('Content-Type', 'application/json');
              res.end(text);
            } catch (err: any) {
              console.error('[AI Parse Error]', err.message);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        } catch (err: any) {
          console.error('[AI Parse Request Error]', err.message);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      // ─── Recommend endpoint ─────────────────────────────────────────────────────
      app.use('/api/ai/recommend', async (req: MinimalRequest, res: MinimalResponse) => {
        try {
          if (req.method !== 'POST') { res.statusCode = 405; res.end(); return; }
          
          let body = '';
          req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
          req.on('end', async () => {
            try {
              const { intent, candidates } = JSON.parse(body);
              if (!intent || !candidates || !Array.isArray(candidates)) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Missing intent or candidates' }));
                return;
              }

              const prompt = `You are a video game recommendation assistant.
User's intent: "${intent}"

Here is a list of candidate games from the user's unplayed library, pre-ranked by similarity to their top-rated games.
Candidates:
${JSON.stringify(candidates, null, 2)}

Your task is to select 3 to 5 games from this specific list that best match the user's intent.
DO NOT invent any games. ONLY choose from the provided candidates.
For each chosen game, provide a concise, one-line reason (under 100 characters) specifically referencing their intent and the game's metadata (e.g. time to beat, genres).

Return a JSON object conforming strictly to this schema:
{
  "picks": [
    {
      "id": 0, // The exact integer ID from the candidate list
      "reason": "string" // Your one-line reason
    }
  ]
}

Do not include any Markdown wrapping like \`\`\`json. Return only raw JSON.`;

              const data = await geminiFetch('gemini-2.5-flash:generateContent', {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                  responseMimeType: "application/json",
                  temperature: 0.2,
                }
              });

              const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
              if (!text) {
                throw new Error("No text response from Gemini");
              }

              res.setHeader('Content-Type', 'application/json');
              res.end(text);
            } catch (err: any) {
              console.error('[AI Recommend Error]', err.message);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        } catch (err: any) {
          console.error('[AI Recommend Request Error]', err.message);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      // ─── Parse Log endpoint ─────────────────────────────────────────────────────
      app.use('/api/ai/parse-log', async (req: MinimalRequest, res: MinimalResponse) => {
        try {
          if (req.method !== 'POST') { res.statusCode = 405; res.end(); return; }
          
          let body = '';
          req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
          req.on('end', async () => {
            try {
              const { text, currentDate } = JSON.parse(body);
              if (!text) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Missing text parameter' }));
                return;
              }

              const prompt = `You are an AI assistant parsing a natural language video game logging entry.
User input: "${text}"
Current local date: "${currentDate}"

Extract the game title and any other structured logging fields provided. 
Resolve any relative dates (like "Sunday", "last weekend", "yesterday") to actual ISO dates ("YYYY-MM-DD") using the Current local date.
If the user mentions a rating like "4.5 stars" or "4/5", convert it to a numeric value out of 5.0 (0.5 to 5.0 in 0.5 increments).
If a field is not mentioned, omit it. Do not invent any values.

Return a JSON object conforming to this schema:
{
  "title": "string",
  "logFields": {
    "status": "string", // "Wishlist", "Backlog", "Playing", "Played"
    "completion": "string", // "Completed", "Mastered", "Abandoned", "Shelved" (only if status is Played)
    "rating": 0, // Number between 0.5 and 5.0
    "platform": "string", // Ensure it's a string, or omit if not found
    "timePlayed": 0, // Number representing hours played
    "startedAt": "string", // "YYYY-MM-DD"
    "finishedAt": "string", // "YYYY-MM-DD"
    "ownership": ["string"] // Array of "Physical", "Digital", "Subscription", "Borrowed"
  }
}

Do not include any Markdown wrapping like \`\`\`json. Return only raw JSON.`;

              const data = await geminiFetch('gemini-2.5-flash:generateContent', {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                  responseMimeType: "application/json",
                  temperature: 0.1,
                }
              });

              const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
              if (!responseText) {
                throw new Error("No text response from Gemini");
              }

              res.setHeader('Content-Type', 'application/json');
              res.end(responseText);
            } catch (err: any) {
              console.error('[AI Parse Log Error]', err.message);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        } catch (err: any) {
          console.error('[AI Parse Log Request Error]', err.message);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      // ─── Taste Insights endpoint ────────────────────────────────────────────────
      app.use('/api/ai/taste-insights', async (req: MinimalRequest, res: MinimalResponse) => {
        try {
          if (req.method !== 'POST') { res.statusCode = 405; res.end(); return; }
          
          let body = '';
          req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
          req.on('end', async () => {
            try {
              const aggregates = JSON.parse(body);
              if (!aggregates) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Missing aggregates data' }));
                return;
              }

              const prompt = `You are an AI video game analyst generating "Taste Insights" for a user based on their computed gaming statistics.

Here is the precise, computed aggregate data of their gaming library and habits:
${JSON.stringify(aggregates, null, 2)}

Your task:
1. Review this data carefully.
2. Extract 3 to 5 concise, specific, and honest observations (insights) about the user's habits. 
3. Each insight MUST reference the specific supporting numbers from the aggregates provided (e.g., "You abandon ~70% of games over 40 hours", "Your average rating for RPGs is 4.5 vs 2.0 for Shooters").
4. Allow honest, slightly unflattering observations (e.g. genres they wishlist but never play). Do NOT pad with generic praise.
5. Do NOT invent patterns. Only state what is demonstrably true in the data provided.
6. If the data is too sparse to form real patterns (e.g. very few games played or rated), return a single insight stating that there isn't enough data yet.

Return a JSON object conforming strictly to this schema:
{
  "insights": [
    "string" // concise insight sentence referencing data
  ]
}

Do not include any Markdown wrapping like \`\`\`json. Return only raw JSON.`;

              const data = await geminiFetch('gemini-2.5-flash:generateContent', {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                  responseMimeType: "application/json",
                  temperature: 0.3,
                }
              });

              const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
              if (!responseText) {
                throw new Error("No text response from Gemini");
              }

              res.setHeader('Content-Type', 'application/json');
              res.end(responseText);
            } catch (err: any) {
              console.error('[AI Taste Insights Error]', err.message);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        } catch (err: any) {
          console.error('[AI Taste Insights Request Error]', err.message);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message }));
        }
  });
}

export function aiBackend(): Plugin {
  return {
    name: 'vite-plugin-ai',
    configResolved() {
      // env is read from process.env directly; dotenv populates it in both dev and electron
    },
    configureServer(server: ViteDevServer) {
      attachAiRoutes(server.middlewares);
    }
  };
}
