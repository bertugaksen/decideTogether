import React, { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Star, MapPin } from 'lucide-react';
import { Venue } from '../types.js';

interface VenueCardProps {
  venue: Venue;
  onSwipe: (direction: 'like' | 'pass') => void;
  isTop: boolean;
  exitDirection?: 'left' | 'right' | null;
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80';

export const VenueCard: React.FC<VenueCardProps> = ({
  venue,
  onSwipe,
  isTop,
  exitDirection,
}) => {
  const x = useMotionValue(0);
  const [internalExitDir, setInternalExitDir] = useState<'left' | 'right' | null>(null);

  // Smooth tilt rotation proportional to horizontal drag distance (val * 0.05, 5deg per 100px)
  const rotate = useTransform(x, (val) => val * 0.05);

  // Stamp opacities reveal progressively as user drags past 20px
  const likeOpacity = useTransform(x, [20, 100], [0, 1]);
  const passOpacity = useTransform(x, [-20, -100], [0, 1]);

  const handleDragEnd = (
    _: any,
    info: { offset: { x: number }; velocity: { x: number } }
  ) => {
    const SWIPE_THRESHOLD = 90;
    const VELOCITY_THRESHOLD = 400;

    if (info.offset.x > SWIPE_THRESHOLD || info.velocity.x > VELOCITY_THRESHOLD) {
      setInternalExitDir('right');
      onSwipe('like');
    } else if (info.offset.x < -SWIPE_THRESHOLD || info.velocity.x < -VELOCITY_THRESHOLD) {
      setInternalExitDir('left');
      onSwipe('pass');
    }
  };

  const effectiveExitDirection =
    exitDirection || internalExitDir || (x.get() >= 0 ? 'right' : 'left');

  if (!isTop) {
    // Underneath background preview card (static, slightly scaled for depth)
    return (
      <div
        className="absolute inset-0 rounded-3xl bg-white border border-[#E7E2D9] shadow-2xs overflow-hidden pointer-events-none transition-all duration-200"
        style={{ transform: 'scale(0.96) translateY(12px)', opacity: 0.85 }}
      >
        <img
          src={venue.photoUrl || FALLBACK_IMAGE}
          alt={venue.name}
          draggable={false}
          className="w-full h-3/5 object-cover pointer-events-none"
          onError={(e) => {
            const img = e.currentTarget;
            img.onerror = null;
            img.src = FALLBACK_IMAGE;
          }}
        />
        <div className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#E07A5F] uppercase tracking-wider">
              {venue.category}
            </span>
            <div className="flex items-center gap-1 bg-[#F5F0EB] px-2 py-0.5 rounded-lg text-xs font-bold text-[#1C1917]">
              <Star className="w-3.5 h-3.5 fill-[#E07A5F] text-[#E07A5F]" />
              <span>{venue.rating.toFixed(1)}</span>
            </div>
          </div>
          <h3 className="font-display font-bold text-xl text-[#1C1917] mt-1 truncate">
            {venue.name}
          </h3>
          <div className="flex items-center gap-1 mt-1 text-xs text-[#78716C]">
            <MapPin className="w-3 h-3 shrink-0 text-[#78716C]" />
            <p className="truncate">{venue.address}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="absolute inset-0 rounded-3xl bg-white border border-[#E7E2D9] shadow-xs overflow-hidden cursor-grab active:cursor-grabbing touch-none select-none z-10"
      style={{ x, rotate }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.75}
      dragTransition={{ bounceStiffness: 300, bounceDamping: 20 }}
      onDragEnd={handleDragEnd}
      exit={{
        x: effectiveExitDirection === 'right' ? 800 : -800,
        rotate: effectiveExitDirection === 'right' ? 22 : -22,
        opacity: 0,
        transition: { duration: 0.22, ease: [0.32, 0.72, 0, 1] },
      }}
    >
      {/* LIKE STAMP (Basil Green #2D6A4F) */}
      <motion.div
        style={{ opacity: likeOpacity }}
        className="absolute top-6 left-6 z-20 border-2 border-[#2D6A4F] text-[#2D6A4F] font-bold tracking-widest text-xl px-4 py-1.5 rounded-xl -rotate-12 bg-white/95 pointer-events-none"
      >
        BEĞENDİM
      </motion.div>

      {/* PASS STAMP (Paprika Red #D9381E) */}
      <motion.div
        style={{ opacity: passOpacity }}
        className="absolute top-6 right-6 z-20 border-2 border-[#D9381E] text-[#D9381E] font-bold tracking-widest text-xl px-4 py-1.5 rounded-xl rotate-12 bg-white/95 pointer-events-none"
      >
        PAS
      </motion.div>

      {/* Venue Photo */}
      <div className="relative w-full h-3/5 bg-stone-100">
        <img
          src={venue.photoUrl || FALLBACK_IMAGE}
          alt={venue.name}
          draggable={false}
          className="w-full h-full object-cover pointer-events-none"
          onError={(e) => {
            const img = e.currentTarget;
            img.onerror = null;
            img.src = FALLBACK_IMAGE;
          }}
        />
      </div>

      {/* Venue Editorial Information */}
      <div className="p-5 flex flex-col justify-between h-2/5">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#E07A5F] uppercase tracking-wider">
              {venue.category}
            </span>
            <div className="flex items-center gap-1 bg-[#F5F0EB] px-2 py-0.5 rounded-lg text-xs font-bold text-[#1C1917]">
              <Star className="w-3.5 h-3.5 fill-[#E07A5F] text-[#E07A5F]" />
              <span>{venue.rating.toFixed(1)}</span>
              <span className="text-[#78716C] font-normal">({venue.reviewCount})</span>
            </div>
          </div>
          <h3 className="font-display font-bold text-2xl text-[#1C1917] mt-1.5 leading-snug tracking-tight line-clamp-1">
            {venue.name}
          </h3>
          <div className="flex items-start gap-1 mt-1 text-xs text-[#78716C]">
            <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#78716C]" />
            <p className="line-clamp-2">{venue.address}</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#E7E2D9] text-xs font-medium text-[#78716C]">
          <span>Fiyat: {'₺'.repeat(venue.priceLevel || 2)}</span>
          <span className={venue.isOpenNow ? 'text-[#2D6A4F] font-semibold' : 'text-[#78716C]'}>
            {venue.isOpenNow !== undefined
              ? venue.isOpenNow
                ? '● Açık'
                : '○ Kapalı'
              : '● Açık'}
          </span>
        </div>
      </div>
    </motion.div>
  );
};
