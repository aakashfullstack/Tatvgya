import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, X } from 'lucide-react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import ArticleCard from '../components/ArticleCard';
import { getArticles, getSubjects } from '../lib/api';

const Explore = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [articles, setArticles] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    subject: searchParams.get('subject') || '',
    sort: searchParams.get('sort') || 'recent',
  });

  const [showFilters, setShowFilters] = useState(false);

  const fetchArticles = useCallback(async (resetPage = false) => {
    try {
      setLoading(true);
      const currentPage = resetPage ? 1 : page;
      
      const params = {
        page: currentPage,
        limit: 12,
        sort: filters.sort,
      };

      if (filters.subject) params.subject = filters.subject;
      if (filters.search) params.search = filters.search;

      const data = await getArticles(params);
      
      if (resetPage) {
        setArticles(data);
        setPage(1);
      } else {
        setArticles((prev) => [...prev, ...data]);
      }
      
      setHasMore(data.length === 12);
    } catch (error) {
      console.error('Failed to fetch articles:', error);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const data = await getSubjects();
        setSubjects(data);
      } catch (error) {
        console.error('Failed to fetch subjects:', error);
      }
    };
    loadSubjects();
  }, []);

  useEffect(() => {
    fetchArticles(true);
    // Update URL params
    const params = new URLSearchParams();
    if (filters.subject) params.set('subject', filters.subject);
    if (filters.search) params.set('search', filters.search);
    if (filters.sort !== 'recent') params.set('sort', filters.sort);
    setSearchParams(params);
  }, [filters, setSearchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchArticles(true);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ search: '', subject: '', sort: 'recent' });
  };

  const loadMore = () => {
    setPage((prev) => prev + 1);
    fetchArticles(false);
  };

  const activeFilterCount = [filters.search, filters.subject, filters.sort !== 'recent'].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#050505]">
      <Navigation />

      {/* Header */}
      <section className="pt-32 pb-12 px-4" data-testid="explore-header">
        <div className="max-w-7xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-white mb-4"
          >
            Explore Articles
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-white/60 text-lg max-w-2xl"
          >
            Discover educational content across various subjects from our expert educators
          </motion.p>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                <input
                  type="text"
                  placeholder="Search articles, topics, or authors..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  data-testid="search-input"
                  className="input-field pl-12 pr-4 h-14 w-full"
                />
              </div>
            </form>

            {/* Filter Toggle (Mobile) */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              data-testid="toggle-filters"
              className="lg:hidden btn-secondary flex items-center justify-center space-x-2 h-14"
            >
              <Filter size={20} />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 bg-[#FFB800] text-black text-xs font-bold rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Desktop Filters */}
            <div className="hidden lg:flex items-center space-x-4">
              {/* Subject Dropdown */}
              <select
                value={filters.subject}
                onChange={(e) => handleFilterChange('subject', e.target.value)}
                data-testid="subject-filter"
                className="input-field h-14 min-w-[180px]"
              >
                <option value="">All Subjects</option>
                {subjects.map((subject) => (
                  <option key={subject.subject_id} value={subject.slug}>
                    {subject.name}
                  </option>
                ))}
              </select>

              {/* Sort Dropdown */}
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                data-testid="sort-filter"
                className="input-field h-14 min-w-[150px]"
              >
                <option value="recent">Recent</option>
                <option value="trending">Trending</option>
                <option value="views">Most Viewed</option>
                <option value="likes">Most Liked</option>
              </select>

              {/* Clear Filters */}
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  data-testid="clear-filters"
                  className="text-white/60 hover:text-[#FFB800] transition-colors flex items-center space-x-1"
                >
                  <X size={16} />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>

          {/* Mobile Filters */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden mt-4 glass-card p-4 space-y-4"
            >
              <div>
                <label className="block text-white/60 text-sm mb-2">Subject</label>
                <select
                  value={filters.subject}
                  onChange={(e) => handleFilterChange('subject', e.target.value)}
                  className="input-field w-full"
                >
                  <option value="">All Subjects</option>
                  {subjects.map((subject) => (
                    <option key={subject.subject_id} value={subject.slug}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-white/60 text-sm mb-2">Sort By</label>
                <select
                  value={filters.sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  className="input-field w-full"
                >
                  <option value="recent">Recent</option>
                  <option value="trending">Trending</option>
                  <option value="views">Most Viewed</option>
                  <option value="likes">Most Liked</option>
                </select>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={clearFilters}
                  className="flex-1 btn-secondary"
                >
                  Clear
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="flex-1 btn-primary"
                >
                  Apply
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Articles Grid */}
      <section className="pb-24 px-4">
        <div className="max-w-7xl mx-auto">
          {loading && articles.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array(12).fill(0).map((_, i) => (
                <div key={i} className="h-[400px] glass-card skeleton" />
              ))}
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-white/60 text-lg">No articles found matching your criteria.</p>
              <button
                onClick={clearFilters}
                className="mt-4 text-[#FFB800] hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {articles.map((article, index) => (
                  <ArticleCard key={article.article_id} article={article} index={index} />
                ))}
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="text-center mt-12">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    data-testid="load-more-btn"
                    className="btn-secondary"
                  >
                    {loading ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Explore;
