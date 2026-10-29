import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Users,
  UserPlus,
  UserMinus,
  Search,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Lock,
  Globe,
  RefreshCw,
  X,
  Copy,
  Check,
  Flame,
  Code,
  Download,
  CheckCircle2,
  Play,
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
  Film,
  Image as ImageIcon,
  Music,
  Clock,
  Filter,
  ArrowLeft,
  Sparkles,
  Layers,
  ChevronRight,
  ChevronLeft,
  Trash2,
  AtSign,
  Repeat,
  Bookmark,
  MoreHorizontal,
  Tag,
  Volume2,
  VolumeX,
  Disc,
  Grid,
  Heart,
  HelpCircle,
  Share2,
  GitCompare,
  UserCheck,
  MessageCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getAvatarProxyUrl, sanitizeUsername } from '../utils/api';
import { formatRelativeTime } from '../i18n';
import PostLightboxModal from '../components/modals/PostLightboxModal';
import StoryLightboxModal from '../components/modals/StoryLightboxModal';
import HighlightLightboxModal from '../components/modals/HighlightLightboxModal';

// 提及滚动列表与翻页（PC 端的滑动组件）
function MentionsScrollList({ mentions }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const hasOverflow = el.scrollWidth > el.clientWidth + 2;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(hasOverflow && el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  };

  useEffect(() => {
    checkScroll();
    const handleResize = () => checkScroll();
    window.addEventListener('resize', handleResize);
    const timer = setTimeout(checkScroll, 120);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [mentions]);

  const handleScroll = (offset) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
      setTimeout(checkScroll, 300);
    }
  };

  return (
    <div className="clean-mentions-container">
      {canScrollLeft && (
        <button
          type="button"
          className="clean-scroll-nav-btn left"
          onClick={() => handleScroll(-140)}
          title="向左翻看 / Scroll left"
        >
          <ChevronLeft size={11} />
        </button>
      )}
      <div
        ref={scrollRef}
        className="clean-meta-scroll-list"
        onScroll={checkScroll}
        onWheel={(e) => {
          if (scrollRef.current && e.deltaY !== 0) {
            scrollRef.current.scrollLeft += e.deltaY * 0.8;
            checkScroll();
          }
        }}
      >
        {mentions.map((m, mIdx) => (
          <a
            key={m.username || mIdx}
            href={`https://www.instagram.com/${m.username}/`}
            target="_blank"
            rel="noreferrer"
            className="clean-mention-chip"
            title={m.full_name ? `${m.full_name} (@${m.username})` : `@${m.username}`}
          >
            <span>@{m.username}</span>
            {m.full_name && <span className="clean-mention-fn">({m.full_name})</span>}
          </a>
        ))}
      </div>
      {canScrollRight && (
        <button
          type="button"
          className="clean-scroll-nav-btn right"
          onClick={() => handleScroll(140)}
          title="向右翻看 / Scroll right"
        >
          <ChevronRight size={11} />
        </button>
      )}
    </div>
  );
}


export default function ProfilePage() {
  const { username: routeUsername } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { 
    lang, 
    t, 
    settings, 
    formatTime, 
    usersList, 
    fetchUsersList, 
    serverStatus,
    setIsScanning,
    setScanMessage,
    isScanning, 
    scanMessage, 
    setAvatarModalData, 
    setDeleteModalUser, 
    setInspectUserData, 
    setShowSettingsModal,
    showToast, 
    API_BASE 
  } = useApp();

  const selectedUser = sanitizeUsername(routeUsername || searchParams.get('user') || 'kohyingliew');

  // Tab 状态
  const [activeProfileTab, setActiveProfileTab] = useState('posts');
  const [headerAvatarUrl, setHeaderAvatarUrl] = useState('');
  const [showMoreActionsDropdown, setShowMoreActionsDropdown] = useState(false);

  // 媒体数据状态
  const [storiesData, setStoriesData] = useState({ username: '', count: 0, items: [] });
  const [postsData, setPostsData] = useState({ count: 0, items: [] });
  const [highlightsData, setHighlightsData] = useState({ count: 0, trays: [] });
  const [repostsData, setRepostsData] = useState({ count: 0, items: [] });
  const [taggedData, setTaggedData] = useState({ count: 0, items: [] });
  const [userBioData, setUserBioData] = useState({
    biography: '',
    external_url: '',
    category_name: '',
    full_name: '',
    posts_count: 0,
    highlights_count: 0,
    reposts_count: 0,
    tagged_count: 0
  });

  // 弹窗与灯箱状态
  const [selectedPostModal, setSelectedPostModal] = useState(null);
  const [selectedStoryMedia, setSelectedStoryMedia] = useState(null);
  const [selectedHighlightTray, setSelectedHighlightTray] = useState(null);
  const [activeHighlightStoryIndex, setActiveHighlightStoryIndex] = useState(0);

  // 关注与粉丝纯净列表
  const [followingUsers, setFollowingUsers] = useState([]);
  const [followersUsers, setFollowersUsers] = useState([]);
  const [simpleSearchQuery, setSimpleSearchQuery] = useState('');
  const [followingPage, setFollowingPage] = useState(1);
  const [followingPageSize, setFollowingPageSize] = useState(settings.pageSize || 50);
  const [followersPage, setFollowersPage] = useState(1);
  const [followersPageSize, setFollowersPageSize] = useState(settings.pageSize || 50);

  // 快照对比与社交圈分析
  const [historyFiles, setHistoryFiles] = useState([]);
  const [analysisMode, setAnalysisMode] = useState(settings.analysisDefault || 'following');
  const [selectedSnapshot, setSelectedSnapshot] = useState('');
  const [selectedBaseSnapshot, setSelectedBaseSnapshot] = useState('');
  const [snapshotData, setSnapshotData] = useState(null);
  const [diffData, setDiffData] = useState(null);
  const [detailsViewMode, setDetailsViewMode] = useState('history_diff');
  const [detailsFilter, setDetailsFilter] = useState('all');
  const [detailsSearchQuery, setDetailsSearchQuery] = useState('');
  const [detailsPage, setDetailsPage] = useState(1);
  const [detailsPageSize, setDetailsPageSize] = useState(50);

  // 跨博主社交圈分析状态
  const [crossUserA, setCrossUserA] = useState(selectedUser);
  const [crossUserB, setCrossUserB] = useState('');
  const [crossUserC, setCrossUserC] = useState('');
  const [isCustomUserB, setIsCustomUserB] = useState(false);
  const [customUserBInput, setCustomUserBInput] = useState('');
  const [crossLoading, setCrossLoading] = useState(false);
  const [crossData, setCrossData] = useState(null);
  const [crossSubTab, setCrossSubTab] = useState('mutual_following');
  const [crossSearchQuery, setCrossSearchQuery] = useState('');
  const [crossPage, setCrossPage] = useState(1);
  const [crossPageSize, setCrossPageSize] = useState(settings.pageSize || 50);

  // 导航与模态框打开助手
  const handleBackToHome = () => navigate('/page/home');
  const handleOpenPostModal = (item) => setSelectedPostModal(item);
  const handleOpenStoryMedia = (item) => setSelectedStoryMedia(item);
  const handleOpenHighlightModal = (tray) => setSelectedHighlightTray(tray);
  const handleOpenAvatarModal = (data) => setAvatarModalData(data);
  const handleOpenInspectModal = (u) => setInspectUserData(u);
  const handleOpenDeleteModal = (u) => setDeleteModalUser(u);

  // 头像计算
  const currentProfilePicUrl = useMemo(() => {
    if (headerAvatarUrl) return headerAvatarUrl;
    if (storiesData?.profile_pic_url) return storiesData.profile_pic_url;
    const u = usersList.find(x => x.username.toLowerCase() === selectedUser.toLowerCase());
    return u?.profile_pic_url || '';
  }, [headerAvatarUrl, storiesData, usersList, selectedUser]);

  const loadStoriesList = async (username) => {
    const un = (username || selectedUser || 'kohyingliew').replace('@', '').trim();
    if (!un) return;
    try {
      const res = await fetch(`${API_BASE}/api/stories/${un}`);
      const data = await res.json();
      setStoriesData(data);
    } catch (e) {
      console.error("加载快拍失败", e);
    }
  };

  // 加载指定博主的全量官方媒体 (Posts, Highlights, Reposts, Tagged)

  const loadProfileMedia = async (username) => {
    const un = (username || selectedUser || '').toLowerCase().replace('@', '').trim();
    if (!un) return;
    try {
      const [rPosts, rHl, rRp, rTag, rProf] = await Promise.all([
        fetch(`${API_BASE}/api/user_posts/${un}`).then(r => r.json()).catch(() => ({ count: 0, items: [] })),
        fetch(`${API_BASE}/api/user_highlights/${un}`).then(r => r.json()).catch(() => ({ count: 0, trays: [] })),
        fetch(`${API_BASE}/api/user_reposts/${un}`).then(r => r.json()).catch(() => ({ count: 0, items: [] })),
        fetch(`${API_BASE}/api/user_tagged/${un}`).then(r => r.json()).catch(() => ({ count: 0, items: [] })),
        fetch(`${API_BASE}/api/users/${un}/profile`).then(r => r.json()).catch(() => ({}))
      ]);
      if (rPosts?.items) setPostsData({ count: rPosts.count ?? rPosts.items.length, items: rPosts.items });
      if (rHl?.trays) setHighlightsData({ count: rHl.count ?? rHl.trays.length, trays: rHl.trays });
      if (rRp?.items) setRepostsData({ count: rRp.count ?? rRp.items.length, items: rRp.items });
      if (rTag?.items) setTaggedData({ count: rTag.count ?? rTag.items.length, items: rTag.items });
      if (rProf) {
        setUserBioData({
          biography: rProf.biography || '',
          external_url: rProf.external_url || '',
          category_name: rProf.category_name || '',
          full_name: rProf.full_name || '',
          posts_count: rProf.posts_count ?? (rPosts?.items?.length || 0),
          highlights_count: rProf.highlights_count ?? (rHl?.trays?.length || 0),
          reposts_count: rProf.reposts_count ?? (rRp?.items?.length || 0),
          tagged_count: rProf.tagged_count ?? (rTag?.items?.length || 0),
        });
      }
    } catch (e) {
      console.error("加载博主媒体失败", e);
    }
  };

  // 加载历史快照列表

  const loadHistoryList = async (targetToSelect = null, userFilter = selectedUser) => {
    try {
      const queryParam = userFilter ? `?user=${encodeURIComponent(userFilter)}` : '';
      const res = await fetch(`${API_BASE}/api/history${queryParam}`);
      const data = await res.json();
      const files = data.history || [];
      setHistoryFiles(files);

      // 加载最新的关注列表与粉丝列表给纯净 Tab
      const latestFollowing = files.find(f => f.mode === 'following');
      if (latestFollowing) {
        fetch(`${API_BASE}/api/snapshot/${latestFollowing.filename}`)
          .then(r => r.json())
          .then(d => {
            setFollowingUsers(d.users || []);
            setFollowingPage(1);
          })
          .catch(() => {});
      } else {
        setFollowingUsers([]);
      }

      const latestFollowers = files.find(f => f.mode === 'followers');
      if (latestFollowers) {
        fetch(`${API_BASE}/api/snapshot/${latestFollowers.filename}`)
          .then(r => r.json())
          .then(d => {
            setFollowersUsers(d.users || []);
            setFollowersPage(1);
          })
          .catch(() => {});
      } else {
        setFollowersUsers([]);
      }

      // 如果有可比对快照，自动载入详情页
      if (files.length > 0) {
        const activeFiles = files.filter(f => f.mode === analysisMode);
        const candidateFiles = activeFiles.length > 0 ? activeFiles : files;
        const fileToLoad = targetToSelect || (candidateFiles.some(f => f.filename === selectedSnapshot) ? selectedSnapshot : candidateFiles[0].filename);
        const fMeta = files.find(f => f.filename === fileToLoad);
        if (fMeta && fMeta.mode && fMeta.mode !== analysisMode) {
          setAnalysisMode(fMeta.mode);
        }
        setSelectedSnapshot(fileToLoad);
        loadSnapshotDetails(fileToLoad, files);
      } else {
        setSelectedSnapshot('');
        setSelectedBaseSnapshot('');
        setSnapshotData(null);
        setDiffData(null);
      }
    } catch (e) {
      console.error("加载历史快照失败", e);
    }
  };

  // 加载指定快照数据及其与上一版的差集

  const loadSnapshotDetails = async (filename, filesList = historyFiles) => {
    if (!filename) return;
    try {
      const res = await fetch(`${API_BASE}/api/snapshot/${filename}`);
      const data = await res.json();
      setSnapshotData(data);
      setDetailsPage(1);

      const currentMeta = (filesList || []).find(f => f.filename === filename);
      if (currentMeta) {
        const sameTargetFiles = (filesList || []).filter(
          f => f.target === currentMeta.target && f.mode === currentMeta.mode
        );
        const currentIndex = sameTargetFiles.findIndex(f => f.filename === filename);
        const prevSnapshot = sameTargetFiles[currentIndex + 1];

        if (prevSnapshot) {
          setSelectedBaseSnapshot(prevSnapshot.filename);
          executeDiff(prevSnapshot.filename, filename);
        } else {
          setSelectedBaseSnapshot('');
          setDiffData(null);
        }
      }
    } catch (e) {
      console.error("加载快照详情失败", e);
    }
  };

  // 执行差集比对

  const executeDiff = async (baseFile, currentFile) => {
    if (!baseFile || !currentFile || baseFile === currentFile) {
      setDiffData(null);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/diff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ old_file: baseFile, new_file: currentFile })
      });
      const data = await res.json();
      setDiffData(data);
    } catch (e) {
      console.error("计算变动失败", e);
    }
  };

  // 进入博主专属主页
    // 安全博主账号校验与清洗（防御路径穿越、注入与非法字符）

  const handleTriggerScrape = async (targetUser, mode) => {
    const clean = (targetUser || selectedUser || '').replace('@', '').trim();
    if (!clean) {
      alert("请输入有效的博主账号！");
      return;
    }
    if (!serverStatus.has_cookie) {
      setShowSettingsModal(true);
      alert("请先在设置中完成登录或粘贴 Cookie 后再开始抓取。");
      return;
    }

    setIsScanning(true);
    setScanMessage(
      mode === 'stories' 
        ? `正在连接 Instagram 抓取 @${clean} 的 24h 快拍...` 
        : `正在启动 @${clean} 的 ${mode === 'following' ? '关注' : '粉丝'} 采集...`
    );

    try {
      const res = await fetch(`${API_BASE}/api/scrape`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: clean, mode })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.detail || "启动任务失败");
        setIsScanning(false);
      }
    } catch (e) {
      alert("连接服务器失败: " + e.message);
      setIsScanning(false);
    }
  };

  // 彻底删除用户所有数据

  const handleExportJSON = () => {
    if (!snapshotData || !snapshotData.users) return;
    const blob = new Blob([JSON.stringify(snapshotData.users, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedSnapshot || 'instagram_users'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 详情页统计指标

  const metrics = useMemo(() => {
    const total = snapshotData?.users?.length || 0;
    const addedCount = diffData?.added_count || 0;
    const removedCount = diffData?.removed_count || 0;
    const storyCount = (snapshotData?.users || []).filter(u => !!u.latest_story_at_gmt8).length;
    const privateCount = (snapshotData?.users || []).filter(u => !!u.is_private).length;
    return { total, addedCount, removedCount, storyCount, privateCount };
  }, [snapshotData, diffData]);

  // 详情页表格数据集合
  const detailsTableRows = useMemo(() => {
    let rows = [];
    if (detailsFilter === 'removed' && diffData?.removed_users) {
      rows = diffData.removed_users;
    } else {
      rows = snapshotData?.users || [];
      if (detailsFilter === 'added' && diffData?.added_users) {
        const addedSet = new Set(diffData.added_users.map(u => String(u.pk)));
        rows = rows.filter(u => addedSet.has(String(u.pk)));
      } else if (detailsFilter === 'story') {
        rows = rows.filter(u => !!u.latest_story_at_gmt8);
      } else if (detailsFilter === 'private') {
        rows = rows.filter(u => !!u.is_private);
      }
    }

    if (detailsSearchQuery.trim()) {
      const q = detailsSearchQuery.toLowerCase().trim();
      rows = rows.filter(u => 
        (u.username || '').toLowerCase().includes(q) ||
        (u.full_name || '').toLowerCase().includes(q) ||
        String(u.pk || '').includes(q)
      );
    }
    return rows;
  }, [snapshotData, diffData, detailsFilter, detailsSearchQuery]);

  // 详情页分页切片
  const paginatedDetailsRows = useMemo(() => {
    const start = (detailsPage - 1) * detailsPageSize;
    return detailsTableRows.slice(start, start + detailsPageSize);
  }, [detailsTableRows, detailsPage, detailsPageSize]);

  // 纯净关注列表搜索与分页
  const filteredFollowingUsers = useMemo(() => {
    if (!simpleSearchQuery.trim()) return followingUsers;
    const q = simpleSearchQuery.toLowerCase().trim();
    return followingUsers.filter(u => 
      (u.username || '').toLowerCase().includes(q) ||
      (u.full_name || '').toLowerCase().includes(q)
    );
  }, [followingUsers, simpleSearchQuery]);

  const paginatedFollowingUsers = useMemo(() => {
    const start = (followingPage - 1) * followingPageSize;
    return filteredFollowingUsers.slice(start, start + followingPageSize);
  }, [filteredFollowingUsers, followingPage, followingPageSize]);

  // 纯净粉丝列表搜索与分页
  const filteredFollowersUsers = useMemo(() => {
    if (!simpleSearchQuery.trim()) return followersUsers;
    const q = simpleSearchQuery.toLowerCase().trim();
    return followersUsers.filter(u => 
      (u.username || '').toLowerCase().includes(q) ||
      (u.full_name || '').toLowerCase().includes(q)
    );
  }, [followersUsers, simpleSearchQuery]);

  const paginatedFollowersUsers = useMemo(() => {
    const start = (followersPage - 1) * followersPageSize;
    return filteredFollowersUsers.slice(start, start + followersPageSize);
  }, [filteredFollowersUsers, followersPage, followersPageSize]);

  // 变动分析：分离关注名单历史快照与粉丝名单历史快照
  const followingHistoryFiles = useMemo(() => {
    return historyFiles.filter(f => f.mode === 'following');
  }, [historyFiles]);

  const followersHistoryFiles = useMemo(() => {
    return historyFiles.filter(f => f.mode === 'followers');
  }, [historyFiles]);

  const currentModeHistoryFiles = useMemo(() => {
    return analysisMode === 'following' ? followingHistoryFiles : followersHistoryFiles;
  }, [analysisMode, followingHistoryFiles, followersHistoryFiles]);

  // 切换变动分析模式 (Following vs Followers)

  const handleSwitchAnalysisMode = (mode) => {
    setAnalysisMode(mode);
    const targetFiles = historyFiles.filter(f => f.mode === mode);
    if (targetFiles.length > 0) {
      const first = targetFiles[0].filename;
      setSelectedSnapshot(first);
      loadSnapshotDetails(first, historyFiles);
    } else {
      setSelectedSnapshot('');
      setSelectedBaseSnapshot('');
      setSnapshotData(null);
      setDiffData(null);
    }
  };

  // 跨博主社交圈与关系分析

  const handleRunCrossAnalysis = async (userAOverride, userBOverride, userCOverride) => {
    const a = (userAOverride || crossUserA || selectedUser || '').trim().replace('@', '');
    const b = (userBOverride !== undefined ? userBOverride : (isCustomUserB ? customUserBInput : crossUserB) || '').trim().replace('@', '');
    const c = (userCOverride !== undefined ? userCOverride : crossUserC || '').trim().replace('@', '');

    if (!a) {
      showToast(lang === 'zh' ? '请选择视角博主 A' : 'Please select Perspective Creator A');
      return;
    }
    if (!b) {
      showToast(lang === 'zh' ? '请选择或输入对比目标 B' : 'Please select or enter Target Creator B');
      return;
    }
    if (a.toLowerCase() === b.toLowerCase()) {
      showToast(lang === 'zh' ? '博主 A 与博主 B 不能为同一人' : 'Creator A and Creator B cannot be the same');
      return;
    }

    setCrossLoading(true);
    try {
      const params = new URLSearchParams({
        user_a: a,
        user_b: b,
      });
      if (c) {
        params.append('user_c', c);
      }
      const res = await fetch(`${API_BASE}/api/cross_analysis?${params.toString()}`);
      const data = await res.json();
      if (data.status === 'ok') {
        setCrossData(data);
        setCrossPage(1);
        setCrossSearchQuery('');
        showToast(lang === 'zh' ? '跨博主社交圈与关系分析计算完成' : 'Cross-creator relationship analysis completed');
      } else {
        showToast(data.message || (lang === 'zh' ? '分析失败' : 'Analysis failed'));
      }
    } catch (e) {
      console.error(e);
      showToast(lang === 'zh' ? '网络请求出错' : 'Network request error');
    } finally {
      setCrossLoading(false);
    }
  };

  const activeCrossList = useMemo(() => {
    if (!crossData) return [];
    if (crossSubTab === 'mutual_following') return crossData.mutual_following || [];
    if (crossSubTab === 'mutual_followers') return crossData.mutual_followers || [];
    if (crossSubTab === 'a_only') return crossData.a_only_following || [];
    if (crossSubTab === 'b_only') return crossData.b_only_following || [];
    return [];
  }, [crossData, crossSubTab]);

  const filteredCrossList = useMemo(() => {
    if (!crossSearchQuery.trim()) return activeCrossList;
    const q = crossSearchQuery.toLowerCase().trim();
    return activeCrossList.filter(u => 
      (u.username || '').toLowerCase().includes(q) ||
      (u.full_name || '').toLowerCase().includes(q)
    );
  }, [activeCrossList, crossSearchQuery]);

  const paginatedCrossList = useMemo(() => {
    const start = (crossPage - 1) * crossPageSize;
    return filteredCrossList.slice(start, start + crossPageSize);
  }, [filteredCrossList, crossPage, crossPageSize]);

  const isUserNewAdded = (userPk) => {
    if (!diffData?.added_users) return false;
    return diffData.added_users.some(u => String(u.pk) === String(userPk));
  };

  // 分页渲染组件辅助函数
  const renderPagination = (currentPageNum, totalItems, pageSize, setPageNum, setPageSize) => {
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    const startIdx = totalItems === 0 ? 0 : (currentPageNum - 1) * pageSize + 1;
    const endIdx = Math.min(currentPageNum * pageSize, totalItems);

    return (
      <div className="clean-pagination-bar">
        <div className="pagination-left">
          <span>
            {lang === 'zh' ? (
              <>共 <strong>{totalItems}</strong> 人 · 显示第 <strong>{startIdx} - {endIdx}</strong> 人</>
            ) : (
              <>Total <strong>{totalItems}</strong> users · Showing <strong>{startIdx} - {endIdx}</strong></>
            )}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--ig-text-muted)' }}>{t('list_pagination_per_page')}</span>
            <select 
              className="pagination-size-select"
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value));
                setPageNum(1);
              }}
            >
              <option value={20}>20 {t('list_pagination_items')}</option>
              <option value={50}>50 {t('list_pagination_items')}</option>
              <option value={100}>100 {t('list_pagination_items')}</option>
            </select>
          </div>
        </div>

        <div className="pagination-controls">
          <button 
            className="page-btn"
            disabled={currentPageNum <= 1}
            onClick={() => setPageNum(p => Math.max(1, p - 1))}
            title={t('list_pagination_prev')}
          >
            <ChevronLeft size={14} />
          </button>

          <span style={{ fontSize: 12, fontWeight: 600, padding: '0 8px' }}>
            {currentPageNum} / {totalPages}
          </span>

          <button 
            className="page-btn"
            disabled={currentPageNum >= totalPages}
            onClick={() => setPageNum(p => Math.min(totalPages, p + 1))}
            title={t('list_pagination_next')}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    );
  };

  // 切换博主时自动加载博主全部媒体数据
  useEffect(() => {
    if (selectedUser) {
      loadStoriesList(selectedUser);
      loadHistoryList(null, selectedUser);
      loadProfileMedia(selectedUser);
      setCrossUserA(selectedUser);
      setCrossUserB('');
      setCrossUserC('');
      setCrossData(null);
    }
  }, [selectedUser]);

  return (
    <>
{/* ================= 博主专属主页 (Profile) ================= */}
        <main>
          {/* 返回按钮 */}
          <button className="back-to-home-btn" onClick={handleBackToHome}>
            <ArrowLeft size={14} />
            <span>{t('profile_back_btn')}</span>
          </button>

          {/* 博主头部卡片 (Instagram 经典 Profile 风格) */}
          <div className="profile-header-card">
            <div className="profile-header-main">
              {/* 大头像 (点击可直接预览与下载高清头像) */}
              <div 
                className={`profile-avatar-large ${(storiesData?.count > 0 || (storiesData?.items && storiesData.items.length > 0)) ? 'has-story' : 'no-story'}`}
                title={(storiesData?.count > 0 || (storiesData?.items && storiesData.items.length > 0)) ? (lang === 'zh' ? '🔥 24h内有快拍 · 点击预览原图' : '🔥 Has 24h Story · Click to preview') : t('profile_avatar_tip')}
                onClick={() => handleOpenAvatarModal({ username: selectedUser, profile_pic_url: currentProfilePicUrl })}
              >
                <div className="profile-avatar-large-inner">
                  {currentProfilePicUrl ? (
                    <img 
                      src={getAvatarProxyUrl(currentProfilePicUrl)} 
                      alt={selectedUser} 
                      referrerPolicy="no-referrer"
                      className="avatar-img"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : null}
                  <span className="avatar-fallback" style={{ fontSize: 32 }}>
                    {selectedUser.substring(0, 1).toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="profile-info-col">
                <div className="profile-username-row">
                  <a 
                    href={`https://www.instagram.com/${selectedUser}/`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="profile-username-link"
                    title={lang === 'zh' ? `在 Instagram 查看 @${selectedUser}` : `View @${selectedUser} on Instagram`}
                  >
                    <h1 className="profile-username-title">@{selectedUser}</h1>
                  </a>
                  <CheckCircle2 size={18} color="#0095f6" />

                  {/* 一键抓取全量媒体 (高亮主操作) */}
                  <button 
                    className="ig-nav-btn primary ig-btn-all-media"
                    onClick={() => handleTriggerScrape(selectedUser, 'all_media')}
                    disabled={isScanning}
                    title={t('btn_crawl_all_media_tip')}
                  >
                    {isScanning ? <RefreshCw size={13} className="spin" /> : <Sparkles size={13} />}
                    <span>{isScanning ? t('profile_btn_crawling') : t('btn_crawl_all_media')}</span>
                  </button>



                  {/* 更多功能下拉菜单 */}
                  <div className="more-actions-container" style={{ position: 'relative' }}>
                    <button 
                      className="ig-nav-btn icon-only"
                      onClick={() => setShowMoreActionsDropdown(!showMoreActionsDropdown)}
                      title={lang === 'zh' ? '更多抓取与管理操作' : 'More actions'}
                    >
                      <MoreHorizontal size={16} />
                    </button>

                    {showMoreActionsDropdown && (
                      <div className="ig-actions-dropdown" onClick={() => setShowMoreActionsDropdown(false)}>
                        {/* 核心功能: 数据变动与圈子社交分析 (Analysis) */}
                        <button 
                          className="dropdown-item highlight-feature-item" 
                          onClick={() => {
                            setActiveProfileTab('details');
                            setDetailsPage(1);
                            setShowMoreActionsDropdown(false);
                            setTimeout(() => {
                              window.scrollTo({ top: 380, behavior: 'smooth' });
                            }, 50);
                          }}
                        >
                          <div className="dropdown-item-icon-box">
                            <Layers size={16} color="#0095f6" />
                          </div>
                          <div className="dropdown-item-content">
                            <div className="dropdown-item-title">
                              {t('nav_analysis_title')}
                            </div>
                            <div className="dropdown-item-desc">
                              {t('nav_analysis_desc')}
                            </div>
                          </div>
                          <ChevronRight size={14} color="#8e8e8e" />
                        </button>

                        <div className="dropdown-divider" />

                        <button className="dropdown-item" onClick={() => handleTriggerScrape(selectedUser, 'stories')}>
                          <Flame size={14} color="#f59e0b" />
                          <span>{t('profile_btn_crawl_stories')}</span>
                        </button>
                        <button className="dropdown-item" onClick={() => handleTriggerScrape(selectedUser, 'following')}>
                          <Users size={14} color="#0095f6" />
                          <span>{t('profile_btn_crawl_following')}</span>
                        </button>
                        <button className="dropdown-item" onClick={() => handleTriggerScrape(selectedUser, 'followers')}>
                          <Users size={14} color="#10b981" />
                          <span>{t('profile_btn_crawl_followers')}</span>
                        </button>
                        <div className="dropdown-divider" />
                        <button className="dropdown-item" onClick={() => handleTriggerScrape(selectedUser, 'posts')}>
                          <Grid size={14} />
                          <span>{lang === 'zh' ? '仅抓取发过的帖子 (Posts)' : 'Crawl Posts Only'}</span>
                        </button>
                        <button className="dropdown-item" onClick={() => handleTriggerScrape(selectedUser, 'highlights')}>
                          <Bookmark size={14} />
                          <span>{lang === 'zh' ? '仅抓取精选快拍专辑 (Highlights)' : 'Crawl Highlights Only'}</span>
                        </button>
                        <button className="dropdown-item" onClick={() => handleTriggerScrape(selectedUser, 'reposts')}>
                          <Repeat size={14} />
                          <span>{lang === 'zh' ? '仅抓取转帖内容 (Reposts)' : 'Crawl Reposts Only'}</span>
                        </button>
                        <button className="dropdown-item" onClick={() => handleTriggerScrape(selectedUser, 'tagged')}>
                          <Tag size={14} />
                          <span>{lang === 'zh' ? '仅抓取被标记内容 (Tagged)' : 'Crawl Tagged Only'}</span>
                        </button>
                        <div className="dropdown-divider" />
                        <button 
                          className="dropdown-item" 
                          onClick={async () => {
                            try {
                              showToast(t('profile_btn_crawling'));
                              await fetch(`${API_BASE}/api/verify_user/${selectedUser}`, { method: 'POST' });
                              await fetchUsersList();
                              await loadProfileMedia(selectedUser);
                              showToast(`${t('toast_verified_stats')} (@${selectedUser})`);
                            } catch (e) {
                              showToast('核验失败: ' + e.message);
                            }
                          }}
                        >
                          <ShieldCheck size={14} color="#10b981" />
                          <span>{t('profile_btn_verify_stats')}</span>
                        </button>
                        <button 
                          className="dropdown-item" 
                          onClick={() => {
                            loadStoriesList(selectedUser);
                            loadHistoryList(null, selectedUser);
                            loadProfileMedia(selectedUser);
                            showToast(t('toast_refreshed'));
                          }}
                        >
                          <RefreshCw size={14} />
                          <span>{t('profile_btn_refresh')}</span>
                        </button>
                        <div className="dropdown-divider" />
                        <button className="dropdown-item danger" onClick={() => handleOpenDeleteModal(selectedUser)}>
                          <Trash2 size={14} />
                          <span>{t('profile_del_btn')}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 第二行: Instagram 官方 3 列数据统计 (帖子 / 粉丝 / 关注) - 文本链接直接跳转 */}
                <div className="profile-stats-row">
                  <button 
                    type="button"
                    className={`profile-stat-link-btn ${activeProfileTab === 'posts' ? 'active' : ''}`}
                    onClick={() => {
                      setActiveProfileTab('posts');
                      window.scrollTo({ top: 380, behavior: 'smooth' });
                    }}
                    title={lang === 'zh' ? '点击查看帖子列表' : 'View posts'}
                  >
                    <strong>{userBioData.posts_count || postsData.count || 0}</strong>
                    <span>{t('tab_posts')}</span>
                  </button>

                  <button 
                    type="button"
                    className={`profile-stat-link-btn ${activeProfileTab === 'followers' ? 'active' : ''}`}
                    onClick={() => {
                      setActiveProfileTab('followers');
                      setFollowersPage(1);
                      window.scrollTo({ top: 380, behavior: 'smooth' });
                    }}
                    title={lang === 'zh' ? '点击直接查看粉丝列表' : 'View followers'}
                  >
                    <strong>{usersList.find(x => x.username.toLowerCase() === selectedUser.toLowerCase())?.followers_count ?? (followersUsers?.length || 0)}</strong>
                    <span>{t('profile_stat_followers_suffix')}</span>
                  </button>

                  <button 
                    type="button"
                    className={`profile-stat-link-btn ${activeProfileTab === 'following' ? 'active' : ''}`}
                    onClick={() => {
                      setActiveProfileTab('following');
                      setFollowingPage(1);
                      window.scrollTo({ top: 380, behavior: 'smooth' });
                    }}
                    title={lang === 'zh' ? '点击直接查看关注列表' : 'View following'}
                  >
                    <strong>{usersList.find(x => x.username.toLowerCase() === selectedUser.toLowerCase())?.following_count ?? (followingUsers?.length || 0)}</strong>
                    <span>{t('profile_stat_following_suffix')}</span>
                  </button>
                </div>

                {/* 第三行: 个人简介与外链 (Bio) */}
                <div className="profile-bio-section">
                  {userBioData.full_name && (
                    <div className="profile-bio-name">{userBioData.full_name}</div>
                  )}
                  {userBioData.category_name && (
                    <div className="profile-bio-category">{userBioData.category_name}</div>
                  )}
                  {userBioData.biography && (
                    <div className="profile-bio-text">{userBioData.biography}</div>
                  )}
                  {userBioData.external_url && (
                    <a 
                      href={userBioData.external_url.startsWith('http') ? userBioData.external_url : `https://${userBioData.external_url}`}
                      target="_blank" 
                      rel="noreferrer" 
                      className="profile-bio-link"
                    >
                      <ExternalLink size={12} />
                      <span>{userBioData.external_url}</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* 精选快拍水平滚动条 (Highlights Tray) */}
            {highlightsData?.trays && highlightsData.trays.length > 0 && (
              <div className="ig-highlights-tray-wrapper">
                <div className="ig-highlights-tray">
                  {highlightsData.trays.map((tray) => {
                    const coverUrl = tray.cover_url || tray.cover_image_url || tray.cover_media?.cropped_image_version?.url || '';
                    return (
                      <div 
                        key={tray.id} 
                        className="ig-highlight-circle-item"
                        onClick={() => handleOpenHighlightModal(tray, 0)}
                        title={`${tray.title} (${tray.media_count || tray.items?.length || 0} 条快拍)`}
                      >
                        <div className="ig-highlight-ring">
                          <div className="ig-highlight-inner">
                            {coverUrl ? (
                              <img 
                                src={getAvatarProxyUrl(coverUrl)} 
                                alt={tray.title}
                                referrerPolicy="no-referrer"
                                className="ig-highlight-cover"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                            ) : null}
                            <span className="ig-highlight-fallback">
                              {(tray.title || 'H').substring(0, 1)}
                            </span>
                          </div>
                        </div>
                        <span className="ig-highlight-title">{tray.title}</span>
                      </div>
                    );
                  })}

                  {/* 全部精选专辑分组浏览入口 */}
                  <div 
                    className={`ig-highlight-circle-item group-view-entry ${activeProfileTab === 'highlights_group' ? 'active' : ''}`}
                    onClick={() => {
                      setActiveProfileTab('highlights_group');
                      setTimeout(() => {
                        window.scrollTo({ top: 380, behavior: 'smooth' });
                      }, 50);
                    }}
                    title={t('highlights_view_all_grouped')}
                  >
                    <div className="ig-highlight-ring group-view-ring">
                      <div className="ig-highlight-inner group-view-inner">
                        <Bookmark size={18} />
                      </div>
                    </div>
                    <span className="ig-highlight-title">{lang === 'zh' ? '全部分组' : 'All Albums'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 正在扫描状态横幅 */}
          {isScanning && (
            <div className="running-task-banner">
              <RefreshCw size={16} className="spin" color="#0095f6" />
              <div className="running-task-pulse" />
              <span className="running-task-msg">{scanMessage}</span>
            </div>
          )}

          {/* Instagram 官方经典 4 项 Tab 居中导航 (与官方个人主页排版完全一致) */}
          <div className="ig-profile-tabs">
            <button 
              className={`ig-tab-item ${activeProfileTab === 'posts' ? 'active' : ''}`}
              onClick={() => setActiveProfileTab('posts')}
            >
              <Grid size={13} />
              <span>{t('tab_posts')} {postsData.count > 0 ? `(${postsData.count})` : ''}</span>
            </button>

            <button 
              className={`ig-tab-item ${activeProfileTab === 'stories' ? 'active story-tab' : ''}`}
              onClick={() => setActiveProfileTab('stories')}
            >
              <Flame size={13} />
              <span>{t('tab_stories')} ({storiesData.count || 0})</span>
            </button>

            <button 
              className={`ig-tab-item ${activeProfileTab === 'reposts' ? 'active' : ''}`}
              onClick={() => setActiveProfileTab('reposts')}
            >
              <Repeat size={13} />
              <span>{t('tab_reposts')} {repostsData.count > 0 ? `(${repostsData.count})` : ''}</span>
            </button>

            <button 
              className={`ig-tab-item ${activeProfileTab === 'tagged' ? 'active' : ''}`}
              onClick={() => setActiveProfileTab('tagged')}
            >
              <Tag size={13} />
              <span>{t('tab_tagged')} {taggedData.count > 0 ? `(${taggedData.count})` : ''}</span>
            </button>
          </div>

          {/* 特殊视图状态指示横幅 (当查看粉丝、关注、分析或专辑全览时显示) */}
          {(activeProfileTab === 'following' || activeProfileTab === 'followers' || activeProfileTab === 'details' || activeProfileTab === 'highlights_group') && (
            <div className="profile-active-view-banner">
              <div className="view-banner-left">
                <span className="view-banner-tag">
                  {activeProfileTab === 'following' && (
                    <><Users size={14} /> <span>{lang === 'zh' ? `正在查看 @${selectedUser} 的关注列表 (Following · ${filteredFollowingUsers.length}人)` : `Viewing @${selectedUser}'s Following (${filteredFollowingUsers.length})`}</span></>
                  )}
                  {activeProfileTab === 'followers' && (
                    <><Users size={14} /> <span>{lang === 'zh' ? `正在查看 @${selectedUser} 的粉丝列表 (Followers · ${filteredFollowersUsers.length}人)` : `Viewing @${selectedUser}'s Followers (${filteredFollowersUsers.length})`}</span></>
                  )}
                  {activeProfileTab === 'details' && (
                    <><Layers size={14} /> <span>{lang === 'zh' ? '正在查看数据变动与圈子透视分析 (Analysis)' : 'Viewing Social & Growth Analysis'}</span></>
                  )}
                  {activeProfileTab === 'highlights_group' && (
                    <><Bookmark size={14} /> <span>{lang === 'zh' ? `精选快拍专辑全览 (共 ${highlightsData.trays?.length || 0} 个专辑 · 按专辑分组)` : `Highlights (${highlightsData.trays?.length || 0} albums grouped)`}</span></>
                  )}
                </span>
              </div>
              <button 
                type="button"
                className="view-banner-back-btn" 
                onClick={() => {
                  setActiveProfileTab('posts');
                  window.scrollTo({ top: 380, behavior: 'smooth' });
                }}
              >
                <Grid size={13} />
                <span>{lang === 'zh' ? '返回贴文九宫格' : 'Back to Posts'}</span>
              </button>
            </div>
          )}

          {/* Tab: Posts 官方 3 列 1:1 纯正九宫格 */}
          {activeProfileTab === 'posts' && (
            <section className="ig-tab-content-section">
              {postsData.items && postsData.items.length > 0 ? (
                <div className="ig-posts-grid">
                  {postsData.items.map((item, idx) => {
                    const isCarousel = item.carousel_media && item.carousel_media.length > 1;
                    const thumbUrl = (isCarousel && (item.carousel_media[0]?.image_url || item.carousel_media[0]?.image_versions2?.candidates?.[0]?.url)) 
                      || item.image_url 
                      || item.display_url 
                      || '';
                    return (
                      <div 
                        key={item.id || item.code || idx} 
                        className="ig-grid-tile"
                        onClick={() => handleOpenPostModal(item)}
                      >
                        <img 
                          src={getAvatarProxyUrl(thumbUrl)} 
                          alt={item.caption || `Post ${idx}`} 
                          className="ig-tile-img"
                          loading="lazy"
                        />
                        <div className="ig-tile-badge">
                          {isCarousel ? (
                            <Layers size={16} color="#fff" />
                          ) : item.is_video ? (
                            <Play size={16} color="#fff" fill="#fff" />
                          ) : null}
                          {item.music?.has_audio && (
                            <span className="ig-tile-music-badge" title={item.music.title ? `${item.music.title} · ${item.music.artist}` : 'Music'}>
                              <Music size={13} color="#fff" />
                            </span>
                          )}
                        </div>
                        <div className="ig-tile-overlay">
                          <div className="ig-overlay-stat">
                            <Heart size={18} fill="#fff" color="#fff" />
                            <span>{item.like_count ?? 0}</span>
                          </div>
                          <div className="ig-overlay-stat">
                            <MessageCircle size={18} fill="#fff" color="#fff" />
                            <span>{item.comment_count ?? 0}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="clean-empty-box">
                  <div className="clean-empty-icon"><Grid size={28} /></div>
                  <div className="clean-empty-title">{t('empty_posts')}</div>
                  <button 
                    className="ig-nav-btn primary"
                    style={{ margin: '12px auto 0' }}
                    onClick={() => handleTriggerScrape(selectedUser, 'posts')}
                    disabled={isScanning}
                  >
                    <RefreshCw size={13} className={isScanning ? "spin" : ""} />
                    <span>{isScanning ? t('profile_btn_crawling') : (lang === 'zh' ? '立即抓取主页帖子' : 'Crawl Posts Now')}</span>
                  </button>
                </div>
              )}
            </section>
          )}

          {/* 精选快拍专辑全览: 按每个 Highlight 独立分组展示 (杜绝混在一块) */}
          {(activeProfileTab === 'highlights_group' || activeProfileTab === 'highlights') && (
            <section className="ig-tab-content-section">
              {highlightsData.trays && highlightsData.trays.length > 0 ? (
                <div className="highlights-grouped-container">
                  {highlightsData.trays.map((tray, trayIdx) => {
                    const coverUrl = tray.cover_url || tray.cover_image_url || tray.cover_media?.cropped_image_version?.url || '';
                    const items = tray.items || [];
                    return (
                      <div key={tray.id || trayIdx} className="highlight-group-card">
                        <div className="highlight-group-card-header">
                          <div className="highlight-group-header-left">
                            <div 
                              className="highlight-group-avatar-ring"
                              onClick={() => handleOpenHighlightModal(tray, 0)}
                              title={lang === 'zh' ? '点击播放此专辑快拍流' : 'Click to play this album'}
                            >
                              {coverUrl ? (
                                <img src={getAvatarProxyUrl(coverUrl)} alt={tray.title} className="highlight-group-avatar-img" />
                              ) : (
                                <Bookmark size={18} />
                              )}
                            </div>
                            <div className="highlight-group-info">
                              <h3 className="highlight-group-title">{tray.title}</h3>
                              <span className="highlight-group-subtitle">
                                {items.length || tray.media_count || 0} {lang === 'zh' ? '条快拍' : 'stories'}
                              </span>
                            </div>
                          </div>

                          <button 
                            type="button"
                            className="highlight-group-play-btn"
                            onClick={() => handleOpenHighlightModal(tray, 0)}
                          >
                            <Play size={12} fill="currentColor" />
                            <span>{lang === 'zh' ? '播放整组快拍' : 'Play Stories'}</span>
                          </button>
                        </div>

                        {/* 该精选专辑内的快拍缩略图横排 */}
                        {items.length > 0 ? (
                          <div className="highlight-group-thumbnails-row">
                            {items.map((st, stIdx) => {
                              const isVid = st.media_type === 2 || st.video_url;
                              const thumb = st.image_url || coverUrl;
                              return (
                                <div 
                                  key={st.pk || stIdx}
                                  className="highlight-story-thumb-box"
                                  onClick={() => handleOpenHighlightModal(tray, stIdx)}
                                  title={`点击从第 ${stIdx + 1} 条快拍开始播放`}
                                >
                                  {thumb ? (
                                    <img src={getAvatarProxyUrl(thumb)} alt="" className="highlight-story-thumb-img" loading="lazy" />
                                  ) : (
                                    <div className="highlight-story-thumb-placeholder">
                                      {isVid ? <Play size={20} /> : <ImageIcon size={20} />}
                                    </div>
                                  )}
                                  <div className="highlight-story-thumb-badge">
                                    {isVid ? <Play size={10} fill="#fff" /> : <ImageIcon size={10} />}
                                    <span>{stIdx + 1}/{items.length}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="highlight-group-no-thumbs">
                            <span>{lang === 'zh' ? '暂未解析到单条快拍，可直接点击播放整组' : 'Click play button above to watch stories'}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="clean-empty-box">
                  <div className="clean-empty-icon"><Bookmark size={28} /></div>
                  <div className="clean-empty-title">{t('empty_highlights')}</div>
                  <button 
                    className="ig-nav-btn primary"
                    style={{ margin: '12px auto 0' }}
                    onClick={() => handleTriggerScrape(selectedUser, 'highlights')}
                    disabled={isScanning}
                  >
                    <RefreshCw size={13} className={isScanning ? "spin" : ""} />
                    <span>{isScanning ? t('profile_btn_crawling') : (lang === 'zh' ? '抓取精选快拍专辑' : 'Crawl Highlights')}</span>
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Tab: Reposts 转帖网格 */}
          {activeProfileTab === 'reposts' && (
            <section className="ig-tab-content-section">
              {repostsData.items && repostsData.items.length > 0 ? (
                <div className="ig-posts-grid">
                  {repostsData.items.map((item, idx) => (
                    <div 
                      key={item.id || item.code || idx} 
                      className="ig-grid-tile"
                      onClick={() => handleOpenPostModal(item)}
                    >
                      <img 
                        src={getAvatarProxyUrl(item.image_url || item.display_url)} 
                        alt={item.caption || `Repost ${idx}`} 
                        className="ig-tile-img"
                        loading="lazy"
                      />
                      <div className="ig-tile-badge repost-badge">
                        <Repeat size={12} color="#fff" />
                        <span>@{item.author?.username || 'creator'}</span>
                        {item.music?.has_audio && (
                          <span className="ig-tile-music-badge" title={item.music.title ? `${item.music.title} · ${item.music.artist}` : 'Music'}>
                            <Music size={11} color="#fff" />
                          </span>
                        )}
                      </div>
                      <div className="ig-tile-overlay">
                        <div className="ig-overlay-stat">
                          <Heart size={18} fill="#fff" color="#fff" />
                          <span>{item.like_count ?? 0}</span>
                        </div>
                        <div className="ig-overlay-stat">
                          <MessageCircle size={18} fill="#fff" color="#fff" />
                          <span>{item.comment_count ?? 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="clean-empty-box">
                  <div className="clean-empty-icon"><Repeat size={28} /></div>
                  <div className="clean-empty-title">{t('empty_reposts')}</div>
                  <button 
                    className="ig-nav-btn primary"
                    style={{ margin: '12px auto 0' }}
                    onClick={() => handleTriggerScrape(selectedUser, 'reposts')}
                    disabled={isScanning}
                  >
                    <RefreshCw size={13} className={isScanning ? "spin" : ""} />
                    <span>{isScanning ? t('profile_btn_crawling') : (lang === 'zh' ? '抓取转帖内容' : 'Crawl Reposts')}</span>
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Tab: Tagged 被标记内容 */}
          {activeProfileTab === 'tagged' && (
            <section className="ig-tab-content-section">
              {taggedData.items && taggedData.items.length > 0 ? (
                <div className="ig-posts-grid">
                  {taggedData.items.map((item, idx) => (
                    <div 
                      key={item.id || item.code || idx} 
                      className="ig-grid-tile"
                      onClick={() => handleOpenPostModal(item)}
                    >
                      <img 
                        src={getAvatarProxyUrl(item.image_url || item.display_url)} 
                        alt={item.caption || `Tagged ${idx}`} 
                        className="ig-tile-img"
                        loading="lazy"
                      />
                      <div className="ig-tile-badge tagged-badge">
                        <Tag size={12} color="#fff" />
                        <span>@{item.author?.username || 'creator'}</span>
                        {item.music?.has_audio && (
                          <span className="ig-tile-music-badge" title={item.music.title ? `${item.music.title} · ${item.music.artist}` : 'Music'}>
                            <Music size={11} color="#fff" />
                          </span>
                        )}
                      </div>
                      <div className="ig-tile-overlay">
                        <div className="ig-overlay-stat">
                          <Heart size={18} fill="#fff" color="#fff" />
                          <span>{item.like_count ?? 0}</span>
                        </div>
                        <div className="ig-overlay-stat">
                          <MessageCircle size={18} fill="#fff" color="#fff" />
                          <span>{item.comment_count ?? 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="clean-empty-box">
                  <div className="clean-empty-icon"><Tag size={28} /></div>
                  <div className="clean-empty-title">{t('empty_tagged')}</div>
                  <button 
                    className="ig-nav-btn primary"
                    style={{ margin: '12px auto 0' }}
                    onClick={() => handleTriggerScrape(selectedUser, 'tagged')}
                    disabled={isScanning}
                  >
                    <RefreshCw size={13} className={isScanning ? "spin" : ""} />
                    <span>{isScanning ? t('profile_btn_crawling') : (lang === 'zh' ? '抓取被标记帖子' : 'Crawl Tagged')}</span>
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Tab 1: 快拍画廊 (纯净无杂质画廊，永久保存，绝不被刷新删除) */}
          {activeProfileTab === 'stories' && (
            <section>
              {storiesData.items && storiesData.items.length > 0 ? (
                <div className="stories-clean-grid">
                  {storiesData.items.map((item) => (
                    <div key={item.filename} className="clean-story-card">
                      {/* 卡片头部 - 固定高度，保证所有卡片顶部完全一致 */}
                      <div className="clean-story-header">
                        <span className={`clean-time-pill ${(item.relative_time || '').includes('归档') ? 'archive' : 'fresh'}`}>
                          <Clock size={11} />
                          <span>{formatRelativeTime(item.relative_time, lang) || (lang === 'zh' ? '刚刚' : 'Just now')}</span>
                        </span>
                        <div className="clean-story-header-badges">
                          {item.reshared_story_author ? (
                            <span className="clean-header-badge reshared-story" title={t('stories_tag_reshared_story')}>
                              <Repeat size={11} />
                              <span>{t('stories_tag_reshared_story')}</span>
                            </span>
                          ) : item.feed_media && item.feed_media.length > 0 ? (
                            <span className="clean-header-badge reshared-feed" title={t('stories_tag_reshared_reel')}>
                              <ExternalLink size={11} />
                              <span>{item.feed_media[0].type === 'clips' ? t('stories_tag_reshared_reel') : t('stories_tag_reshared_post')}</span>
                            </span>
                          ) : (
                            <span className="clean-header-badge standard">
                              {item.type === 'video' ? t('stories_tag_video') : t('stories_tag_image')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 媒体视窗 - 紧随头部，确保所有卡片画面起始高度 100% 水平对齐 */}
                      <div className="clean-story-media-box">
                        {item.type === 'video' ? (
                          <video 
                            src={`${API_BASE}${item.url}`} 
                            controls 
                            playsInline
                            preload="metadata"
                            className="clean-video-player" 
                          />
                        ) : (
                          <img 
                            src={`${API_BASE}${item.url}`} 
                            alt={item.filename} 
                            className="clean-image-viewer"
                            onClick={() => handleOpenStoryMedia(item)}
                          />
                        )}
                      </div>

                      {/* 媒体下方信息区 - 容纳转发、艾特、音乐等元数据，绝不影响上方画面对齐 */}
                      <div className="clean-story-meta-section">
                        {/* 1. 转发他人快拍原作者 */}
                        {item.reshared_story_author && (
                          <div className="clean-meta-item clean-reshared-author-bar">
                            <div className="clean-meta-label">
                              <Repeat size={11} color="#8b5cf6" />
                              <span>{t('stories_reshared_story_by')}:</span>
                            </div>
                            <a
                              href={`https://www.instagram.com/${item.reshared_story_author.username}/`}
                              target="_blank"
                              rel="noreferrer"
                              className="clean-author-chip"
                              title={`@${item.reshared_story_author.username}`}
                            >
                              <span className="clean-chip-un">@{item.reshared_story_author.username}</span>
                              {item.reshared_story_author.full_name && (
                                <span className="clean-chip-fn">({item.reshared_story_author.full_name})</span>
                              )}
                            </a>
                          </div>
                        )}

                        {/* 2. 转发原帖 (Reels / 帖子) */}
                        {item.feed_media && item.feed_media.length > 0 && (
                          <div className="clean-meta-item clean-feed-media-bar">
                            <div className="clean-meta-label">
                              <ExternalLink size={11} color="#be185d" />
                              <span>{t('stories_reshared_label')}:</span>
                            </div>
                            <div className="clean-meta-scroll-list">
                              {item.feed_media.map((fm) => (
                                <a 
                                  key={fm.code}
                                  href={fm.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="clean-feed-link"
                                >
                                  {fm.type === 'clips' ? 'Reels' : 'Post'} #{fm.code}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 3. @ 提及/艾特用户（含 PC 端左右翻页按钮与滚轮滑动） */}
                        {item.mentions && item.mentions.length > 0 && (
                          <div className="clean-meta-item clean-mentions-bar">
                            <div className="clean-meta-label">
                              <AtSign size={11} color="#0095f6" />
                              <span>{t('stories_mentions_label')}:</span>
                            </div>
                            <MentionsScrollList mentions={item.mentions} />
                          </div>
                        )}

                        {/* 4. 音乐胶囊 */}
                        {item.bgm && (
                          <div className="clean-meta-item clean-bgm-bar">
                            <Music size={11} color="#d46b08" style={{ flexShrink: 0 }} />
                            <span className="clean-bgm-text">
                              {item.bgm}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* 卡片底部操作与下载 */}
                      <div className="clean-story-footer">
                        <span className="clean-story-date">
                          {formatTime(item.time_display || item.created_at)} ({item.size_kb} KB)
                        </span>
                        <a 
                          href={`${API_BASE}${item.url}`} 
                          download={item.filename}
                          target="_blank" 
                          rel="noreferrer"
                          className="clean-download-btn"
                          title={t('stories_btn_download')}
                        >
                          <Download size={12} />
                          <span>{t('stories_btn_download')}</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="clean-empty-box">
                  <div className="clean-empty-icon">
                    <Flame size={24} />
                  </div>
                  <div className="clean-empty-title">{t('stories_empty_title')}</div>
                  <div className="clean-empty-text">
                    {t('stories_empty_desc')}
                  </div>
                  <button 
                    className="ig-nav-btn primary"
                    style={{ margin: '0 auto' }}
                    onClick={() => handleTriggerScrape(selectedUser, 'stories')}
                    disabled={isScanning}
                  >
                    <Play size={14} />
                    <span>{t('stories_resync')}</span>
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Tab 2: 纯净关注名单 (Following - 支持头像直接渲染与点击下载) */}
          {activeProfileTab === 'following' && (
            <section className="clean-card-box">
              <div className="clean-filter-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Users size={16} color="var(--ig-text-secondary)" />
                  <span style={{ fontSize: 13, fontWeight: 700 }}>
                    {t('tab_following')} ({filteredFollowingUsers.length})
                  </span>
                </div>

                <div className="clean-search-mini">
                  <Search size={13} color="#8e8e8e" />
                  <input 
                    type="text" 
                    placeholder={t('list_search_following')} 
                    value={simpleSearchQuery}
                    onChange={e => {
                      setSimpleSearchQuery(e.target.value);
                      setFollowingPage(1);
                    }}
                  />
                  {simpleSearchQuery && (
                    <X size={12} cursor="pointer" onClick={() => {
                      setSimpleSearchQuery('');
                      setFollowingPage(1);
                    }} />
                  )}
                </div>
              </div>

              {paginatedFollowingUsers.length > 0 ? (
                <div>
                  {paginatedFollowingUsers.map((u, i) => (
                    <div key={u.pk || i} className="clean-list-item">
                      <div className="clean-item-left">
                        {/* 头像容器：直接渲染在线 URL，具有 24h 快拍时显示红粉色渐变 Story Ring */}
                        <div 
                          className={`clean-avatar ${u.latest_story_at_gmt8 ? 'has-story' : 'no-story'}`}
                          title={u.latest_story_at_gmt8 ? (lang === 'zh' ? '🔥 24h内有快拍 · 点击预览头像' : '🔥 Has 24h Story · Click to preview') : t('home_card_avatar_tip')}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAvatarModal(u);
                          }}
                        >
                          <div className="clean-avatar-inner">
                            {u.profile_pic_url ? (
                              <img 
                                src={getAvatarProxyUrl(u.profile_pic_url)} 
                                alt={u.username} 
                                referrerPolicy="no-referrer"
                                className="avatar-img"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                            ) : null}
                            <span className="avatar-fallback">{u.username.substring(0, 1).toUpperCase()}</span>
                          </div>
                        </div>

                        <div className="clean-user-info">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <a 
                              href={`https://www.instagram.com/${u.username}/`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="clean-un"
                              title={`在 Instagram 查看 @${u.username}`}
                            >
                              @{u.username}
                            </a>
                            {u.is_verified && <CheckCircle2 size={12} color="#0095f6" />}
                            {u.is_private && <Lock size={11} color="#8e8e8e" />}
                          </div>
                          <span className="clean-fn">{u.full_name || '无昵称'}</span>
                        </div>
                      </div>

                      <div className="clean-item-right">
                        {u.latest_story_at_gmt8 && (
                          <span className="table-tag story">
                            <Flame size={10} /> {t('list_tag_story')} ({formatTime(u.latest_story_at_gmt8, false)})
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* 分页控制栏 */}
                  {renderPagination(
                    followingPage, 
                    filteredFollowingUsers.length, 
                    followingPageSize, 
                    setFollowingPage, 
                    setFollowingPageSize
                  )}
                </div>
              ) : (
                <div className="clean-empty-box" style={{ border: 'none' }}>
                  <div className="clean-empty-icon">
                    <Users size={24} />
                  </div>
                  <div className="clean-empty-title">{t('list_empty')}</div>
                  <div className="clean-empty-text">{t('list_empty')}</div>
                  <button 
                    className="ig-nav-btn primary"
                    style={{ margin: '0 auto' }}
                    onClick={() => handleTriggerScrape(selectedUser, 'following')}
                    disabled={isScanning}
                  >
                    <Play size={14} />
                    <span>{t('profile_btn_crawl_following')}</span>
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Tab 3: 纯净粉丝名单 (Followers - 支持头像直接渲染与点击下载) */}
          {activeProfileTab === 'followers' && (
            <section className="clean-card-box">
              <div className="clean-filter-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Users size={16} color="var(--ig-text-secondary)" />
                  <span style={{ fontSize: 13, fontWeight: 700 }}>
                    {t('tab_followers')} ({filteredFollowersUsers.length})
                  </span>
                </div>

                <div className="clean-search-mini">
                  <Search size={13} color="#8e8e8e" />
                  <input 
                    type="text" 
                    placeholder={t('list_search_followers')} 
                    value={simpleSearchQuery}
                    onChange={e => {
                      setSimpleSearchQuery(e.target.value);
                      setFollowersPage(1);
                    }}
                  />
                  {simpleSearchQuery && (
                    <X size={12} cursor="pointer" onClick={() => {
                      setSimpleSearchQuery('');
                      setFollowersPage(1);
                    }} />
                  )}
                </div>
              </div>

              {paginatedFollowersUsers.length > 0 ? (
                <div>
                  {paginatedFollowersUsers.map((u, i) => (
                    <div key={u.pk || i} className="clean-list-item">
                      <div className="clean-item-left">
                        {/* 头像容器：直接渲染在线 URL，具有 24h 快拍时显示红粉色渐变 Story Ring */}
                        <div 
                          className={`clean-avatar ${u.latest_story_at_gmt8 ? 'has-story' : 'no-story'}`}
                          title={u.latest_story_at_gmt8 ? (lang === 'zh' ? '🔥 24h内有快拍 · 点击预览头像' : '🔥 Has 24h Story · Click to preview') : t('home_card_avatar_tip')}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAvatarModal(u);
                          }}
                        >
                          <div className="clean-avatar-inner">
                            {u.profile_pic_url ? (
                              <img 
                                src={getAvatarProxyUrl(u.profile_pic_url)} 
                                alt={u.username} 
                                referrerPolicy="no-referrer"
                                className="avatar-img"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                            ) : null}
                            <span className="avatar-fallback">{u.username.substring(0, 1).toUpperCase()}</span>
                          </div>
                        </div>

                        <div className="clean-user-info">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <a 
                              href={`https://www.instagram.com/${u.username}/`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="clean-un"
                              title={`在 Instagram 查看 @${u.username}`}
                            >
                              @{u.username}
                            </a>
                            {u.is_verified && <CheckCircle2 size={12} color="#0095f6" />}
                            {u.is_private && <Lock size={11} color="#8e8e8e" />}
                          </div>
                          <span className="clean-fn">{u.full_name || '无昵称'}</span>
                        </div>
                      </div>

                      <div className="clean-item-right">
                        {u.latest_story_at_gmt8 && (
                          <span className="table-tag story">
                            <Flame size={10} /> {t('list_tag_story')} ({formatTime(u.latest_story_at_gmt8, false)})
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* 分页控制栏 */}
                  {renderPagination(
                    followersPage, 
                    filteredFollowersUsers.length, 
                    followersPageSize, 
                    setFollowersPage, 
                    setFollowersPageSize
                  )}
                </div>
              ) : (
                <div className="clean-empty-box" style={{ border: 'none' }}>
                  <div className="clean-empty-icon">
                    <Users size={24} />
                  </div>
                  <div className="clean-empty-title">{t('list_empty')}</div>
                  <div className="clean-empty-text">{t('list_empty')}</div>
                  <button 
                    className="ig-nav-btn primary"
                    style={{ margin: '0 auto' }}
                    onClick={() => handleTriggerScrape(selectedUser, 'followers')}
                    disabled={isScanning}
                  >
                    <Play size={14} />
                    <span>{t('profile_btn_crawl_followers')}</span>
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Tab 4: 独立隔离的变动分析 & 详情页 (面向需要高级差集与参数的用户) */}
          {activeProfileTab === 'details' && (
            <section className="details-container">
              {/* 变动分析顶层主切换卡：单博主历史期数对比 vs 跨博主社交圈与关系分析 */}
              <div className="analysis-master-tabs">
                <button 
                  className={`analysis-master-tab ${detailsViewMode === 'history_diff' ? 'active' : ''}`}
                  onClick={() => setDetailsViewMode('history_diff')}
                >
                  <Clock size={15} />
                  <span>{t('analysis_tab_history_diff')}</span>
                </button>
                <button 
                  className={`analysis-master-tab ${detailsViewMode === 'cross_network' ? 'active' : ''}`}
                  onClick={() => {
                    setDetailsViewMode('cross_network');
                    if (!crossUserA) setCrossUserA(selectedUser);
                    if (!crossUserB && usersList.length > 1) {
                      const other = usersList.find(u => u.username.toLowerCase() !== selectedUser.toLowerCase());
                      if (other) setCrossUserB(other.username);
                    }
                  }}
                >
                  <Share2 size={15} />
                  <span>{t('analysis_tab_cross_network')}</span>
                  <span className="analysis-new-badge">NEW</span>
                </button>
              </div>

              {detailsViewMode === 'history_diff' ? (
                <>
                  {/* 快照选择与比对工具条 */}
                  <div className="diff-toolbar-card">
                {/* 关注与粉丝历史独立分类切换标签 */}
                <div className="analysis-subtabs-row">
                  <div className="analysis-segmented-tabs">
                    <button 
                      className={`analysis-segment-btn ${analysisMode === 'following' ? 'active' : ''}`}
                      onClick={() => handleSwitchAnalysisMode('following')}
                    >
                      <UserPlus size={14} />
                      <span>{t('diff_mode_following')}</span>
                      <span className="analysis-badge">{followingHistoryFiles.length}</span>
                    </button>
                    <button 
                      className={`analysis-segment-btn ${analysisMode === 'followers' ? 'active' : ''}`}
                      onClick={() => handleSwitchAnalysisMode('followers')}
                    >
                      <Users size={14} />
                      <span>{t('diff_mode_followers')}</span>
                      <span className="analysis-badge">{followersHistoryFiles.length}</span>
                    </button>
                  </div>

                  {snapshotData && (
                    <button className="ig-nav-btn" onClick={handleExportJSON}>
                      <Download size={13} />
                      <span>{t('list_export_btn')}</span>
                    </button>
                  )}
                </div>

                {/* 对应模式下的历史期数对比选择器 */}
                <div className="diff-selectors-row">
                  <div className="diff-selectors-left">
                    <div className="diff-selector-item">
                      <label className="diff-selector-label">
                        {analysisMode === 'following' ? t('diff_target_following') : t('diff_target_followers')}
                      </label>
                      <select 
                        className="clean-select-input"
                        value={selectedSnapshot}
                        onChange={e => {
                          setSelectedSnapshot(e.target.value);
                          loadSnapshotDetails(e.target.value);
                        }}
                      >
                        {currentModeHistoryFiles.length === 0 && <option value="">{t('list_empty')}</option>}
                        {currentModeHistoryFiles.map((f, idx) => (
                          <option key={f.filename} value={f.filename}>
                            {formatTime(f.created_at)} · {f.user_count} {lang === 'zh' ? '人' : 'users'} {idx === 0 ? (lang === 'zh' ? ' (最新)' : ' (Latest)') : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="diff-selector-item">
                      <label className="diff-selector-label">
                        {analysisMode === 'following' ? t('diff_base_following') : t('diff_base_followers')}
                      </label>
                      <select 
                        className="clean-select-input"
                        value={selectedBaseSnapshot}
                        onChange={e => {
                          setSelectedBaseSnapshot(e.target.value);
                          executeDiff(e.target.value, selectedSnapshot);
                        }}
                      >
                        <option value="">{t('diff_no_base')}</option>
                        {currentModeHistoryFiles.filter(f => f.filename !== selectedSnapshot).map(f => (
                          <option key={f.filename} value={f.filename}>
                            {formatTime(f.created_at)} · {f.user_count} {lang === 'zh' ? '人' : 'users'}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedBaseSnapshot && (
                      <button 
                        className="ig-nav-btn"
                        onClick={() => executeDiff(selectedBaseSnapshot, selectedSnapshot)}
                      >
                        <ArrowRightLeft size={13} />
                        <span>{t('diff_recalc_btn')}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 指标卡片行 */}
              <div className="details-metric-row">
                <div 
                  className={`details-metric-card ${detailsFilter === 'all' ? 'active' : ''}`}
                  onClick={() => {
                    setDetailsFilter('all');
                    setDetailsPage(1);
                  }}
                >
                  <div className="details-metric-card-header">
                    <span className="details-metric-title">{t('diff_metric_total')}</span>
                    <Users size={14} color="var(--ig-text-secondary)" />
                  </div>
                  <div className="details-metric-val">{metrics.total}</div>
                  <div className="details-metric-sub">{lang === 'zh' ? '当前期完整收录人数' : 'Total users in snapshot'}</div>
                </div>

                <div 
                  className={`details-metric-card ${detailsFilter === 'added' ? 'active' : ''}`}
                  onClick={() => {
                    setDetailsFilter('added');
                    setDetailsPage(1);
                  }}
                >
                  <div className="details-metric-card-header">
                    <span className="details-metric-title">
                      {analysisMode === 'following'
                        ? (lang === 'zh' ? '新增关注' : 'New Following')
                        : (lang === 'zh' ? '新增粉丝' : 'New Followers')}
                    </span>
                    <UserPlus size={14} color="#10b981" />
                  </div>
                  <div className="details-metric-val green">+{metrics.addedCount}</div>
                  <div className="details-metric-sub">{selectedBaseSnapshot ? (lang === 'zh' ? '较基准期新出现人员' : 'Compared to base snapshot') : (lang === 'zh' ? '需选择对比基准' : 'Select base snapshot')}</div>
                </div>

                <div 
                  className={`details-metric-card ${detailsFilter === 'removed' ? 'active' : ''}`}
                  onClick={() => {
                    setDetailsFilter('removed');
                    setDetailsPage(1);
                  }}
                >
                  <div className="details-metric-card-header">
                    <span className="details-metric-title">
                      {analysisMode === 'following'
                        ? (lang === 'zh' ? '已经取关' : 'Unfollowed')
                        : (lang === 'zh' ? '掉粉/被取关' : 'Lost Followers')}
                    </span>
                    <UserMinus size={14} color="#ed4956" />
                  </div>
                  <div className="details-metric-val red">-{metrics.removedCount}</div>
                  <div className="details-metric-sub">{selectedBaseSnapshot ? (lang === 'zh' ? '较基准期不再存在人员' : 'Compared to base snapshot') : (lang === 'zh' ? '需选择对比基准' : 'Select base snapshot')}</div>
                </div>

                <div 
                  className={`details-metric-card ${detailsFilter === 'story' ? 'active' : ''}`}
                  onClick={() => {
                    setDetailsFilter('story');
                    setDetailsPage(1);
                  }}
                >
                  <div className="details-metric-card-header">
                    <span className="details-metric-title">{t('diff_metric_stories')}</span>
                    <Flame size={14} color="#f59e0b" />
                  </div>
                  <div className="details-metric-val">{metrics.storyCount}</div>
                  <div className="details-metric-sub">{lang === 'zh' ? '当前处于活跃状态账号' : 'Active stories posted'}</div>
                </div>

                <div 
                  className={`details-metric-card ${detailsFilter === 'private' ? 'active' : ''}`}
                  onClick={() => {
                    setDetailsFilter('private');
                    setDetailsPage(1);
                  }}
                >
                  <div className="details-metric-card-header">
                    <span className="details-metric-title">{lang === 'zh' ? '私密账号' : 'Private Accounts'}</span>
                    <Lock size={14} color="var(--ig-text-secondary)" />
                  </div>
                  <div className="details-metric-val">{metrics.privateCount}</div>
                  <div className="details-metric-sub">{lang === 'zh' ? '需关注批准账号' : 'Protected accounts'}</div>
                </div>
              </div>

              {/* 核心详情数据表格 */}
              <div className="clean-table-box">
                <div className="clean-table-top-bar">
                  <div className="clean-table-filter-pills">
                    <button 
                      className={`filter-pill-btn ${detailsFilter === 'all' ? 'active' : ''}`}
                      onClick={() => {
                        setDetailsFilter('all');
                        setDetailsPage(1);
                      }}
                    >
                      {t('diff_filter_all')} ({metrics.total})
                    </button>
                    <button 
                      className={`filter-pill-btn ${detailsFilter === 'added' ? 'active' : ''}`}
                      onClick={() => {
                        setDetailsFilter('added');
                        setDetailsPage(1);
                      }}
                    >
                      {analysisMode === 'following' ? (lang === 'zh' ? '新增关注' : 'New Following') : (lang === 'zh' ? '新增粉丝' : 'New Followers')} (+{metrics.addedCount})
                    </button>
                    <button 
                      className={`filter-pill-btn ${detailsFilter === 'removed' ? 'active' : ''}`}
                      onClick={() => {
                        setDetailsFilter('removed');
                        setDetailsPage(1);
                      }}
                    >
                      {analysisMode === 'following' ? (lang === 'zh' ? '已经取关' : 'Unfollowed') : (lang === 'zh' ? '掉粉/取关' : 'Lost Followers')} (-{metrics.removedCount})
                    </button>
                    <button 
                      className={`filter-pill-btn ${detailsFilter === 'story' ? 'active' : ''}`}
                      onClick={() => {
                        setDetailsFilter('story');
                        setDetailsPage(1);
                      }}
                    >
                      {t('diff_filter_story')} ({metrics.storyCount})
                    </button>
                    <button 
                      className={`filter-pill-btn ${detailsFilter === 'private' ? 'active' : ''}`}
                      onClick={() => {
                        setDetailsFilter('private');
                        setDetailsPage(1);
                      }}
                    >
                      {t('diff_filter_private')} ({metrics.privateCount})
                    </button>
                  </div>

                  <div className="clean-search-mini">
                    <Search size={13} color="#8e8e8e" />
                    <input 
                      type="text" 
                      placeholder={t('diff_search_placeholder')} 
                      value={detailsSearchQuery}
                      onChange={e => {
                        setDetailsSearchQuery(e.target.value);
                        setDetailsPage(1);
                      }}
                    />
                    {detailsSearchQuery && (
                      <X size={12} cursor="pointer" onClick={() => {
                        setDetailsSearchQuery('');
                        setDetailsPage(1);
                      }} />
                    )}
                  </div>
                </div>

                {/* 表格内容 */}
                <div className="clean-table-responsive">
                  <table className="clean-table">
                    <thead>
                      <tr>
                        <th style={{ width: 44 }}>#</th>
                        <th>{t('diff_col_user')}</th>
                        <th>{lang === 'zh' ? '数字 UID' : 'User ID'}</th>
                        <th>{t('diff_col_avatar')}</th>
                        <th>{t('diff_col_story')}</th>
                        <th>{t('diff_col_private')}</th>
                        <th style={{ textAlign: 'right' }}>{t('diff_col_actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedDetailsRows.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--ig-text-secondary)' }}>
                            <HelpCircle size={24} style={{ margin: '0 auto 8px', color: '#8e8e8e' }} />
                            <div>{lang === 'zh' ? '当前筛选条件下无匹配数据' : 'No matching users found'}</div>
                          </td>
                        </tr>
                      ) : (
                        paginatedDetailsRows.map((u, idx) => {
                          const globalIdx = (detailsPage - 1) * detailsPageSize + idx + 1;
                          const isNew = isUserNewAdded(u.pk);
                          const isRemoved = detailsFilter === 'removed';
                          return (
                            <tr key={u.pk || idx} className={`${isNew ? 'row-added' : ''} ${isRemoved ? 'row-removed' : ''}`}>
                              <td style={{ color: 'var(--ig-text-muted)' }}>{globalIdx}</td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  {/* 表格内头像：直接渲染在线 URL，具有 24h 快拍时显示红粉色渐变 Story Ring */}
                                  <div 
                                    className={`clean-avatar ${u.latest_story_at_gmt8 ? 'has-story' : 'no-story'}`} 
                                    style={{ width: 36, height: 36, fontSize: 12 }}
                                    title={u.latest_story_at_gmt8 ? (lang === 'zh' ? '🔥 24h内有快拍 · 点击预览头像' : '🔥 Has 24h Story · Click to preview') : t('home_card_avatar_tip')}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenAvatarModal(u);
                                    }}
                                  >
                                    <div className="clean-avatar-inner">
                                      {u.profile_pic_url ? (
                                        <img 
                                          src={getAvatarProxyUrl(u.profile_pic_url)} 
                                          alt={u.username} 
                                          referrerPolicy="no-referrer"
                                          className="avatar-img"
                                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                        />
                                      ) : null}
                                      <span className="avatar-fallback" style={{ fontSize: 12 }}>
                                        {u.username.substring(0, 1).toUpperCase()}
                                      </span>
                                    </div>
                                  </div>

                                  <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                      <a 
                                        href={`https://www.instagram.com/${u.username}/`} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="clean-un"
                                        title={`在 Instagram 查看 @${u.username}`}
                                      >
                                        @{u.username}
                                      </a>
                                      {u.is_verified && <CheckCircle2 size={12} color="#0095f6" />}
                                      {isNew && <span className="table-tag new">NEW</span>}
                                      {isRemoved && <span className="table-tag lost">LOST</span>}
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--ig-text-secondary)' }}>
                                      {u.full_name || '-'}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span 
                                  className="table-code-text" 
                                  style={{ cursor: 'pointer' }}
                                  title="点击复制 UID" 
                                  onClick={() => copyToClipboard(String(u.pk || u.id))}
                                >
                                  {u.pk || u.id}
                                </span>
                              </td>
                              <td>
                                {u.avatar_updated_at_gmt8 ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ig-text-secondary)' }}>
                                    <Calendar size={12} />
                                    <span>{formatTime(u.avatar_updated_at_gmt8)}</span>
                                  </div>
                                ) : (
                                  <span style={{ color: 'var(--ig-text-muted)' }}>-</span>
                                )}
                              </td>
                              <td>
                                {u.latest_story_at_gmt8 ? (
                                  <span className="table-tag story">
                                    <Flame size={10} /> {formatTime(u.latest_story_at_gmt8, false)}
                                  </span>
                                ) : (
                                  <span style={{ color: 'var(--ig-text-muted)', fontSize: 12 }}>{lang === 'zh' ? '无' : 'None'}</span>
                                )}
                              </td>
                              <td>
                                {u.is_private ? (
                                  <span style={{ fontSize: 12, color: 'var(--ig-text-secondary)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                    <Lock size={12} /> {t('diff_private_yes')}
                                  </span>
                                ) : (
                                  <span style={{ fontSize: 12, color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                    <Globe size={12} /> {t('diff_private_no')}
                                  </span>
                                )}
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <div style={{ display: 'inline-flex', gap: 6 }}>
                                  <button 
                                    className="table-btn-action"
                                    onClick={() => handleOpenInspectModal(u)}
                                    title={lang === 'zh' ? '查看 Instagram 返回的所有原始原生参数' : 'View all raw parameters returned by Instagram'}
                                  >
                                    <Code size={12} />
                                    <span>{lang === 'zh' ? '原始参数' : 'Raw Data'}</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>

                  {/* 详情页分页控制栏 */}
                  {renderPagination(
                    detailsPage, 
                    detailsTableRows.length, 
                    detailsPageSize, 
                    setDetailsPage, 
                    setDetailsPageSize
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="cross-analysis-wrapper">
              {/* 跨博主配置选择卡片 */}
              <div className="cross-selectors-card">
                <div className="cross-selectors-grid">
                  {/* 视角博主 A */}
                  <div className="cross-selector-col">
                    <label className="cross-selector-label">
                      <span className="cross-role-badge a">A</span>
                      <span>{t('cross_user_a_label')}</span>
                    </label>
                    <select 
                      className="clean-select-input"
                      value={crossUserA}
                      onChange={e => setCrossUserA(e.target.value)}
                    >
                      {usersList.map(u => (
                        <option key={u.username} value={u.username}>
                          @{u.username} ({u.full_name || '无昵称'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 对比目标 B */}
                  <div className="cross-selector-col">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <label className="cross-selector-label" style={{ marginBottom: 0 }}>
                        <span className="cross-role-badge b">B</span>
                        <span>{t('cross_user_b_label')}</span>
                      </label>
                      <button 
                        type="button"
                        className="cross-toggle-btn"
                        onClick={() => setIsCustomUserB(!isCustomUserB)}
                      >
                        {isCustomUserB ? t('cross_select_b_toggle') : t('cross_custom_b_toggle')}
                      </button>
                    </div>
                    {isCustomUserB ? (
                      <input 
                        type="text"
                        className="clean-select-input"
                        placeholder={t('cross_custom_b_placeholder')}
                        value={customUserBInput}
                        onChange={e => setCustomUserBInput(e.target.value)}
                      />
                    ) : (
                      <select 
                        className="clean-select-input"
                        value={crossUserB}
                        onChange={e => setCrossUserB(e.target.value)}
                      >
                        <option value="">{lang === 'zh' ? '-- 请选择对比博主 --' : '-- Select Creator B --'}</option>
                        {usersList.filter(u => u.username.toLowerCase() !== (crossUserA || selectedUser).toLowerCase()).map(u => (
                          <option key={u.username} value={u.username}>
                            @{u.username} ({u.full_name || '无昵称'})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* 第三方博主 C */}
                  <div className="cross-selector-col">
                    <label className="cross-selector-label">
                      <span className="cross-role-badge c">C</span>
                      <span>{t('cross_user_c_label')}</span>
                    </label>
                    <select 
                      className="clean-select-input"
                      value={crossUserC}
                      onChange={e => setCrossUserC(e.target.value)}
                    >
                      <option value="">{t('cross_user_c_none')}</option>
                      {usersList.filter(u => u.username.toLowerCase() !== (crossUserA || selectedUser).toLowerCase() && (!crossUserB || u.username.toLowerCase() !== crossUserB.toLowerCase())).map(u => (
                        <option key={u.username} value={u.username}>
                          @{u.username} ({u.full_name || '无昵称'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="cross-action-bar">
                  <button 
                    className="ig-nav-btn primary cross-execute-btn"
                    onClick={() => handleRunCrossAnalysis()}
                    disabled={crossLoading}
                  >
                    {crossLoading ? <RefreshCw size={14} className="spin" /> : <GitCompare size={14} />}
                    <span>{crossLoading ? t('cross_loading') : t('cross_btn_analyze')}</span>
                  </button>
                </div>
              </div>

              {/* 分析结果面板 */}
              {crossData ? (
                <div className="cross-results-container">
                  {/* 拓扑关系速览卡片 */}
                  <div className="cross-relation-matrix">
                    {/* A <-> B 直接关系 */}
                    <div className="cross-relation-card">
                      <div className="cross-card-header">
                        <span className="cross-card-title">{t('cross_direct_title')}</span>
                        <span className={`cross-status-pill ${crossData.direct_relations?.relationship_type === 'mutual' ? 'mutual' : crossData.direct_relations?.relationship_type === 'a_only' ? 'a-only' : crossData.direct_relations?.relationship_type === 'b_only' ? 'b-only' : 'none'}`}>
                          {lang === 'zh' ? crossData.direct_relations?.label_zh : crossData.direct_relations?.label_en}
                        </span>
                      </div>

                      <div className="cross-nodes-flow">
                        <div className="cross-node">
                          <div className="cross-node-avatar">{(crossData.user_a?.username || 'A').substring(0, 2).toUpperCase()}</div>
                          <div className="cross-node-un">@{crossData.user_a?.username}</div>
                          <span className="cross-node-tag a">博主 A</span>
                        </div>

                        <div className="cross-flow-arrows">
                          <div className={`cross-arrow-line ${crossData.direct_relations?.a_follows_b ? 'active' : 'inactive'}`}>
                            <span>A ➔ B</span>
                            <span className="arrow-sym">{crossData.direct_relations?.a_follows_b ? '✓ 关注' : '✕ 未关注'}</span>
                          </div>
                          <div className={`cross-arrow-line ${crossData.direct_relations?.b_follows_a ? 'active' : 'inactive'}`}>
                            <span>B ➔ A</span>
                            <span className="arrow-sym">{crossData.direct_relations?.b_follows_a ? '✓ 关注' : '✕ 未关注'}</span>
                          </div>
                        </div>

                        <div className="cross-node">
                          <div className="cross-node-avatar">{(crossData.user_b?.username || 'B').substring(0, 2).toUpperCase()}</div>
                          <div className="cross-node-un">@{crossData.user_b?.username}</div>
                          <span className="cross-node-tag b">博主 B</span>
                        </div>
                      </div>
                    </div>

                    {/* B <-> C 第三方三角关系 */}
                    {crossData.context_relations && crossData.user_c && (
                      <div className="cross-relation-card">
                        <div className="cross-card-header">
                          <span className="cross-card-title">{t('cross_triad_title')}</span>
                          {crossData.direct_relations?.a_follows_b && crossData.context_relations?.b_follows_c && !crossData.direct_relations?.b_follows_a ? (
                            <span className="cross-status-pill warning">
                              ⚠️ 三角单向链条
                            </span>
                          ) : (
                            <span className="cross-status-pill info">
                              第三方视角
                            </span>
                          )}
                        </div>

                        <div className="cross-nodes-flow">
                          <div className="cross-node">
                            <div className="cross-node-avatar">{(crossData.user_b?.username || 'B').substring(0, 2).toUpperCase()}</div>
                            <div className="cross-node-un">@{crossData.user_b?.username}</div>
                            <span className="cross-node-tag b">博主 B</span>
                          </div>

                          <div className="cross-flow-arrows">
                            <div className={`cross-arrow-line ${crossData.context_relations?.b_follows_c ? 'active' : 'inactive'}`}>
                              <span>B ➔ C</span>
                              <span className="arrow-sym">{crossData.context_relations?.b_follows_c ? '✓ 关注' : '✕ 未关注'}</span>
                            </div>
                            <div className={`cross-arrow-line ${crossData.context_relations?.c_follows_b ? 'active' : 'inactive'}`}>
                              <span>C ➔ B</span>
                              <span className="arrow-sym">{crossData.context_relations?.c_follows_b ? '✓ 关注' : '✕ 未关注'}</span>
                            </div>
                          </div>

                          <div className="cross-node">
                            <div className="cross-node-avatar">{(crossData.user_c?.username || 'C').substring(0, 2).toUpperCase()}</div>
                            <div className="cross-node-un">@{crossData.user_c?.username}</div>
                            <span className="cross-node-tag c">第三方 C</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 智能洞察卡片列表 */}
                  {crossData.insights && crossData.insights.length > 0 && (
                    <div className="cross-insights-section">
                      <div className="cross-insights-title">
                        <Sparkles size={15} color="#ec4899" />
                        <span>{t('cross_insights_title')}</span>
                      </div>
                      <div className="cross-insights-grid">
                        {crossData.insights.map((ins, idx) => (
                          <div key={idx} className={`cross-insight-card ${ins.level === 'special' ? 'warning' : ins.level === 'success' ? 'success' : 'info'}`}>
                            <div className="cross-insight-card-title">{lang === 'zh' ? ins.title_zh : ins.title_en}</div>
                            <div className="cross-insight-card-desc">{lang === 'zh' ? ins.desc_zh : ins.desc_en}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 名单探索选项卡 */}
                  <div className="clean-card-box" style={{ marginTop: 20 }}>
                    <div className="cross-subtabs-bar">
                      <div className="cross-subtabs-group">
                        <button 
                          className={`cross-subtab-btn ${crossSubTab === 'mutual_following' ? 'active' : ''}`}
                          onClick={() => { setCrossSubTab('mutual_following'); setCrossPage(1); }}
                        >
                          <UserCheck size={14} />
                          <span>{t('cross_tab_mutual_following')}</span>
                          <span className="cross-tab-count">{crossData.stats?.mutual_following_count || 0}</span>
                        </button>
                        <button 
                          className={`cross-subtab-btn ${crossSubTab === 'mutual_followers' ? 'active' : ''}`}
                          onClick={() => { setCrossSubTab('mutual_followers'); setCrossPage(1); }}
                        >
                          <Users size={14} />
                          <span>{t('cross_tab_mutual_followers')}</span>
                          <span className="cross-tab-count">{crossData.stats?.mutual_followers_count || 0}</span>
                        </button>
                        <button 
                          className={`cross-subtab-btn ${crossSubTab === 'a_only' ? 'active' : ''}`}
                          onClick={() => { setCrossSubTab('a_only'); setCrossPage(1); }}
                        >
                          <span>{t('cross_tab_a_only')}</span>
                          <span className="cross-tab-count">{crossData.a_only_following ? crossData.a_only_following.length : 0}</span>
                        </button>
                        {crossData.user_b?.is_tracked && (
                          <button 
                            className={`cross-subtab-btn ${crossSubTab === 'b_only' ? 'active' : ''}`}
                            onClick={() => { setCrossSubTab('b_only'); setCrossPage(1); }}
                          >
                            <span>{t('cross_tab_b_only')}</span>
                            <span className="cross-tab-count">{crossData.b_only_following ? crossData.b_only_following.length : 0}</span>
                          </button>
                        )}
                      </div>

                      <div className="clean-search-mini">
                        <Search size={13} color="#8e8e8e" />
                        <input 
                          type="text" 
                          placeholder={lang === 'zh' ? '在当前名单中筛选...' : 'Search in list...'} 
                          value={crossSearchQuery}
                          onChange={e => {
                            setCrossSearchQuery(e.target.value);
                            setCrossPage(1);
                          }}
                        />
                      </div>
                    </div>

                    {/* 名单列表内容 */}
                    {paginatedCrossList.length > 0 ? (
                      <div>
                        {paginatedCrossList.map((u, idx) => (
                          <div key={u.pk || u.username || idx} className="clean-list-item">
                            <div className="clean-item-left">
                              <div 
                                className={`clean-avatar ${u.latest_story_at_gmt8 ? 'has-story' : 'no-story'}`}
                                title={t('home_card_avatar_tip')}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenAvatarModal(u);
                                }}
                              >
                                <div className="clean-avatar-inner">
                                  {u.profile_pic_url ? (
                                    <img 
                                      src={getAvatarProxyUrl(u.profile_pic_url)} 
                                      alt={u.username} 
                                      referrerPolicy="no-referrer"
                                      className="avatar-img"
                                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                    />
                                  ) : null}
                                  <span className="avatar-fallback">{(u.username || '?').substring(0, 1).toUpperCase()}</span>
                                </div>
                              </div>

                              <div className="clean-user-info">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <a 
                                    href={`https://www.instagram.com/${u.username}/`} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="clean-un"
                                    title={`在 Instagram 查看 @${u.username}`}
                                  >
                                    @{u.username}
                                  </a>
                                  {u.is_verified && <CheckCircle2 size={12} color="#0095f6" />}
                                  {u.is_private && <Lock size={11} color="#8e8e8e" />}
                                </div>
                                <span className="clean-fn">{u.full_name || '无昵称'}</span>
                              </div>
                            </div>

                            <div className="clean-item-right">
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {u.latest_story_at_gmt8 && (
                                  <span className="table-tag story">
                                    <Flame size={10} /> {t('list_tag_story')}
                                  </span>
                                )}
                                <button 
                                  className="clean-action-circle"
                                  onClick={() => {
                                    navigator.clipboard.writeText(u.username);
                                    showToast(`已复制 @${u.username}`);
                                  }}
                                  title="复制用户名"
                                >
                                  <Copy size={12} />
                                </button>
                                {u.pk && (
                                  <button 
                                    className="clean-action-circle"
                                    onClick={() => handleOpenInspectModal(u)}
                                    title="查看原始参数"
                                  >
                                    <Code size={12} />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}

                        {renderPagination(
                          crossPage,
                          filteredCrossList.length,
                          crossPageSize,
                          setCrossPage,
                          setCrossPageSize
                        )}
                      </div>
                    ) : (
                      <div className="clean-empty-box" style={{ border: 'none' }}>
                        <div className="clean-empty-icon">
                          <Users size={24} />
                        </div>
                        <div className="clean-empty-title">{t('cross_empty_mutual')}</div>
                        <div className="clean-empty-text">
                          {crossData.user_b?.is_tracked 
                            ? (lang === 'zh' ? '该分类下未匹配到人员' : 'No users found in this category')
                            : (lang === 'zh' ? '博主 B 为外部未追踪账号，系统已完成直接关注与三角拓扑核验，但无法比对 B 的完整本地名单。' : 'Target B is not tracked locally.')
                          }
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="cross-intro-card">
                  <div className="cross-intro-icon">
                    <Share2 size={36} color="var(--ig-primary)" />
                  </div>
                  <div className="cross-intro-title">
                    {lang === 'zh' ? '选择博主并开始跨账号社交圈与关系分析' : 'Select Creators & Start Cross-Network Analysis'}
                  </div>
                  <div className="cross-intro-desc">
                    {lang === 'zh' 
                      ? '支持精准对比视角博主 A 与目标 B 的直接互关状态、共同关注好友、共同粉丝、以及结合第三方博主 C 的三角链条（如：A关注了B，C的粉丝中有B，但B却未关注A）。'
                      : 'Supports bi-directional follow verification, mutual following & followers discovery, and triadic relationship analysis across creators.'}
                  </div>
                  <button 
                    className="ig-nav-btn primary"
                    style={{ margin: '0 auto' }}
                    onClick={() => handleRunCrossAnalysis()}
                    disabled={crossLoading}
                  >
                    <GitCompare size={14} />
                    <span>{crossLoading ? t('cross_loading') : t('cross_btn_analyze')}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      )}
        </main>


      {/* 模态框: 帖子详情与互动 Lightbox */}
      {selectedPostModal && (
        <PostLightboxModal 
          selectedPostModal={selectedPostModal}
          onClose={() => setSelectedPostModal(null)}
          t={t}
          lang={lang}
          API_BASE={API_BASE}
          showToast={showToast}
          selectedUser={selectedUser}
        />
      )}

      {/* 模态框: 24h 快拍单张 Lightbox */}
      {selectedStoryMedia && (
        <StoryLightboxModal 
          selectedStoryMedia={selectedStoryMedia}
          onClose={() => setSelectedStoryMedia(null)}
          t={t}
          API_BASE={API_BASE}
        />
      )}

      {/* 模态框: 精选快拍 3D 长方棱柱 Lightbox */}
      {selectedHighlightTray && selectedHighlightTray.items && selectedHighlightTray.items.length > 0 && (
        <HighlightLightboxModal 
          selectedHighlightTray={selectedHighlightTray}
          setSelectedHighlightTray={setSelectedHighlightTray}
          activeHighlightStoryIndex={activeHighlightStoryIndex}
          setActiveHighlightStoryIndex={setActiveHighlightStoryIndex}
          currentProfilePicUrl={currentProfilePicUrl}
          selectedUser={selectedUser}
          highlightsData={highlightsData}
          onClose={() => setSelectedHighlightTray(null)}
          t={t}
          lang={lang}
          API_BASE={API_BASE}
        />
      )}
    </>
  );
}
