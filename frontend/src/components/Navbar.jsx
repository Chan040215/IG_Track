import React, { useState } from 'react';
import { 
  Flame, 
  Search, 
  Smartphone, 
  Check, 
  Globe, 
  Settings, 
  LogOut 
} from 'lucide-react';
import { sanitizeUsername } from '../utils/api';

export default function Navbar({
  onBackToHome,
  onSearch,
  isStandalone,
  handleInstallClick,
  lang,
  toggleLang,
  serverStatus,
  onOpenSettings,
  currentUser,
  onLogout,
  t
}) {
  const [searchInput, setSearchInput] = useState('');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      const clean = sanitizeUsername(searchInput);
      if (clean && onSearch) {
        onSearch(clean);
        setSearchInput('');
      }
    }
  };

  return (
    <div className="ig-navbar-sticky">
      <header className="ig-navbar">
        <div className="ig-nav-left" onClick={onBackToHome} style={{ cursor: 'pointer' }}>
          <div className="ig-logo-badge">
            <Flame size={20} />
          </div>
          <div>
            <span className="ig-nav-title">Instagram Tracker</span>
          </div>
        </div>

        <div className="ig-nav-center">
          <div className="ig-nav-search">
            <Search size={14} color="#8e8e8e" />
            <input 
              type="text" 
              placeholder={t('nav_search_placeholder')} 
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
        </div>

        <div className="ig-nav-right">
          {/* PWA 手机/桌面微端安装按钮 */}
          <button 
            className={`pwa-install-btn ${isStandalone ? 'installed' : ''}`}
            onClick={handleInstallClick}
            title={isStandalone ? t('pwa_installed_btn') : t('pwa_install_btn')}
          >
            {isStandalone ? <Check size={14} /> : <Smartphone size={14} />}
            <span>{isStandalone ? t('pwa_installed_btn') : t('pwa_install_btn')}</span>
          </button>

          {/* 多语言切换按钮 */}
          <button 
            className="lang-toggle-btn"
            onClick={toggleLang}
            title={t('lang_toggle_title')}
          >
            <Globe size={14} />
            <span>{t('lang_toggle_btn')}</span>
          </button>

          {/* 登录凭证状态 */}
          <div className="ig-status-indicator">
            <span className={`ig-dot ${serverStatus?.has_cookie ? 'online' : 'offline'}`} />
            <span>{serverStatus?.has_cookie ? t('status_ready') : t('status_offline')}</span>
          </div>

          {/* 设置按钮 */}
          <button className="ig-nav-btn" onClick={onOpenSettings}>
            <Settings size={14} />
            <span>{t('nav_settings')}</span>
          </button>

          {/* 用户账号与退出 */}
          {currentUser && (
            <div className="ig-user-badge-nav" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {currentUser.picture ? (
                <img 
                  src={currentUser.picture} 
                  alt={currentUser.name} 
                  style={{ width: 26, height: 26, borderRadius: '50%' }}
                />
              ) : (
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#0095f6', color: '#fff', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {(currentUser.name || 'U')[0].toUpperCase()}
                </div>
              )}
              {onLogout && (
                <button 
                  className="ig-nav-btn" 
                  onClick={onLogout}
                  title={lang === 'zh' ? '退出登录' : 'Sign Out'}
                  style={{ padding: '6px 8px' }}
                >
                  <LogOut size={13} />
                </button>
              )}
            </div>
          )}
        </div>
      </header>
    </div>
  );
}
