import React, { useEffect, useState } from 'react';
import { motion, useAnimationControls, useMotionValue, useTransform } from 'framer-motion';
import { Star, MapPin } from 'lucide-react';
import { Venue } from '../types.js';

interface VenueCardProps {
  venue: Venue;
  onSwipe: (direction: 'like' | 'pass') => void;
  isTop: boolean;
  triggerSwipe?: 'like' | 'pass' | null;
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80';

const getDistanceText = (venue: Venue): string => {
  if (venue.distanceKm !== undefined && venue.distanceKm !== null) {
    if (venue.distanceKm < 1) {
      return `${Math.round(venue.distanceKm * 1000)}m`;
    }
    return `${venue.distanceKm.toFixed(1)} km`;
  }
  const parts = venue.address.split(',');
  if (parts.length > 1) {
    return parts[parts.length - 1].trim();
  }
  return 'Civarda';
};

const formatReviewCount = (count: number): string => {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return `${count}`;
};

const CardBody: React.FC<{ venue: Venue }> = ({ venue }) => {
  const distanceText = getDistanceText(venue);

  return (
    <>
      {/* 78% Food-First Photo Container */}
      <div className="relative w-full h-[78%] bg-stone-900 overflow-hidden">
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

        {/* Smooth Dark Vignette / Scrim Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#141210]/95 via-[#141210]/40 to-transparent flex flex-col justify-end p-5 select-none pointer-events-none">
          {/* Rating & Distance Badges */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1 bg-[#D97706]/95 backdrop-blur-xs px-2.5 py-1 rounded-lg text-xs font-bold text-white shadow-xs">
              <Star className="w-3.5 h-3.5 fill-white text-white" />
              <span>{venue.rating.toFixed(1)}</span>
              <span className="text-white/80 font-normal">({formatReviewCount(venue.reviewCount)})</span>
            </div>

            <div className="flex items-center gap-1 bg-white/20 backdrop-blur-xs px-2.5 py-1 rounded-lg text-xs font-semibold text-white shadow-xs">
              <MapPin className="w-3 h-3 text-white/90 shrink-0" />
              <span>{distanceText}</span>
            </div>
          </div>

          {/* Large Venue Title directly over photo */}
          <h3 className="font-display font-bold text-2xl text-white leading-tight tracking-tight drop-shadow-xs line-clamp-1">
            {venue.name}
          </h3>
        </div>
      </div>

      {/* 22% Minimalist Editorial Ivory Footer Bar */}
      <div className="h-[22%] bg-[#FAF7F2] px-5 flex items-center justify-between border-t border-[#E7E2D9] text-xs font-medium">
        <span className="text-[#57534E] font-semibold tracking-wide truncate max-w-[200px]">
          {venue.category}
        </span>
        <span
          className={
            venue.isOpenNow !== false
              ? 'flex items-center gap-1.5 font-semibold text-[#2D6A4F]'
              : 'flex items-center gap-1.5 font-semibold text-[#78716C]'
          }
        >
          <span
            className={`w-2 h-2 rounded-full ${
              venue.isOpenNow !== false ? 'bg-[#2D6A4F]' : 'bg-[#78716C]'
            }`}
          />
          {venue.isOpenNow !== false ? 'Açık' : 'Kapalı'}
        </span>
      </div>
    </>
  );
};

export const VenueCard: React.FC<VenueCardProps> = ({
  venue,
  onSwipe,
  isTop,
  triggerSwipe,
}) => {
  const x = useMotionValue(0);
  const controls = useAnimationControls();
  const [isFlying, setIsFlying] = useState(false);

  // Smooth tilt rotation proportional to horizontal drag distance (val * 0.05, 5deg per 100px)
  const rotate = useTransform(x, (val) => val * 0.05);

  // Stamp opacities reveal progressively as user drags past 20px
  const likeOpacity = useTransform(x, [20, 90], [0, 1]);
  const passOpacity = useTransform(x, [-20, -90], [0, 1]);

  const flyAway = async (direction: 'like' | 'pass', velocityX: number = 0) => {
    if (isFlying) return;
    setIsFlying(true);

    const targetX =
      direction === 'like'
        ? Math.max(velocityX * 0.6, 900)
        : Math.min(velocityX * 0.6, -900);
    const targetRotate = direction === 'like' ? 24 : -24;

    await controls.start({
      x: targetX,
      rotate: targetRotate,
      opacity: 0,
      transition: { duration: 0.22, ease: [0.32, 0.72, 0, 1] },
    });

    onSwipe(direction);
  };

  // Trigger flight on programmatic button click (Like / Pass buttons in SwipeDeck)
  useEffect(() => {
    if (triggerSwipe && isTop && !isFlying) {
      flyAway(triggerSwipe);
    }
  }, [triggerSwipe, isTop]);

  // When card transitions from underneath to top card, spring it into view (Tinder deck pop)
  useEffect(() => {
    if (isTop) {
      controls.set({ scale: 0.95, y: 12, opacity: 0.85, x: 0, rotate: 0 });
      controls.start({
        scale: 1,
        y: 0,
        opacity: 1,
        transition: { type: 'spring', stiffness: 350, damping: 25 },
      });
    }
  }, [isTop]);

  const handleDragEnd = (
    _: any,
    info: { offset: { x: number }; velocity: { x: number } }
  ) => {
    if (isFlying) return;

    const SWIPE_THRESHOLD = 80;
    const VELOCITY_THRESHOLD = 300;

    if (info.offset.x > SWIPE_THRESHOLD || info.velocity.x > VELOCITY_THRESHOLD) {
      flyAway('like', info.velocity.x);
    } else if (info.offset.x < -SWIPE_THRESHOLD || info.velocity.x < -VELOCITY_THRESHOLD) {
      flyAway('pass', info.velocity.x);
    } else {
      // User didn't cross threshold - spring smoothly back to center
      controls.start({
        x: 0,
        rotate: 0,
        transition: { type: 'spring', stiffness: 350, damping: 22 },
      });
    }
  };

  if (!isTop) {
    // Underneath background preview card (slightly scaled, springs up when top card leaves)
    return (
      <motion.div
        className="absolute inset-0 rounded-3xl bg-white border border-[#E7E2D9] shadow-2xs overflow-hidden pointer-events-none"
        initial={{ scale: 0.95, y: 12, opacity: 0.85 }}
        animate={{ scale: 0.95, y: 12, opacity: 0.85 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <CardBody venue={venue} />
      </motion.div>
    );
  }

  return (
    <motion.div
      className="absolute inset-0 rounded-3xl bg-white border border-[#E7E2D9] shadow-xs overflow-hidden cursor-grab active:cursor-grabbing touch-none select-none z-10"
      style={{ x, rotate }}
      animate={controls}
      drag={!isFlying ? 'x' : false}
      dragSnapToOrigin={false}
      onDragEnd={handleDragEnd}
    >
      {/* LIKE STAMP (Basil Green #2D6A4F) */}
      <motion.div
        style={{ opacity: likeOpacity }}
        className="absolute top-6 left-6 z-30 border-2 border-[#2D6A4F] text-[#2D6A4F] font-bold tracking-widest text-xl px-4 py-1.5 rounded-xl -rotate-12 bg-white/95 shadow-md pointer-events-none"
      >
        BEĞENDİM
      </motion.div>

      {/* PASS STAMP (Paprika Red #D9381E) */}
      <motion.div
        style={{ opacity: passOpacity }}
        className="absolute top-6 right-6 z-30 border-2 border-[#D9381E] text-[#D9381E] font-bold tracking-widest text-xl px-4 py-1.5 rounded-xl rotate-12 bg-white/95 shadow-md pointer-events-none"
      >
        PAS
      </motion.div>

      <CardBody venue={venue} />
    </motion.div>
  );
};
