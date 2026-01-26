import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Eye, Heart, Bookmark, User } from 'lucide-react';

const ArticleCard = ({ article, index = 0 }) => {
  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toString() || '0';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="article-card group"
      data-testid={`article-card-${article.article_id}`}
    >
      {/* Cover Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={article.cover_image || 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800'}
          alt={article.title}
          className="article-image w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        
        {/* Subject Badge */}
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 text-xs font-medium bg-[#FFB800] text-black rounded-full">
            {article.subject_name}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Author */}
        <div className="flex items-center space-x-2 mb-3">
          {article.author_photo ? (
            <img
              src={article.author_photo}
              alt={article.author_name}
              className="w-6 h-6 rounded-full object-cover"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
              <User size={12} className="text-white/60" />
            </div>
          )}
          <span className="text-white/60 text-sm">{article.author_name}</span>
        </div>

        {/* Title */}
        <h3 className="text-white font-semibold text-lg mb-2 line-clamp-2 group-hover:text-[#FFB800] transition-colors">
          {article.title}
        </h3>

        {/* Excerpt */}
        <p className="text-white/50 text-sm line-clamp-2 mb-4">
          {article.excerpt}
        </p>

        {/* Stats */}
        <div className="flex items-center justify-between text-white/40 text-sm">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <Eye size={14} />
              <span>{formatNumber(article.view_count)}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Heart size={14} />
              <span>{formatNumber(article.like_count)}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Bookmark size={14} />
              <span>{formatNumber(article.bookmark_count)}</span>
            </span>
          </div>
          <span className="flex items-center space-x-1">
            <Clock size={14} />
            <span>{article.reading_time} min</span>
          </span>
        </div>

        {/* Actions */}
        <div className="mt-4 pt-4 border-t border-white/5 flex space-x-3">
          <Link
            to={`/article/${article.slug || article.article_id}`}
            data-testid={`read-article-${article.article_id}`}
            className="flex-1 btn-primary text-center text-sm py-2"
          >
            Read
          </Link>
          <Link
            to={`/educator/${article.educator_id}`}
            data-testid={`view-author-${article.article_id}`}
            className="flex-1 btn-secondary text-center text-sm py-2"
          >
            Author
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default ArticleCard;
