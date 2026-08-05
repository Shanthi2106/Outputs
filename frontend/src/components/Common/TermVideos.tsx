import { useState } from 'react';
import { TermVideo } from '@/types';

interface TermVideosProps {
  videos?: TermVideo[];
  termName: string;
  /** Compact layout for chat bubbles */
  compact?: boolean;
}

function youtubeSearchUrl(termName: string): string {
  const q = encodeURIComponent(`${termName} autism explained for parents animated`);
  return `https://www.youtube.com/results?search_query=${q}`;
}

function thumbnailUrl(youtubeId: string): string {
  return `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
}

function embedUrl(youtubeId: string): string {
  // Autoplay when user clicks play; modestbranding keeps focus on the video
  const params = new URLSearchParams({
    autoplay: '1',
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
  });
  return `https://www.youtube.com/embed/${youtubeId}?${params.toString()}`;
}

function VideoPlayer({ video, compact }: { video: TermVideo; compact?: boolean }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 bg-black shadow-sm">
      <div
        className={`relative w-full bg-black ${
          compact ? 'min-h-[180px] aspect-video' : 'min-h-[220px] aspect-video'
        }`}
      >
        {playing ? (
          <iframe
            className="absolute inset-0 w-full h-full"
            src={embedUrl(video.youtubeId)}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="absolute inset-0 w-full h-full group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            aria-label={`Play video: ${video.title}`}
          >
            <img
              src={thumbnailUrl(video.youtubeId)}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/35 group-hover:bg-black/45 transition-colors" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="flex items-center justify-center w-16 h-16 rounded-full bg-red-600 text-white shadow-lg group-hover:scale-110 transition-transform">
                <svg viewBox="0 0 24 24" className="w-8 h-8 ml-1" fill="currentColor" aria-hidden>
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </div>
            <span className="absolute bottom-2 left-2 right-2 text-left text-white text-xs sm:text-sm font-medium drop-shadow line-clamp-2">
              {video.title}
            </span>
          </button>
        )}
      </div>
      <div className={`bg-white px-3 py-2 ${compact ? 'text-xs' : 'text-sm'}`}>
        <p className="font-medium text-gray-900">{video.title}</p>
        {video.source && <p className="text-gray-500 mt-0.5">Source: {video.source}</p>}
      </div>
    </div>
  );
}

export default function TermVideos({ videos = [], termName, compact = false }: TermVideosProps) {
  const playable = videos.filter((v) => v.youtubeId);

  return (
    <div className={compact ? 'mt-3' : 'mb-6'}>
      <h3
        className={`font-semibold text-gray-900 flex items-center ${
          compact ? 'text-sm mb-2' : 'mb-3'
        }`}
      >
        <span className={`${compact ? 'text-base' : 'text-xl'} mr-2`}>🎬</span>
        Watch an animated explanation
        {termName ? (
          <span className="ml-1 font-normal text-gray-500">— {termName}</span>
        ) : null}
      </h3>

      {playable.length > 0 ? (
        <div className={`space-y-4 ${compact ? 'space-y-3' : ''}`}>
          {playable.map((video) => (
            <VideoPlayer key={video.youtubeId} video={video} compact={compact} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-center">
          <p className={`text-gray-700 mb-2 ${compact ? 'text-xs' : 'text-sm'}`}>
            No in-app video is available for this term yet.
          </p>
          <a
            href={youtubeSearchUrl(termName)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center btn-primary text-sm"
          >
            Find animated videos on YouTube
          </a>
        </div>
      )}
    </div>
  );
}
