import fs from 'fs';
import path from 'path';
import { LitBotKnowledgeArticle, DEFAULT_KNOWLEDGE_ARTICLES } from '../lib/litbotKnowledge';

const KNOWLEDGE_FILE_PATH = path.resolve(process.cwd(), '.litbot-knowledge.json');

let memoryCache: LitBotKnowledgeArticle[] | null = null;

export function getServerKnowledgeArticles(): LitBotKnowledgeArticle[] {
  if (memoryCache) return memoryCache;

  try {
    if (fs.existsSync(KNOWLEDGE_FILE_PATH)) {
      const raw = fs.readFileSync(KNOWLEDGE_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryCache = parsed;
        return memoryCache;
      }
    }
  } catch (err) {
    console.warn('Note reading server LITbot knowledge store:', err);
  }

  memoryCache = [...DEFAULT_KNOWLEDGE_ARTICLES];
  return memoryCache;
}

export function saveServerKnowledgeArticles(articles: LitBotKnowledgeArticle[]): LitBotKnowledgeArticle[] {
  const sanitized = Array.isArray(articles) ? articles : DEFAULT_KNOWLEDGE_ARTICLES;
  memoryCache = sanitized;

  try {
    fs.writeFileSync(KNOWLEDGE_FILE_PATH, JSON.stringify(sanitized, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Note persisting LITbot knowledge store to disk:', err);
  }

  return memoryCache;
}

export function mergeKnowledgeArticles(
  clientArticles: LitBotKnowledgeArticle[] = []
): LitBotKnowledgeArticle[] {
  const serverArticles = getServerKnowledgeArticles();
  const byId = new Map<string, LitBotKnowledgeArticle>();

  for (const item of serverArticles) {
    if (item && item.id) byId.set(item.id, item);
  }
  for (const item of clientArticles) {
    if (item && item.id) byId.set(item.id, item);
  }

  return Array.from(byId.values());
}
