// MediaMind API Client

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://worker-production-5f19.up.railway.app';

export interface Project {
  id: string;
  topic: string;
  slug: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  image_count?: number;
  video_count?: number;
  clip_count?: number;
  news_count?: number;
  created_at: string;
  completed_at?: string;
  error_message?: string;
}

export interface MediaItem {
  id: string;
  project_id: string;
  type: 'image' | 'video' | 'newspaper_scan' | 'article_screenshot';
  title: string;
  source: string;
  source_url: string;
  hosted_url?: string;
  storage_path?: string;
  metadata?: Record<string, unknown>;
  relevance_score?: number;
  created_at: string;
}

export interface Clip {
  id: string;
  media_id: string;
  project_id: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  description: string;
  relevance_score?: number;
  hosted_url?: string;
  storage_path?: string;
  extraction_method?: string;
  metadata?: Record<string, unknown>;
}

export interface VideoWithClips extends MediaItem {
  clips: Clip[];
}

export interface ProjectResults {
  images: MediaItem[];
  videos: VideoWithClips[];
  news: MediaItem[];
}

export interface ResearchResponse {
  success: boolean;
  project: {
    id: string;
    slug: string;
    topic: string;
    status: string;
  };
}

export interface ProjectResponse {
  success: boolean;
  project: Project;
  results: ProjectResults;
}

// Start a new research
export async function startResearch(topic: string, options?: {
  max_images?: number;
  max_videos?: number;
  max_news?: number;
}): Promise<ResearchResponse> {
  const response = await fetch(`${API_URL}/v1/research`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, options }),
  });
  return response.json();
}

// Get project by ID
export async function getProject(id: string): Promise<ProjectResponse> {
  const response = await fetch(`${API_URL}/v1/project/${id}`);
  return response.json();
}

// Test search (no DB save)
export async function testSearch(topic: string): Promise<{
  success: boolean;
  topic: string;
  summary: {
    videos: number;
    images: number;
    newspapers: number;
    news: number;
    total: number;
  };
  results: {
    videos: Array<{ url: string; title: string; source: string; thumbnail?: string }>;
    images: Array<{ url: string; title: string; source: string; thumbnail?: string }>;
    newspapers: Array<{ url: string; title: string; source: string; snippet?: string }>;
    news: Array<{ url: string; title: string; source: string; snippet?: string }>;
  };
}> {
  const response = await fetch(`${API_URL}/v1/test/search?topic=${encodeURIComponent(topic)}`);
  return response.json();
}

// Get all projects (from Supabase directly)
export async function getProjects(): Promise<Project[]> {
  // This would normally go through our API, but for now we'll use Supabase directly
  const response = await fetch(`${API_URL}/v1/projects`);
  if (!response.ok) return [];
  const data = await response.json();
  return data.projects || [];
}
