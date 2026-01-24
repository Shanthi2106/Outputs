# 📄 Document Upload Feature - Terms & Meanings Extraction

## Overview

The **Upload Document** feature now focuses on extracting all autism-related terms from your documents and providing comprehensive meanings for each term found.

---

## What It Does

### Input:
- Upload any document (PDF, Word, or Text file)
- IEPs, therapy notes, assessment reports, progress reports, etc.

### Output:
**Primary Section - Autism Terms Found:**
For each term discovered in your document, you get:

1. **Term Name & Full Name**
   - Example: "ABA" - Applied Behavior Analysis

2. **Occurrence Count**
   - How many times the term appears in your document
   - Visual badge showing frequency (e.g., "5x")

3. **💡 Contextual Meaning (NEW!)**
   - AI-generated explanation specific to YOUR document
   - Explains what this term means for YOUR child based on how it's used
   - 2-3 sentences focused on practical implications

4. **📖 General Definition**
   - Comprehensive plain-language explanation
   - Parent-friendly description
   - Includes "What to Expect", "Questions to Ask", "Red Flags"

5. **✨ Examples**
   - Real-world scenarios
   - Practical examples you'll encounter

6. **Related Terms**
   - Other terms you should know about

---

## Example Output

When you upload an IEP document containing "ABA", you'll see:

```
📚 Autism Terms Found in Your Document (5)

╔══════════════════════════════════════════╗
║ ABA                                   5x ║
║ Applied Behavior Analysis                ║
║ Category: Therapy • Found 5 times        ║
╚══════════════════════════════════════════╝

💡 What This Means in Your Document:
The mention of ABA therapy 5 times throughout your child's IEP indicates
that behavioral intervention is a central component of their educational plan.
Based on the context, your child will be receiving structured one-on-one
therapy sessions focused on developing communication and daily living skills.
You should confirm with the team exactly how many hours per week are allocated
and ensure you're getting regular progress updates.

📖 General Definition:
ABA is like a teaching method that breaks down skills into small steps and
rewards progress. Think of it as a structured way to help your child learn
new skills - from communication to daily living tasks - by practicing them
repeatedly and celebrating successes.

WHAT TO EXPECT: Typical ABA programs are 10-40 hours per week depending on
your child's needs. Sessions should be individualized to your child's goals.

QUESTIONS TO ASK:
(1) What specific behaviors/skills will be targeted?
(2) How will progress be measured and reported?
(3) Who will supervise my child's program?

RED FLAG: If you're told 'all kids get the same program' or progress data
isn't shared regularly, ask for clarification.

✨ Examples:
• An ABA therapist might help a child learn to ask for juice by rewarding
  them each time they say or sign 'juice'
• Teaching handwashing by breaking it into steps: turn on water, wet hands,
  apply soap, rub hands, rinse, dry
• Using a token board where your child earns stars for completing tasks,
  then trades stars for a preferred activity

Related terms: DTT, Natural Environment Teaching, Positive Reinforcement
```

---

## How It Works

### Backend Process:

1. **Document Upload**
   - Extract text from PDF, Word, or Text files
   - Count total words

2. **Term Detection**
   - Scan document for all 17 autism terms in knowledge base
   - Track occurrence count for each term found
   - Record positions where terms appear

3. **Contextual Analysis (NEW!)**
   - For each term found, extract surrounding context (400 characters)
   - Send term + context + document snippet to AI
   - AI generates 2-3 sentence explanation specific to this document
   - Focuses on: What it means for THIS child, what parents should know, action steps

4. **Enhanced Term Data**
   - Combine contextual meaning with general definition
   - Include examples and related terms
   - Format for display

### Frontend Display:

**Primary Section** (Always visible):
- Large, prominent cards for each term
- Contextual meaning in blue highlighted box
- General definition in gray box
- Examples and related terms clearly displayed

**Secondary Sections** (Collapsible):
- AI Detailed Analysis Report
- AI Key Findings
- AI Term Breakdown & Significance
- AI Recommendations
- AI Overall Assessment
- Quick Summary

---

## Key Features

### ✅ Contextual Intelligence
**Before:** Generic definitions only
**Now:** "What this means in YOUR document"

AI analyzes HOW the term is used in your specific document and explains implications for YOUR child.

### ✅ Visual Hierarchy
**Primary Focus:** Terms and their meanings (what you uploaded for)
**Secondary Info:** AI analysis, recommendations (bonus insights)

### ✅ Actionable Information
Every term includes:
- What to expect (specific numbers, timeframes)
- Questions to ask your care team
- Red flags to watch for
- Real examples

### ✅ Parent-Friendly Language
- No medical jargon
- "Your child" not "the patient"
- Practical scenarios
- Empowering tone

---

## Use Cases

### Use Case 1: New IEP Review
**Scenario:** You just received your child's IEP and don't understand the terminology.

**Upload:** The IEP document

**You Get:**
- List of all autism terms found (ABA, IEP, Accommodations, etc.)
- What each term means IN YOUR CHILD'S IEP specifically
- Questions to ask at the next IEP meeting
- Understanding of what services your child will receive

### Use Case 2: Therapy Progress Notes
**Scenario:** Monthly therapy notes use terms you're unfamiliar with.

**Upload:** The therapy notes

**You Get:**
- Explanation of therapy terminology (BCBA, RBT, DTT, etc.)
- What the therapist is working on with your child
- Whether the approach is typical or concerning
- Questions to ask the therapist

### Use Case 3: Assessment Report
**Scenario:** Evaluation results contain technical terms.

**Upload:** The assessment report

**You Get:**
- Breakdown of diagnostic terminology
- What findings mean for your child's needs
- Next steps based on assessment
- Questions to ask the evaluator

### Use Case 4: School Meeting Prep
**Scenario:** Preparing for an IEP meeting.

**Upload:** Current IEP + previous progress reports

**You Get:**
- Comprehensive understanding of all terms
- Specific questions prepared for the meeting
- Knowledge of your legal rights (FAPE)
- Confidence to advocate effectively

---

## Technical Details

### Backend Changes:

**File:** `backend/src/services/DocumentService.ts`

**New Method:** `enrichTermsWithContext()`
```typescript
// For each term found, generates contextual meaning using AI
// Extracts 400 characters of context around first occurrence
// Sends to AI with prompt: "Explain what this means for THIS parent's child"
// Returns enhanced term data with contextualMeaning field
```

**Updated Interface:** `DocumentAnalysis`
```typescript
foundTerms: Array<{
  term: Term;
  occurrences: number;
  positions: number[];
  contextualMeaning?: string;  // NEW: Document-specific explanation
}>
```

### Frontend Changes:

**File:** `frontend/src/components/Document/DocumentAnalysis.tsx`

**New Primary Section:**
- Large term cards with contextual meanings
- Visual badges showing occurrence count
- Separated contextual vs. general definitions
- Examples and related terms integrated

**Collapsed Secondary Sections:**
- AI Detailed Analysis Report (full narrative)
- AI Key Findings
- AI Term Breakdown
- AI Recommendations
- AI Overall Assessment
- Quick Summary

---

## Comparison: Before vs. After

### Before:
1. Upload document
2. Get consolidated narrative report
3. Terms listed at bottom in collapsible section
4. No document-specific context

### After:
1. Upload document
2. **PRIMARY: See all terms with contextual meanings**
3. Each term explained for YOUR document
4. General definitions + examples included
5. Narrative report available as bonus (collapsed)

---

## Performance

### Processing Time:
- **Document parsing:** 1-3 seconds (PDF/Word extraction)
- **Term detection:** Instant (pattern matching)
- **Contextual analysis:** 5-15 seconds per term (AI processing)
- **Total for 5 terms:** ~30-60 seconds

### Optimization:
- Terms processed in parallel (all at once, not sequential)
- Context extraction optimized (400 chars around term)
- Fallback to general definition if AI fails

---

## Testing

### Test the Feature:

1. **Go to:** http://localhost:5173
2. **Click:** "Upload Document" tab
3. **Upload:** Any autism-related document
4. **Wait:** 30-60 seconds (depending on number of terms)
5. **See:** Terms extracted with contextual meanings!

### Sample Test Documents:
- IEP documents (look for: ABA, IEP, FAPE, Accommodations)
- Therapy notes (look for: BCBA, RBT, BIP, FBA)
- Assessment reports (look for: Social Skills, Executive Function, Sensory Processing)
- Progress reports (look for: Multiple terms)

---

## Benefits for Parents

### 1. **Quick Understanding**
Don't wade through full reports - see terms and meanings immediately

### 2. **Document-Specific Context**
Not generic definitions - explanations based on YOUR document

### 3. **Complete Information**
Contextual meaning + general definition + examples + related terms

### 4. **Meeting Preparation**
Upload IEP before meeting, understand all terms, prepare questions

### 5. **Confidence Building**
Knowledge = power to advocate effectively

### 6. **Time Savings**
No need to Google each term separately

---

## What Makes This Better Than Google

### Google:
1. Search one term at a time
2. Get generic definitions
3. No context about YOUR document
4. Can't process documents
5. Separate searches needed

### This Feature:
1. ✅ Upload once, get all terms
2. ✅ Document-specific meanings
3. ✅ Contextual explanations
4. ✅ Comprehensive definitions
5. ✅ Examples + questions + red flags
6. ✅ All in one place

---

## Future Enhancements

### Potential Additions:
1. **Term Highlighting:** Highlight terms in original document text
2. **Export Feature:** Download terms list as PDF
3. **Comparison Mode:** Compare terms across multiple documents
4. **Historical Tracking:** Track term changes over time
5. **Custom Glossary:** Save personal notes about each term
6. **Print-Friendly:** Optimized print view of terms

---

## Status

🟢 **FULLY OPERATIONAL**

- ✅ Backend extracting terms with contextual meanings
- ✅ Frontend displaying terms prominently
- ✅ 17 terms in knowledge base
- ✅ AI providing document-specific context
- ✅ All document types supported (PDF, Word, Text)
- ✅ Mobile responsive design
- ✅ Servers running and stable

---

## Quick Start Guide

### For Parents:

**Step 1:** Go to http://localhost:5173

**Step 2:** Click "Upload Document" tab

**Step 3:** Click "Choose file" and select your document

**Step 4:** Wait 30-60 seconds while we analyze

**Step 5:** Read through each term found:
- Start with the blue "Contextual Meaning" box
- Read the general definition for more context
- Review examples to understand better
- Note related terms you might want to learn about

**Step 6:** Click "Upload Another" to analyze a different document

**Step 7:** Use the collapsible sections for deeper AI insights (optional)

---

## Support

### Common Questions:

**Q: How many terms can it find?**
A: Currently 17 autism-related terms. More being added regularly.

**Q: What file types are supported?**
A: PDF, Word (.doc, .docx), and Text (.txt) files

**Q: How long does it take?**
A: 30-60 seconds depending on document length and number of terms

**Q: What if a term isn't found?**
A: Only terms in our curated database are detected. Chat feature can explain any term.

**Q: Can I save the results?**
A: Currently view-only. Export feature coming soon.

---

**The Document Upload feature now gives you EXACTLY what you need: terms from YOUR documents with meanings specific to YOUR child.** 🎯

Upload a document now and see the difference!
