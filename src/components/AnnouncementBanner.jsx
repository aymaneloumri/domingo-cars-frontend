import React, { useState, useEffect } from 'react';

export default function AnnouncementBanner({ announcements }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (announcements.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent(c => (c + 1) % announcements.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [announcements.length]);

  if (!announcements.length) return null;

  const ann = announcements[current];

  return (
    <div className="flex items-center gap-4 px-4 md:px-8 overflow-hidden">
      <span className="flex-shrink-0 bg-[#FF6B00] text-white text-xs font-heading px-3 py-1 tracking-widest uppercase">
        Annonce
      </span>
      <div className="flex-1 overflow-hidden">
        <p className="font-body text-sm text-white">
          <span className="font-semibold text-[#FF6B00]">{ann.title}</span>
          {' — '}
          {ann.message}
        </p>
      </div>
      {announcements.length > 1 && (
        <div className="flex gap-1 flex-shrink-0">
          {announcements.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${i === current ? 'bg-[#FF6B00]' : 'bg-[#444]'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
