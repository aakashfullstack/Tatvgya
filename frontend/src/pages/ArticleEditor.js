import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Send, AlertCircle } from 'lucide-react';
import Navigation from '../components/Navigation';
import { useAuth } from '../context/AuthContext';
import { getMyProfile, createArticle, getSubjects } from '../lib/api';
import { Toaster, toast } from 'sonner';

const ArticleEditor = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // For editing
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [subjects, setSubjects] = useState([]);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    cover_image: '',
    subject_id: '',
    tags: '',
    originality_confirmed: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileData, subjectsData] = await Promise.all([
          getMyProfile(),
          getSubjects()
        ]);
        setProfile(profileData);
        setSubjects(subjectsData);
        
        // Filter subjects to only show ones educator is assigned to
        if (profileData.subjects && profileData.subjects.length > 0) {
          setFormData(prev => ({
            ...prev,
            subject_id: profileData.subjects[0].subject_id
          }));
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast.error('Failed to load data');
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (status) => {
    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    if (!formData.content.trim()) {
      toast.error('Please enter content');
      return;
    }
    if (!formData.subject_id) {
      toast.error('Please select a subject');
      return;
    }
    if (status === 'pending' && !formData.originality_confirmed) {
      toast.error('Please confirm content originality');
      return;
    }

    setLoading(true);
    try {
      const articleData = {
        title: formData.title,
        content: formData.content,
        excerpt: formData.excerpt || formData.content.substring(0, 200),
        cover_image: formData.cover_image || null,
        subject_id: formData.subject_id,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        status,
        originality_confirmed: formData.originality_confirmed,
      };

      const result = await createArticle(articleData);
      
      if (result.is_flagged) {
        toast.warning(`Article created but flagged: ${result.moderation_note}`);
      } else {
        toast.success(status === 'pending' ? 'Article submitted for review' : 'Draft saved');
      }
      
      navigate('/educator');
    } catch (error) {
      toast.error(error.message || 'Failed to save article');
    } finally {
      setLoading(false);
    }
  };

  // Filter subjects to only show assigned ones
  const availableSubjects = subjects.filter(
    s => profile?.subjects?.some(ps => ps.subject_id === s.subject_id)
  );

  return (
    <div className="min-h-screen bg-[#050505]">
      <Toaster position="top-center" theme="dark" />
      <Navigation />

      <div className="pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Back</span>
            </button>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleSubmit('draft')}
                disabled={loading}
                className="btn-secondary flex items-center space-x-2"
              >
                <Save size={18} />
                <span>Save Draft</span>
              </button>
              <button
                onClick={() => handleSubmit('pending')}
                disabled={loading}
                className="btn-primary flex items-center space-x-2"
              >
                <Send size={18} />
                <span>Submit for Review</span>
              </button>
            </div>
          </div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Title */}
            <div>
              <label className="block text-white/60 text-sm mb-2">Article Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter a compelling title..."
                data-testid="article-title-input"
                className="input-field text-xl font-semibold"
              />
            </div>

            {/* Subject */}
            <div>
              <label className="block text-white/60 text-sm mb-2">Subject *</label>
              <select
                name="subject_id"
                value={formData.subject_id}
                onChange={handleChange}
                data-testid="article-subject-select"
                className="input-field"
              >
                <option value="">Select a subject</option>
                {availableSubjects.map(subject => (
                  <option key={subject.subject_id} value={subject.subject_id}>
                    {subject.name}
                  </option>
                ))}
              </select>
              {profile && availableSubjects.length === 0 && (
                <p className="text-yellow-500 text-sm mt-2 flex items-center space-x-1">
                  <AlertCircle size={14} />
                  <span>No subjects assigned. Contact admin.</span>
                </p>
              )}
            </div>

            {/* Cover Image */}
            <div>
              <label className="block text-white/60 text-sm mb-2">Cover Image URL</label>
              <input
                type="url"
                name="cover_image"
                value={formData.cover_image}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
                data-testid="article-cover-input"
                className="input-field"
              />
              {formData.cover_image && (
                <img
                  src={formData.cover_image}
                  alt="Cover preview"
                  className="mt-4 w-full h-48 object-cover rounded-xl"
                />
              )}
            </div>

            {/* Excerpt */}
            <div>
              <label className="block text-white/60 text-sm mb-2">Excerpt (optional)</label>
              <textarea
                name="excerpt"
                value={formData.excerpt}
                onChange={handleChange}
                placeholder="A brief summary of your article..."
                data-testid="article-excerpt-input"
                className="input-field min-h-[100px] resize-none"
                maxLength={300}
              />
              <p className="text-white/40 text-xs mt-1">{formData.excerpt.length}/300</p>
            </div>

            {/* Content */}
            <div>
              <label className="block text-white/60 text-sm mb-2">Content *</label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="Write your article content here... (HTML supported)"
                data-testid="article-content-input"
                className="input-field min-h-[400px] resize-y font-mono text-sm"
              />
              <p className="text-white/40 text-xs mt-1">
                HTML tags supported: h2, h3, p, ul, ol, li, blockquote, strong, em
              </p>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-white/60 text-sm mb-2">Tags (comma separated)</label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="physics, mechanics, newton"
                data-testid="article-tags-input"
                className="input-field"
              />
            </div>

            {/* Originality Confirmation */}
            <div className="glass-card p-4">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="originality_confirmed"
                  checked={formData.originality_confirmed}
                  onChange={handleChange}
                  data-testid="originality-checkbox"
                  className="mt-1 w-5 h-5 rounded border-white/20 bg-white/5 text-[#FFB800] focus:ring-[#FFB800]/50"
                />
                <div>
                  <span className="text-white font-medium">Content Originality Confirmation</span>
                  <p className="text-white/60 text-sm mt-1">
                    I confirm that this content is original and does not violate any copyright or intellectual property rights. I understand that plagiarized content will be removed.
                  </p>
                </div>
              </label>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ArticleEditor;
