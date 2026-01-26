import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BookOpen, Heart, Bookmark, Clock, User, Settings, LogOut,
  ChevronRight, Eye
} from 'lucide-react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import ArticleCard from '../components/ArticleCard';
import { useAuth } from '../context/AuthContext';
import { getStudentProfile, getLikedArticles, getBookmarkedArticles, getReadingHistory } from '../lib/api';

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('liked');
  const [profile, setProfile] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getStudentProfile();
        setProfile(data);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      try {
        let data;
        switch (activeTab) {
          case 'liked':
            data = await getLikedArticles();
            break;
          case 'bookmarked':
            data = await getBookmarkedArticles();
            break;
          case 'history':
            data = await getReadingHistory();
            break;
          default:
            data = [];
        }
        setArticles(data);
      } catch (error) {
        console.error('Failed to fetch articles:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, [activeTab]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const tabs = [
    { id: 'liked', label: 'Liked', icon: Heart },
    { id: 'bookmarked', label: 'Bookmarked', icon: Bookmark },
    { id: 'history', label: 'History', icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-[#050505]">
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
                  <h2 className="text-white font-semibold text-lg">{user?.name}</h2>
                  <p className="text-white/60 text-sm">{user?.email}</p>
                </div>

                {/* Navigation */}
                <nav className="space-y-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      data-testid={`tab-${tab.id}`}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                        activeTab === tab.id
                          ? 'bg-[#FFB800] text-black'
                          : 'text-white/60 hover:bg-white/5'
                      }`}
                    >
                      <tab.icon size={18} />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </nav>

                {/* Actions */}
                <div className="mt-6 pt-6 border-t border-white/10 space-y-2">
                  <Link
                    to="/explore"
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-white/60 hover:bg-white/5 transition-all"
                  >
                    <BookOpen size={18} />
                    <span>Explore Articles</span>
                  </Link>
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
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <h1 className="text-2xl font-bold text-white mb-2">
                  {activeTab === 'liked' && 'Liked Articles'}
                  {activeTab === 'bookmarked' && 'Bookmarked Articles'}
                  {activeTab === 'history' && 'Reading History'}
                </h1>
                <p className="text-white/60">
                  {activeTab === 'liked' && 'Articles you\'ve liked'}
                  {activeTab === 'bookmarked' && 'Articles you\'ve saved for later'}
                  {activeTab === 'history' && 'Your recent reading activity'}
                </p>
              </motion.div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {Array(6).fill(0).map((_, i) => (
                    <div key={i} className="h-[400px] glass-card skeleton" />
                  ))}
                </div>
              ) : articles.length === 0 ? (
                <div className="glass-card p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                    {activeTab === 'liked' && <Heart className="text-white/40" size={32} />}
                    {activeTab === 'bookmarked' && <Bookmark className="text-white/40" size={32} />}
                    {activeTab === 'history' && <Clock className="text-white/40" size={32} />}
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">
                    {activeTab === 'liked' && 'No liked articles yet'}
                    {activeTab === 'bookmarked' && 'No bookmarks yet'}
                    {activeTab === 'history' && 'No reading history'}
                  </h3>
                  <p className="text-white/60 mb-6">
                    {activeTab === 'liked' && 'Like articles to see them here'}
                    {activeTab === 'bookmarked' && 'Bookmark articles to read them later'}
                    {activeTab === 'history' && 'Articles you read will appear here'}
                  </p>
                  <Link to="/explore" className="btn-primary inline-flex items-center space-x-2">
                    <span>Explore Articles</span>
                    <ChevronRight size={18} />
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {articles.map((article, index) => (
                    <ArticleCard key={article.article_id} article={article} index={index} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default StudentDashboard;
