import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, BookOpen, Eye, Heart, Bookmark, ExternalLink, Twitter, Linkedin, Globe } from 'lucide-react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import ArticleCard from '../components/ArticleCard';
import { getEducator, getEducatorArticles } from '../lib/api';

const EducatorProfile = () => {
  const { id } = useParams();
  const [educator, setEducator] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [educatorData, articlesData] = await Promise.all([
          getEducator(id),
          getEducatorArticles(id, { status: 'published', limit: 20 }),
        ]);
        setEducator(educatorData);
        setArticles(articlesData);
      } catch (error) {
        console.error('Failed to fetch educator:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    window.scrollTo(0, 0);
  }, [id]);

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toString() || '0';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505]">
        <Navigation />
        <div className="pt-32 max-w-4xl mx-auto px-4">
          <div className="flex items-center space-x-6 mb-8">
            <div className="w-24 h-24 skeleton rounded-full" />
            <div className="space-y-4 flex-1">
              <div className="h-8 skeleton rounded w-48" />
              <div className="h-4 skeleton rounded w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!educator) {
    return (
      <div className="min-h-screen bg-[#050505]">
        <Navigation />
        <div className="pt-32 text-center">
          <p className="text-white/60">Educator not found</p>
          <Link to="/explore" className="text-[#FFB800] hover:underline mt-4 inline-block">
            Browse Articles
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505]">
      <Navigation />

      {/* Profile Header */}
      <section className="pt-32 pb-12 px-4" data-testid="educator-profile">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8"
          >
            <div className="flex flex-col md:flex-row items-start gap-6">
              {/* Profile Photo */}
              {educator.profile_photo ? (
                <img
                  src={educator.profile_photo}
                  alt={educator.name}
                  className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover ring-4 ring-[#FFB800]/20"
                />
              ) : (
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-white/10 flex items-center justify-center ring-4 ring-[#FFB800]/20">
                  <User size={48} className="text-white/60" />
                </div>
              )}

              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2" data-testid="educator-name">
                  {educator.name}
                </h1>
                
                {/* Subjects */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {educator.subjects?.map((subject) => (
                    <Link
                      key={subject.subject_id}
                      to={`/explore?subject=${subject.slug}`}
                      className="px-3 py-1 bg-[#FFB800]/10 text-[#FFB800] rounded-full text-sm hover:bg-[#FFB800]/20 transition-colors"
                    >
                      {subject.name}
                    </Link>
                  ))}
                </div>

                {/* Bio */}
                {educator.bio && (
                  <p className="text-white/60 mb-4">{educator.bio}</p>
                )}

                {/* Social Links */}
                {educator.social_links && (
                  <div className="flex items-center space-x-4">
                    {educator.social_links.twitter && (
                      <a
                        href={educator.social_links.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white/40 hover:text-[#1DA1F2] transition-colors"
                      >
                        <Twitter size={20} />
                      </a>
                    )}
                    {educator.social_links.linkedin && (
                      <a
                        href={educator.social_links.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white/40 hover:text-[#0A66C2] transition-colors"
                      >
                        <Linkedin size={20} />
                      </a>
                    )}
                    {educator.social_links.website && (
                      <a
                        href={educator.social_links.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white/40 hover:text-[#FFB800] transition-colors"
                      >
                        <Globe size={20} />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-white/10">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 text-[#FFB800] mb-1">
                  <BookOpen size={18} />
                  <span className="text-2xl font-bold">{formatNumber(educator.total_articles)}</span>
                </div>
                <p className="text-white/40 text-sm">Articles</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 text-[#FFB800] mb-1">
                  <Eye size={18} />
                  <span className="text-2xl font-bold">{formatNumber(educator.total_views)}</span>
                </div>
                <p className="text-white/40 text-sm">Views</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 text-[#FFB800] mb-1">
                  <Heart size={18} />
                  <span className="text-2xl font-bold">{formatNumber(educator.total_likes)}</span>
                </div>
                <p className="text-white/40 text-sm">Likes</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 text-[#FFB800] mb-1">
                  <Bookmark size={18} />
                  <span className="text-2xl font-bold">{formatNumber(educator.total_bookmarks)}</span>
                </div>
                <p className="text-white/40 text-sm">Bookmarks</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Articles */}
      <section className="pb-24 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-8">
            Articles by {educator.name.split(' ')[0]}
          </h2>

          {articles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/60">No published articles yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {articles.map((article, index) => (
                <ArticleCard key={article.article_id} article={article} index={index} />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default EducatorProfile;
