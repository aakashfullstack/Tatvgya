import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Clock, Eye, Heart, Bookmark, Share2, Flag, 
  User, Calendar, Tag, ChevronRight 
} from 'lucide-react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import ArticleCard from '../components/ArticleCard';
import { getArticle, getRelatedArticles, likeArticle, bookmarkArticle } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Toaster, toast } from 'sonner';

const Article = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [article, setArticle] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [bookmarkCount, setBookmarkCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const articleData = await getArticle(id);
        setArticle(articleData);
        setIsLiked(articleData.is_liked);
        setIsBookmarked(articleData.is_bookmarked);
        setLikeCount(articleData.like_count);
        setBookmarkCount(articleData.bookmark_count);

        const related = await getRelatedArticles(articleData.article_id);
        setRelatedArticles(related);
      } catch (error) {
        console.error('Failed to fetch article:', error);
        toast.error('Article not found');
        navigate('/explore');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    window.scrollTo(0, 0);
  }, [id, navigate]);

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to like articles');
      return;
    }

    try {
      const result = await likeArticle(article.article_id);
      setIsLiked(result.liked);
      setLikeCount(result.like_count);
      toast.success(result.liked ? 'Article liked!' : 'Like removed');
    } catch (error) {
      toast.error('Failed to like article');
    }
  };

  const handleBookmark = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to bookmark articles');
      return;
    }

    try {
      const result = await bookmarkArticle(article.article_id);
      setIsBookmarked(result.bookmarked);
      setBookmarkCount(result.bookmark_count);
      toast.success(result.bookmarked ? 'Article bookmarked!' : 'Bookmark removed');
    } catch (error) {
      toast.error('Failed to bookmark article');
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: article.title,
        text: article.excerpt,
        url: window.location.href,
      });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505]">
        <Navigation />
        <div className="pt-32 max-w-4xl mx-auto px-4">
          <div className="h-8 w-48 skeleton rounded mb-8" />
          <div className="h-96 skeleton rounded-2xl mb-8" />
          <div className="space-y-4">
            <div className="h-8 skeleton rounded w-3/4" />
            <div className="h-4 skeleton rounded w-full" />
            <div className="h-4 skeleton rounded w-5/6" />
          </div>
        </div>
      </div>
    );
  }

  if (!article) return null;

  return (
    <div className="min-h-screen bg-[#050505]">
      <Toaster position="top-center" theme="dark" />
      <Navigation />

      {/* Hero */}
      <section className="pt-24 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            data-testid="back-btn"
            className="flex items-center space-x-2 text-white/60 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>

          {/* Subject Badge */}
          <Link
            to={`/explore?subject=${article.subject?.slug}`}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-[#FFB800]/10 text-[#FFB800] rounded-full text-sm font-medium mb-6 hover:bg-[#FFB800]/20 transition-colors"
          >
            <span>{article.subject?.name}</span>
            <ChevronRight size={14} />
          </Link>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight"
            data-testid="article-title"
          >
            {article.title}
          </motion.h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-white/60 text-sm mb-8">
            <Link
              to={`/educator/${article.educator_id}`}
              className="flex items-center space-x-2 hover:text-[#FFB800] transition-colors"
            >
              {article.author_photo ? (
                <img
                  src={article.author_photo}
                  alt={article.author_name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <User size={16} />
                </div>
              )}
              <span className="font-medium text-white">{article.author_name}</span>
            </Link>
            <span className="flex items-center space-x-1">
              <Calendar size={14} />
              <span>{formatDate(article.published_at)}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Clock size={14} />
              <span>{article.reading_time} min read</span>
            </span>
          </div>

          {/* Cover Image */}
          {article.cover_image && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl overflow-hidden mb-8"
            >
              <img
                src={article.cover_image}
                alt={article.title}
                className="w-full h-auto object-cover"
              />
            </motion.div>
          )}
        </div>
      </section>

      {/* Content */}
      <section className="pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-8">
            {/* Article Content */}
            <motion.article
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex-1 article-content"
              dangerouslySetInnerHTML={{ __html: article.content }}
              data-testid="article-content"
            />

            {/* Sidebar Actions */}
            <div className="hidden lg:block">
              <div className="sticky top-32 space-y-4">
                <button
                  onClick={handleLike}
                  data-testid="like-btn"
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    isLiked
                      ? 'bg-red-500 text-white'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
                </button>
                <p className="text-center text-white/40 text-xs">{likeCount}</p>

                <button
                  onClick={handleBookmark}
                  data-testid="bookmark-btn"
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    isBookmarked
                      ? 'bg-[#FFB800] text-black'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  <Bookmark size={20} fill={isBookmarked ? 'currentColor' : 'none'} />
                </button>
                <p className="text-center text-white/40 text-xs">{bookmarkCount}</p>

                <button
                  onClick={handleShare}
                  data-testid="share-btn"
                  className="w-12 h-12 rounded-full bg-white/5 text-white/60 hover:bg-white/10 flex items-center justify-center transition-all"
                >
                  <Share2 size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="mt-8 pt-8 border-t border-white/10">
              <div className="flex items-center flex-wrap gap-2">
                <Tag size={16} className="text-white/40" />
                {article.tags.map((tag) => (
                  <Link
                    key={tag}
                    to={`/explore?search=${tag}`}
                    className="px-3 py-1 bg-white/5 text-white/60 rounded-full text-sm hover:bg-white/10 transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Mobile Actions */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 glass p-4 flex justify-around items-center z-40">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-2 ${isLiked ? 'text-red-500' : 'text-white/60'}`}
            >
              <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
              <span>{likeCount}</span>
            </button>
            <button
              onClick={handleBookmark}
              className={`flex items-center space-x-2 ${isBookmarked ? 'text-[#FFB800]' : 'text-white/60'}`}
            >
              <Bookmark size={20} fill={isBookmarked ? 'currentColor' : 'none'} />
              <span>{bookmarkCount}</span>
            </button>
            <button
              onClick={handleShare}
              className="flex items-center space-x-2 text-white/60"
            >
              <Share2 size={20} />
              <span>Share</span>
            </button>
          </div>

          {/* Author Card */}
          <div className="mt-12 glass-card p-6">
            <div className="flex items-start space-x-4">
              <Link to={`/educator/${article.educator_id}`}>
                {article.author_photo ? (
                  <img
                    src={article.author_photo}
                    alt={article.author_name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                    <User size={24} className="text-white/60" />
                  </div>
                )}
              </Link>
              <div className="flex-1">
                <Link
                  to={`/educator/${article.educator_id}`}
                  className="text-white font-semibold text-lg hover:text-[#FFB800] transition-colors"
                >
                  {article.author_name}
                </Link>
                <p className="text-white/60 text-sm mt-1">
                  Expert educator on TATVGYA
                </p>
                <Link
                  to={`/educator/${article.educator_id}`}
                  className="inline-flex items-center text-[#FFB800] text-sm mt-3 hover:underline"
                >
                  View Profile
                  <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="py-16 px-4 bg-[#0A0A0A]">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-8">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedArticles.map((article, index) => (
                <ArticleCard key={article.article_id} article={article} index={index} />
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default Article;
