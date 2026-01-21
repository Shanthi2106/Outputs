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
      const knowledgeBasePath = join(__dirname, '../../../knowledge-base/terms-starter.json');
      const data = readFileSync(knowledgeBasePath, 'utf-8');
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
      throw new Error('Failed to load knowledge base');
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
   * Find terms mentioned in a text passage
   */
  findTermsInText(text: string): Term[] {
    const normalizedText = text.toLowerCase();
    const foundTerms: Term[] = [];

    this.terms.forEach((term) => {
      // Check if term or full name appears in text
      if (
        normalizedText.includes(term.term.toLowerCase()) ||
        normalizedText.includes(term.fullName.toLowerCase())
      ) {
        foundTerms.push(term);
      }
    });

    return foundTerms;
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
      explanation += `**Related terms:** ${term.relatedTerms.join(', ')}`;
    }

    return explanation;
  }
}

export default new KnowledgeBaseService();
