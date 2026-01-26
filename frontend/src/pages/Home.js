import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, BookOpen, Users, Eye, FlaskConical, Cpu, Palette, TrendingUp, Globe, Scale, HeartPulse, BookMarked, ChevronLeft, ChevronRight } from 'lucide-react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import ArticleCard from '../components/ArticleCard';
import AnimatedCounter from '../components/AnimatedCounter';
import { getStats, getSubjects, getArticles } from '../lib/api';

const SUBJECT_ICONS = {
  science: FlaskConical,
  technology: Cpu,
  arts: Palette,
  commerce: TrendingUp,
  humanities: Globe,
  law: Scale,
  medicine: HeartPulse,
  others: BookMarked,
};

const Home = () => {
  const [stats, setStats] = useState({ total_articles: 0, total_educators: 0, total_views: 0 });
  const [subjects, setSubjects] = useState([]);
  const [articles, setArticles] = useState([]);
  const [filter, setFilter] = useState('recent');
  const [loading, setLoading] = useState(true);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const navigate = useNavigate();

  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 150]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0.3]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, subjectsData, articlesData] = await Promise.all([
          getStats(),
          getSubjects(),
          getArticles({ limit: 20, sort: filter }),
        ]);
        setStats(statsData);
        setSubjects(subjectsData);
        setArticles(articlesData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filter]);

  const handleFilterChange = async (newFilter) => {
    setFilter(newFilter);
    try {
      const articlesData = await getArticles({ limit: 20, sort: newFilter });
      setArticles(articlesData);
    } catch (error) {
      console.error('Failed to fetch articles:', error);
    }
  };

  const handleSubjectClick = (slug) => {
    navigate(`/explore?subject=${slug}`);
    window.scrollTo(0, 0);
  };

  const handleGetStarted = () => {
    navigate('/explore');
    window.scrollTo(0, 0);
  };

  const nextCarousel = () => {
    setCarouselIndex((prev) => Math.min(prev + 1, Math.max(0, articles.length - 4)));
  };

  const prevCarousel = () => {
    setCarouselIndex((prev) => Math.max(prev - 1, 0));
  };

  return (
    <div className="min-h-screen bg-[#050505]">
      <Navigation />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden" data-testid="hero-section">
        {/* Background Glow */}
        <div className="absolute inset-0 hero-glow" />
        
        {/* Animated Background */}
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="absolute inset-0 pointer-events-none"
        >
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#FFB800]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#F59E0B]/10 rounded-full blur-3xl" />
        </motion.div>

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-[0.2em] md:tracking-[0.3em] mb-8"
            data-testid="hero-title"
          >
            <span className="shine-text">TATVGYA</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl text-[#FFB800] font-medium mb-6"
          >
            Unlocking Wisdom, Connecting Minds
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg text-white/60 max-w-2xl mx-auto mb-10"
          >
            A platform where educators share diverse and trending knowledge, and students discover quality learning tailored to their needs.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={handleGetStarted}
              data-testid="get-started-btn"
              className="btn-primary flex items-center space-x-2 text-lg px-8 py-4"
            >
              <span>Get Started</span>
              <ArrowRight size={20} />
            </button>
            <Link
              to="/about"
              data-testid="learn-more-btn"
              className="btn-secondary text-lg px-8 py-4"
            >
              Learn More
            </Link>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2"
          >
            <motion.div className="w-1.5 h-1.5 bg-white/60 rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      {/* Metrics Section */}
      <section className="py-24 relative" data-testid="metrics-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass-card p-8 text-center"
            >
              <BookOpen className="w-12 h-12 text-[#FFB800] mx-auto mb-4" />
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                <AnimatedCounter end={stats.total_articles} suffix="+" />
              </div>
              <p className="text-white/60">Published Articles</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="glass-card p-8 text-center"
            >
              <Users className="w-12 h-12 text-[#FFB800] mx-auto mb-4" />
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                <AnimatedCounter end={stats.total_educators} suffix="+" />
              </div>
              <p className="text-white/60">Expert Educators</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="glass-card p-8 text-center"
            >
              <Eye className="w-12 h-12 text-[#FFB800] mx-auto mb-4" />
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                <AnimatedCounter end={stats.total_views} suffix="+" />
              </div>
              <p className="text-white/60">Total Views</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Article Carousel Section */}
      <section className="py-24 bg-[#0A0A0A]" data-testid="articles-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Featured Articles
              </h2>
              <p className="text-white/60">
                Discover the latest educational content from our expert educators
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 mt-6 md:mt-0">
              {['recent', 'trending', 'views', 'likes'].map((f) => (
                <button
                  key={f}
                  onClick={() => handleFilterChange(f)}
                  data-testid={`filter-${f}`}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    filter === f
                      ? 'bg-[#FFB800] text-black'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {f === 'views' ? 'Most Viewed' : f === 'likes' ? 'Most Liked' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Carousel */}
          <div className="relative">
            {/* Navigation Arrows */}
            <button
              onClick={prevCarousel}
              disabled={carouselIndex === 0}
              data-testid="carousel-prev"
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-[#FFB800] hover:text-black transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={nextCarousel}
              disabled={carouselIndex >= articles.length - 4}
              data-testid="carousel-next"
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-[#FFB800] hover:text-black transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={24} />
            </button>

            {/* Articles Grid */}
            <div className="overflow-hidden">
              <motion.div
                animate={{ x: -carouselIndex * 320 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="flex gap-6"
              >
                {loading
                  ? Array(8).fill(0).map((_, i) => (
                      <div key={i} className="w-[300px] flex-shrink-0 h-[400px] glass-card skeleton" />
                    ))
                  : articles.map((article, index) => (
                      <div key={article.article_id} className="w-[300px] flex-shrink-0">
                        <ArticleCard article={article} index={index} />
                      </div>
                    ))
                }
              </motion.div>
            </div>
          </div>

          {/* View All Button */}
          <div className="text-center mt-12">
            <button
              onClick={handleGetStarted}
              data-testid="explore-all-btn"
              className="btn-secondary inline-flex items-center space-x-2"
            >
              <span>Explore All Articles</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* Subjects Section */}
      <section className="py-24" data-testid="subjects-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Find content that matches your interests
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Explore articles across various subjects curated by our expert educators
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {subjects.map((subject, index) => {
              const IconComponent = SUBJECT_ICONS[subject.slug] || BookMarked;
              return (
                <motion.button
                  key={subject.subject_id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => handleSubjectClick(subject.slug)}
                  data-testid={`subject-${subject.slug}`}
                  className="glass-card p-6 text-center group cursor-pointer"
                  style={{ '--subject-color': subject.color }}
                >
                  <div
                    className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110"
                    style={{ backgroundColor: `${subject.color}20` }}
                  >
                    <IconComponent
                      size={32}
                      style={{ color: subject.color }}
                    />
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-1 group-hover:text-[#FFB800] transition-colors">
                    {subject.name}
                  </h3>
                  <p className="text-white/40 text-sm">
                    {subject.article_count} articles
                  </p>
                </motion.button>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden" data-testid="cta-section">
        <div className="absolute inset-0 hero-glow" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-white mb-6"
          >
            Ready to Start Your Learning Journey?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-white/60 mb-10"
          >
            Join thousands of Indian students exploring quality educational content
          </motion.p>
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            onClick={handleGetStarted}
            data-testid="cta-get-started"
            className="btn-primary text-lg px-10 py-4 inline-flex items-center space-x-2 animate-pulse-glow"
          >
            <span>Get Started</span>
            <ArrowRight size={20} />
          </motion.button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
