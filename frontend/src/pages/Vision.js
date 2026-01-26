import React from 'react';
import { motion } from 'framer-motion';
import { Compass, Eye, Heart, Rocket, Shield, Zap } from 'lucide-react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';

const Vision = () => {
  const visionPoints = [
    {
      icon: Compass,
      title: 'Guiding Light for Indian Education',
      description: 'To become the premier platform that guides millions of Indian students towards academic excellence and lifelong learning.'
    },
    {
      icon: Heart,
      title: 'Empowering Educators',
      description: 'Creating a sustainable ecosystem where educators can share their expertise, earn recognition, and impact countless lives.'
    },
    {
      icon: Shield,
      title: 'Quality Assurance',
      description: 'Maintaining the highest standards of content quality through rigorous review processes and expert curation.'
    },
    {
      icon: Zap,
      title: 'Innovation in Learning',
      description: 'Continuously evolving with technology to provide immersive, interactive, and effective learning experiences.'
    }
  ];

  const roadmap = [
    {
      phase: 'Phase 1',
      title: 'Foundation',
      status: 'completed',
      items: ['Launch platform', 'Onboard initial educators', 'Create core content library']
    },
    {
      phase: 'Phase 2',
      title: 'Growth',
      status: 'current',
      items: ['Expand subject coverage', 'Mobile app development', 'Community features']
    },
    {
      phase: 'Phase 3',
      title: 'Scale',
      status: 'upcoming',
      items: ['Premium content tiers', 'Live sessions', 'Certification programs']
    },
    {
      phase: 'Phase 4',
      title: 'Excellence',
      status: 'upcoming',
      items: ['Regional language support', 'University partnerships', 'Career guidance integration']
    }
  ];

  return (
    <div className="min-h-screen bg-[#050505]">
      <Navigation />

      {/* Hero */}
      <section className="pt-32 pb-20 px-4" data-testid="vision-hero">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold text-white mb-6"
          >
            Our <span className="text-[#FFB800]">Vision</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-white/60 max-w-3xl mx-auto"
          >
            To revolutionize education in India by creating a seamless bridge between expert knowledge and eager minds, making quality learning accessible to every corner of the nation.
          </motion.p>
        </div>
      </section>

      {/* Vision Statement */}
      <section className="py-20 px-4 bg-[#0A0A0A]">
        <div className="max-w-6xl mx-auto">
          <div className="glass-card p-8 md:p-12">
            <div className="flex items-center space-x-4 mb-8">
              <Eye className="text-[#FFB800]" size={40} />
              <h2 className="text-3xl font-bold text-white">Vision Statement</h2>
            </div>
            <p className="text-xl text-white/70 leading-relaxed mb-8">
              "We envision a future where every student in India has access to world-class educational content, personalized learning paths, and guidance from the best educators in the country. TATVGYA will be the catalyst that transforms how knowledge is shared and consumed, breaking down barriers and creating opportunities for millions."
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {visionPoints.map((point, index) => (
                <motion.div
                  key={point.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start space-x-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#FFB800]/10 flex items-center justify-center flex-shrink-0">
                    <point.icon className="text-[#FFB800]" size={24} />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">{point.title}</h3>
                    <p className="text-white/50 text-sm">{point.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Rocket className="text-[#FFB800]" size={32} />
              <h2 className="text-3xl font-bold text-white">Our Roadmap</h2>
            </div>
            <p className="text-white/60 max-w-2xl mx-auto">
              Our journey towards becoming India's leading educational platform
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {roadmap.map((item, index) => (
              <motion.div
                key={item.phase}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`glass-card p-6 relative ${
                  item.status === 'current' ? 'ring-2 ring-[#FFB800]' : ''
                }`}
              >
                {item.status === 'current' && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#FFB800] text-black text-xs font-bold rounded-full">
                    CURRENT
                  </div>
                )}
                <div className="text-[#FFB800] text-sm font-medium mb-2">{item.phase}</div>
                <h3 className="text-white font-bold text-xl mb-4">{item.title}</h3>
                <ul className="space-y-2">
                  {item.items.map((listItem, i) => (
                    <li key={i} className="flex items-center space-x-2 text-white/60 text-sm">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        item.status === 'completed' ? 'bg-green-500' :
                        item.status === 'current' ? 'bg-[#FFB800]' : 'bg-white/30'
                      }`} />
                      <span>{listItem}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Sanskrit Quote */}
      <section className="py-20 px-4 bg-[#0A0A0A]">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card p-8 md:p-12"
          >
            <p className="text-3xl md:text-4xl text-[#FFB800] font-serif mb-6">
              कर्मण्येवाधिकारस्ते मा फलेषु कदाचन
            </p>
            <p className="text-white/60 text-lg italic mb-4">
              "You have the right to work, but never to the fruit of work."
            </p>
            <p className="text-white/40 text-sm">
              — Bhagavad Gita 2.47
            </p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Vision;
