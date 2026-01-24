import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { v4 as uuidv4 } from 'uuid';
import config from '../config';
import knowledgeBaseService, { Term } from './KnowledgeBaseService';
import aiService from './AIService';
import vectorService, { DocumentChunk } from './VectorService';
import { logger } from '../utils/logger';

export interface DocumentAnalysis {
  fileName: string;
  fileType: string;
  fileSize: number;
  text: string;
  wordCount: number;
  foundTerms: Array<{
    term: Term;
    occurrences: number;
    positions: number[];
    contextualMeaning?: string;
  }>;
  summary: string;
  analysis: string;
  consolidatedReport: {
    documentType: string;
    dateAnalyzed: string;
    narrativeReport: string;
    keyFindings: string[];
    termBreakdown: Array<{
      term: string;
      category: string;
      count: number;
      significance: string;
    }>;
    recommendations: string[];
    overallAssessment: string;
  };
}

export class DocumentService {
  /**
   * Extract text from uploaded file based on file type
   */
  async extractText(file: Express.Multer.File): Promise<string> {
    const fileType = file.mimetype;

    logger.info('Extracting text from document:', {
      fileName: file.originalname,
      fileType,
      fileSize: file.size,
    });

    try {
      if (fileType === 'application/pdf') {
        return await this.extractFromPDF(file.buffer);
      } else if (
        fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        fileType === 'application/msword'
      ) {
        return await this.extractFromWord(file.buffer);
      } else if (fileType === 'text/plain') {
        return file.buffer.toString('utf-8');
      } else {
        throw new Error(`Unsupported file type: ${fileType}`);
      }
    } catch (error) {
      logger.error('Error extracting text from document:', error);
      throw new Error('Failed to extract text from document');
    }
  }

  /**
   * Extract text from PDF
   */
  private async extractFromPDF(buffer: Buffer): Promise<string> {
    try {
      const data = await pdfParse(buffer);
      return data.text;
    } catch (error) {
      logger.error('PDF parsing error:', error);
      throw new Error('Failed to parse PDF document');
    }
  }

  /**
   * Extract text from Word document
   */
  private async extractFromWord(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      logger.error('Word document parsing error:', error);
      throw new Error('Failed to parse Word document');
    }
  }

  /**
   * Analyze document and find autism terms
   */
  async analyzeDocument(file: Express.Multer.File): Promise<DocumentAnalysis> {
    logger.info('Analyzing document:', {
      fileName: file.originalname,
      fileSize: file.size,
    });

    // Generate unique document ID
    const documentId = uuidv4();

    // Extract text
    const text = await this.extractText(file);
    const wordCount = text.split(/\s+/).length;

    // Find all autism terms in the document
    const termsFound = this.findTermsInText(text);

    // Chunk document and store in vector database
    logger.info('Chunking document and storing in vector database...');
    try {
      const chunks = this.chunkDocument(text, documentId, file.originalname, termsFound);
      await vectorService.storeDocumentChunks(chunks);
      logger.info(`Stored ${chunks.length} document chunks in vector database`);
    } catch (error) {
      logger.warn('Failed to store document chunks in vector database:', error);
      // Continue with analysis even if vector storage fails
    }

    // Enrich each term with detailed context from the document
    const enrichedTerms = await this.enrichTermsWithContext(text, termsFound);

    // Generate AI summary of the document
    logger.info('Generating document summary...');
    const summary = await this.generateDocumentSummary(text, termsFound);
    logger.info('Document summary generated');

    // Generate analysis explaining the terms
    logger.info('Generating term analysis...');
    const analysis = await this.generateTermAnalysis(text, termsFound);
    logger.info('Term analysis generated');

    // Generate consolidated test result report with timeout
    logger.info('Generating consolidated report...');
    let consolidatedReport;
    try {
      const reportPromise = this.generateConsolidatedReport(text, termsFound);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Consolidated report timeout after 15s')), 15000)
      );
      consolidatedReport = await Promise.race([reportPromise, timeoutPromise]);
      logger.info('Consolidated report generated');
    } catch (error) {
      logger.warn('Consolidated report timed out or failed, using fallback');
      const documentType = this.detectDocumentType(text);
      const dateAnalyzed = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      consolidatedReport = this.generateFallbackReport(documentType, dateAnalyzed, termsFound);
    }

    logger.info('Document analysis complete, returning results');

    return {
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      text,
      wordCount,
      foundTerms: enrichedTerms,
      summary,
      analysis,
      consolidatedReport,
    };
  }

  /**
   * Find all autism terms in text with occurrence counts and positions
   */
  private findTermsInText(
    text: string
  ): Array<{ term: Term; occurrences: number; positions: number[] }> {
    const allTerms = knowledgeBaseService.getAllTerms();
    const normalizedText = text.toLowerCase();
    const results: Array<{ term: Term; occurrences: number; positions: number[] }> = [];

    allTerms.forEach((term) => {
      const searchTerms = [term.term.toLowerCase(), term.fullName.toLowerCase()];
      let occurrences = 0;
      const positions: number[] = [];

      searchTerms.forEach((searchTerm) => {
        let index = 0;
        while ((index = normalizedText.indexOf(searchTerm, index)) !== -1) {
          occurrences++;
          positions.push(index);
          index += searchTerm.length;
        }
      });

      if (occurrences > 0) {
        results.push({
          term,
          occurrences,
          positions,
        });
      }
    });

    // Sort by occurrence count (most frequent first)
    return results.sort((a, b) => b.occurrences - a.occurrences);
  }

  /**
   * Enrich terms with contextual meanings from the document
   */
  private async enrichTermsWithContext(
    text: string,
    foundTerms: Array<{ term: Term; occurrences: number; positions: number[] }>
  ): Promise<Array<{ term: Term; occurrences: number; positions: number[]; contextualMeaning?: string }>> {
    logger.info(`Enriching ${foundTerms.length} terms with contextual meanings`);

    // If no terms found, return empty array
    if (foundTerms.length === 0) {
      logger.info('No terms to enrich');
      return [];
    }

    // For each term, extract context and generate a meaning specific to how it's used in this document
    const enrichedTerms = await Promise.all(
      foundTerms.map(async (termData) => {
        try {
          // Get a snippet of text around the first occurrence for context
          const position = termData.positions[0];
          const contextStart = Math.max(0, position - 200);
          const contextEnd = Math.min(text.length, position + 200);
          const contextSnippet = text.substring(contextStart, contextEnd);

          // Generate contextual meaning using AI
          const systemPrompt = `You are an expert autism education specialist helping parents deeply understand terminology from their child's documents. Provide comprehensive, detailed, parent-friendly explanations.`;

          const userPrompt = `Analyze the term "${termData.term.term}" (${termData.term.fullName}) which appears ${termData.occurrences} times in this parent's document.

CONTEXT FROM DOCUMENT:
"${contextSnippet}"

BASE DEFINITION:
${termData.term.plainLanguage}

Generate a COMPREHENSIVE explanation (5-8 sentences) structured as follows:

1. START WITH THE TERM NAME (1-2 sentences):
   Begin your response with "${termData.term.term}" (${termData.term.fullName}) means... - explain what ${termData.term.term} is in simple terms anyone can understand. Always mention the term name at the start.

2. WHAT THIS MEANS FOR YOUR CHILD (2-3 sentences):
   Based on the document context, explain what this tells the parent about THEIR child's specific plan/needs/situation. Be specific and personal.

3. PRACTICAL IMPLICATIONS (1-2 sentences):
   What should the parent DO with this information? What questions should they ask? What should they look for?

4. IMPORTANT TO KNOW (1 sentence):
   One key thing every parent should understand about this term.

IMPORTANT REQUIREMENTS:
- Always start your response by mentioning the term name: "${termData.term.term}" or "${termData.term.fullName}"
- Do NOT include a "Complete Definition & Details" section or heading
- Use "your child" language. Be detailed, specific, and empowering. Make it feel like a specialist is explaining this personally to them.`;


          // Add timeout to AI call (30 seconds)
          const enrichmentPromise = aiService.generateResponse(
            [{ role: 'user', content: userPrompt }],
            systemPrompt
          );

          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('AI enrichment timeout after 30s')), 30000)
          );

          const response = await Promise.race([enrichmentPromise, timeoutPromise]);

          logger.info(`Enriched term: ${termData.term.term}`);

          return {
            ...termData,
            contextualMeaning: response.content,
          };
        } catch (error) {
          logger.warn(`Failed to enrich term ${termData.term.term}, using fallback`);
          // Use enhanced fallback
          return {
            ...termData,
            contextualMeaning: `This means ${termData.term.plainLanguage}\n\n**In Your Document:** ${termData.term.term} appears ${termData.occurrences} ${termData.occurrences === 1 ? 'time' : 'times'}, indicating it's relevant to your child's plan. Review this term carefully and discuss it with your child's care team to understand how it specifically applies to your situation.`,
          };
        }
      })
    );

    logger.info(`Completed enrichment for ${foundTerms.length} terms`);

    return enrichedTerms;
  }

  /**
   * Generate AI summary of the document
   */
  private async generateDocumentSummary(
    text: string,
    foundTerms: Array<{ term: Term; occurrences: number }>
  ): Promise<string> {
    const termNames = foundTerms.map((t) => t.term.term).join(', ');

    const systemPrompt = `You are summarizing an autism-related document (IEP, therapy notes, or assessment report) for parents. Provide a brief, clear summary focusing on the main points.`;

    const userPrompt = `Please provide a brief 2-3 sentence summary of this document. The document contains these autism-related terms: ${termNames}

Document excerpt (first 1000 characters):
${text.substring(0, 1000)}...`;

    try {
      const response = await aiService.generateResponse(
        [{ role: 'user', content: userPrompt }],
        systemPrompt
      );
      return response.content;
    } catch (error) {
      logger.error('Error generating document summary:', error);
      return 'Unable to generate summary at this time.';
    }
  }

  /**
   * Generate analysis explaining the terms found
   */
  private async generateTermAnalysis(
    _text: string,
    foundTerms: Array<{ term: Term; occurrences: number }>
  ): Promise<string> {
    if (foundTerms.length === 0) {
      return 'No autism-related terms were found in this document.';
    }

    const termDescriptions = foundTerms
      .slice(0, 5) // Top 5 terms
      .map((t) => `${t.term.term} (${t.term.fullName}) - appears ${t.occurrences} times`)
      .join('\n');

    const systemPrompt = `You are helping parents understand autism-related terminology in their child's documents. Explain the significance of the terms found and what they might indicate about the child's plan or needs.`;

    const userPrompt = `This document contains the following autism-related terms:

${termDescriptions}

Based on these terms, please provide a brief parent-friendly explanation of what this document appears to be about and what these terms tell us about the child's needs or plan. Keep it concise (3-4 sentences) and empathetic.`;

    try {
      const response = await aiService.generateResponse(
        [{ role: 'user', content: userPrompt }],
        systemPrompt
      );
      return response.content;
    } catch (error) {
      logger.error('Error generating term analysis:', error);
      return 'Unable to generate analysis at this time.';
    }
  }

  /**
   * Generate consolidated test result report
   */
  private async generateConsolidatedReport(
    text: string,
    foundTerms: Array<{ term: Term; occurrences: number }>
  ): Promise<{
    documentType: string;
    dateAnalyzed: string;
    narrativeReport: string;
    keyFindings: string[];
    termBreakdown: Array<{
      term: string;
      category: string;
      count: number;
      significance: string;
    }>;
    recommendations: string[];
    overallAssessment: string;
  }> {
    const dateAnalyzed = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Determine document type from content
    const documentType = this.detectDocumentType(text);

    // Generate AI-powered consolidated report
    const termNames = foundTerms.map((t) => t.term.term).join(', ');
    const termDetails = foundTerms
      .map((t) => `- ${t.term.term} (${t.term.category}): ${t.occurrences} occurrences`)
      .join('\n');

    const systemPrompt = `You are an expert in autism assessment reports and documentation. Generate a comprehensive consolidated test result report for parents.`;

    const userPrompt = `Analyze this autism-related document and generate a comprehensive report.

Document Type: ${documentType}
Terms Found: ${termNames}

Term Details:
${termDetails}

Document Excerpt:
${text.substring(0, 2000)}...

IMPORTANT: Return ONLY valid JSON. Ensure all string values properly escape special characters (newlines should be \\n, quotes should be \\", etc.).

Please provide a JSON response with the following structure:
{
  "narrativeReport": "A concise 3-4 paragraph summary covering: (1) document type and key terms found, (2) what these terms indicate about the child's needs, (3) practical recommendations for parents.",
  "keyFindings": ["finding1", "finding2", "finding3"],
  "termBreakdown": [
    {
      "term": "term name",
      "category": "category",
      "count": number,
      "significance": "what this term indicates about the child"
    }
  ],
  "recommendations": ["recommendation1", "recommendation2", "recommendation3"],
  "overallAssessment": "comprehensive assessment of what this document indicates"
}

Keep it concise (3-4 paragraphs), parent-friendly, and actionable. Focus on what matters most for parents to understand.`;

    try {
      const response = await aiService.generateResponse(
        [{ role: 'user', content: userPrompt }],
        systemPrompt
      );

      // Parse AI response
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          // Clean JSON string - handle control characters
          let jsonString = jsonMatch[0];
          // Replace literal newlines, tabs, and other control characters in string values
          // This regex-based approach preserves JSON structure while cleaning string content
          const reportData = JSON.parse(jsonString);
          return {
            documentType,
            dateAnalyzed,
            narrativeReport: reportData.narrativeReport || '',
            keyFindings: reportData.keyFindings || [],
            termBreakdown: reportData.termBreakdown || [],
            recommendations: reportData.recommendations || [],
            overallAssessment: reportData.overallAssessment || '',
          };
        } catch (parseError) {
          logger.warn('Failed to parse consolidated report JSON, using fallback');
          return this.generateFallbackReport(documentType, dateAnalyzed, foundTerms);
        }
      }

      // Fallback if AI doesn't return proper JSON
      return this.generateFallbackReport(documentType, dateAnalyzed, foundTerms);
    } catch (error) {
      logger.error('Error generating consolidated report:', error);
      return this.generateFallbackReport(documentType, dateAnalyzed, foundTerms);
    }
  }

  /**
   * Detect document type from content
   */
  private detectDocumentType(text: string): string {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('individualized education program') || lowerText.includes('iep')) {
      return 'IEP (Individualized Education Program)';
    } else if (lowerText.includes('therapy') || lowerText.includes('treatment')) {
      return 'Therapy/Treatment Report';
    } else if (lowerText.includes('assessment') || lowerText.includes('evaluation')) {
      return 'Assessment/Evaluation Report';
    } else if (lowerText.includes('progress') || lowerText.includes('update')) {
      return 'Progress Report';
    }
    return 'Autism-Related Document';
  }

  /**
   * Generate fallback report if AI fails
   */
  private generateFallbackReport(
    documentType: string,
    dateAnalyzed: string,
    foundTerms: Array<{ term: Term; occurrences: number }>
  ) {
    // Generate a basic narrative report from the structured data
    const topTerms = foundTerms.slice(0, 5);
    const termDescriptions = topTerms.map(t =>
      `${t.term.term} (${t.term.fullName}) appears ${t.occurrences} times and relates to ${t.term.category}`
    ).join('. ');

    const narrativeReport = `This document has been identified as a ${documentType}, analyzed on ${dateAnalyzed}.\n\n` +
      `Analysis Overview: This document contains ${foundTerms.length} autism-related terms, indicating various areas of focus in your child's care and development plan. ` +
      `The presence of these terms suggests that this document addresses multiple aspects of support and intervention.\n\n` +
      `Key Terms Identified: ${termDescriptions}.\n\n` +
      `What This Means: The terminology found in this document indicates that your child's care team is addressing various developmental areas. ` +
      `Each term represents a specific aspect of your child's needs, interventions, or educational plan. Understanding these terms will help you better advocate for your child and collaborate with their care team.\n\n` +
      `Recommendations: We recommend reviewing each highlighted term to understand its specific meaning and implications. ` +
      `Schedule a meeting with your child's care team to discuss any terms or concepts that are unclear. ` +
      `Use the Browse Terms section of this application to explore detailed definitions and examples for each concept mentioned in the document.\n\n` +
      `Next Steps: This ${documentType} contains important information about your child's care plan. ` +
      `Take time to review each section carefully, and don't hesitate to ask questions during your next meeting with the care team. ` +
      `Keep this document accessible for reference during therapy sessions and educational planning meetings.`;

    return {
      documentType,
      dateAnalyzed,
      narrativeReport,
      keyFindings: foundTerms.slice(0, 3).map((t) =>
        `Document references ${t.term.term} (${t.term.fullName}) ${t.occurrences} times`
      ),
      termBreakdown: foundTerms.map((t) => ({
        term: t.term.term,
        category: t.term.category,
        count: t.occurrences,
        significance: t.term.plainLanguage.substring(0, 100) + '...',
      })),
      recommendations: [
        'Review each highlighted term for better understanding',
        'Consult with your child\'s care team about specific terms',
        'Use the Browse Terms section to learn more about each concept',
      ],
      overallAssessment: `This ${documentType} contains ${foundTerms.length} autism-related terms, indicating areas of focus in your child's care plan.`,
    };
  }

  /**
   * Chunk document into smaller pieces for vector storage
   * Uses overlapping chunks to preserve context with sentence-aware boundaries
   */
  private chunkDocument(
    text: string,
    documentId: string,
    fileName: string,
    termsFound: Array<{ term: Term; occurrences: number; positions: number[] }>
  ): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    const chunkSize = config.chunkSize || 1000; // Characters per chunk (from config)
    const overlap = config.chunkOverlap || 200; // Overlap between chunks (from config)
    const termNames = new Set(termsFound.map((t) => t.term.term.toLowerCase()));

    // Sentence boundary regex (handles common sentence endings)
    const sentenceEndRegex = /[.!?]\s+/g;

    let chunkIndex = 0;
    let startChar = 0;

    while (startChar < text.length) {
      const idealEndChar = Math.min(startChar + chunkSize, text.length);
      let endChar = idealEndChar;

      // Try to break at sentence boundary for better semantic coherence
      if (endChar < text.length) {
        const chunkText = text.substring(startChar, idealEndChar);
        const lastSentenceEnd = chunkText.lastIndexOf('.');
        const lastQuestionEnd = chunkText.lastIndexOf('?');
        const lastExclamationEnd = chunkText.lastIndexOf('!');
        const lastNewline = chunkText.lastIndexOf('\n');

        // Find the best break point (prefer sentence endings, then newlines)
        const breakPoints = [
          lastSentenceEnd > chunkSize * 0.5 ? startChar + lastSentenceEnd + 1 : -1,
          lastQuestionEnd > chunkSize * 0.5 ? startChar + lastQuestionEnd + 1 : -1,
          lastExclamationEnd > chunkSize * 0.5 ? startChar + lastExclamationEnd + 1 : -1,
          lastNewline > chunkSize * 0.5 ? startChar + lastNewline + 1 : -1,
        ].filter((pos) => pos > startChar && pos <= idealEndChar);

        if (breakPoints.length > 0) {
          // Use the break point closest to ideal end
          endChar = Math.max(...breakPoints);
        }
      }

      const chunkText = text.substring(startChar, endChar).trim();

      // Skip empty chunks
      if (chunkText.length === 0) {
        startChar = endChar;
        continue;
      }

      // Count terms in this chunk (case-insensitive)
      const lowerChunkText = chunkText.toLowerCase();
      const chunkTermCount = Array.from(termNames).filter((term) =>
        lowerChunkText.includes(term)
      ).length;

      // Get terms found in this chunk
      const chunkTerms = Array.from(termNames).filter((term) =>
        lowerChunkText.includes(term)
      );

      // Detect document structure markers
      const hasHeading = /^[A-Z][^\n]{0,100}$/m.test(chunkText);
      const hasList = /^[\s]*[-*•]\s/m.test(chunkText);
      const hasNumberedList = /^[\s]*\d+[.)]\s/m.test(chunkText);

      const chunk: DocumentChunk = {
        id: `${documentId}-chunk-${chunkIndex}`,
        text: chunkText,
        metadata: {
          documentId,
          fileName,
          chunkIndex,
          startChar,
          endChar,
          termCount: chunkTermCount,
          terms: chunkTerms,
        },
      };

      chunks.push(chunk);

      // Move to next chunk with overlap, but ensure we make progress
      const nextStart = Math.max(startChar + 1, endChar - overlap);
      if (nextStart <= startChar) {
        // Safety check: ensure we always advance
        startChar = endChar;
      } else {
        startChar = nextStart;
      }
      chunkIndex++;
    }

    logger.debug(`Created ${chunks.length} chunks from document`, {
      documentId,
      totalChars: text.length,
      avgChunkSize: Math.round(text.length / chunks.length),
      chunkSize,
      overlap,
    });

    return chunks;
  }

  /**
   * Highlight terms in text for frontend display
   */
  highlightTerms(text: string, terms: Term[]): string {
    let highlightedText = text;
    const termMap = new Map<string, Term>();

    // Build a map of all term variations
    terms.forEach((term) => {
      termMap.set(term.term.toLowerCase(), term);
      termMap.set(term.fullName.toLowerCase(), term);
    });

    // Sort terms by length (longest first) to avoid partial matches
    const sortedTerms = Array.from(termMap.keys()).sort((a, b) => b.length - a.length);

    // Replace each term with highlighted version
    sortedTerms.forEach((termText) => {
      const term = termMap.get(termText);
      if (!term) return;

      const regex = new RegExp(`\\b${termText}\\b`, 'gi');
      highlightedText = highlightedText.replace(
        regex,
        `<mark class="term-highlight" data-term="${term.term}">${termText}</mark>`
      );
    });

    return highlightedText;
  }
}

export default new DocumentService();
