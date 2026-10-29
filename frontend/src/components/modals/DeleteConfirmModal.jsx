import React from 'react';
import { X, Trash2, RefreshCw } from 'lucide-react';

export default function DeleteConfirmModal({ userToDelete, isDeleting, onClose, onConfirm, t, lang }) {
  if (!userToDelete) return null;

  return (
    <div className="ig-modal-overlay" onClick={() => !isDeleting && onClose()}>
      <div className="ig-modal-box" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <div className="ig-modal-header">
          <span className="ig-modal-title" style={{ color: 'var(--ig-danger)' }}>{t('modal_delete_title')}</span>
          <button className="ig-modal-close" onClick={() => !isDeleting && onClose()}>
            <X size={16} />
          </button>
        </div>

        <div className="ig-modal-body">
          <div className="delete-confirm-box">
            <div className="delete-confirm-icon">
              <Trash2 size={26} />
            </div>
            <h4 className="delete-confirm-title">
              {lang === 'zh' ? `确定彻底删除 @${userToDelete} 吗？` : `Permanently delete all data for @${userToDelete}?`}
            </h4>
            <p className="delete-confirm-desc">
              {t('modal_delete_desc', { username: userToDelete })}
            </p>

            <div className="delete-confirm-actions">
              <button 
                className="ig-nav-btn" 
                onClick={onClose}
                disabled={isDeleting}
              >
                {t('modal_delete_cancel')}
              </button>
              <button 
                className="ig-nav-btn danger" 
                style={{ background: 'var(--ig-danger)', color: '#fff', borderColor: 'var(--ig-danger)' }}
                onClick={onConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? <RefreshCw size={13} className="spin" /> : <Trash2 size={13} />}
                <span>{isDeleting ? (lang === 'zh' ? '正在清除...' : 'Deleting...') : t('modal_delete_confirm')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
