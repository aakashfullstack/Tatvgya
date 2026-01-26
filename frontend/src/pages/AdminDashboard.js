import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Users, FileText, Flag, MessageSquare, Shield,
  Plus, Eye, Check, X, LogOut, ChevronRight, AlertTriangle
} from 'lucide-react';
import Navigation from '../components/Navigation';
import { useAuth } from '../context/AuthContext';
import {
  getAdminDashboard, getAdminEducators, getAdminArticles, getReports,
  getContactQueries, articleAction, createEducator, getSubjects
} from '../lib/api';
import { Toaster, toast } from 'sonner';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboard, setDashboard] = useState(null);
  const [educators, setEducators] = useState([]);
  const [articles, setArticles] = useState([]);
  const [reports, setReports] = useState([]);
  const [queries, setQueries] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateEducator, setShowCreateEducator] = useState(false);
  const [newEducator, setNewEducator] = useState({
    name: '', email: '', subject_ids: [], bio: ''
  });

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [dashboardData, subjectsData] = await Promise.all([
          getAdminDashboard(),
          getSubjects()
        ]);
        setDashboard(dashboardData);
        setSubjects(subjectsData);
      } catch (error) {
        console.error('Failed to fetch dashboard:', error);
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  useEffect(() => {
    const fetchTabData = async () => {
      try {
        switch (activeTab) {
          case 'educators':
            const educatorsData = await getAdminEducators();
            setEducators(educatorsData);
            break;
          case 'articles':
            const articlesData = await getAdminArticles({ status: 'pending' });
            setArticles(articlesData);
            break;
          case 'reports':
            const reportsData = await getReports({ status: 'pending' });
            setReports(reportsData);
            break;
          case 'queries':
            const queriesData = await getContactQueries({ status: 'new' });
            setQueries(queriesData);
            break;
          default:
            break;
        }
      } catch (error) {
        console.error('Failed to fetch tab data:', error);
      }
    };
    if (activeTab !== 'overview') {
      fetchTabData();
    }
  }, [activeTab]);

  const handleArticleAction = async (articleId, action, reason = null) => {
    try {
      await articleAction(articleId, action, reason);
      setArticles(articles.filter(a => a.article_id !== articleId));
      toast.success(`Article ${action}d successfully`);
    } catch (error) {
      toast.error(error.message || `Failed to ${action} article`);
    }
  };

  const handleCreateEducator = async (e) => {
    e.preventDefault();
    try {
      const result = await createEducator(newEducator);
      toast.success(`Educator created. Password: ${result.password}`);
      setShowCreateEducator(false);
      setNewEducator({ name: '', email: '', subject_ids: [], bio: '' });
      // Refresh educators list
      const educatorsData = await getAdminEducators();
      setEducators(educatorsData);
    } catch (error) {
      toast.error(error.message || 'Failed to create educator');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
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
                <div className="text-center mb-6 pb-6 border-b border-white/10">
                  <div className="w-16 h-16 rounded-full bg-[#FFB800]/10 flex items-center justify-center mx-auto mb-4">
                    <Shield className="text-[#FFB800]" size={32} />
                  </div>
                  <h2 className="text-white font-semibold text-lg">Admin Panel</h2>
                  <p className="text-white/60 text-sm">{user?.email}</p>
                </div>

                <nav className="space-y-2">
                  {[
                    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
                    { id: 'educators', label: 'Educators', icon: Users, badge: dashboard?.pending_educators },
                    { id: 'articles', label: 'Articles', icon: FileText, badge: dashboard?.pending_articles },
                    { id: 'reports', label: 'Reports', icon: Flag, badge: dashboard?.pending_reports },
                    { id: 'queries', label: 'Contact Queries', icon: MessageSquare, badge: dashboard?.new_contact_queries },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      data-testid={`admin-tab-${tab.id}`}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                        activeTab === tab.id
                          ? 'bg-[#FFB800] text-black'
                          : 'text-white/60 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <tab.icon size={18} />
                        <span>{tab.label}</span>
                      </div>
                      {tab.badge > 0 && (
                        <span className={`w-5 h-5 flex items-center justify-center text-xs font-bold rounded-full ${
                          activeTab === tab.id ? 'bg-black/20 text-black' : 'bg-red-500 text-white'
                        }`}>
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </nav>

                <div className="mt-6 pt-6 border-t border-white/10">
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
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <h1 className="text-2xl font-bold text-white mb-8">Admin Dashboard</h1>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="glass-card p-6 text-center">
                      <div className="text-3xl font-bold text-[#FFB800]">{dashboard?.stats?.total_articles}</div>
                      <p className="text-white/60 text-sm">Published Articles</p>
                    </div>
                    <div className="glass-card p-6 text-center">
                      <div className="text-3xl font-bold text-[#FFB800]">{dashboard?.stats?.total_educators}</div>
                      <p className="text-white/60 text-sm">Active Educators</p>
                    </div>
                    <div className="glass-card p-6 text-center">
                      <div className="text-3xl font-bold text-[#FFB800]">{dashboard?.stats?.total_students}</div>
                      <p className="text-white/60 text-sm">Students</p>
                    </div>
                    <div className="glass-card p-6 text-center">
                      <div className="text-3xl font-bold text-[#FFB800]">{formatNumber(dashboard?.stats?.total_views)}</div>
                      <p className="text-white/60 text-sm">Total Views</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass-card p-6">
                      <h3 className="text-white font-semibold mb-4">Pending Actions</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-white/60">Articles to Review</span>
                          <span className="text-[#FFB800] font-bold">{dashboard?.pending_articles}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/60">Flagged Content</span>
                          <span className="text-[#FFB800] font-bold">{dashboard?.flagged_articles}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/60">Open Reports</span>
                          <span className="text-[#FFB800] font-bold">{dashboard?.pending_reports}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/60">New Queries</span>
                          <span className="text-[#FFB800] font-bold">{dashboard?.new_contact_queries}</span>
                        </div>
                      </div>
                    </div>

                    <div className="glass-card p-6">
                      <h3 className="text-white font-semibold mb-4">Quick Actions</h3>
                      <div className="space-y-2">
                        <button
                          onClick={() => setShowCreateEducator(true)}
                          className="w-full btn-primary flex items-center justify-center space-x-2"
                        >
                          <Plus size={18} />
                          <span>Create Educator</span>
                        </button>
                        <button
                          onClick={() => setActiveTab('articles')}
                          className="w-full btn-secondary flex items-center justify-center space-x-2"
                        >
                          <FileText size={18} />
                          <span>Review Articles</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'educators' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-bold text-white">Manage Educators</h1>
                    <button
                      onClick={() => setShowCreateEducator(true)}
                      className="btn-primary flex items-center space-x-2"
                    >
                      <Plus size={18} />
                      <span>Create</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {educators.map((educator) => (
                      <div key={educator.profile_id} className="glass-card p-4 flex items-center gap-4">
                        <img
                          src={educator.profile_photo || 'https://via.placeholder.com/60'}
                          alt={educator.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <h3 className="text-white font-semibold">{educator.name}</h3>
                          <p className="text-white/60 text-sm">{educator.email}</p>
                          <div className="flex gap-1 mt-1">
                            {educator.subjects?.slice(0, 2).map((s) => (
                              <span key={s.subject_id} className="px-2 py-0.5 bg-white/5 text-white/60 rounded text-xs">
                                {s.name}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[#FFB800] font-bold">{educator.total_articles}</div>
                          <p className="text-white/40 text-xs">articles</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'articles' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <h1 className="text-2xl font-bold text-white mb-8">Review Articles</h1>

                  {articles.length === 0 ? (
                    <div className="glass-card p-12 text-center">
                      <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
                      <h3 className="text-white font-semibold text-lg mb-2">All caught up!</h3>
                      <p className="text-white/60">No pending articles to review</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {articles.map((article) => (
                        <div key={article.article_id} className="glass-card p-6">
                          <div className="flex items-start gap-4">
                            {article.cover_image && (
                              <img
                                src={article.cover_image}
                                alt={article.title}
                                className="w-32 h-24 object-cover rounded-lg"
                              />
                            )}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-0.5 bg-[#FFB800]/10 text-[#FFB800] rounded text-xs">
                                  {article.subject_name}
                                </span>
                                {article.is_flagged && (
                                  <span className="px-2 py-0.5 bg-red-500/10 text-red-500 rounded text-xs flex items-center gap-1">
                                    <AlertTriangle size={12} />
                                    Flagged
                                  </span>
                                )}
                              </div>
                              <h3 className="text-white font-semibold text-lg">{article.title}</h3>
                              <p className="text-white/60 text-sm mt-1">By {article.author_name}</p>
                              {article.flag_reason && (
                                <p className="text-red-400 text-sm mt-2">{article.flag_reason}</p>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleArticleAction(article.article_id, 'approve')}
                                className="p-2 bg-green-500/10 text-green-500 hover:bg-green-500/20 rounded-lg transition-all"
                                title="Approve"
                              >
                                <Check size={20} />
                              </button>
                              <button
                                onClick={() => {
                                  const reason = prompt('Rejection reason:');
                                  if (reason) handleArticleAction(article.article_id, 'reject', reason);
                                }}
                                className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-all"
                                title="Reject"
                              >
                                <X size={20} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'reports' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <h1 className="text-2xl font-bold text-white mb-8">Content Reports</h1>
                  {reports.length === 0 ? (
                    <div className="glass-card p-12 text-center">
                      <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
                      <h3 className="text-white font-semibold text-lg mb-2">No pending reports</h3>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reports.map((report) => (
                        <div key={report.report_id} className="glass-card p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <span className="px-2 py-0.5 bg-red-500/10 text-red-500 rounded text-xs uppercase">
                                {report.reason}
                              </span>
                              <h3 className="text-white font-semibold mt-2">{report.article_title}</h3>
                              <p className="text-white/60 text-sm">Reported by: {report.reporter_name}</p>
                            </div>
                          </div>
                          {report.description && (
                            <p className="text-white/60 text-sm bg-white/5 p-3 rounded-lg">{report.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'queries' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <h1 className="text-2xl font-bold text-white mb-8">Contact Queries</h1>
                  {queries.length === 0 ? (
                    <div className="glass-card p-12 text-center">
                      <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
                      <h3 className="text-white font-semibold text-lg mb-2">No new queries</h3>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {queries.map((query) => (
                        <div key={query.query_id} className="glass-card p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-white font-semibold">{query.subject}</h3>
                              <p className="text-white/60 text-sm">{query.name} - {query.email}</p>
                            </div>
                            <span className="px-2 py-0.5 bg-[#FFB800]/10 text-[#FFB800] rounded text-xs">
                              {query.status}
                            </span>
                          </div>
                          <p className="text-white/60 bg-white/5 p-3 rounded-lg">{query.message}</p>
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

      {/* Create Educator Modal */}
      {showCreateEducator && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-8 max-w-md w-full"
          >
            <h2 className="text-xl font-bold text-white mb-6">Create Educator</h2>
            <form onSubmit={handleCreateEducator} className="space-y-4">
              <div>
                <label className="block text-white/60 text-sm mb-2">Name</label>
                <input
                  type="text"
                  value={newEducator.name}
                  onChange={(e) => setNewEducator({ ...newEducator, name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-white/60 text-sm mb-2">Email</label>
                <input
                  type="email"
                  value={newEducator.email}
                  onChange={(e) => setNewEducator({ ...newEducator, email: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-white/60 text-sm mb-2">Subjects</label>
                <select
                  multiple
                  value={newEducator.subject_ids}
                  onChange={(e) => setNewEducator({
                    ...newEducator,
                    subject_ids: Array.from(e.target.selectedOptions, o => o.value)
                  })}
                  className="input-field min-h-[100px]"
                  required
                >
                  {subjects.map((s) => (
                    <option key={s.subject_id} value={s.subject_id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-white/60 text-sm mb-2">Bio</label>
                <textarea
                  value={newEducator.bio}
                  onChange={(e) => setNewEducator({ ...newEducator, bio: e.target.value })}
                  className="input-field min-h-[80px]"
                />
              </div>
              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateEducator(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  Create
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
