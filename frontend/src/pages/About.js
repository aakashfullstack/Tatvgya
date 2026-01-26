import React from 'react';
import { motion } from 'framer-motion';
import { Target, Users, Globe, Award, BookOpen, Lightbulb } from 'lucide-react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';

const About = () => {
  const values = [
    {
      icon: BookOpen,
      title: 'Quality Education',
      description: 'Curated content from expert educators ensuring high-quality learning materials.'
    },
    {
      icon: Users,
      title: 'Community Driven',
      description: 'Building a community where knowledge flows freely between educators and learners.'
    },
    {
      icon: Globe,
      title: 'Accessible to All',
      description: 'Making quality education accessible to students across India, regardless of location.'
    },
    {
      icon: Lightbulb,
      title: 'Innovation',
      description: 'Constantly evolving our platform to provide the best learning experience.'
    }
  ];

  const team = [
    {
      name: 'Dr. Aakash Verma',
      role: 'Founder & CEO',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200'
    },
    {
      name: 'Priya Sharma',
      role: 'Head of Content',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200'
    },
    {
      name: 'Rajesh Kumar',
      role: 'CTO',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200'
    }
  ];

  return (
    <div className="min-h-screen bg-[#050505]">
      <Navigation />

      {/* Hero */}
      <section className="pt-32 pb-20 px-4" data-testid="about-hero">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold text-white mb-6"
          >
            About <span className="text-[#FFB800]">TATVGYA</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-white/60 max-w-2xl mx-auto"
          >
            Unlocking Wisdom, Connecting Minds — A platform dedicated to transforming education in India through quality content and expert guidance.
          </motion.p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 px-4 bg-[#0A0A0A]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center space-x-3 mb-6">
                <Target className="text-[#FFB800]" size={32} />
                <h2 className="text-3xl font-bold text-white">Our Mission</h2>
              </div>
              <p className="text-white/60 text-lg leading-relaxed mb-6">
                TATVGYA was founded with a simple yet powerful mission: to democratize quality education in India. We believe that every student deserves access to expert knowledge, regardless of their geographic or economic circumstances.
              </p>
              <p className="text-white/60 text-lg leading-relaxed">
                Our platform bridges the gap between expert educators and eager learners, creating a vibrant ecosystem where knowledge flows freely and learning never stops.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass-card p-8"
            >
              <Award className="text-[#FFB800] mb-6" size={48} />
              <h3 className="text-2xl font-bold text-white mb-4">Our Impact</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <span className="text-white/60">Articles Published</span>
                  <span className="text-2xl font-bold text-[#FFB800]">100+</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <span className="text-white/60">Expert Educators</span>
                  <span className="text-2xl font-bold text-[#FFB800]">20+</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <span className="text-white/60">Subjects Covered</span>
                  <span className="text-2xl font-bold text-[#FFB800]">8</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Total Views</span>
                  <span className="text-2xl font-bold text-[#FFB800]">200K+</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-white text-center mb-12"
          >
            Our Core Values
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-6 text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#FFB800]/10 flex items-center justify-center mx-auto mb-4">
                  <value.icon className="text-[#FFB800]" size={28} />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{value.title}</h3>
                <p className="text-white/50 text-sm">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 px-4 bg-[#0A0A0A]">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-white text-center mb-4"
          >
            Meet Our Leadership
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-white/60 text-center mb-12 max-w-2xl mx-auto"
          >
            Our team is passionate about education and committed to making TATVGYA the best learning platform in India.
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-6 text-center"
              >
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-24 h-24 rounded-full object-cover mx-auto mb-4 ring-4 ring-[#FFB800]/20"
                />
                <h3 className="text-white font-semibold text-lg mb-1">{member.name}</h3>
                <p className="text-[#FFB800] text-sm">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
