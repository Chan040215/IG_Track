import React from 'react';
import { X, Download, ExternalLink } from 'lucide-react';
import { getAvatarProxyUrl } from '../../utils/api';

export default function AvatarModal({ data, onClose, t, lang, API_BASE }) {
  if (!data) return null;

  return (
    <div className="ig-modal-overlay" onClick={onClose}>
      <div className="ig-modal-box" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div className="ig-modal-header">
          <span className="ig-modal-title">{t('modal_avatar_title')}</span>
          <button className="ig-modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="ig-modal-body">
          <div className="avatar-preview-box">
            <div className="avatar-preview-large-ring">
              <div className="avatar-preview-large-inner">
                {data.profile_pic_url ? (
                  <img 
                    src={getAvatarProxyUrl(data.profile_pic_url, API_BASE)} 
                    alt={data.username} 
                    referrerPolicy="no-referrer"
                    className="avatar-img"
                  />
                ) : (
                  <span>{(data.username || '').substring(0, 1).toUpperCase()}</span>
                )}
              </div>
            </div>

            <div className="avatar-preview-un">@{data.username}</div>
            {data.full_name && (
              <div className="avatar-preview-fn">{data.full_name}</div>
            )}

            {data.profile_pic_url ? (
              <div className="avatar-preview-actions">
                <a 
                  href={`${API_BASE}/api/download_avatar?url=${encodeURIComponent(data.profile_pic_url)}&username=${encodeURIComponent(data.username)}`}
                  className="ig-nav-btn primary"
                  style={{ padding: '8px 16px', textDecoration: 'none' }}
                  download={`${data.username}_avatar.jpg`}
                >
                  <Download size={14} />
                  <span>{t('modal_avatar_download')}</span>
                </a>
                <a 
                  href={data.profile_pic_url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="ig-nav-btn"
                  style={{ padding: '8px 14px', textDecoration: 'none' }}
                >
                  <ExternalLink size={13} />
                  <span>{t('modal_avatar_open_tab')}</span>
                </a>
              </div>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--ig-text-muted)' }}>
                {lang === 'zh' ? '暂无该博主的在线高清头像 URL' : 'No avatar URL available'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
