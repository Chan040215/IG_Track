import React, { useState } from 'react';
import { X, Code, Copy, Check } from 'lucide-react';

export default function InspectModal({ inspectUser, onClose, lang }) {
  const [copied, setCopied] = useState(false);

  if (!inspectUser) return null;

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(JSON.stringify(inspectUser, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {}
  };

  return (
    <div className="ig-modal-overlay" onClick={onClose}>
      <div className="ig-modal-box" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
        <div className="ig-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Code size={16} color="#0095f6" />
            <span className="ig-modal-title">@{inspectUser.username} {lang === 'zh' ? '的完整原始参数' : 'Raw Parameters'}</span>
          </div>
          <button className="ig-modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="ig-modal-body">
          <div style={{ fontSize: 12.5, color: 'var(--ig-text-secondary)', marginBottom: 14, lineHeight: 1.5 }}>
            {lang === 'zh' 
              ? <>由 Instagram 官方接口直接返回，已完整保留 <code>fbid_v2</code>、<code>pk_id</code>、<code>strong_id__</code>、<code>latest_reel_media</code> 等全部参数。</>
              : <>Directly returned from Instagram API, including <code>fbid_v2</code>, <code>pk_id</code>, <code>strong_id__</code>, <code>latest_reel_media</code>, etc.</>
            }
          </div>

          {/* 关键字段速查 */}
          <div className="raw-param-grid">
            <div className="raw-param-item">
              <span className="raw-param-key">fbid_v2</span>
              <span className="raw-param-val">{String(inspectUser.fbid_v2 || '-')}</span>
            </div>
            <div className="raw-param-item">
              <span className="raw-param-key">strong_id__</span>
              <span className="raw-param-val">{String(inspectUser.strong_id__ || inspectUser.pk || '-')}</span>
            </div>
            <div className="raw-param-item">
              <span className="raw-param-key">pk_id</span>
              <span className="raw-param-val">{String(inspectUser.pk_id || inspectUser.pk || '-')}</span>
            </div>
            <div className="raw-param-item">
              <span className="raw-param-key">is_favorite</span>
              <span className="raw-param-val">{inspectUser.is_favorite ? 'true' : 'false'}</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ig-text-secondary)' }}>
              {lang === 'zh' ? '全量原生 JSON 数据:' : 'Full Raw JSON Data:'}
            </span>
            <button 
              className="table-btn-action" 
              onClick={handleCopy}
            >
              {copied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
              <span>{copied ? (lang === 'zh' ? '已复制' : 'Copied') : (lang === 'zh' ? '复制 JSON' : 'Copy JSON')}</span>
            </button>
          </div>

          <pre className="raw-json-box">
            {JSON.stringify(inspectUser, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
