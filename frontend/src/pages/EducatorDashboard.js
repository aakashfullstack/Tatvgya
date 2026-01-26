import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, FileText, Plus, Eye, Heart, Bookmark, User, LogOut,
  Edit, Trash2, Clock, Send, AlertCircle, CheckCircle, XCircle
} from 'lucide-react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import {
  getMyProfile, getMyArticles, getMyStats, deleteArticle, getSubjects
} from '../lib/api';
import { Toaster, toast } from 'sonner';

const EducatorDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [profile, setProfile] = useState(null);
  const [articles, setArticles] = useState([]);
  const [stats, setStats] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [articleFilter, setArticleFilter] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileData, statsData, subjectsData] = await Promise.all([
          getMyProfile(),
          getMyStats(),
          getSubjects()
        ]);
        setProfile(profileData);
        setStats(statsData);
        setSubjects(subjectsData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const data = await getMyArticles({ status: articleFilter });
        setArticles(data);
      } catch (error) {
        console.error('Failed to fetch articles:', error);
      }
    };
    if (activeTab === 'articles') {
      fetchArticles();
    }
  }, [activeTab, articleFilter]);

  const handleDeleteArticle = async (articleId) => {
    if (!window.confirm('Are you sure you want to delete this article?')) return;
    
    try {
      await deleteArticle(articleId);
      setArticles(articles.filter(a => a.article_id !== articleId));
      toast.success('Article deleted');
    } catch (error) {
      toast.error(error.message || 'Failed to delete article');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: { color: 'bg-gray-500', icon: Edit, label: 'Draft' },
      pending: { color: 'bg-yellow-500', icon: Clock, label: 'Pending' },
      published: { color: 'bg-green-500', icon: CheckCircle, label: 'Published' },
      rejected: { color: 'bg-red-500', icon: XCircle, label: 'Rejected' },
    };
    const badge = badges[status] || badges.draft;
    return (
      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${badge.color} text-white`}>
        <badge.icon size={12} />
        <span>{badge.label}</span>
      </span>
    );
  };

  const formatNumber = (num) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toString() || '0';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505]">
        <Navigation />
        <div className="pt-32 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-[#FFB800] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505]">
      <Toaster position="top-center" theme="dark" />
      <Navigation />

      <div className="pt-24 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <div className="lg:w-72 flex-shrink-0">
              <div className="glass-card p-6 sticky top-24">
                {/* Profile Summary */}
                <div className="text-center mb-6 pb-6 border-b border-white/10">
                  {profile?.profile_photo ? (
                    <img
                      src={profile.profile_photo}
                      alt={profile?.name}
                      className="w-20 h-20 rounded-full object-cover mx-auto mb-4"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-[#FFB800]/10 flex items-center justify-center mx-auto mb-4">
                      <User className="text-[#FFB800]" size={32} />
                    </div>
                  )}
                  <h2 className="text-white font-semibold text-lg">{profile?.name}</h2>
                  <p className="text-white/60 text-sm">Educator</p>
                  <div className="flex flex-wrap justify-center gap-1 mt-2">
                    {profile?.subjects?.slice(0, 2).map((subject) => (
                      <span key={subject.subject_id} className="px-2 py-0.5 bg-[#FFB800]/10 text-[#FFB800] rounded text-xs">
                        {subject.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Navigation */}
                <nav className="space-y-2">
                  <button
                    onClick={() => setActiveTab('overview')}
                    data-testid="tab-overview"
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                      activeTab === 'overview'
                        ? 'bg-[#FFB800] text-black'
                        : 'text-white/60 hover:bg-white/5'
                    }`}
                  >
                    <LayoutDashboard size={18} />
                    <span>Overview</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('articles')}
                    data-testid="tab-articles"
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                      activeTab === 'articles'
                        ? 'bg-[#FFB800] text-black'
                        : 'text-white/60 hover:bg-white/5'
                    }`}
                  >
                    <FileText size={18} />
                    <span>My Articles</span>
                  </button>
                  <Link
                    to="/educator/create"
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-white/60 hover:bg-white/5 transition-all"
                  >
                    <Plus size={18} />
                    <span>New Article</span>
                  </Link>
                </nav>

                {/* Actions */}
                <div className="mt-6 pt-6 border-t border-white/10 space-y-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-white/60 hover:bg-white/5 transition-all"
                  >
                    <LogOut size={18} />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              {activeTab === 'overview' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <h1 className="text-2xl font-bold text-white mb-8">Dashboard Overview</h1>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="glass-card p-6 text-center">
                      <FileText className="w-8 h-8 text-[#FFB800] mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">{stats?.total_articles || 0}</div>
                      <p className="text-white/60 text-sm">Total Articles</p>
                    </div>
                    <div className="glass-card p-6 text-center">
                      <Eye className="w-8 h-8 text-[#FFB800] mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">{formatNumber(stats?.total_views)}</div>
                      <p className="text-white/60 text-sm">Total Views</p>
                    </div>
                    <div className="glass-card p-6 text-center">
                      <Heart className="w-8 h-8 text-[#FFB800] mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">{formatNumber(stats?.total_likes)}</div>
                      <p className="text-white/60 text-sm">Total Likes</p>
                    </div>
                    <div className="glass-card p-6 text-center">
                      <Bookmark className="w-8 h-8 text-[#FFB800] mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">{formatNumber(stats?.total_bookmarks)}</div>
                      <p className="text-white/60 text-sm">Total Bookmarks</p>
                    </div>
                  </div>

                  {/* Article Status */}
                  <div className="glass-card p-6">
                    <h2 className="text-lg font-semibold text-white mb-4">Article Status</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-white/5 rounded-xl">
                        <div className="text-2xl font-bold text-green-500">{stats?.published_count || 0}</div>
                        <p className="text-white/60 text-sm">Published</p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-xl">
                        <div className="text-2xl font-bold text-yellow-500">{stats?.pending_count || 0}</div>
                        <p className="text-white/60 text-sm">Pending</p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-xl">
                        <div className="text-2xl font-bold text-gray-500">{stats?.draft_count || 0}</div>
                        <p className="text-white/60 text-sm">Drafts</p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-xl">
                        <div className="text-2xl font-bold text-red-500">{stats?.rejected_count || 0}</div>
                        <p className="text-white/60 text-sm">Rejected</p>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="mt-8">
                    <Link
                      to="/educator/create"
                      className="btn-primary inline-flex items-center space-x-2"
                    >
                      <Plus size={18} />
                      <span>Create New Article</span>
                    </Link>
                  </div>
                </motion.div>
              )}

              {activeTab === 'articles' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                    <h1 className="text-2xl font-bold text-white mb-4 md:mb-0">My Articles</h1>
                    <div className="flex items-center space-x-4">
                      <select
                        value={articleFilter}
                        onChange={(e) => setArticleFilter(e.target.value)}
                        className="input-field py-2"
                      >
                        <option value="all">All Status</option>
                        <option value="published">Published</option>
                        <option value="pending">Pending</option>
                        <option value="draft">Draft</option>
                        <option value="rejected">Rejected</option>
                      </select>
                      <Link to="/educator/create" className="btn-primary inline-flex items-center space-x-2">
                        <Plus size={18} />
                        <span>New</span>
                      </Link>
                    </div>
                  </div>

                  {articles.length === 0 ? (
                    <div className="glass-card p-12 text-center">
                      <FileText className="w-16 h-16 text-white/20 mx-auto mb-4" />
                      <h3 className="text-white font-semibold text-lg mb-2">No articles yet</h3>
                      <p className="text-white/60 mb-6">Start creating content to share your knowledge</p>
                      <Link to="/educator/create" className="btn-primary inline-flex items-center space-x-2">
                        <Plus size={18} />
                        <span>Create Article</span>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {articles.map((article) => (
                        <div
                          key={article.article_id}
                          className="glass-card p-4 flex flex-col md:flex-row md:items-center gap-4"
                        >
                          {article.cover_image && (
                            <img
                              src={article.cover_image}
                              alt={article.title}
                              className="w-full md:w-32 h-24 object-cover rounded-lg"
                            />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              {getStatusBadge(article.status)}
                              <span className="text-white/40 text-sm">{article.subject_name}</span>
                            </div>
                            <h3 className="text-white font-semibold line-clamp-1">{article.title}</h3>
                            <div className="flex items-center space-x-4 mt-2 text-white/40 text-sm">
                              <span className="flex items-center space-x-1">
                                <Eye size={14} />
                                <span>{article.view_count}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Heart size={14} />
                                <span>{article.like_count}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Clock size={14} />
                                <span>{article.reading_time} min</span>
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {article.status === 'published' && (
                              <Link
                                to={`/article/${article.slug}`}
                                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                              >
                                <Eye size={18} />
                              </Link>
                            )}
                            {article.status !== 'published' && (
                              <>
                                <Link
                                  to={`/educator/edit/${article.article_id}`}
                                  className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                                >
                                  <Edit size={18} />
                                </Link>
                                <button
                                  onClick={() => handleDeleteArticle(article.article_id)}
                                  className="p-2 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default EducatorDashboard;
