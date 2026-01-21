import aiService from './AIService';
import { logger } from '../utils/logger';

export interface SafetyCheckResult {
  isSafe: boolean;
  isMedicalAdviceRequest: boolean;
  suggestedResponse?: string;
}

export class SafetyService {
  private medicalKeywords = [
    'diagnose',
    'treat',
    'cure',
    'medication',
    'dosage',
    'prescription',
    'therapy plan',
    'medical advice',
    'should i',
    'is it safe',
    'side effects',
    'symptoms',
  ];

  /**
   * Check if a query is safe and within boundaries
   */
  async checkQuery(query: string): Promise<SafetyCheckResult> {
    // Quick keyword check first
    const hasKeywords = this.containsMedicalKeywords(query);

    // If keywords detected, do a more thorough AI check
    if (hasKeywords) {
      try {
        const isMedicalRequest = await aiService.detectMedicalAdviceRequest(query);

        if (isMedicalRequest) {
          return {
            isSafe: false,
            isMedicalAdviceRequest: true,
            suggestedResponse: this.getMedicalAdviceRedirect(),
          };
        }
      } catch (error) {
        logger.error('Error in AI safety check:', error);
        // Err on the side of caution
        if (hasKeywords) {
          return {
            isSafe: false,
            isMedicalAdviceRequest: true,
            suggestedResponse: this.getMedicalAdviceRedirect(),
          };
        }
      }
    }

    return {
      isSafe: true,
      isMedicalAdviceRequest: false,
    };
  }

  /**
   * Quick keyword-based check for medical advice
   */
  private containsMedicalKeywords(text: string): boolean {
    const lowerText = text.toLowerCase();
    return this.medicalKeywords.some((keyword) => lowerText.includes(keyword));
  }

  /**
   * Get the standard medical advice redirect message
   */
  private getMedicalAdviceRedirect(): string {
    return `I understand you have questions about your child's care, but I can only provide educational information about autism-related terminology.

For questions about:
- Diagnosis or treatment
- Medication or therapy plans
- Medical decisions
- Specific symptoms or concerns

Please consult with:
- Your child's pediatrician
- A developmental pediatrician
- A licensed therapist or specialist
- Your child's care team

I'm here to help you understand the terminology you encounter in documents and reports. Is there a specific term or concept I can help explain?`;
  }

  /**
   * Validate that a query is educational in nature
   */
  async validateEducationalQuery(query: string): Promise<boolean> {
    const educationalKeywords = [
      'what is',
      'what does',
      'explain',
      'mean',
      'definition',
      'help me understand',
      'can you clarify',
    ];

    const lowerQuery = query.toLowerCase();
    return educationalKeywords.some((keyword) => lowerQuery.includes(keyword));
  }

  /**
   * Get a disclaimer message
   */
  getDisclaimer(): string {
    return 'This information is for educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment.';
  }
}

export default new SafetyService();
