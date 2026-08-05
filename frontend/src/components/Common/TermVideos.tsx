import { TermVideo } from '@/types';

interface TermVideosProps {
  videos?: TermVideo[];
  termName: string;
  /** Compact layout for chat bubbles */
  compact?: boolean;
}

function youtubeSearchUrl(termName: string): string {
  const q = encodeURIComponent(`${termName} autism explained for parents`);
  return `https://www.youtube.com/results?search_query=${q}`;
}

export default function TermVideos({ videos = [], termName, compact = false }: TermVideosProps) {
  const hasVideos = videos.length > 0;

  return (
    <div className={compact ? 'mt-3' : 'mb-6'}>
      <h3
        className={`font-semibold text-gray-900 flex items-center ${
          compact ? 'text-sm mb-2' : 'mb-3'
        }`}
      >
        <span className={`${compact ? 'text-base' : 'text-xl'} mr-2`}>▶️</span>
        Helpful videos
        {termName ? (
          <span className="ml-1 font-normal text-gray-500">about {termName}</span>
        ) : null}
      </h3>

      {hasVideos ? (
        <div className={`space-y-4 ${compact ? 'space-y-3' : ''}`}>
          {videos.map((video) => (
            <div key={video.youtubeId} className="rounded-lg overflow-hidden border border-gray-200 bg-white">
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}`}
                  title={video.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
              <div className={`px-3 py-2 border-t border-gray-100 ${compact ? 'text-xs' : 'text-sm'}`}>
                <p className="font-medium text-gray-900">{video.title}</p>
                {video.source && (
                  <p className="text-gray-500 mt-0.5">Source: {video.source}</p>
                )}
                <a
                  href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline mt-1 inline-block"
                >
                  Open on YouTube
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className={`text-gray-600 ${compact ? 'text-xs' : 'text-sm'}`}>
          No curated video yet for this term.{' '}
          <a
            href={youtubeSearchUrl(termName)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 hover:underline font-medium"
          >
            Search YouTube for explanations
          </a>
        </p>
      )}

      {hasVideos && (
        <p className={`mt-2 text-gray-500 ${compact ? 'text-xs' : 'text-sm'}`}>
          Prefer more options?{' '}
          <a
            href={youtubeSearchUrl(termName)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 hover:underline"
          >
            Search YouTube for “{termName}”
          </a>
        </p>
      )}
    </div>
  );
}
