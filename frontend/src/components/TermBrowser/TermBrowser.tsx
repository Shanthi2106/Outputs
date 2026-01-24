import { useState, useMemo, useEffect } from 'react';
import { Term } from '@/types';
import TermCard from './TermCard';
import TermDetailModal from './TermDetailModal';
import apiService from '@/services/api';

const categories = ['All', 'Therapy', 'Education', 'Communication', 'Sensory', 'Behavior', 'Social', 'Cognitive'];

export default function TermBrowser() {
  const [allTerms, setAllTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);

  // Fetch terms from API on component mount
  useEffect(() => {
    const fetchTerms = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiService.getAllTerms();
        if (response.success && response.terms) {
          setAllTerms(response.terms);
        } else {
          setError('Failed to load terms from server');
        }
      } catch (err: any) {
        console.error('Error fetching terms:', err);
        setError(err.message || 'Failed to load terms. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTerms();
  }, []);

  // Fallback hardcoded terms (for development/offline)
  const fallbackTerms: Term[] = [
  {
    term: 'ABA',
    fullName: 'Applied Behavior Analysis',
    category: 'Therapy',
    definition: 'A therapeutic approach that uses behavioral principles to encourage positive behaviors and reduce challenging ones.',
    plainLanguage: 'ABA is like a teaching method that breaks down skills into small steps and rewards progress. Think of it as a structured way to help your child learn new skills - from communication to daily living tasks - by practicing them repeatedly and celebrating successes.',
    examples: [
      'An ABA therapist might help a child learn to ask for juice by rewarding them each time they say or sign "juice"',
      'Teaching handwashing by breaking it into steps: turn on water, wet hands, apply soap, rub hands, rinse, dry'
    ],
    relatedTerms: ['DTT', 'Natural Environment Teaching', 'Positive Reinforcement'],
    documentTypes: ['IEP', 'Therapy Notes', 'Assessment Report']
  },
  {
    term: 'IEP',
    fullName: 'Individualized Education Program',
    category: 'Education',
    definition: 'A legally binding document that outlines the special education services, accommodations, and goals for a child with disabilities in school.',
    plainLanguage: 'An IEP is your child\'s personalized education plan. It lists what help your child will get at school, what they\'re working toward, and how progress will be measured. It\'s created by you, teachers, and specialists working together.',
    examples: [
      'An IEP might include speech therapy twice a week and extra time on tests',
      'Goals like "improve ability to take turns in conversations" with specific measurements'
    ],
    relatedTerms: ['504 Plan', 'Annual Goals', 'Accommodations', 'Modifications'],
    documentTypes: ['IEP', 'School Records']
  },
  {
    term: 'Echolalia',
    fullName: 'Echolalia',
    category: 'Communication',
    definition: 'The repetition of words, phrases, or sounds that someone else has said.',
    plainLanguage: 'Echolalia is when your child repeats words or phrases they\'ve heard. This might be lines from a favorite show, something you just said, or phrases they heard earlier. It\'s actually a common part of language development and can be your child\'s way of processing language or communicating.',
    examples: [
      'You ask "Do you want juice?" and your child repeats "Do you want juice?" instead of answering',
      'Your child repeatedly quotes lines from a favorite movie',
      'Repeating the last few words of what someone says'
    ],
    relatedTerms: ['Scripting', 'Verbal Stimming', 'Delayed Echolalia'],
    documentTypes: ['Speech Therapy Notes', 'Assessment Report', 'IEP']
  },
  {
    term: 'Sensory Processing',
    fullName: 'Sensory Processing',
    category: 'Sensory',
    definition: 'How the nervous system receives, organizes, and responds to sensory information from the environment and the body.',
    plainLanguage: 'Sensory processing is how your child\'s brain makes sense of what they see, hear, touch, taste, smell, and feel in their body. Some children with autism may be extra sensitive (sounds feel too loud) or less sensitive (not noticing when something is hot) to different sensations.',
    examples: [
      'Being bothered by clothing tags or certain fabrics',
      'Covering ears in loud environments',
      'Seeking out spinning or jumping activities',
      'Not noticing when hands are messy or face is dirty'
    ],
    relatedTerms: ['Sensory Integration', 'SPD', 'Sensory Seeking', 'Sensory Avoiding', 'Occupational Therapy'],
    documentTypes: ['OT Evaluation', 'Sensory Profile', 'IEP']
  },
  {
    term: 'Stimming',
    fullName: 'Self-Stimulatory Behavior',
    category: 'Behavior',
    definition: 'Repetitive body movements or sounds that provide sensory input.',
    plainLanguage: 'Stimming refers to repetitive movements or sounds your child makes, like hand-flapping, rocking, or humming. These behaviors often help your child regulate their emotions, focus, or deal with overwhelming situations. Everyone stims to some degree (like tapping a pen), but it may be more noticeable in autistic children.',
    examples: [
      'Flapping hands when excited or anxious',
      'Rocking back and forth',
      'Making repetitive sounds or humming',
      'Spinning objects or themselves'
    ],
    relatedTerms: ['Self-Regulation', 'Sensory Seeking', 'Repetitive Behaviors'],
    documentTypes: ['Behavior Plan', 'IEP', 'Assessment Report']
  },
  {
    term: 'Social Skills',
    fullName: 'Social Skills',
    category: 'Social',
    definition: 'The abilities needed to interact and communicate effectively with others.',
    plainLanguage: 'Social skills are the "rules" of interacting with other people - things like making eye contact, taking turns in conversation, understanding body language, and knowing how close to stand to someone. Many children with autism benefit from explicitly learning these skills that others might pick up naturally.',
    examples: [
      'Greeting someone when they enter a room',
      'Waiting for a pause to add to a conversation',
      'Understanding when someone is joking versus serious',
      'Recognizing facial expressions and what they mean'
    ],
    relatedTerms: ['Pragmatic Language', 'Theory of Mind', 'Perspective Taking', 'Social Thinking'],
    documentTypes: ['IEP', 'Social Skills Assessment', 'Therapy Notes']
  },
  {
    term: 'Executive Function',
    fullName: 'Executive Function',
    category: 'Cognitive',
    definition: 'A set of mental skills that help with planning, organizing, remembering details, and managing time and attention.',
    plainLanguage: 'Executive function is like the brain\'s "manager" - it helps your child plan ahead, stay organized, remember instructions, and switch between tasks. Many children with autism find these skills challenging, which is why they might have trouble with homework planning or transitioning between activities.',
    examples: [
      'Planning the steps to complete a homework assignment',
      'Remembering to bring home the right books from school',
      'Stopping one activity and starting another',
      'Keeping track of belongings'
    ],
    relatedTerms: ['Working Memory', 'Cognitive Flexibility', 'Task Initiation', 'Organization Skills'],
    documentTypes: ['IEP', 'Neuropsychological Evaluation', 'Progress Report']
  },
  {
    term: 'Accommodations',
    fullName: 'Accommodations',
    category: 'Education',
    definition: 'Changes in how a student accesses learning or demonstrates knowledge, without changing what is being taught or expected.',
    plainLanguage: 'Accommodations are helpful changes that don\'t make the work easier, but make it more accessible for your child. Think of them like ramps for someone in a wheelchair - they provide equal access. For example, extra time on tests or preferential seating near the teacher.',
    examples: [
      'Extra time on tests and assignments',
      'Use of a calculator for math problems',
      'Preferential seating away from distractions',
      'Frequent breaks during work',
      'Visual schedules to understand daily routine'
    ],
    relatedTerms: ['Modifications', 'Supports', 'IEP', '504 Plan'],
    documentTypes: ['IEP', '504 Plan']
  },
  {
    term: 'Meltdown',
    fullName: 'Meltdown',
    category: 'Behavior',
    definition: 'An intense response to overwhelming situations, often involving a loss of behavioral control.',
    plainLanguage: 'A meltdown happens when your child becomes completely overwhelmed and temporarily loses control. It\'s not a tantrum - it\'s not about getting something they want. It\'s more like their nervous system hitting "overload" from too much sensory input, emotional stress, or changes in routine. The best response is staying calm and ensuring safety until it passes.',
    examples: [
      'Crying, screaming, or shutting down after a loud, crowded event',
      'Aggressive behavior when too many demands are placed at once',
      'Becoming non-verbal or unresponsive when overstimulated'
    ],
    relatedTerms: ['Shutdown', 'Dysregulation', 'Sensory Overload', 'Fight or Flight Response'],
    documentTypes: ['Behavior Plan', 'IEP', 'Crisis Plan']
  },
  {
    term: 'AAC',
    fullName: 'Augmentative and Alternative Communication',
    category: 'Communication',
    definition: 'Methods of communication that supplement or replace speech for people who have difficulty with spoken language.',
    plainLanguage: 'AAC includes any tool or strategy that helps your child communicate besides talking. This can be as simple as pointing to pictures or as high-tech as a speech-generating device. Using AAC doesn\'t prevent speech development - in fact, it often helps it by reducing frustration and giving your child a way to express themselves.',
    examples: [
      'Picture Exchange Communication System (PECS)',
      'Communication apps on tablets (like Proloquo2Go)',
      'Sign language',
      'Communication boards with pictures or words'
    ],
    relatedTerms: ['PECS', 'Speech-Generating Device', 'Visual Supports', 'Sign Language'],
    documentTypes: ['IEP', 'Speech Therapy Notes', 'Communication Plan']
  },
  ];

  // Use fetched terms or fallback to hardcoded terms
  const termsToUse = allTerms.length > 0 ? allTerms : fallbackTerms;

  // Filter terms based on search and category
  const filteredTerms = useMemo(() => {
    return termsToUse.filter((term) => {
      const matchesSearch =
        term.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
        term.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        term.plainLanguage.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === 'All' || term.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory, termsToUse]);

  // Show loading state
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-gray-600">Loading autism terms...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="card bg-red-50 border-red-200">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Terms</h3>
            <p className="text-red-600">{error}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Retry
          </button>
          {termsToUse.length > 0 && (
            <p className="mt-4 text-sm text-gray-600">
              Showing {termsToUse.length} cached terms. Some features may be limited.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Browse Autism Terms
        </h2>
        <p className="text-gray-600">
          Explore our glossary of {termsToUse.length} common autism-related terms organized by category.
        </p>
      </div>

      {/* Search */}
      <div className="card mb-6">
        <input
          type="text"
          placeholder="Search terms..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field"
        />
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`
                px-4 py-2 rounded-lg font-medium text-sm transition-colors
                ${
                  selectedCategory === category
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }
              `}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {filteredTerms.length} {filteredTerms.length === 1 ? 'term' : 'terms'}
      </div>

      {/* Terms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTerms.map((term) => (
          <TermCard
            key={term.term}
            term={term}
            onClick={() => setSelectedTerm(term)}
          />
        ))}
      </div>

      {filteredTerms.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-2">No terms found</p>
          <p className="text-sm">Try adjusting your search or filter</p>
        </div>
      )}

      {/* Term Detail Modal */}
      {selectedTerm && (
        <TermDetailModal
          term={selectedTerm}
          onClose={() => setSelectedTerm(null)}
        />
      )}
    </div>
  );
}
