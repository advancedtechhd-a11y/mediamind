'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Image, Video, FileText, Scissors, Key, BarChart3, Loader2, ExternalLink, Trash2 } from 'lucide-react';
import { startResearch, type Project } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';

const SUPABASE_URL = 'https://wwgwvfhujfbtlotndqzt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3Z3d2Zmh1amZidGxvdG5kcXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2OTUxOTAsImV4cCI6MjA4NTI3MTE5MH0.VTavPv9ZQEM4UQCR_dyB0HDpjGRfLzk5LQPXD7cz2CQ';

export default function Dashboard() {
  const router = useRouter();
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [stats, setStats] = useState({ researches: 0, images: 0, clips: 0 });

  // Fetch projects on load
  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/projects?select=*&order=created_at.desc&limit=20`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
          },
        }
      );
      if (!response.ok) {
        console.error('Failed to fetch projects:', response.status);
        setProjects([]);
        return;
      }
      const data = await response.json();
      // Ensure data is an array
      const projectsArray = Array.isArray(data) ? data : [];
      setProjects(projectsArray);

      // Calculate stats
      const totalResearches = projectsArray.length;
      let totalImages = 0;
      let totalClips = 0;
      projectsArray.forEach((p: Project) => {
        totalImages += p.image_count || 0;
        totalClips += p.clip_count || 0;
      });
      setStats({ researches: totalResearches, images: totalImages, clips: totalClips });
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoadingProjects(false);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    try {
      const result = await startResearch(topic.trim());
      if (result.success && result.project?.id) {
        router.push(`/project/${result.project.id}`);
      }
    } catch (error) {
      console.error('Research failed:', error);
      alert('Failed to start research. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function deleteProject(id: string) {
    if (!confirm('Delete this project?')) return;

    try {
      await fetch(`${SUPABASE_URL}/rest/v1/projects?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      });
      setProjects(projects.filter(p => p.id !== id));
    } catch (error) {
      console.error('Delete failed:', error);
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Search className="w-4 h-4" />
            </div>
            <span className="text-xl font-bold">MediaMind</span>
          </div>
          <nav className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white transition-colors">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Usage</span>
            </button>
            <button className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white transition-colors">
              <Key className="w-4 h-4" />
              <span className="hidden sm:inline">API Keys</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Search Box */}
        <div className="max-w-3xl mx-auto mb-12">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Research any topic... (e.g., Al Capone, D-Day Normandy, 1969 Moon Landing)"
                className="w-full pl-12 pr-32 py-4 bg-gray-900 border border-gray-700 rounded-xl text-lg placeholder:text-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !topic.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Starting...</span>
                  </>
                ) : (
                  <span>Search</span>
                )}
              </button>
            </div>
          </form>
          <p className="text-center text-gray-500 text-sm mt-3">
            Get images, videos, newspaper clippings, and news articles for any topic
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-12 max-w-2xl mx-auto">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-blue-400">{stats.researches}</div>
            <div className="text-gray-500 text-sm mt-1">Researches</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-green-400">{stats.images}</div>
            <div className="text-gray-500 text-sm mt-1">Images</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-purple-400">{stats.clips}</div>
            <div className="text-gray-500 text-sm mt-1">Clips</div>
          </div>
        </div>

        {/* Recent Projects */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-500" />
            Recent Projects
          </h2>

          {loadingProjects ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
            </div>
          ) : projects.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
              <Search className="w-12 h-12 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500">No research projects yet. Start by searching a topic above!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-lg truncate">{project.topic}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Image className="w-4 h-4" />
                          {project.image_count || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Video className="w-4 h-4" />
                          {project.video_count || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Scissors className="w-4 h-4" />
                          {project.clip_count || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {project.news_count || 0}
                        </span>
                        <span className="text-gray-600">|</span>
                        <span>
                          {project.created_at && formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          project.status === 'completed' ? 'bg-green-900/50 text-green-400' :
                          project.status === 'processing' ? 'bg-blue-900/50 text-blue-400' :
                          project.status === 'failed' ? 'bg-red-900/50 text-red-400' :
                          'bg-gray-800 text-gray-400'
                        }`}>
                          {project.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => router.push(`/project/${project.id}`)}
                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Open
                      </button>
                      <button
                        onClick={() => deleteProject(project.id)}
                        className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-16 py-8 text-center text-gray-500 text-sm">
        <p>MediaMind - AI-powered media research</p>
        <p className="mt-1">
          API: <code className="bg-gray-800 px-2 py-1 rounded text-xs">http://ik4g0gsg8ko8wcko8s840k4c.46.224.208.101.sslip.io</code>
        </p>
      </footer>
    </div>
  );
}
