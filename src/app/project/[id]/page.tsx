'use client';

import { useState, useEffect, use, Suspense } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Image as ImageIcon, Video, FileText, Scissors,
  Download, Share2, Copy, Loader2, ExternalLink, Play,
  Newspaper, Clock, CheckCircle2, XCircle
} from 'lucide-react';
import { type ProjectResponse, type MediaItem, type VideoWithClips, type Clip, type Project } from '@/lib/api';

const SUPABASE_URL = 'https://wwgwvfhujfbtlotndqzt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3Z3d2Zmh1amZidGxvdG5kcXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2OTUxOTAsImV4cCI6MjA4NTI3MTE5MH0.zO3XyyooQ8ZTEHb_Tx643U4cV1WSWXl1WyqyvvjiV3M';

function ProjectContent({ id }: { id: string }) {
  const [data, setData] = useState<ProjectResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'images' | 'videos' | 'clips' | 'news'>('images');
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProject();
  }, [id]);

  // Poll while processing
  useEffect(() => {
    if (data?.project?.status === 'processing') {
      setPolling(true);
      const interval = setInterval(fetchProject, 3000);
      return () => clearInterval(interval);
    } else {
      setPolling(false);
    }
  }, [data?.project?.status]);

  async function fetchProject() {
    try {
      // Fetch project directly from Supabase
      const projectRes = await fetch(
        `${SUPABASE_URL}/rest/v1/projects?id=eq.${id}&select=*`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
          },
        }
      );
      const projects = await projectRes.json();

      if (!projects || projects.length === 0) {
        setError('Project not found');
        setLoading(false);
        return;
      }

      const project = projects[0] as Project;

      // Fetch media for this project
      const mediaRes = await fetch(
        `${SUPABASE_URL}/rest/v1/media?project_id=eq.${id}&select=*`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
          },
        }
      );
      const media = await mediaRes.json() as MediaItem[];

      // Fetch clips for this project
      const clipsRes = await fetch(
        `${SUPABASE_URL}/rest/v1/clips?project_id=eq.${id}&select=*`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
          },
        }
      );
      const clips = await clipsRes.json() as Clip[];

      // Organize results
      const images = media.filter(m => m.type === 'image') || [];
      const videos = (media.filter(m => m.type === 'video') || []).map(v => ({
        ...v,
        clips: clips.filter(c => c.media_id === v.id) || [],
      })) as VideoWithClips[];
      const news = media.filter(m => ['newspaper_scan', 'article_screenshot'].includes(m.type)) || [];

      setData({
        success: true,
        project,
        results: { images, videos, news },
      });
      setError(null);
    } catch (err) {
      console.error('Failed to fetch project:', err);
      setError('Failed to load project');
    } finally {
      setLoading(false);
    }
  }

  function copyApiResponse() {
    if (data) {
      navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      alert('API response copied to clipboard!');
    }
  }

  async function handleCancel() {
    if (!confirm('Stop this research?')) return;
    try {
      // Update status directly in Supabase
      await fetch(
        `${SUPABASE_URL}/rest/v1/projects?id=eq.${id}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'cancelled' }),
        }
      );
      fetchProject(); // Refresh to show cancelled status
    } catch (err) {
      console.error('Failed to cancel:', err);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !data?.project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <XCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">{error || 'Project Not Found'}</h1>
        <Link href="/" className="text-blue-500 hover:underline">Go back home</Link>
      </div>
    );
  }

  const { project, results } = data;
  const images = results?.images || [];
  const videos = results?.videos || [];
  const news = results?.news || [];
  const allClips = videos.flatMap(v => v.clips || []);

  const tabs = [
    { id: 'images' as const, label: 'Images', icon: ImageIcon, count: images.length },
    { id: 'videos' as const, label: 'Videos', icon: Video, count: videos.length },
    { id: 'clips' as const, label: 'Clips', icon: Scissors, count: allClips.length },
    { id: 'news' as const, label: 'News', icon: Newspaper, count: news.length },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors w-fit">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Project Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{project.topic}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <ImageIcon className="w-4 h-4" />
                  {images.length} images
                </span>
                <span className="flex items-center gap-1">
                  <Video className="w-4 h-4" />
                  {videos.length} videos
                </span>
                <span className="flex items-center gap-1">
                  <Scissors className="w-4 h-4" />
                  {allClips.length} clips
                </span>
                <span className="flex items-center gap-1">
                  <Newspaper className="w-4 h-4" />
                  {news.length} news
                </span>
                <span className="text-gray-600">|</span>
                <span className={`flex items-center gap-1 ${
                  project.status === 'completed' ? 'text-green-400' :
                  project.status === 'processing' ? 'text-blue-400' :
                  project.status === 'failed' ? 'text-red-400' :
                  project.status === 'cancelled' ? 'text-orange-400' : 'text-gray-400'
                }`}>
                  {project.status === 'completed' && <CheckCircle2 className="w-4 h-4" />}
                  {project.status === 'processing' && <Loader2 className="w-4 h-4 animate-spin" />}
                  {project.status === 'failed' && <XCircle className="w-4 h-4" />}
                  {project.status === 'cancelled' && <XCircle className="w-4 h-4" />}
                  {project.status}
                  {polling && ' (updating...)'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {project.status === 'processing' && (
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  Stop Research
                </button>
              )}
              <button
                onClick={copyApiResponse}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
              >
                <Copy className="w-4 h-4" />
                Copy API Response
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-800 mb-6">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-white'
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                <span className="px-2 py-0.5 bg-gray-800 rounded text-xs">{tab.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {activeTab === 'images' && (
          <div>
            {images.length === 0 ? (
              <EmptyState icon={ImageIcon} message="No images found" />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {images.map((img) => (
                  <MediaCard key={img.id} item={img} type="image" />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'videos' && (
          <div>
            {videos.length === 0 ? (
              <EmptyState icon={Video} message="No videos found" />
            ) : (
              <div className="space-y-6">
                {videos.map((video) => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'clips' && (
          <div>
            {allClips.length === 0 ? (
              <EmptyState icon={Scissors} message="No clips extracted" />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {allClips.map((clip) => (
                  <ClipCard key={clip.id} clip={clip} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'news' && (
          <div>
            {news.length === 0 ? (
              <EmptyState icon={Newspaper} message="No news found" />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {news.map((item) => (
                  <MediaCard key={item.id} item={item} type="news" />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// Main page component that handles params
export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    }>
      <ProjectContent id={id} />
    </Suspense>
  );
}

function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
      <Icon className="w-12 h-12 text-gray-700 mx-auto mb-4" />
      <p className="text-gray-500">{message}</p>
    </div>
  );
}

function MediaCard({ item, type }: { item: MediaItem; type: 'image' | 'news' }) {
  const url = item.hosted_url || item.source_url;
  const isImage = type === 'image' || item.type === 'image';

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors group">
      <div className="aspect-video bg-gray-800 relative">
        {isImage ? (
          <img
            src={url}
            alt={item.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23333"/><text x="50%" y="50%" fill="%23666" text-anchor="middle" dy=".3em">No image</text></svg>';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileText className="w-12 h-12 text-gray-600" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
          >
            <ExternalLink className="w-5 h-5" />
          </a>
          <a
            href={url}
            download
            className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
          >
            <Download className="w-5 h-5" />
          </a>
        </div>
      </div>
      <div className="p-3">
        <p className="text-sm font-medium truncate" title={item.title}>{item.title}</p>
        <p className="text-xs text-gray-500 mt-1">{item.source}</p>
      </div>
    </div>
  );
}

function VideoCard({ video }: { video: VideoWithClips }) {
  const url = video.hosted_url || video.source_url;
  const clips = video.clips || [];

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="flex flex-col md:flex-row">
        {/* Video Preview */}
        <div className="md:w-80 flex-shrink-0">
          <div className="aspect-video bg-gray-800 relative">
            <video
              src={url}
              className="w-full h-full object-cover"
              preload="metadata"
            />
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50 transition-colors"
            >
              <Play className="w-12 h-12" />
            </a>
          </div>
        </div>

        {/* Video Info */}
        <div className="flex-1 p-4">
          <h3 className="font-medium text-lg mb-2">{video.title}</h3>
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
            <span>{video.source}</span>
            {(video.metadata as { has_audio?: boolean })?.has_audio && (
              <span className="px-2 py-0.5 bg-green-900/50 text-green-400 rounded text-xs">Has Audio</span>
            )}
          </div>

          {clips.length > 0 && (
            <div>
              <p className="text-sm text-gray-400 mb-2">Extracted Clips ({clips.length}):</p>
              <div className="flex flex-wrap gap-2">
                {clips.map((clip) => (
                  <a
                    key={clip.id}
                    href={clip.hosted_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-sm transition-colors flex items-center gap-2"
                  >
                    <Clock className="w-3 h-3" />
                    {clip.start_time} - {clip.end_time}
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-colors flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Open Video
            </a>
            <a
              href={url}
              download
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function ClipCard({ clip }: { clip: Clip }) {
  const url = clip.hosted_url;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors group">
      <div className="aspect-video bg-gray-800 relative">
        {url && (
          <video
            src={url}
            className="w-full h-full object-cover"
            preload="metadata"
          />
        )}
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
          >
            <Play className="w-6 h-6" />
          </a>
        </div>
        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 rounded text-xs">
          {clip.start_time} - {clip.end_time}
        </div>
        {(clip.metadata as { preserve_original_audio?: boolean })?.preserve_original_audio && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-green-900/80 text-green-400 rounded text-xs">
            B-Roll
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm truncate" title={clip.description}>{clip.description || 'Extracted clip'}</p>
        <p className="text-xs text-gray-500 mt-1">{clip.duration_seconds}s • {clip.extraction_method}</p>
      </div>
    </div>
  );
}
