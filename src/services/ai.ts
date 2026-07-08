export interface ParsedQuery {
  target: 'igdb' | 'library';
  igdbSearchQuery: string;
  filters: {
    genres?: string[];
    platforms?: string[];
    maxTime?: number;
    status?: string;
    minRating?: number;
  };
}

/**
 * Gets an embedding vector for the given text.
 */
export async function embed(text: string): Promise<number[]> {
  const res = await fetch('/api/ai/embed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    throw new Error('Failed to fetch embedding');
  }
  const data = await res.json();
  return data.embedding;
}

/**
 * Parses a natural language query into structured search filters.
 */
export async function parseSearch(query: string): Promise<ParsedQuery> {
  const res = await fetch('/api/ai/parse-search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) {
    throw new Error('Failed to parse search');
  }
  const data = await res.json();
  return data;
}

export interface ParsedLogResult {
  title: string;
  logFields: {
    status?: string;
    completion?: string;
    rating?: number;
    platform?: string;
    timePlayed?: number;
    startedAt?: string;
    finishedAt?: string;
    ownership?: string[];
  };
}

/**
 * Parses a natural language log entry into structured fields.
 */
export async function parseLog(text: string): Promise<ParsedLogResult> {
  const res = await fetch('/api/ai/parse-log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      text, 
      currentDate: new Date().toISOString().split('T')[0] 
    }),
  });
  if (!res.ok) {
    throw new Error('Failed to parse log');
  }
  const data = await res.json();
  return data;
}

/**
 * Generates taste insights based on computed aggregates.
 */
export async function generateTasteInsights(aggregates: any): Promise<string[]> {
  const res = await fetch('/api/ai/taste-insights', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(aggregates),
  });
  if (!res.ok) {
    throw new Error('Failed to generate insights');
  }
  const data = await res.json();
  return data.insights || [];
}

/**
 * Calculates cosine similarity between two vectors.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
