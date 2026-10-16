import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass, ArrowLeft, Home } from 'lucide-react';
import PageTransition from '../components/layout/PageTransition';

export default function NotFound() {
  return (
    <PageTransition>
      <div className="relative min-h-[80vh] flex items-center justify-center overflow-hidden px-4">
        {/* Giant decorative 404 watermark */}
        <div
          className="absolute select-none pointer-events-none font-display font-bold text-center leading-none"
          style={{
            fontSize: 'clamp(140px, 30vw, 360px)',
            color: 'var(--color-gold)',
            opacity: 0.05,
            zIndex: 0,
          }}
        >
          404
        </div>

        <div className="relative z-10 text-center max-w-lg mx-auto py-16">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-16 h-16 mx-auto mb-6 flex items-center justify-center border border-token-2 rounded-full"
            style={{ backgroundColor: 'var(--color-surface)' }}
          >
            <Compass className="w-8 h-8 text-gold animate-spin-slow" />
          </motion.div>

          <span className="text-xs uppercase tracking-[0.3em] text-gold font-semibold block mb-2">
            Wrong Turn
          </span>

          <h1 className="text-4xl md:text-5xl font-display font-medium text-ivory mb-4">
            Lost in the Crowd
          </h1>

          <p className="text-sm md:text-base text-ivory-dim leading-relaxed mb-8">
            This page took a wrong turn somewhere between the box office and the stage. The curtain has fallen on this particular address.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/"
              className="px-6 py-3 bg-surface border border-token text-gold hover:border-gold transition-colors text-xs font-semibold uppercase tracking-widest flex items-center gap-2"
            >
              <Home className="w-4 h-4" /> Home Stage
            </Link>
            <Link
              to="/events"
              className="px-6 py-3 bg-surface-2 border border-token-2 text-ivory hover:text-gold hover:border-gold transition-colors text-xs font-semibold uppercase tracking-widest flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Browse Events
            </Link>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
