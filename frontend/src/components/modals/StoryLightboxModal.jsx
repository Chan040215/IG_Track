import React from 'react';
import { X, AtSign } from 'lucide-react';

export default function StoryLightboxModal({ storyMedia, onClose, t, API_BASE }) {
  if (!storyMedia) return null;

  return (
    <div className="ig-modal-overlay" onClick={onClose}>
      <div 
        className="ig-modal-box" 
        style={{ maxWidth: 640, background: '#000', padding: 16 }} 
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 13, color: '#f3f4f6' }}>{storyMedia.filename}</span>
          <button className="ig-modal-close" style={{ color: '#fff' }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <img 
          src={`${API_BASE}${storyMedia.url}`} 
          alt={storyMedia.filename} 
          style={{ maxWidth: '100%', maxHeight: '74vh', objectFit: 'contain', borderRadius: 8, display: 'block', margin: '0 auto' }} 
        />
        {storyMedia.mentions && storyMedia.mentions.length > 0 && (
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
            <span style={{ fontSize: 11, color: '#9ca3af', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <AtSign size={12} color="#0095f6" /> {t('stories_mentions_label')}:
            </span>
            {storyMedia.mentions.map((m, mIdx) => (
              <a
                key={m.username || mIdx}
                href={`https://www.instagram.com/${m.username}/`}
                target="_blank"
                rel="noreferrer"
                style={{ 
                  fontSize: 12, 
                  color: '#38bdf8', 
                  background: 'rgba(255,255,255,0.12)', 
                  padding: '3px 9px', 
                  borderRadius: 14, 
                  textDecoration: 'none',
                  fontWeight: 600
                }}
              >
                @{m.username} {m.full_name && `(${m.full_name})`}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
