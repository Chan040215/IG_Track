import React, { useRef, useEffect } from 'react';
import { 
  X, 
  Settings, 
  Palette, 
  SlidersHorizontal, 
  ShieldCheck, 
  Database, 
  Check, 
  Play, 
  Globe, 
  RefreshCw, 
  Terminal, 
  RotateCcw, 
  LogOut, 
  User 
} from 'lucide-react';

export default function SettingsModal({
  show,
  onClose,
  activeSettingsTab,
  setActiveSettingsTab,
  settings,
  updateSetting,
  resetSettings,
  serverStatus,
  manualCookie,
  setManualCookie,
  handleSaveCookie,
  handleAutoLogin,
  customApiUrl,
  setCustomApiUrl,
  handleTestApiConnection,
  handleSaveApiUrl,
  isTestingApi,
  apiTestStatus,
  showLogs,
  setShowLogs,
  usersList = [],
  historyFiles = [],
  currentUser,
  onLogout,
  t,
  lang,
  API_BASE
}) {
  const logsEndRef = useRef(null);

  useEffect(() => {
    if (showLogs && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [showLogs, serverStatus?.task?.logs]);

  if (!show) return null;

  return (
    <div className="ig-modal-overlay" onClick={onClose}>
      <div className="ig-modal-box settings-modal-box" onClick={e => e.stopPropagation()}>
        <div className="ig-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Settings size={18} color="#0095f6" />
            <span className="ig-modal-title">{t('modal_settings_title')}</span>
          </div>
          <button className="ig-modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* 四大分类切换标签 */}
        <div className="settings-tabs-header">
          <button 
            className={`settings-tab-btn ${activeSettingsTab === 'appearance' ? 'active' : ''}`}
            onClick={() => setActiveSettingsTab('appearance')}
          >
            <Palette size={14} />
            <span>{t('modal_settings_tab_appearance')}</span>
          </button>
          <button 
            className={`settings-tab-btn ${activeSettingsTab === 'preferences' ? 'active' : ''}`}
            onClick={() => setActiveSettingsTab('preferences')}
          >
            <SlidersHorizontal size={14} />
            <span>{t('modal_settings_tab_preferences')}</span>
          </button>
          <button 
            className={`settings-tab-btn ${activeSettingsTab === 'account' ? 'active' : ''}`}
            onClick={() => setActiveSettingsTab('account')}
          >
            <ShieldCheck size={14} />
            <span>{t('modal_settings_tab_account')}</span>
          </button>
          <button 
            className={`settings-tab-btn ${activeSettingsTab === 'storage' ? 'active' : ''}`}
            onClick={() => setActiveSettingsTab('storage')}
          >
            <Database size={14} />
            <span>{t('modal_settings_tab_storage')}</span>
          </button>
        </div>

        <div className="ig-modal-body" style={{ maxHeight: '68vh', overflowY: 'auto' }}>
          {/* 分类 1: 显示与排版 */}
          {activeSettingsTab === 'appearance' && (
            <div>
              {/* 列表显示密度 */}
              <div className="settings-section-card">
                <div className="settings-card-title">{t('settings_density_title')}</div>
                <p className="settings-card-desc">{t('settings_density_desc')}</p>
                <div className="settings-options-grid">
                  <div 
                    className={`settings-option-card ${settings.listDensity === 'compact' ? 'active' : ''}`}
                    onClick={() => updateSetting('listDensity', 'compact')}
                  >
                    <div className="settings-option-title">
                      <span>{t('settings_density_compact')}</span>
                      {settings.listDensity === 'compact' && <Check size={14} color="#0095f6" />}
                    </div>
                    <div className="settings-option-sub">{t('settings_density_compact_sub')}</div>
                  </div>

                  <div 
                    className={`settings-option-card ${settings.listDensity === 'comfortable' ? 'active' : ''}`}
                    onClick={() => updateSetting('listDensity', 'comfortable')}
                  >
                    <div className="settings-option-title">
                      <span>{t('settings_density_comfortable')}</span>
                      {settings.listDensity === 'comfortable' && <Check size={14} color="#0095f6" />}
                    </div>
                    <div className="settings-option-sub">{t('settings_density_comfortable_sub')}</div>
                  </div>

                  <div 
                    className={`settings-option-card ${settings.listDensity === 'large' ? 'active' : ''}`}
                    onClick={() => updateSetting('listDensity', 'large')}
                  >
                    <div className="settings-option-title">
                      <span>{t('settings_density_large')}</span>
                      {settings.listDensity === 'large' && <Check size={14} color="#0095f6" />}
                    </div>
                    <div className="settings-option-sub">{t('settings_density_large_sub')}</div>
                  </div>
                </div>
              </div>

              {/* 快拍画廊卡片尺寸 */}
              <div className="settings-section-card">
                <div className="settings-card-title">{t('settings_stories_size_title')}</div>
                <p className="settings-card-desc">{t('settings_stories_size_desc')}</p>
                <div className="settings-options-grid">
                  <div 
                    className={`settings-option-card ${settings.storiesSize === 'standard' ? 'active' : ''}`}
                    onClick={() => updateSetting('storiesSize', 'standard')}
                  >
                    <div className="settings-option-title">
                      <span>{t('settings_stories_standard')}</span>
                      {settings.storiesSize === 'standard' && <Check size={14} color="#0095f6" />}
                    </div>
                    <div className="settings-option-sub">{lang === 'zh' ? '适合笔记本与常规屏幕' : 'Balanced for laptops'}</div>
                  </div>

                  <div 
                    className={`settings-option-card ${settings.storiesSize === 'large' ? 'active' : ''}`}
                    onClick={() => updateSetting('storiesSize', 'large')}
                  >
                    <div className="settings-option-title">
                      <span>{t('settings_stories_large')}</span>
                      {settings.storiesSize === 'large' && <Check size={14} color="#0095f6" />}
                    </div>
                    <div className="settings-option-sub">{lang === 'zh' ? '大屏沉浸高清视觉' : 'Immersive large view'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 分类 2: 通用偏好 */}
          {activeSettingsTab === 'preferences' && (
            <div>
              {/* 全局时间制式 */}
              <div className="settings-section-card">
                <div className="settings-card-title">{t('settings_time_format_title')}</div>
                <p className="settings-card-desc">{t('settings_time_format_desc')}</p>
                <div className="settings-options-grid">
                  <div 
                    className={`settings-option-card ${settings.timeFormat === '12h' ? 'active' : ''}`}
                    onClick={() => updateSetting('timeFormat', '12h')}
                  >
                    <div className="settings-option-title">
                      <span>{t('settings_time_12h')}</span>
                      {settings.timeFormat === '12h' && <Check size={14} color="#0095f6" />}
                    </div>
                    <div className="settings-option-sub">{lang === 'zh' ? '格式: 2026-10-27 10:45 PM' : 'e.g. 10:45 PM'}</div>
                  </div>

                  <div 
                    className={`settings-option-card ${settings.timeFormat === '24h' ? 'active' : ''}`}
                    onClick={() => updateSetting('timeFormat', '24h')}
                  >
                    <div className="settings-option-title">
                      <span>{t('settings_time_24h')}</span>
                      {settings.timeFormat === '24h' && <Check size={14} color="#0095f6" />}
                    </div>
                    <div className="settings-option-sub">{lang === 'zh' ? '格式: 2026-10-27 22:45' : 'e.g. 22:45'}</div>
                  </div>
                </div>
              </div>

              {/* 默认单页加载条数 */}
              <div className="settings-section-card">
                <div className="settings-card-title">{t('settings_page_size_title')}</div>
                <p className="settings-card-desc">{t('settings_page_size_desc')}</p>
                <div className="settings-options-grid">
                  {[25, 50, 100].map(sz => (
                    <div 
                      key={sz}
                      className={`settings-option-card ${settings.pageSize === sz ? 'active' : ''}`}
                      onClick={() => updateSetting('pageSize', sz)}
                    >
                      <div className="settings-option-title">
                        <span>{t(`settings_page_${sz}`)}</span>
                        {settings.pageSize === sz && <Check size={14} color="#0095f6" />}
                      </div>
                      <div className="settings-option-sub">{lang === 'zh' ? `每次翻页浏览 ${sz} 位用户` : `View ${sz} users per page`}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 变动分析默认起始页 */}
              <div className="settings-section-card">
                <div className="settings-card-title">{t('settings_analysis_default_title')}</div>
                <p className="settings-card-desc">{t('settings_analysis_default_desc')}</p>
                <div className="settings-options-grid">
                  <div 
                    className={`settings-option-card ${settings.analysisDefault === 'following' ? 'active' : ''}`}
                    onClick={() => updateSetting('analysisDefault', 'following')}
                  >
                    <div className="settings-option-title">
                      <span>{t('settings_analysis_following')}</span>
                      {settings.analysisDefault === 'following' && <Check size={14} color="#0095f6" />}
                    </div>
                    <div className="settings-option-sub">{lang === 'zh' ? '优先查看博主关注了谁' : 'Check who creator followed'}</div>
                  </div>

                  <div 
                    className={`settings-option-card ${settings.analysisDefault === 'followers' ? 'active' : ''}`}
                    onClick={() => updateSetting('analysisDefault', 'followers')}
                  >
                    <div className="settings-option-title">
                      <span>{t('settings_analysis_followers')}</span>
                      {settings.analysisDefault === 'followers' && <Check size={14} color="#0095f6" />}
                    </div>
                    <div className="settings-option-sub">{lang === 'zh' ? '优先查看谁关注了博主' : 'Check who followed creator'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 分类 3: 账号与凭证 */}
          {activeSettingsTab === 'account' && (
            <div>
              {/* 当前登录商业账号信息 */}
              {currentUser && (
                <div className="settings-section-card">
                  <div className="settings-card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <User size={15} color="#0095f6" />
                    <span>{lang === 'zh' ? '已登录商业账号' : 'Active Account'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
                    {currentUser.picture ? (
                      <img 
                        src={currentUser.picture} 
                        alt={currentUser.name} 
                        style={{ width: 44, height: 44, borderRadius: '50%' }}
                      />
                    ) : (
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#0095f6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                        {(currentUser.name || 'U')[0].toUpperCase()}
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{currentUser.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--ig-text-secondary)' }}>{currentUser.email}</div>
                      <div style={{ fontSize: 11, color: 'var(--ig-text-muted)', marginTop: 2 }}>ID: {currentUser.id}</div>
                    </div>
                    {onLogout && (
                      <button 
                        className="ig-nav-btn danger" 
                        onClick={onLogout}
                        style={{ color: '#ed4956', borderColor: '#fed7d7' }}
                        title="退出当前登录"
                      >
                        <LogOut size={13} />
                        <span>{lang === 'zh' ? '退出登录' : 'Sign Out'}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* 凭证状态 */}
              <div className="settings-section-card">
                <div className="settings-card-title">{t('modal_settings_cookie_sec')}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                  <span className={`ig-dot ${serverStatus?.has_cookie ? 'online' : 'offline'}`} style={{ width: 10, height: 10 }} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>
                    {serverStatus?.has_cookie 
                      ? (lang === 'zh' ? '系统已持有有效 Instagram 登录凭证' : 'Valid Instagram session cookie is active') 
                      : (lang === 'zh' ? '尚未检测到登录凭证' : 'No session cookie detected')
                    }
                  </span>
                </div>
              </div>

              {/* 方式一: 一键登录 */}
              <div className="settings-section-card">
                <div className="settings-card-title">{t('modal_settings_auto_login')}</div>
                <p className="settings-card-desc">
                  {lang === 'zh'
                    ? '点击后将在本地弹出 Chromium 窗口，在窗口内登录 Instagram 即可自动截获并保存 Cookie。'
                    : 'Launches a browser window locally. Log into Instagram to automatically capture and store your cookie.'
                  }
                </p>
                <button className="ig-nav-btn primary" onClick={handleAutoLogin}>
                  <Play size={13} />
                  <span>{t('modal_settings_auto_login')}</span>
                </button>
              </div>

              {/* 方式二: 手动粘贴 */}
              <div className="settings-section-card">
                <div className="settings-card-title">{t('modal_settings_manual_title')}</div>
                <p className="settings-card-desc">
                  {lang === 'zh'
                    ? '若已在本地浏览器登录，可从 F12 控制台复制整串 Cookie 粘贴到下方保存。'
                    : 'Copy the cookie string from browser dev tools and paste it below.'
                  }
                </p>
                <div className="cookie-input-row">
                  <input 
                    type="text" 
                    className="cookie-input" 
                    placeholder={t('modal_settings_manual_placeholder')} 
                    value={manualCookie}
                    onChange={e => setManualCookie(e.target.value)}
                  />
                  <button className="ig-nav-btn primary" onClick={handleSaveCookie}>
                    {t('modal_settings_save_cookie')}
                  </button>
                </div>
              </div>

              {/* 方式三: Cloudflare Tunnel / 远程后端接口配置 */}
              <div className="settings-section-card">
                <div className="settings-card-title">
                  <Globe size={14} color="#0095f6" />
                  <span>{lang === 'zh' ? 'Cloudflare Tunnel 远程后端服务' : 'Remote Backend / Cloudflare Tunnel'}</span>
                </div>
                <p className="settings-card-desc">
                  {lang === 'zh'
                    ? '当项目前端部署在 Cloudflare Pages 或在手机外网使用时，在此填入运行中的 Cloudflare Tunnel 链接（例如 https://xxxx.trycloudflare.com），即可穿透连接您电脑上的爬虫后端。'
                    : 'When the frontend is deployed on Cloudflare Pages, enter your active Cloudflare Tunnel URL to connect to your local backend.'
                  }
                </p>
                <div className="cookie-input-row">
                  <input 
                    type="text" 
                    className="cookie-input" 
                    placeholder="https://xxxx.trycloudflare.com (留空则使用本机默认)" 
                    value={customApiUrl}
                    onChange={e => {
                      setCustomApiUrl(e.target.value);
                    }}
                  />
                  <button 
                    className="ig-nav-btn secondary" 
                    onClick={() => handleTestApiConnection(customApiUrl)}
                    disabled={isTestingApi}
                    title="测试该后端地址是否可通"
                  >
                    {isTestingApi ? <RefreshCw size={13} className="spinning" /> : <ShieldCheck size={13} />}
                    <span>{lang === 'zh' ? '测试' : 'Test'}</span>
                  </button>
                  <button className="ig-nav-btn primary" onClick={handleSaveApiUrl}>
                    <Check size={13} />
                    <span>{lang === 'zh' ? '保存' : 'Save'}</span>
                  </button>
                </div>

                {apiTestStatus && (
                  <div style={{ marginTop: 8, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, color: apiTestStatus.success ? '#00ba88' : '#ed4956' }}>
                    <span className={`ig-dot ${apiTestStatus.success ? 'online' : 'offline'}`} style={{ width: 8, height: 8 }} />
                    <span style={{ fontWeight: 600 }}>{apiTestStatus.msg}</span>
                  </div>
                )}
                <div style={{ marginTop: 6, fontSize: 11.5, color: 'var(--ig-text-secondary)' }}>
                  {lang === 'zh' ? '当前生效地址: ' : 'Active Base: '} <code>{API_BASE || '(同源/本地)'}</code>
                </div>
              </div>

              {/* 控制台日志 */}
              <div style={{ borderTop: '1px solid var(--ig-border-subtle)', paddingTop: 14 }}>
                <div 
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => setShowLogs(!showLogs)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, color: 'var(--ig-text-secondary)' }}>
                    <Terminal size={14} />
                    <span>{t('modal_settings_logs_sec')}</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--ig-text-muted)' }}>
                    {showLogs ? (lang === 'zh' ? '收起' : 'Hide') : (lang === 'zh' ? '展开' : 'Show')}
                  </span>
                </div>

                {showLogs && (
                  <div className="raw-json-box" style={{ marginTop: 10, maxHeight: 180 }}>
                    {(serverStatus?.task?.logs || []).map((log, i) => (
                      <div key={i} style={{ marginBottom: 3 }}>{log}</div>
                    ))}
                    <div ref={logsEndRef} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 分类 4: 存储与维护 */}
          {activeSettingsTab === 'storage' && (
            <div>
              <div className="settings-section-card">
                <div className="settings-card-title">{t('settings_storage_title')}</div>
                <p className="settings-card-desc">{t('settings_storage_desc')}</p>
                
                <div className="settings-stat-cards">
                  <div className="settings-stat-box">
                    <div className="settings-stat-num">{usersList.length}</div>
                    <div className="settings-stat-label">{t('settings_stat_creators')}</div>
                  </div>
                  <div className="settings-stat-box">
                    <div className="settings-stat-num">{usersList.reduce((acc, u) => acc + (u.stories_count || 0), 0)}</div>
                    <div className="settings-stat-label">{t('settings_stat_stories')}</div>
                  </div>
                  <div className="settings-stat-box">
                    <div className="settings-stat-num">{historyFiles.length}</div>
                    <div className="settings-stat-label">{t('settings_stat_snapshots')}</div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--ig-border-subtle)', paddingTop: 14, marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ig-text)' }}>{t('settings_reset_btn')}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--ig-text-secondary)' }}>
                      {lang === 'zh' ? '将列表大小、时间制式、分页大小重置为出厂预设值' : 'Reset list density, time format, and page size to factory defaults'}
                    </div>
                  </div>
                  <button 
                    className="ig-nav-btn"
                    style={{ color: '#ed4956', borderColor: '#fed7d7' }}
                    onClick={() => {
                      if (window.confirm(t('settings_reset_confirm'))) {
                        resetSettings();
                      }
                    }}
                  >
                    <RotateCcw size={13} />
                    <span>{t('settings_reset_btn')}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
