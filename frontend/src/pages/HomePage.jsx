import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Search, 
  ChevronRight, 
  RefreshCw, 
  Trash2, 
  Play, 
  Flame, 
  Layers, 
  X, 
  History 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getAvatarProxyUrl, sanitizeUsername } from '../utils/api';

export default function HomePage() {
  const navigate = useNavigate();
  const { 
    lang, 
    t, 
    formatTime, 
    usersList, 
    searchHistory, 
    addSearchRecord, 
    removeSearchRecord, 
    isScanning, 
    scanMessage, 
    setAvatarModalData, 
    setDeleteModalUser, 
    API_BASE 
  } = useApp();

  const [homeSearchInput, setHomeSearchInput] = useState('');

  const handleHomeSearch = () => {
    const clean = sanitizeUsername(homeSearchInput);
    if (!clean) return;
    addSearchRecord(clean);
    navigate(`/page/profile/${clean}`);
  };

  const handleSelectUser = (username) => {
    const clean = sanitizeUsername(username);
    if (!clean) return;
    addSearchRecord(clean);
    navigate(`/page/profile/${clean}`);
  };

  const query = homeSearchInput.trim().toLowerCase().replace('@', '');
  const displayUsers = query 
    ? usersList.filter(u => u.username.toLowerCase().includes(query))
    : usersList;

  return (
    <main>
      {/* 1. Hero 区域 */}
      <section className="home-hero-section">
        <div className="home-hero-badge">
          <Sparkles size={13} color="#0095f6" />
          <span>{t('home_hero_badge')}</span>
        </div>
        <h1 className="home-hero-title">{t('home_hero_title')}</h1>
        <p className="home-hero-desc">
          {t('home_hero_desc')}
        </p>

        {/* 首页大搜索框 */}
        <div className="home-search-bar">
          <Search size={18} color="#8e8e8e" />
          <input 
            type="text" 
            className="home-search-input"
            placeholder={t('home_search_placeholder')}
            value={homeSearchInput}
            onChange={e => setHomeSearchInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleHomeSearch()}
          />
          <button className="home-search-btn" onClick={handleHomeSearch}>
            {t('home_search_btn')}
          </button>
        </div>

        {/* 快速直达胶囊 */}
        {homeSearchInput.trim() && (
          <div 
            style={{ 
              marginTop: 12, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}
          >
            <div 
              style={{
                padding: '8px 18px',
                borderRadius: 20,
                background: 'rgba(0, 149, 246, 0.08)',
                border: '1px solid rgba(0, 149, 246, 0.25)',
                color: 'var(--ig-primary)',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
              onClick={handleHomeSearch}
            >
              <Search size={14} />
              <span>
                {lang === 'zh' 
                  ? `按回车或点击此处直接直达 @${sanitizeUsername(homeSearchInput)} 专属主页` 
                  : `Press Enter or click to visit @${sanitizeUsername(homeSearchInput)}`}
              </span>
              <ChevronRight size={14} />
            </div>
          </div>
        )}

        {/* 2. 搜索历史标签沉淀 */}
        {searchHistory && searchHistory.length > 0 && (
          <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ig-text-secondary)', marginBottom: 8 }}>
              <History size={13} />
              <span>{lang === 'zh' ? '最近搜索历史 (商业版私密存储):' : 'Recent Searches (Private):'}</span>
              <button 
                onClick={() => removeSearchRecord()}
                style={{ background: 'none', border: 'none', color: 'var(--ig-text-muted)', cursor: 'pointer', fontSize: 11, marginLeft: 8 }}
                title="清空搜索历史"
              >
                {lang === 'zh' ? '清空全部' : 'Clear All'}
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 640 }}>
              {searchHistory.map((item, idx) => (
                <div 
                  key={idx}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 12px',
                    borderRadius: 16,
                    background: 'var(--ig-bg-secondary, rgba(0,0,0,0.04))',
                    border: '1px solid var(--ig-border-subtle, rgba(0,0,0,0.08))',
                    fontSize: 12.5,
                    cursor: 'pointer'
                  }}
                  onClick={() => handleSelectUser(item.query)}
                >
                  <span style={{ fontWeight: 600 }}>@{item.query}</span>
                  <X 
                    size={12} 
                    style={{ color: 'var(--ig-text-muted)', marginLeft: 2 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSearchRecord(item.query);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 3. 全局进行中任务横幅 */}
      {isScanning && (
        <div className="running-task-banner">
          <RefreshCw size={16} className="spin text-cyan" />
          <div className="running-task-pulse" />
          <span className="running-task-msg">{scanMessage}</span>
        </div>
      )}

      {/* 4. 已收录博主卡片展区 */}
      <section>
        <div className="home-users-title-row">
          <h2 className="home-section-title">
            {query ? (lang === 'zh' ? '搜索匹配博主' : 'Search Matches') : t('home_tracked_title')} ({displayUsers.length})
          </h2>
          <span style={{ fontSize: 13, color: 'var(--ig-text-secondary)' }}>
            {query ? (lang === 'zh' ? '在本地已收录库中筛选' : 'Filtered in local archive') : t('home_tracked_sub')}
          </span>
        </div>

        {displayUsers.length > 0 ? (
          <div className="home-users-grid">
            {displayUsers.map((u) => (
              <div 
                key={u.username} 
                className="home-user-card"
                onClick={() => handleSelectUser(u.username)}
              >
                {/* 单个用户快捷删除按钮 */}
                <button 
                  className="home-delete-btn"
                  title={t('home_card_del_tip', { username: u.username })}
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteModalUser(u.username);
                  }}
                >
                  <Trash2 size={13} />
                </button>

                {/* 博主头像展示 */}
                <div 
                  className={`home-avatar-ring ${u.stories_count > 0 ? 'has-story' : 'no-story'}`}
                  title={u.stories_count > 0 ? (lang === 'zh' ? '🔥 24h内有快拍 · 点击预览原图' : '🔥 Has 24h Story · Click to preview') : (u.profile_pic_url ? t('home_card_avatar_tip') : "")}
                  onClick={(e) => {
                    if (u.profile_pic_url) {
                      e.stopPropagation();
                      setAvatarModalData(u);
                    }
                  }}
                >
                  <div className="home-avatar-inner">
                    {u.profile_pic_url ? (
                      <img 
                        src={getAvatarProxyUrl(u.profile_pic_url, API_BASE)} 
                        alt={u.username} 
                        referrerPolicy="no-referrer"
                        className="avatar-img"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : null}
                    <span className="avatar-fallback">{u.username.substring(0, 1).toUpperCase()}</span>
                  </div>
                </div>
                <div className="home-card-username">@{u.username}</div>
                <div className="home-card-sub">
                  {u.last_active ? `${t('home_card_updated')}: ${formatTime(u.last_active)}` : t('home_card_archived')}
                </div>

                <div className="home-card-badges">
                  {u.stories_count > 0 && (
                    <span className="home-pill-badge active-story">
                      🔥 {u.stories_count} {t('home_pill_stories')}
                    </span>
                  )}
                  {(u.following_count > 0 || u.followers_count > 0) && (
                    <span className="home-pill-badge" title={`关注: ${u.following_count} · 粉丝: ${u.followers_count}`}>
                      👥 {u.following_count} / {u.followers_count}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : query ? (
          <div className="clean-empty-box">
            <div className="clean-empty-icon">
              <Search size={24} />
            </div>
            <div className="clean-empty-title">
              {lang === 'zh' ? `本地尚未收录 @${query}` : `Not archived locally yet`}
            </div>
            <div className="clean-empty-text">
              {lang === 'zh' 
                ? '这是新博主账号。点击下方按钮即可直接进入该博主页面，一键开始抓取最新快拍与媒体数据！' 
                : 'This is a new creator. Click below to enter profile and start collecting stories & media!'}
            </div>
            <button 
              className="home-search-btn" 
              style={{ margin: '0 auto', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              onClick={handleHomeSearch}
            >
              <Play size={14} />
              <span>{lang === 'zh' ? `直达 @${query} 主页` : `Go to @${query}`}</span>
            </button>
          </div>
        ) : (
          <div className="clean-empty-box">
            <div className="clean-empty-icon">
              <Flame size={24} />
            </div>
            <div className="clean-empty-title">{t('home_empty_title')}</div>
            <div className="clean-empty-text">
              {t('home_empty_desc')}
            </div>
            <button 
              className="home-search-btn" 
              style={{ margin: '0 auto', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              onClick={() => handleSelectUser('kohyingliew')}
            >
              <Play size={14} />
              <span>{t('home_empty_btn')}</span>
            </button>
          </div>
        )}
      </section>

      {/* 5. 0 基础新手极简指南 */}
      <section className="guide-container">
        <div className="guide-title-row">
          <h3 className="guide-title">{t('guide_title')}</h3>
          <p className="guide-sub">{t('guide_sub')}</p>
        </div>

        <div className="guide-grid">
          <div className="guide-card">
            <div className="guide-card-icon">
              <Search size={20} />
            </div>
            <span className="guide-card-step">{t('guide_step1_badge')}</span>
            <div className="guide-card-title">{t('guide_step1_title')}</div>
            <p className="guide-card-desc">
              {t('guide_step1_desc')}
            </p>
          </div>

          <div className="guide-card">
            <div className="guide-card-icon">
              <Flame size={20} />
            </div>
            <span className="guide-card-step">{t('guide_step2_badge')}</span>
            <div className="guide-card-title">{t('guide_step2_title')}</div>
            <p className="guide-card-desc">
              {t('guide_step2_desc')}
            </p>
          </div>

          <div className="guide-card">
            <div className="guide-card-icon">
              <Layers size={20} />
            </div>
            <span className="guide-card-step">{t('guide_step3_badge')}</span>
            <div className="guide-card-title">{t('guide_step3_title')}</div>
            <p className="guide-card-desc">
              {t('guide_step3_desc')}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
