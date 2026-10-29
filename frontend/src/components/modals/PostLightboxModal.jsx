import React, { useRef, useState, useEffect } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ChevronUp, 
  ChevronDown, 
  Volume2, 
  VolumeX, 
  Disc, 
  Heart, 
  MessageCircle, 
  RefreshCw, 
  Tag, 
  CheckCircle2, 
  Lock, 
  ExternalLink, 
  Download, 
  Music, 
  Repeat, 
  Search 
} from 'lucide-react';
import { getAvatarProxyUrl } from '../../utils/api';

export default function PostLightboxModal({
  selectedPostModal,
  onClose,
  selectedUser,
  postInteractions,
  fetchPostInteractions,
  isRefreshingInteractions,
  t,
  lang,
  API_BASE
}) {
  const [carouselSlideIndex, setCarouselSlideIndex] = useState(0);
  const [lightboxActiveTab, setLightboxActiveTab] = useState('comments');
  const [likersSearchQuery, setLikersSearchQuery] = useState('');
  const [isPostAudioPlaying, setIsPostAudioPlaying] = useState(false);
  const [expandedCommentReplies, setExpandedCommentReplies] = useState({});
  const postAudioRef = useRef(null);
  const postCarouselTouchRef = useRef({ startX: 0, startY: 0, startTime: 0 });

  useEffect(() => {
    if (selectedPostModal) {
      setCarouselSlideIndex(0);
      setLightboxActiveTab('comments');
      setLikersSearchQuery('');
      setExpandedCommentReplies({});
      const targetUser = selectedPostModal.author?.username || selectedUser;
      const codeOrPk = selectedPostModal.code || selectedPostModal.pk;
      if (codeOrPk && fetchPostInteractions) {
        fetchPostInteractions(targetUser, String(codeOrPk), false);
      }
    }
  }, [selectedPostModal]);

  useEffect(() => {
    if (!selectedPostModal) {
      if (postAudioRef.current) {
        postAudioRef.current.pause();
        postAudioRef.current.currentTime = 0;
      }
      setIsPostAudioPlaying(false);
      return;
    }

    const music = selectedPostModal.music;
    const isVid = selectedPostModal.is_video || selectedPostModal.video_url;
    if (music?.has_audio && music?.audio_url && !isVid) {
      const timer = setTimeout(() => {
        if (postAudioRef.current) {
          postAudioRef.current.play()
            .then(() => setIsPostAudioPlaying(true))
            .catch(() => setIsPostAudioPlaying(false));
        }
      }, 350);
      return () => clearTimeout(timer);
    } else {
      if (postAudioRef.current) {
        postAudioRef.current.pause();
      }
      setIsPostAudioPlaying(false);
    }
  }, [selectedPostModal]);

  useEffect(() => {
    if (!selectedPostModal?.carousel_media?.length || !postAudioRef.current) return;
    const currentSlide = selectedPostModal.carousel_media[carouselSlideIndex] || selectedPostModal.carousel_media[0];
    const isSlideVideo = currentSlide?.media_type === 2 || (currentSlide?.video_versions && currentSlide.video_versions.length > 0) || currentSlide?.video_url;
    if (isSlideVideo) {
      postAudioRef.current.pause();
      setIsPostAudioPlaying(false);
    }
  }, [carouselSlideIndex, selectedPostModal]);

  if (!selectedPostModal) return null;

  const togglePostAudio = () => {
    if (!postAudioRef.current) return;
    if (isPostAudioPlaying) {
      postAudioRef.current.pause();
      setIsPostAudioPlaying(false);
    } else {
      postAudioRef.current.play()
        .then(() => setIsPostAudioPlaying(true))
        .catch(() => setIsPostAudioPlaying(false));
    }
  };

  const toggleCommentReplies = (commentId) => {
    setExpandedCommentReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  const handlePostCarouselTouchStart = (e) => {
    if (e.touches && e.touches.length === 1) {
      postCarouselTouchRef.current = {
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        startTime: Date.now()
      };
    }
  };

  const handlePostCarouselTouchEnd = (e) => {
    if (!postCarouselTouchRef.current.startTime) return;
    if (!e.changedTouches || e.changedTouches.length === 0) return;

    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const deltaX = endX - postCarouselTouchRef.current.startX;
    const deltaY = endY - postCarouselTouchRef.current.startY;
    const deltaTime = Date.now() - postCarouselTouchRef.current.startTime;

    postCarouselTouchRef.current = { startX: 0, startY: 0, startTime: 0 };

    if (Math.abs(deltaX) > 30 && Math.abs(deltaX) > Math.abs(deltaY) * 1.15 && deltaTime < 650) {
      if (deltaX < 0) {
        if (selectedPostModal?.carousel_media && carouselSlideIndex < selectedPostModal.carousel_media.length - 1) {
          setCarouselSlideIndex(prev => prev + 1);
        }
      } else {
        if (selectedPostModal?.carousel_media && carouselSlideIndex > 0) {
          setCarouselSlideIndex(prev => prev - 1);
        }
      }
    }
  };

  const postKey = String(selectedPostModal.code || selectedPostModal.pk || '');
  const currentInteractions = postInteractions[postKey] || {};
  const displayLikeCount = currentInteractions.total_likers_count ?? selectedPostModal.like_count ?? 0;
  const displayCommentCount = currentInteractions.comments_count ?? selectedPostModal.comment_count ?? 0;
  const authorUsername = selectedPostModal.author?.username || selectedUser;
  const isCarousel = selectedPostModal.carousel_media && selectedPostModal.carousel_media.length > 0;

  let dlUrl = selectedPostModal.video_url || selectedPostModal.image_url || selectedPostModal.display_url;
  if (isCarousel) {
    const currentSlide = selectedPostModal.carousel_media[carouselSlideIndex] || selectedPostModal.carousel_media[0];
    dlUrl = currentSlide.video_url || currentSlide.video_versions?.[0]?.url || currentSlide.image_url || currentSlide.image_versions2?.candidates?.[0]?.url || dlUrl;
  }
  const downloadName = `${authorUsername}_post_${selectedPostModal.code || selectedPostModal.pk || 'media'}_${carouselSlideIndex + 1}`;

  return (
    <div className="ig-modal-overlay ig-post-lightbox-backdrop" onClick={onClose}>
      <button className="ig-lightbox-close" onClick={onClose} title="关闭 (Esc)">
        <X size={26} />
      </button>

      <div className="ig-post-lightbox-card" onClick={e => e.stopPropagation()}>
        {/* 左侧媒体显示区 */}
        <div 
          className="ig-lightbox-media-container"
          onTouchStart={handlePostCarouselTouchStart}
          onTouchEnd={handlePostCarouselTouchEnd}
        >
          {(() => {
            if (isCarousel) {
              const currentSlide = selectedPostModal.carousel_media[carouselSlideIndex] || selectedPostModal.carousel_media[0];
              const isSlideVideo = currentSlide.media_type === 2 || (currentSlide.video_versions && currentSlide.video_versions.length > 0) || currentSlide.video_url;
              const slideVideoUrl = currentSlide.video_url || currentSlide.video_versions?.[0]?.url;
              const slideImgUrl = currentSlide.image_url || currentSlide.image_versions2?.candidates?.[0]?.url;

              return (
                <div 
                  className="ig-carousel-slider-box"
                  onTouchStart={handlePostCarouselTouchStart}
                  onTouchEnd={handlePostCarouselTouchEnd}
                >
                  {isSlideVideo && slideVideoUrl ? (
                    <video 
                      src={slideVideoUrl} 
                      controls 
                      autoPlay 
                      playsInline 
                      className="ig-lightbox-media-player"
                    />
                  ) : (
                    <img 
                      src={getAvatarProxyUrl(slideImgUrl, API_BASE)} 
                      alt="Slide" 
                      className="ig-lightbox-media-img"
                      draggable="false"
                    />
                  )}

                  {carouselSlideIndex > 0 && (
                    <button 
                      className="ig-carousel-nav prev"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCarouselSlideIndex(carouselSlideIndex - 1);
                      }}
                    >
                      <ChevronLeft size={20} />
                    </button>
                  )}
                  {carouselSlideIndex < selectedPostModal.carousel_media.length - 1 && (
                    <button 
                      className="ig-carousel-nav next"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCarouselSlideIndex(carouselSlideIndex + 1);
                      }}
                    >
                      <ChevronRight size={20} />
                    </button>
                  )}

                  <div className="ig-carousel-dots">
                    {selectedPostModal.carousel_media.map((_, dotIdx) => (
                      <span 
                        key={dotIdx} 
                        className={`ig-dot-indicator ${dotIdx === carouselSlideIndex ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCarouselSlideIndex(dotIdx);
                        }}
                      />
                    ))}
                  </div>
                </div>
              );
            }

            if (selectedPostModal.is_video || selectedPostModal.video_url) {
              return (
                <video 
                  src={selectedPostModal.video_url} 
                  controls 
                  autoPlay 
                  playsInline 
                  className="ig-lightbox-media-player"
                />
              );
            }

            return (
              <img 
                src={getAvatarProxyUrl(selectedPostModal.image_url || selectedPostModal.display_url, API_BASE)} 
                alt={selectedPostModal.caption || 'Post'} 
                className="ig-lightbox-media-img"
              />
            );
          })()}

          {selectedPostModal.music?.has_audio && selectedPostModal.music?.audio_url && (
            <audio 
              ref={postAudioRef} 
              src={selectedPostModal.music.audio_url} 
              loop 
              onPlay={() => setIsPostAudioPlaying(true)}
              onPause={() => setIsPostAudioPlaying(false)}
              onEnded={() => setIsPostAudioPlaying(false)}
            />
          )}

          {selectedPostModal.music?.has_audio && selectedPostModal.music?.audio_url && !(selectedPostModal.is_video || selectedPostModal.video_url) && (
            <button 
              type="button"
              className={`ig-lightbox-audio-float-btn ${isPostAudioPlaying ? 'playing' : 'muted'}`}
              onClick={(e) => {
                e.stopPropagation();
                togglePostAudio();
              }}
              title={isPostAudioPlaying ? t('sound_toggle_mute') : t('sound_toggle_unmute')}
            >
              {isPostAudioPlaying ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
          )}
        </div>

        {/* 右侧信息与互动侧栏 */}
        <div className="ig-lightbox-sidebar">
          {/* 头部: 作者信息与跳转 */}
          <div className="ig-lightbox-author-row">
            <div className="ig-lightbox-author-left">
              <div className="ig-lightbox-avatar-ring">
                {selectedPostModal.author?.profile_pic_url ? (
                  <img 
                    src={getAvatarProxyUrl(selectedPostModal.author.profile_pic_url, API_BASE)} 
                    alt={authorUsername} 
                    className="ig-lightbox-avatar-img"
                  />
                ) : (
                  <span>{authorUsername.substring(0, 1).toUpperCase()}</span>
                )}
              </div>
              <div className="ig-lightbox-author-names">
                <a 
                  href={`https://www.instagram.com/${authorUsername}/`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="ig-lightbox-username"
                >
                  @{authorUsername}
                </a>
                {selectedPostModal.reposted_by && (
                  <span className="ig-lightbox-repost-tag">
                    <Repeat size={10} /> {lang === 'zh' ? '转帖自他人' : 'Repost'}
                  </span>
                )}
              </div>
            </div>

            <a 
              href={`https://www.instagram.com/p/${selectedPostModal.code || selectedPostModal.shortcode || ''}/`} 
              target="_blank" 
              rel="noreferrer" 
              className="ig-lightbox-visit-btn"
              title={t('view_post_on_ig')}
            >
              <ExternalLink size={14} />
            </a>
          </div>

          {/* 官方风格音乐音轨栏 */}
          {selectedPostModal.music?.has_audio && (
            <div 
              className={`ig-post-music-bar ${isPostAudioPlaying ? 'playing' : ''}`}
              onClick={togglePostAudio}
              title={isPostAudioPlaying ? t('sound_toggle_mute') : t('sound_toggle_unmute')}
            >
              <div className="music-bar-left">
                <div className={`music-disc ${isPostAudioPlaying ? 'spinning' : ''}`}>
                  <Disc size={15} />
                </div>
                <div className="music-details">
                  <span className="music-title">{selectedPostModal.music.title || 'Original Audio'}</span>
                  {selectedPostModal.music.artist && (
                    <span className="music-artist"> · {selectedPostModal.music.artist}</span>
                  )}
                </div>
              </div>
              <div className="music-bar-right">
                <div className={`music-equalizer ${isPostAudioPlaying ? 'active' : ''}`}>
                  <span className="eq-bar bar-1"></span>
                  <span className="eq-bar bar-2"></span>
                  <span className="eq-bar bar-3"></span>
                  <span className="eq-bar bar-4"></span>
                </div>
                <button className="music-play-toggle" type="button" aria-label="Toggle Audio">
                  {isPostAudioPlaying ? <Volume2 size={14} /> : <VolumeX size={14} />}
                </button>
              </div>
            </div>
          )}

          {/* 选项卡切换: 评论 与 点赞者 */}
          <div className="ig-lightbox-tabs-bar">
            <button 
              type="button"
              className={`ig-lightbox-tab-btn ${lightboxActiveTab === 'comments' ? 'active' : ''}`}
              onClick={() => setLightboxActiveTab('comments')}
            >
              <MessageCircle size={14} />
              <span>{t('modal_tab_comments')}</span>
              <span className="ig-tab-pill-badge">{displayCommentCount}</span>
            </button>

            <button 
              type="button"
              className={`ig-lightbox-tab-btn ${lightboxActiveTab === 'likers' ? 'active' : ''}`}
              onClick={() => setLightboxActiveTab('likers')}
            >
              <Heart size={14} fill={lightboxActiveTab === 'likers' ? '#ed4956' : 'none'} color={lightboxActiveTab === 'likers' ? '#ed4956' : 'currentColor'} />
              <span>{t('modal_tab_likers')}</span>
              <span className="ig-tab-pill-badge">{displayLikeCount}</span>
            </button>

            <button 
              type="button"
              className={`ig-lightbox-refresh-btn ${isRefreshingInteractions || currentInteractions.loading ? 'spinning' : ''}`}
              onClick={() => fetchPostInteractions(authorUsername, postKey, true)}
              title={t('modal_refresh_interactions')}
              disabled={isRefreshingInteractions || currentInteractions.loading}
            >
              <RefreshCw size={13} />
            </button>
          </div>

          {/* 主体滚动展示区 */}
          <div className="ig-lightbox-comments-scroll">
            {lightboxActiveTab === 'comments' ? (
              <>
                {selectedPostModal.caption ? (
                  <div className="ig-lightbox-caption-box">
                    <div className="ig-caption-author-bar">
                      <span className="ig-caption-username">@{authorUsername}</span>
                    </div>
                    <div className="ig-caption-text">{selectedPostModal.caption}</div>
                    {selectedPostModal.taken_at_gmt8 && (
                      <div className="ig-caption-time">{selectedPostModal.taken_at_gmt8}</div>
                    )}
                  </div>
                ) : (
                  <div className="ig-caption-empty">{lang === 'zh' ? '该帖子未附带任何正文。' : 'No caption provided.'}</div>
                )}

                {selectedPostModal.tagged_users && selectedPostModal.tagged_users.length > 0 && (
                  <div className="ig-lightbox-tagged-list">
                    <div className="tagged-label"><Tag size={12} /> {lang === 'zh' ? '帖子提及的人:' : 'Tagged Users:'}</div>
                    <div className="tagged-chips">
                      {selectedPostModal.tagged_users.map(u => (
                        <a 
                          key={u.username}
                          href={`https://www.instagram.com/${u.username}/`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="tagged-chip"
                        >
                          @{u.username}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="ig-comments-section-header">
                  <span>{lang === 'zh' ? '公开评论' : 'Public Comments'}</span>
                  {currentInteractions.comments && (
                    <span className="count-tag">{currentInteractions.comments.length}</span>
                  )}
                </div>

                {currentInteractions.loading ? (
                  <div className="ig-lightbox-loading-box">
                    <RefreshCw size={18} className="spinning" />
                    <span>{lang === 'zh' ? '正在同步此帖公开评论与点赞名单...' : 'Fetching comments & likers from Instagram...'}</span>
                  </div>
                ) : currentInteractions.comments && currentInteractions.comments.length > 0 ? (
                  <div className="ig-comments-list-wrapper">
                    {currentInteractions.comments.map(c => (
                      <div key={c.id || Math.random()} className="ig-comment-row">
                        <div className="ig-comment-avatar-ring">
                          {c.user?.profile_pic_url ? (
                            <img 
                              src={getAvatarProxyUrl(c.user.profile_pic_url, API_BASE)} 
                              alt={c.user.username} 
                              className="ig-comment-avatar-img"
                            />
                          ) : (
                            <span className="ig-comment-avatar-placeholder">
                              {(c.user?.username || '?').substring(0, 1).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="ig-comment-main-box">
                          <div className="ig-comment-bubble">
                            <a 
                              href={`https://www.instagram.com/${c.user?.username}/`} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="ig-comment-user-link"
                            >
                              @{c.user?.username}
                            </a>
                            {c.user?.is_verified && <CheckCircle2 size={11} className="verified-badge-mini" />}
                            <span className="ig-comment-text-body">{c.text}</span>
                          </div>
                          <div className="ig-comment-sub-meta">
                            <span className="ig-comment-time">{c.time_display}</span>
                            {c.like_count > 0 && (
                              <span className="ig-comment-likes-pill">
                                <Heart size={10} fill="#ed4956" color="#ed4956" /> {c.like_count}
                              </span>
                            )}
                          </div>

                          {c.child_comments && c.child_comments.length > 0 && (() => {
                            const isExpanded = !!expandedCommentReplies[c.id];
                            const replyCount = c.child_comments.length;

                            return (
                              <div className="ig-comment-replies-wrapper">
                                <button 
                                  type="button"
                                  className="ig-toggle-replies-btn"
                                  onClick={() => toggleCommentReplies(c.id)}
                                >
                                  <span className="ig-reply-line" />
                                  <span className="ig-reply-toggle-text">
                                    {isExpanded 
                                      ? t('modal_hide_replies')
                                      : t('modal_view_replies').replace('{count}', replyCount)}
                                  </span>
                                  {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                </button>

                                {isExpanded && (
                                  <div className="ig-comment-replies-nest">
                                    {c.child_comments.map(cc => (
                                      <div key={cc.id || Math.random()} className="ig-comment-reply-row">
                                        <div className="ig-reply-avatar-ring">
                                          {cc.user?.profile_pic_url ? (
                                            <img 
                                              src={getAvatarProxyUrl(cc.user.profile_pic_url, API_BASE)} 
                                              alt={cc.user.username} 
                                              className="ig-reply-avatar-img"
                                            />
                                          ) : (
                                            <span className="ig-reply-avatar-placeholder">
                                              {(cc.user?.username || '?').substring(0, 1).toUpperCase()}
                                            </span>
                                          )}
                                        </div>
                                        <div className="ig-reply-main-box">
                                          <div className="ig-comment-bubble">
                                            <a 
                                              href={`https://www.instagram.com/${cc.user?.username}/`} 
                                              target="_blank" 
                                              rel="noreferrer" 
                                              className="ig-comment-user-link"
                                            >
                                              @{cc.user?.username}
                                            </a>
                                            {cc.user?.is_verified && <CheckCircle2 size={11} className="verified-badge-mini" />}
                                            <span className="ig-comment-text-body">{cc.text}</span>
                                          </div>
                                          <div className="ig-comment-sub-meta">
                                            <span className="ig-comment-time">{cc.time_display}</span>
                                            {cc.like_count > 0 && (
                                              <span className="ig-comment-likes-pill">
                                                <Heart size={10} fill="#ed4956" color="#ed4956" /> {cc.like_count}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="ig-comments-empty-notice">
                    <MessageCircle size={28} />
                    <p>{t('modal_comments_empty')}</p>
                  </div>
                )}
              </>
            ) : (
              /* 点赞者名单 (Likers Tab) */
              <div className="ig-likers-tab-container">
                <div className="ig-likers-header-box">
                  <div className="ig-likers-search-wrapper">
                    <Search size={14} className="search-icon" />
                    <input 
                      type="text"
                      value={likersSearchQuery}
                      onChange={e => setLikersSearchQuery(e.target.value)}
                      placeholder={t('modal_likers_search_placeholder')}
                      className="ig-likers-search-input"
                    />
                    {likersSearchQuery && (
                      <button type="button" className="clear-btn" onClick={() => setLikersSearchQuery('')}>
                        <X size={12} />
                      </button>
                    )}
                  </div>
                  <div className="ig-likers-count-pill">
                    {t('modal_likers_count_banner')
                      .replace('{fetched}', String(currentInteractions.likers?.length ?? 0))
                      .replace('{total}', String(displayLikeCount))}
                  </div>
                </div>

                {currentInteractions.loading ? (
                  <div className="ig-lightbox-loading-box">
                    <RefreshCw size={18} className="spinning" />
                    <span>{lang === 'zh' ? '正在同步点赞用户名单...' : 'Loading likers...'}</span>
                  </div>
                ) : (
                  (() => {
                    const likers = currentInteractions.likers || [];
                    const filtered = likers.filter(u => {
                      if (!likersSearchQuery.trim()) return true;
                      const q = likersSearchQuery.toLowerCase().trim();
                      return (u.username && u.username.toLowerCase().includes(q)) ||
                             (u.full_name && u.full_name.toLowerCase().includes(q));
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="ig-comments-empty-notice">
                          <Heart size={28} />
                          <p>{likersSearchQuery ? (lang === 'zh' ? '未找到符合搜索条件的用户' : 'No matching users found') : t('modal_likers_empty')}</p>
                        </div>
                      );
                    }

                    return (
                      <div className="ig-likers-cards-list">
                        {filtered.map(u => (
                          <div key={u.id || u.username} className="ig-liker-card-row">
                            <div className="ig-liker-card-left">
                              <div className="ig-liker-avatar-ring">
                                {u.profile_pic_url ? (
                                  <img 
                                    src={getAvatarProxyUrl(u.profile_pic_url, API_BASE)} 
                                    alt={u.username} 
                                    className="ig-liker-avatar-img"
                                  />
                                ) : (
                                  <span className="ig-liker-avatar-placeholder">
                                    {(u.username || '?').substring(0, 1).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div className="ig-liker-info-col">
                                <div className="ig-liker-username-row">
                                  <span className="ig-liker-username-text">@{u.username}</span>
                                  {u.is_verified && <CheckCircle2 size={12} className="verified-badge-mini" />}
                                  {u.is_private && <Lock size={11} className="private-badge-mini" />}
                                </div>
                                {u.full_name && (
                                  <div className="ig-liker-fullname-text">{u.full_name}</div>
                                )}
                              </div>
                            </div>

                            <div className="ig-liker-card-right">
                              <a 
                                href={`https://www.instagram.com/${u.username}/`} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="ig-liker-ig-link"
                                title={t('modal_view_on_ig')}
                              >
                                <ExternalLink size={12} />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()
                )}
              </div>
            )}
          </div>

          {/* 底部点赞、评论数与下载操作 */}
          <div className="ig-lightbox-footer">
            <div className="ig-lightbox-stats-row">
              <button 
                type="button"
                className={`stat-item-btn ${lightboxActiveTab === 'likers' ? 'active' : ''}`}
                onClick={() => setLightboxActiveTab('likers')}
                title={lang === 'zh' ? '点击查看点赞用户名单' : 'Click to view who liked'}
              >
                <Heart size={18} fill="#ed4956" color="#ed4956" />
                <strong>{displayLikeCount}</strong>
                <span>{t('modal_post_likes')}</span>
              </button>

              <button 
                type="button"
                className={`stat-item-btn ${lightboxActiveTab === 'comments' ? 'active' : ''}`}
                onClick={() => setLightboxActiveTab('comments')}
                title={lang === 'zh' ? '点击查看评论' : 'Click to view comments'}
              >
                <MessageCircle size={18} color="var(--ig-text-secondary)" />
                <strong>{displayCommentCount}</strong>
                <span>{t('modal_post_comments')}</span>
              </button>
            </div>

            <div className="ig-lightbox-actions-row">
              <a 
                href={`${API_BASE}/api/download_media?url=${encodeURIComponent(dlUrl)}&filename=${encodeURIComponent(downloadName)}`}
                download
                className="ig-nav-btn primary ig-lightbox-dl-btn"
              >
                <Download size={14} />
                <span>{t('modal_post_download')}</span>
              </a>

              {selectedPostModal.music?.has_audio && selectedPostModal.music?.audio_url && (
                <a 
                  href={`${API_BASE}/api/download_media?url=${encodeURIComponent(selectedPostModal.music.audio_url)}&filename=${encodeURIComponent(`${authorUsername}_audio_${(selectedPostModal.music.title || 'track').replace(/[^a-zA-Z0-9_\-]/g, '_')}.mp3`)}`}
                  download
                  className="ig-nav-btn secondary ig-lightbox-dl-audio-btn"
                  title={t('modal_post_download_music')}
                >
                  <Music size={14} />
                  <span>{t('modal_post_download_music')}</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
