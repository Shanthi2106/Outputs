import { readFileSync } from 'fs';
import { join } from 'path';
import { logger } from '../utils/logger';

export interface Term {
  term: string;
  fullName: string;
  category: string;
  definition: string;
  plainLanguage: string;
  examples: string[];
  relatedTerms: string[];
  documentTypes: string[];
  videos?: Array<{
    title: string;
    youtubeId: string;
    source?: string;
  }>;
}

export class KnowledgeBaseService {
  private terms: Term[] = [];
  private termMap: Map<string, Term> = new Map();

  constructor() {
    this.loadTerms();
  }

  /**
   * Load terms from the knowledge base JSON file
   */
  private loadTerms(): void {
    try {
      // Try multiple path resolutions for different environments (local vs Vercel)
      const possiblePaths = [
        // If knowledge-base was copied to dist during build
        join(__dirname, '../knowledge-base/terms-starter.json'),
        // Local development: from backend/dist/services/ -> ../../../knowledge-base/
        join(__dirname, '../../../knowledge-base/terms-starter.json'),
        // Vercel/serverless: from backend/dist/ -> ../knowledge-base/
        join(__dirname, '../../knowledge-base/terms-starter.json'),
        // Alternative: from project root
        join(process.cwd(), 'knowledge-base/terms-starter.json'),
        // Fallback: relative to current working directory
        './knowledge-base/terms-starter.json',
      ];

      let knowledgeBasePath: string | null = null;
      let data: string | null = null;

      for (const path of possiblePaths) {
        try {
          data = readFileSync(path, 'utf-8');
          knowledgeBasePath = path;
          logger.info(`Successfully loaded knowledge base from: ${path}`);
          break;
        } catch (err) {
          // Try next path
          continue;
        }
      }

      if (!data || !knowledgeBasePath) {
        throw new Error(`Could not find knowledge base file. Tried paths: ${possiblePaths.join(', ')}`);
      }

      this.terms = JSON.parse(data);

      // Build a map for quick lookups (case-insensitive)
      this.terms.forEach((term) => {
        this.termMap.set(term.term.toLowerCase(), term);
        // Also map full name
        this.termMap.set(term.fullName.toLowerCase(), term);
      });

      logger.info(`Loaded ${this.terms.length} terms from knowledge base`);
    } catch (error) {
      logger.error('Failed to load knowledge base:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error details: ${errorMessage}`);
      throw new Error(`Failed to load knowledge base: ${errorMessage}`);
    }
  }

  /**
   * Search for a term in the knowledge base
   */
  searchTerm(query: string): Term | null {
    const normalizedQuery = query.toLowerCase().trim();

    // Exact match
    const exactMatch = this.termMap.get(normalizedQuery);
    if (exactMatch) {
      return exactMatch;
    }

    // Partial match
    const partialMatch = this.terms.find((term) =>
      term.term.toLowerCase().includes(normalizedQuery) ||
      term.fullName.toLowerCase().includes(normalizedQuery)
    );

    return partialMatch || null;
  }

  /**
   * Get related terms
   */
  getRelatedTerms(termName: string): Term[] {
    const term = this.searchTerm(termName);
    if (!term) {
      return [];
    }

    return term.relatedTerms
      .map((relatedName) => this.searchTerm(relatedName))
      .filter((t): t is Term => t !== null);
  }

  /**
   * Get all terms in a category
   */
  getTermsByCategory(category: string): Term[] {
    return this.terms.filter(
      (term) => term.category.toLowerCase() === category.toLowerCase()
    );
  }

  /**
   * Get all terms
   */
  getAllTerms(): Term[] {
    return this.terms;
  }

  /**
   * Find terms mentioned in a text passage (word-boundary aware, longest first)
   */
  findTermsInText(text: string): Term[] {
    const normalizedText = text.toLowerCase();
    const found: Term[] = [];
    const seen = new Set<string>();

    // Prefer longer names first so "Social Skills" wins over partial matches
    const sorted = [...this.terms].sort(
      (a, b) =>
        Math.max(b.term.length, b.fullName.length) -
        Math.max(a.term.length, a.fullName.length)
    );

    for (const term of sorted) {
      const candidates = [term.term, term.fullName].filter(Boolean);
      const matched = candidates.some((name) => {
        const escaped = name.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Allow flexible whitespace in multi-word names
        const pattern = escaped.replace(/\s+/g, '\\s+');
        const re = new RegExp(`(^|[^a-z0-9])${pattern}([^a-z0-9]|$)`, 'i');
        return re.test(normalizedText);
      });

      if (matched && !seen.has(term.term.toLowerCase())) {
        seen.add(term.term.toLowerCase());
        found.push(term);
      }
    }

    return found;
  }

  /**
   * Find the best glossary term(s) for a chat question.
   * Handles phrasing like "what is an IEP?", "explain stimming", "meaning of ABA".
   */
  findTermsForChatQuery(message: string): Term[] {
    const direct = this.findTermsInText(message);
    if (direct.length > 0) {
      return direct;
    }

    // Extract candidate after common question patterns
    const patterns = [
      /what\s+(?:is|are|does)\s+(?:an?\s+|the\s+)?(.+?)(?:\?|$)/i,
      /explain\s+(?:what\s+)?(?:an?\s+|the\s+)?(.+?)(?:\?|$)/i,
      /(?:meaning|definition)\s+of\s+(?:an?\s+|the\s+)?(.+?)(?:\?|$)/i,
      /tell\s+me\s+about\s+(?:an?\s+|the\s+)?(.+?)(?:\?|$)/i,
      /help\s+me\s+understand\s+(?:an?\s+|the\s+)?(.+?)(?:\?|$)/i,
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match?.[1]) {
        const candidate = match[1].replace(/[?.!,]+$/, '').trim();
        const term = this.searchTerm(candidate);
        if (term) {
          return [term];
        }
        // Try first few words of the candidate
        const words = candidate.split(/\s+/).slice(0, 4).join(' ');
        const partial = this.searchTerm(words);
        if (partial) {
          return [partial];
        }
      }
    }

    // Last resort: searchTerm on the whole message
    const fuzzy = this.searchTerm(message);
    return fuzzy ? [fuzzy] : [];
  }

  /**
   * Get a formatted explanation for a term
   */
  getTermExplanation(term: Term): string {
    let explanation = `**${term.fullName}** (${term.term})\n\n`;
    explanation += `${term.plainLanguage}\n\n`;

    if (term.examples.length > 0) {
      explanation += `**Examples:**\n`;
      term.examples.forEach((example, index) => {
        explanation += `${index + 1}. ${example}\n`;
      });
      explanation += '\n';
    }

    if (term.relatedTerms.length > 0) {
      explanation += `**Related terms:** ${term.relatedTerms.join(', ')}\n`;
    }

    // Videos are shown as embedded players in the UI — do not dump raw links into text.

    return explanation;
  }
}

export default new KnowledgeBaseService();
