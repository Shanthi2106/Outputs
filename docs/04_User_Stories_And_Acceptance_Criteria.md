# AI-Powered Parent Assistant for Autism
## User Stories and Acceptance Criteria

**Version:** 1.0
**Date:** January 2026
**Format:** As a [user], I want [goal], so that [benefit]

---

## Epic 1: Term Explanation

### User Story 1.1: Simple Term Lookup
**As a** parent of a child with autism
**I want to** quickly look up what a specific autism-related term means
**So that** I can understand my child's assessment report

**Priority:** Critical
**Story Points:** 5

**Acceptance Criteria:**
- [ ] Given I enter a term like "echolalia" in the search box
- [ ] When I submit the query
- [ ] Then I receive a clear, plain-language explanation within 3 seconds
- [ ] And the explanation uses language at an 8th-grade reading level or below
- [ ] And the explanation includes at least one practical example
- [ ] And the response is presented in an easy-to-read format

**Definition of Done:**
- Unit tests pass with 100% coverage
- Response time < 3 seconds in 95% of cases
- Flesch-Kincaid reading level ≤ 8.0
- UAT validation with 5+ parents shows 85%+ comprehension

---

### User Story 1.2: Natural Language Query
**As a** parent
**I want to** ask questions in my own words
**So that** I don't need to know the exact technical term

**Priority:** High
**Story Points:** 8

**Acceptance Criteria:**
- [ ] Given I type "What does it mean when my child repeats what I say?"
- [ ] When I submit the query
- [ ] Then the system identifies this refers to "echolalia"
- [ ] And provides an explanation of the concept
- [ ] And mentions the formal term if relevant
- [ ] And the response feels conversational and supportive

**Definition of Done:**
- Natural language processing correctly identifies terms from descriptions in 90%+ of test cases
- Response includes both plain language and formal terminology
- User satisfaction rating ≥ 4/5 for naturalness

---

### User Story 1.3: Related Terms Suggestion
**As a** parent learning about autism
**I want to** discover related terms I might not know about
**So that** I can build a more complete understanding

**Priority:** Medium
**Story Points:** 5

**Acceptance Criteria:**
- [ ] Given I search for a term like "sensory processing"
- [ ] When I receive the explanation
- [ ] Then I also see 3-5 related terms (e.g., "proprioception", "interoception")
- [ ] And I can click on any related term to learn more
- [ ] And the relationships between terms are clear

**Definition of Done:**
- Related terms algorithm returns relevant suggestions in 85%+ of cases
- Related terms are clickable/tappable links
- System maintains conversation context when exploring related terms

---

## Epic 2: Contextual Clarification

### User Story 2.1: Document Excerpt Explanation
**As a** parent reading an IEP document
**I want to** paste a confusing section and get it explained
**So that** I can understand what the school is planning for my child

**Priority:** Critical
**Story Points:** 13

**Acceptance Criteria:**
- [ ] Given I paste a text excerpt up to 500 words
- [ ] When I submit for clarification
- [ ] Then the system identifies all autism-related terms in the text
- [ ] And highlights or annotates those terms
- [ ] And provides explanations relevant to the document context
- [ ] And preserves the original text formatting where possible
- [ ] And responds within 5 seconds

**Definition of Done:**
- Term identification accuracy ≥ 90% on test documents
- Support for excerpts up to 500 words
- Response time < 5 seconds for 95th percentile
- Context-appropriate explanations validated by domain experts

---

### User Story 2.2: Document Type Recognition
**As a** parent with different types of documents
**I want to** receive explanations tailored to the document type
**So that** the context is more relevant and helpful

**Priority:** High
**Story Points:** 8

**Acceptance Criteria:**
- [ ] Given I indicate the document type (IEP, therapy notes, assessment, school evaluation)
- [ ] When I submit an excerpt
- [ ] Then the explanations reference the specific context
- [ ] And terminology is explained as it relates to that document type
- [ ] And examples are appropriate to the setting

**Definition of Done:**
- Support for 4 document types: IEP, therapy notes, assessment reports, school evaluations
- Context-specific explanations for each type
- User feedback shows 85%+ relevance rating

---

### User Story 2.3: Term Highlighting
**As a** parent reviewing explained text
**I want to** see which terms were identified and explained
**So that** I can focus on the most important information

**Priority:** Medium
**Story Points:** 5

**Acceptance Criteria:**
- [ ] Given the system has processed my document excerpt
- [ ] When I view the results
- [ ] Then identified terms are visually highlighted in the original text
- [ ] And I can click/tap a highlighted term to see its explanation
- [ ] And the highlighting is accessible (not relying on color alone)

**Definition of Done:**
- Visual highlighting implemented with appropriate contrast
- Click/tap interaction works on desktop and mobile
- WCAG 2.1 AA accessibility compliance
- Interactive demo works smoothly

---

## Epic 3: Conversational Interaction

### User Story 3.1: Follow-up Questions
**As a** parent who needs more clarity
**I want to** ask follow-up questions about a term
**So that** I can deepen my understanding

**Priority:** Critical
**Story Points:** 13

**Acceptance Criteria:**
- [ ] Given I've received an explanation for a term
- [ ] When I ask "Can you give me an example?" or "What does that mean for my child?"
- [ ] Then the system maintains context and provides a relevant follow-up response
- [ ] And I can ask up to 10 follow-up questions in a single conversation
- [ ] And the conversation feels natural and supportive

**Definition of Done:**
- Context retention for minimum 10 conversation turns
- Follow-up question handling success rate ≥ 90%
- User satisfaction with conversation flow ≥ 4/5
- Automated tests for common follow-up patterns

---

### User Story 3.2: Simplification Request
**As a** parent who finds an explanation still too complex
**I want to** ask for simpler language
**So that** I can truly understand the concept

**Priority:** High
**Story Points:** 8

**Acceptance Criteria:**
- [ ] Given I've received an explanation
- [ ] When I say "Can you explain that more simply?" or "I still don't understand"
- [ ] Then the system provides a simplified version
- [ ] And uses more basic vocabulary and shorter sentences
- [ ] And includes more concrete examples

**Definition of Done:**
- Simplified explanations reduce Flesch-Kincaid grade level by at least 2 grades
- System successfully detects simplification requests in 95%+ of cases
- Users report improved understanding after simplification request

---

### User Story 3.3: Conversation Reset
**As a** parent working on multiple documents
**I want to** start a fresh conversation
**So that** I can switch contexts without confusion

**Priority:** Medium
**Story Points:** 3

**Acceptance Criteria:**
- [ ] Given I'm in the middle of a conversation
- [ ] When I click "New Conversation" or type "start over"
- [ ] Then the system clears the current context
- [ ] And I can begin a completely fresh query
- [ ] And my previous conversation is not persisted

**Definition of Done:**
- Reset button/command functional on all interfaces
- Context fully cleared on reset
- New conversation starts without previous context
- Privacy: no conversation history retained

---

### User Story 3.4: Proactive Assistance
**As a** parent exploring a complex topic
**I want to** receive proactive suggestions for what to learn next
**So that** I can build comprehensive understanding

**Priority:** Low
**Story Points:** 5

**Acceptance Criteria:**
- [ ] Given I've asked about several related terms
- [ ] When the conversation reaches a natural point
- [ ] Then the system suggests "You might also want to know about..."
- [ ] And the suggestions are contextually relevant
- [ ] And I can easily accept or dismiss suggestions

**Definition of Done:**
- Proactive suggestions appear at appropriate conversation points
- Suggestions are relevant in 85%+ of cases
- Users can easily dismiss without disruption
- Feature can be disabled in settings

---

## Epic 4: Safety and Boundaries

### User Story 4.1: Medical Advice Boundary
**As a** parent seeking information
**I want to** be clearly informed when I'm asking for medical advice
**So that** I know to consult a professional

**Priority:** Critical
**Story Points:** 8

**Acceptance Criteria:**
- [ ] Given I ask "Should I try this therapy for my child?"
- [ ] When the system detects a medical/treatment question
- [ ] Then it politely declines to answer
- [ ] And explains that this is a medical decision
- [ ] And recommends consulting with the child's healthcare team
- [ ] And the refusal is empathetic and supportive

**Definition of Done:**
- Medical advice detection accuracy ≥ 95%
- Refusal responses reviewed by autism professionals for appropriateness
- 100% of medical questions receive boundary response
- User feedback shows understanding and acceptance of boundaries

---

### User Story 4.2: Educational Disclaimer
**As a** parent using the system
**I want to** clearly understand what this tool is and isn't
**So that** I have appropriate expectations

**Priority:** High
**Story Points:** 3

**Acceptance Criteria:**
- [ ] Given I first access the application
- [ ] When I land on the homepage
- [ ] Then I see a clear disclaimer that this is educational, not medical advice
- [ ] And the disclaimer is visible but not obtrusive
- [ ] And I can acknowledge and proceed

**Definition of Done:**
- Disclaimer visible on first visit
- Legal team approval of disclaimer text
- Dismissible but returns for new sessions
- Accessible and readable on all devices

---

### User Story 4.3: Professional Referral
**As a** parent with questions beyond the system's scope
**I want to** be directed to appropriate professional resources
**So that** I can get the help I need

**Priority:** Medium
**Story Points:** 5

**Acceptance Criteria:**
- [ ] Given I ask a question that requires professional input
- [ ] When the system identifies this as out-of-scope
- [ ] Then it provides suggestions for who to contact (therapist, educator, doctor)
- [ ] And explains why this question needs a professional
- [ ] And the tone is supportive, not dismissive

**Definition of Done:**
- Referral suggestions appropriate to question type
- Resources include general guidance (not specific names/contacts)
- Reviewed by autism professionals for appropriateness
- User feedback shows helpfulness of referrals

---

## Epic 5: User Experience

### User Story 5.1: Mobile Access
**As a** parent on the go
**I want to** use the assistant on my phone
**So that** I can get help when reviewing documents at meetings or appointments

**Priority:** High
**Story Points:** 8

**Acceptance Criteria:**
- [ ] Given I access the application on a mobile device
- [ ] When I interact with the interface
- [ ] Then all features work smoothly on a small screen
- [ ] And text is readable without zooming
- [ ] And touch targets are appropriately sized
- [ ] And the experience feels native to mobile

**Definition of Done:**
- Responsive design works on phones (320px+) and tablets
- Touch targets minimum 44x44px (iOS) / 48x48dp (Android)
- Text input and conversation scrolling work smoothly
- Testing on iOS and Android devices
- Performance acceptable on mid-range devices

---

### User Story 5.2: Accessible Interface
**As a** parent with visual impairments
**I want to** use assistive technologies with the application
**So that** I can access autism terminology support like other parents

**Priority:** High
**Story Points:** 13

**Acceptance Criteria:**
- [ ] Given I use a screen reader
- [ ] When I navigate the application
- [ ] Then all content is announced correctly
- [ ] And I can operate all features using keyboard only
- [ ] And color contrast meets WCAG 2.1 AA standards
- [ ] And focus indicators are clearly visible

**Definition of Done:**
- WCAG 2.1 Level AA compliance verified
- Testing with NVDA, JAWS, and VoiceOver
- Keyboard navigation for all features
- Color contrast ratio ≥ 4.5:1 for text
- Accessibility audit passed

---

### User Story 5.3: Fast Response Time
**As a** busy parent
**I want to** get answers quickly
**So that** I can make efficient use of my limited time

**Priority:** High
**Story Points:** 5

**Acceptance Criteria:**
- [ ] Given I submit any query
- [ ] When the system processes my request
- [ ] Then I see a response within 3 seconds
- [ ] And I see a loading indicator if processing takes longer
- [ ] And the experience feels responsive and fast

**Definition of Done:**
- 95th percentile response time < 3 seconds
- Loading indicators appear after 500ms
- Performance monitoring in place
- Optimization for common queries (caching)

---

### User Story 5.4: Clear Error Messages
**As a** parent encountering an error
**I want to** understand what went wrong and what to do
**So that** I can continue using the system successfully

**Priority:** Medium
**Story Points:** 5

**Acceptance Criteria:**
- [ ] Given the system encounters an error
- [ ] When I see the error message
- [ ] Then it explains what happened in plain language
- [ ] And suggests what I can do next
- [ ] And provides a way to report persistent issues
- [ ] And the tone is apologetic but reassuring

**Definition of Done:**
- All error types have user-friendly messages
- No technical jargon in error messages
- Actionable suggestions included
- Error reporting mechanism functional
- Reviewed for tone and clarity

---

## Epic 6: Feedback and Improvement

### User Story 6.1: Rate Explanation Quality
**As a** parent receiving an explanation
**I want to** provide quick feedback on whether it helped
**So that** the system can improve over time

**Priority:** Medium
**Story Points:** 5

**Acceptance Criteria:**
- [ ] Given I receive an explanation
- [ ] When I finish reading it
- [ ] Then I see a simple rating option (helpful / not helpful, or 1-5 stars)
- [ ] And I can optionally provide additional comments
- [ ] And my feedback is submitted anonymously
- [ ] And I receive a thank-you message

**Definition of Done:**
- Rating widget implemented after each explanation
- Optional comment field
- Anonymous submission (no PII)
- Data collected in analytics system
- Thank-you confirmation displayed

---

### User Story 6.2: Report Incorrect Information
**As a** parent who notices an error
**I want to** flag incorrect or outdated information
**So that** other parents receive accurate explanations

**Priority:** High
**Story Points:** 5

**Acceptance Criteria:**
- [ ] Given I see information that seems wrong
- [ ] When I click "Report an issue"
- [ ] Then I can describe the problem
- [ ] And optionally provide correct information
- [ ] And my report is submitted to the content team
- [ ] And I receive acknowledgment

**Definition of Done:**
- Report button available on all explanations
- Form collects issue description and optional corrections
- Reports go to content team review queue
- Confirmation message sent to user
- Process for content team review established

---

### User Story 6.3: Suggest New Terms
**As a** parent encountering unfamiliar terminology
**I want to** suggest terms that should be added to the knowledge base
**So that** future parents can benefit

**Priority:** Low
**Story Points:** 3

**Acceptance Criteria:**
- [ ] Given I search for a term not in the system
- [ ] When the system says "I don't have information on that yet"
- [ ] Then I can submit a suggestion to add this term
- [ ] And I receive confirmation that it will be reviewed
- [ ] And I can optionally provide context about where I encountered it

**Definition of Done:**
- Suggestion form available when term not found
- Submissions go to content team backlog
- Confirmation message displayed
- Process for prioritizing suggested terms

---

## Cross-Cutting Stories

### User Story X.1: Privacy Assurance
**As a** parent concerned about privacy
**I want to** know that my child's information is not stored
**So that** I can use the system with confidence

**Priority:** Critical
**Story Points:** 5

**Acceptance Criteria:**
- [ ] Given I use the application
- [ ] When I read the privacy policy
- [ ] Then I clearly understand that no personal data is stored
- [ ] And I see that conversations are not persisted
- [ ] And I have confidence in the security measures
- [ ] And the privacy policy is easy to understand (not legal jargon)

**Definition of Done:**
- Clear, plain-language privacy policy published
- Technical implementation verified: no conversation persistence
- Privacy policy reviewed by legal team
- Privacy statement visible in application
- Compliance with applicable privacy regulations

---

### User Story X.2: Trust in Accuracy
**As a** parent relying on this information
**I want to** know that explanations are accurate and reviewed
**So that** I can trust what I'm learning

**Priority:** High
**Story Points:** 3

**Acceptance Criteria:**
- [ ] Given I receive an explanation
- [ ] When I look for credibility indicators
- [ ] Then I see that content is reviewed by autism experts
- [ ] And I can access information about the review process
- [ ] And sources or references are mentioned where appropriate
- [ ] And I understand the limitations (educational, not diagnostic)

**Definition of Done:**
- Expert review process established and documented
- Credibility statement visible in application
- About page explains content development process
- Sources cited where appropriate
- Educational limitations clearly communicated

---

## Testing User Stories

### Test Story 1: Happy Path - First-Time User
**Scenario:** New parent with freshly received IEP

**Steps:**
1. User arrives at application homepage
2. Sees welcome message and disclaimer
3. Types "What is FAPE?"
4. Receives clear explanation within 3 seconds
5. Asks follow-up: "What does this mean for my child?"
6. Receives contextual response
7. Rates explanation as helpful
8. Continues to use for other terms

**Expected Outcome:** User successfully understands term, feels confident, and continues using the system

---

### Test Story 2: Complex Document Excerpt
**Scenario:** Parent with multi-page assessment report

**Steps:**
1. User pastes 300-word excerpt containing 5-6 technical terms
2. Indicates document type as "Assessment Report"
3. Receives processed text with terms highlighted
4. Clicks on first highlighted term
5. Reads explanation with context-specific examples
6. Navigates to related terms
7. Returns to document to review other terms

**Expected Outcome:** User successfully understands all terms in context and feels prepared to discuss with professionals

---

### Test Story 3: Boundary Detection
**Scenario:** Parent asks for treatment advice

**Steps:**
1. User asks "Should I start ABA therapy for my 3-year-old?"
2. System detects medical/treatment question
3. Provides empathetic boundary response
4. Explains this is a decision for healthcare professionals
5. Suggests consulting with child's therapy team
6. User understands and appreciates the boundary

**Expected Outcome:** User receives clear, respectful boundary setting and knows where to get professional advice

---

## Prioritization Summary

### Must Have (MVP)
- US 1.1: Simple Term Lookup
- US 1.2: Natural Language Query
- US 2.1: Document Excerpt Explanation
- US 3.1: Follow-up Questions
- US 3.2: Simplification Request
- US 4.1: Medical Advice Boundary
- US 4.2: Educational Disclaimer
- US 5.1: Mobile Access
- US 5.2: Accessible Interface
- US 5.3: Fast Response Time
- US X.1: Privacy Assurance

### Should Have (Post-MVP, Phase 2)
- US 1.3: Related Terms Suggestion
- US 2.2: Document Type Recognition
- US 2.3: Term Highlighting
- US 3.3: Conversation Reset
- US 4.3: Professional Referral
- US 5.4: Clear Error Messages
- US 6.1: Rate Explanation Quality
- US 6.2: Report Incorrect Information
- US X.2: Trust in Accuracy

### Nice to Have (Phase 3+)
- US 3.4: Proactive Assistance
- US 6.3: Suggest New Terms

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | January 2026 | Product Team | Initial user stories for MVP and beyond |
