import { Term } from '@/types';

interface TermCardProps {
  term: Term;
  onClick: () => void;
}

const categoryColors: Record<string, string> = {
  Therapy: 'bg-green-100 text-green-800',
  Education: 'bg-blue-100 text-blue-800',
  Communication: 'bg-purple-100 text-purple-800',
  Sensory: 'bg-orange-100 text-orange-800',
  Behavior: 'bg-red-100 text-red-800',
  Social: 'bg-pink-100 text-pink-800',
  Cognitive: 'bg-indigo-100 text-indigo-800',
};

export default function TermCard({ term, onClick }: TermCardProps) {
  return (
    <div
      onClick={onClick}
      className="card hover:shadow-lg hover:border-primary-300 transition-all cursor-pointer"
    >
      {/* Category Badge */}
      <div className="mb-3">
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${categoryColors[term.category] || 'bg-gray-100 text-gray-800'}`}>
          {term.category}
        </span>
      </div>

      {/* Term Name */}
      <h3 className="text-lg font-bold text-gray-900 mb-1">
        {term.term}
      </h3>
      <p className="text-sm text-gray-600 mb-3">
        {term.fullName}
      </p>

      {/* Short Description */}
      <p className="text-sm text-gray-700 mb-4 line-clamp-3">
        {term.plainLanguage}
      </p>

      {/* Learn More Button */}
      <button className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center">
        Learn More
        <span className="ml-1">→</span>
      </button>
    </div>
  );
}
