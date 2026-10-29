import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Users,
  UserPlus,
  UserMinus,
  Search,
  ExternalLink,
  Terminal,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Calendar,
  Lock,
  Globe,
  RefreshCw,
  Settings,
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
  User,
  Filter,
  ArrowLeft,
  Sparkles,
  Layers,
  ChevronRight,
  ChevronLeft,
  Trash2,
  AtSign,
  SlidersHorizontal,
  Palette,
  Database,
  RotateCcw,
  Repeat,
  Share2,
  GitCompare,
  UserCheck,
  Grid,
  Heart,
  LogOut,
  Bookmark,
  BookmarkCheck,
  History,
  ShieldAlert,
  MessageCircle,
  MoreHorizontal,
  Tag,
  Volume2,
  VolumeX,
  Disc,
  Smartphone,
  Archive,
  FolderOpen,
  FolderDown,
  FileText
} from 'lucide-react';
import './App.css';
import LoginPage from './pages/LoginPage';
import { translations, getTranslation, formatToAmPm, formatRelativeTime } from './i18n';

export const GOOGLE_CLIENT_ID = "1027473678070-7qnnq1mr9j6g1gi3jtkk5gbq5o6gpoo5.apps.googleusercontent.com";

export const getAuthToken = () => {
  return localStorage.getItem('ig_user_token') || '';
};

export const authFetch = async (url, options = {}) => {
  const token = getAuthToken();
  const headers = { ...(options.headers || {}) };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return fetch(url, { ...options, headers });
};

// 全局 API 请求自动附加 Ngrok 标头并自动注入 Bearer Token
if (typeof window !== 'undefined' && window.fetch) {
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const [resource, config] = args;
    if (typeof resource === 'string' && (resource.includes('ngrok') || resource.includes('/api/'))) {
      const newConfig = { ...(config || {}) };
      const headers = {
        ...(newConfig.headers || {}),
        'ngrok-skip-browser-warning': 'true'
      };
      const token = localStorage.getItem('ig_user_token');
      if (token && !headers['Authorization']) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      newConfig.headers = headers;
      return originalFetch.call(this, resource, newConfig);
    }
    return originalFetch.apply(this, args);
  };
}

export default function App() {
  // 0. 多语言切换 (zh / en)
  const [lang, setLang] = useState(() => localStorage.getItem('ig_track_lang') || 'zh');
  const t = (key, params) => getTranslation(key, lang, params);
  const toggleLang = () => {
    const next = lang === 'zh' ? 'en' : 'zh';
    setLang(next);
    localStorage.setItem('ig_track_lang', next);
  };

  // 1. 页面导航与选定用户
  const [currentPage, setCurrentPage] = useState('home'); // 'home' | 'profile'
  const [selectedUser, setSelectedUser] = useState('kohyingliew');
  const [activeProfileTab, setActiveProfileTab] = useState('posts'); // 'posts' | 'stories' | 'highlights' | 'reposts' | 'tagged' | 'following' | 'followers' | 'details'

  // 2. 服务状态与Cookie
  const [serverStatus, setServerStatus] = useState({ has_cookie: false, cookie_preview: '', task: {} });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [manualCookie, setManualCookie] = useState('');
  const [showLogs, setShowLogs] = useState(false);

  // 3. 抓取控制与加载状态 (防假死修复)
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  const isScanningRef = useRef(false);
  const lastTaskStatusRef = useRef('idle');

  // 同步 isScanning 到 ref，避免 setInterval 闭包陈旧 bug
  useEffect(() => {
    isScanningRef.current = isScanning;
  }, [isScanning]);

  // 4. 用户列表与首页搜索
  const [homeSearchInput, setHomeSearchInput] = useState('');
  const [usersList, setUsersList] = useState([]);

  // PWA 微端应用与安装引导状态
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPwaModal, setShowPwaModal] = useState(false);
  const [pwaPlatform, setPwaPlatform] = useState('ios'); // 'ios' | 'android' | 'desktop'

  // 通用系统与偏好设置 (本地持久化配置)
  const DEFAULT_SETTINGS = {
    listDensity: 'comfortable', // 'compact' | 'comfortable' | 'large'
    storiesSize: 'standard',    // 'standard' | 'large'
    pageSize: 50,               // 25 | 50 | 100
    timeFormat: '12h',          // '12h' | '24h'
    analysisDefault: 'following',// 'following' | 'followers'
  };

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('ig_tracker_general_settings');
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {}
    return DEFAULT_SETTINGS;
  });

  const [activeSettingsTab, setActiveSettingsTab] = useState('appearance'); // 'appearance' | 'preferences' | 'account' | 'storage'

  const updateSetting = (key, value) => {
    setSettings(prev => {
      const updated = { ...prev, [key]: value };
      try {
        localStorage.setItem('ig_tracker_general_settings', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.setItem('ig_tracker_general_settings', JSON.stringify(DEFAULT_SETTINGS));
    } catch (e) {}
    showToast(lang === 'zh' ? '已恢复全部默认设置' : 'Preferences reset to default');
  };

  const formatTime = (timeStr, includeDate = true, includeSeconds = false) => {
    return formatToAmPm(timeStr, includeDate, includeSeconds, settings.timeFormat);
  };

  // 5. 快拍数据 (Stories)
  const [storiesData, setStoriesData] = useState({ username: '', count: 0, items: [] });
  const [selectedStoryMedia, setSelectedStoryMedia] = useState(null);

  // 5.5 全量媒体数据 (Posts, Highlights, Reposts, Tagged)
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
  const [selectedPostModal, setSelectedPostModal] = useState(null); // Post Lightbox modal
  const [selectedHighlightTray, setSelectedHighlightTray] = useState(null); // Highlight viewer modal
  const [activeHighlightStoryIndex, setActiveHighlightStoryIndex] = useState(0); // Highlight story active index
  const [carouselSlideIndex, setCarouselSlideIndex] = useState(0); // Carousel slider active index
  const [showMoreActionsDropdown, setShowMoreActionsDropdown] = useState(false); // Header more options dropdown
  const [postInteractions, setPostInteractions] = useState({}); // { [postKey]: { loading, comments, likers, total_likers_count, comments_count, error } }
  const [lightboxActiveTab, setLightboxActiveTab] = useState('comments'); // 'comments' | 'likers'
  const [likersSearchQuery, setLikersSearchQuery] = useState('');
  const [isRefreshingInteractions, setIsRefreshingInteractions] = useState(false);
  const [isPostAudioPlaying, setIsPostAudioPlaying] = useState(false);
  const [expandedCommentReplies, setExpandedCommentReplies] = useState({}); // { [commentId]: boolean }
  const [archiveSummary, setArchiveSummary] = useState(null);
  const [isArchiving, setIsArchiving] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const postAudioRef = useRef(null);

  const toggleCommentReplies = (commentId) => {
    setExpandedCommentReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  // 手机端帖子多图轮播手势滑动翻页 (Swipe to change post slides)
  const postCarouselTouchRef = useRef({ startX: 0, startY: 0, startTime: 0 });

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

    // 水平滑动手势判定：滑动距离 > 30px，且横向位移显著大于纵向位移，在 650ms 内完成
    if (Math.abs(deltaX) > 30 && Math.abs(deltaX) > Math.abs(deltaY) * 1.15 && deltaTime < 650) {
      if (deltaX < 0) {
        // 向左划（手指向左拉） -> 查看下一张图片
        if (selectedPostModal?.carousel_media && carouselSlideIndex < selectedPostModal.carousel_media.length - 1) {
          setCarouselSlideIndex(prev => prev + 1);
        }
      } else {
        // 向右划（手指向右拉） -> 返回上一张图片
        if (selectedPostModal?.carousel_media && carouselSlideIndex > 0) {
          setCarouselSlideIndex(prev => prev - 1);
        }
      }
    }
  };

  // 手机端快拍 3D 竖向长方体转动与跟手滑动 (Instagram 3D Cube Rotation for Highlights)
  const storyTouchRef = useRef({ startX: 0, startY: 0, startTime: 0, isMoving: false, direction: null });
  const [storyDragOffset, setStoryDragOffset] = useState({ x: 0, y: 0, isDragging: false });
  const [story3DRotation, setStory3DRotation] = useState({ angle: 0, isDragging: false, direction: null });
  const [currentTrayIdx, setCurrentTrayIdx] = useState(0);
  const [storyMuted, setStoryMuted] = useState(false);
  const [storyProgress, setStoryProgress] = useState(0); // 0 ~ 100 对应的快拍进度百分比
  const [isStoryPaused, setIsStoryPaused] = useState(false);
  const storyVideoRef = useRef(null);
  const storyHoldTimeoutRef = useRef(null);

  const storyDidDragRef = useRef(false);

  const handleStoryTouchStart = (e) => {
    storyDidDragRef.current = false;
    const isTouch = !!e.touches;
    if (isTouch && e.touches.length !== 1) return;
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;

    storyTouchRef.current = {
      startX: clientX,
      startY: clientY,
      startTime: Date.now(),
      isMoving: false,
      direction: null
    };
    setStoryDragOffset({ x: 0, y: 0, isDragging: true });
    setStory3DRotation({ angle: 0, isDragging: true, direction: null });

    // Instagram 核心交互: 长按定格查看，暂停播放与白条进度
    storyHoldTimeoutRef.current = setTimeout(() => {
      if (!storyTouchRef.current.isMoving) {
        setIsStoryPaused(true);
        if (storyVideoRef.current && !storyVideoRef.current.paused) {
          storyVideoRef.current.pause();
        }
      }
    }, 220);
  };

  const handleStoryTouchMove = (e) => {
    if (!storyTouchRef.current.startTime) return;
    const isTouch = !!e.touches;
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;
    const deltaX = clientX - storyTouchRef.current.startX;
    const deltaY = clientY - storyTouchRef.current.startY;

    if (!storyTouchRef.current.isMoving) {
      if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) {
        storyTouchRef.current.isMoving = true;
        storyTouchRef.current.direction = Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical';
        // 手指滑动时清除长按定格定时器
        if (storyHoldTimeoutRef.current) {
          clearTimeout(storyHoldTimeoutRef.current);
          storyHoldTimeoutRef.current = null;
        }
      }
    }

    if (storyTouchRef.current.direction === 'horizontal') {
      // 水平滑动：3D 竖向长方形转动切换到不同 Highlight 专辑
      const cardWidth = window.innerWidth <= 768 ? window.innerWidth : 420;
      const progressRatio = deltaX / cardWidth;
      let rawAngle = progressRatio * 90; // -90 deg to +90 deg

      const allTrays = highlightsData?.trays && highlightsData.trays.length > 0 ? highlightsData.trays : (selectedHighlightTray ? [selectedHighlightTray] : []);
      const foundIdx = allTrays.findIndex(t => (t.id && selectedHighlightTray?.id && t.id === selectedHighlightTray.id) || t.title === selectedHighlightTray?.title);
      const activeIdx = foundIdx >= 0 ? foundIdx : currentTrayIdx;
      const hasNext = activeIdx < allTrays.length - 1;
      const hasPrev = activeIdx > 0;

      if (deltaX < 0) {
        if (hasNext) {
          // 有下一个 highlight 专辑：3D 立方体长方形旋转
          const rawAngle = Math.max(-90, Math.min(0, progressRatio * 90));
          setStory3DRotation({ angle: rawAngle, isDragging: true, direction: 'next' });
          setStoryDragOffset({ x: 0, y: 0, isDragging: true });
        } else {
          // 只有一个 highlight 或已是最后一个 highlight：跟手横向滑出，丝滑动画退出回到 user 页面
          setStory3DRotation({ angle: 0, isDragging: true, direction: null });
          setStoryDragOffset({ x: deltaX, y: 0, isDragging: true });
        }
      } else {
        if (hasPrev) {
          // 有上一个 highlight 专辑：3D 立方体长方形旋转
          const rawAngle = Math.max(0, Math.min(90, progressRatio * 90));
          setStory3DRotation({ angle: rawAngle, isDragging: true, direction: 'prev' });
          setStoryDragOffset({ x: 0, y: 0, isDragging: true });
        } else {
          // 首个专辑向右划：阻尼回弹
          const dampedX = deltaX * 0.25;
          setStory3DRotation({ angle: 0, isDragging: true, direction: null });
          setStoryDragOffset({ x: dampedX, y: 0, isDragging: true });
        }
      }
    } else if (storyTouchRef.current.direction === 'vertical' && deltaY > 0) {
      // 竖直下拉：下拉退出跟手动画
      setStoryDragOffset({ x: 0, y: deltaY, isDragging: true });
    }
  };

  const handleStoryTouchEnd = () => {
    if (storyHoldTimeoutRef.current) {
      clearTimeout(storyHoldTimeoutRef.current);
      storyHoldTimeoutRef.current = null;
    }
    // 松手恢复播放
    setIsStoryPaused(false);
    if (storyVideoRef.current && storyVideoRef.current.paused) {
      storyVideoRef.current.play().catch(() => {});
    }

    if (!storyTouchRef.current.startTime) return;
    const deltaTime = Date.now() - storyTouchRef.current.startTime;
    const wasMoving = storyTouchRef.current.isMoving;
    const dir = storyTouchRef.current.direction;
    const currentAngle = story3DRotation.angle;
    const currentX = storyDragOffset.x;
    const currentY = storyDragOffset.y;

    storyTouchRef.current = { startX: 0, startY: 0, startTime: 0, isMoving: false, direction: null };

    if (!wasMoving) {
      setStoryDragOffset({ x: 0, y: 0, isDragging: false });
      setStory3DRotation({ angle: 0, isDragging: false, direction: null });
      return;
    }

    storyDidDragRef.current = true;
    setTimeout(() => { storyDidDragRef.current = false; }, 400);

    if (dir === 'horizontal') {
      const allTrays = highlightsData?.trays && highlightsData.trays.length > 0 ? highlightsData.trays : (selectedHighlightTray ? [selectedHighlightTray] : []);
      const foundIdx = allTrays.findIndex(t => (t.id && selectedHighlightTray?.id && t.id === selectedHighlightTray.id) || t.title === selectedHighlightTray?.title);
      const activeIdx = foundIdx >= 0 ? foundIdx : currentTrayIdx;
      const hasNext = activeIdx < allTrays.length - 1;
      const hasPrev = activeIdx > 0;

      if (currentAngle < 0 || currentX < 0) {
        // 向左划
        if (hasNext) {
          const isFlipNext = (currentAngle < -20) || (currentAngle < -10 && deltaTime < 320);
          if (isFlipNext) {
            setStory3DRotation({ angle: -90, isDragging: false, direction: 'next' });
            setTimeout(() => {
              const nextIdx = activeIdx + 1;
              const nextTrayObj = allTrays[nextIdx];
              setCurrentTrayIdx(nextIdx);
              setSelectedHighlightTray(nextTrayObj);
              setActiveHighlightStoryIndex(0);
              setStoryProgress(0);
              setStory3DRotation({ angle: 0, isDragging: false, direction: null });
            }, 260);
          } else {
            setStory3DRotation({ angle: 0, isDragging: false, direction: null });
          }
        } else {
          // 只有一个 highlight 或已是最后一个：左划超过 45px 或快划，丝滑滑出屏幕回到 user 页面
          const isSwipeExit = (currentX < -45) || (currentX < -15 && deltaTime < 320);
          if (isSwipeExit) {
            setStoryDragOffset({ x: -window.innerWidth * 1.15, y: 0, isDragging: false });
            setTimeout(() => {
              closeActiveModal();
              setStoryDragOffset({ x: 0, y: 0, isDragging: false });
              setStory3DRotation({ angle: 0, isDragging: false, direction: null });
            }, 220);
          } else {
            setStoryDragOffset({ x: 0, y: 0, isDragging: false });
          }
        }
      } else if (currentAngle > 0 || currentX > 0) {
        // 向右划
        if (hasPrev) {
          const isFlipPrev = (currentAngle > 20) || (currentAngle > 10 && deltaTime < 320);
          if (isFlipPrev) {
            setStory3DRotation({ angle: 90, isDragging: false, direction: 'prev' });
            setTimeout(() => {
              const prevIdx = activeIdx - 1;
              const prevTrayObj = allTrays[prevIdx];
              setCurrentTrayIdx(prevIdx);
              setSelectedHighlightTray(prevTrayObj);
              setActiveHighlightStoryIndex(0);
              setStoryProgress(0);
              setStory3DRotation({ angle: 0, isDragging: false, direction: null });
            }, 260);
          } else {
            setStory3DRotation({ angle: 0, isDragging: false, direction: null });
          }
        } else {
          setStoryDragOffset({ x: 0, y: 0, isDragging: false });
        }
      } else {
        setStoryDragOffset({ x: 0, y: 0, isDragging: false });
        setStory3DRotation({ angle: 0, isDragging: false, direction: null });
      }
    } else if (dir === 'vertical') {
      if (currentY > 80) {
        // 下拉超过 80px，平滑下拉退出快拍
        setStoryDragOffset({ x: 0, y: window.innerHeight * 0.85, isDragging: false });
        setTimeout(() => {
          closeActiveModal();
          setStoryDragOffset({ x: 0, y: 0, isDragging: false });
          setStory3DRotation({ angle: 0, isDragging: false, direction: null });
        }, 180);
      } else {
        // 回弹
        setStoryDragOffset({ x: 0, y: 0, isDragging: false });
      }
    } else {
      setStoryDragOffset({ x: 0, y: 0, isDragging: false });
      setStory3DRotation({ angle: 0, isDragging: false, direction: null });
    }
  };

  const [customApiUrl, setCustomApiUrl] = useState(() => localStorage.getItem('ig_api_base') || '');
  const [apiTestStatus, setApiTestStatus] = useState(null);
  const [isTestingApi, setIsTestingApi] = useState(false);

  const handleTestApiConnection = async (testUrl) => {
    const target = (testUrl || customApiUrl || API_BASE).trim().replace(/\/+$/, '');
    if (!target) return;
    setIsTestingApi(true);
    setApiTestStatus(null);
    try {
      const resp = await fetch(`${target}/api/users`, { signal: AbortSignal.timeout(6000) });
      if (resp.ok) {
        setApiTestStatus({ success: true, msg: lang === 'zh' ? '连接成功！后端运行正常' : 'Connected successfully!' });
      } else {
        setApiTestStatus({ success: false, msg: `HTTP ${resp.status}` });
      }
    } catch (e) {
      setApiTestStatus({ success: false, msg: lang === 'zh' ? '连接失败，请确认隧道或后端正在运行' : 'Failed to connect. Check tunnel status.' });
    } finally {
      setIsTestingApi(false);
    }
  };

  const handleSaveApiUrl = () => {
    const cleaned = customApiUrl.trim().replace(/\/+$/, '');
    if (cleaned) {
      localStorage.setItem('ig_api_base', cleaned);
    } else {
      localStorage.removeItem('ig_api_base');
    }
    API_BASE = getApiBase();
    window.location.reload();
  };

  // 获取博主全量归档信息
  const fetchArchiveSummary = async (username) => {
    if (!username) return;
    try {
      const res = await fetch(`${API_BASE}/api/archive/${username}/summary`);
      const data = await res.json();
      if (data.status === 'ok') {
        setArchiveSummary(data.summary);
      } else {
        setArchiveSummary(null);
      }
    } catch (e) {
      console.error("fetchArchiveSummary failed:", e);
    }
  };

  // 触发全量归档到本地
  const startFullArchive = async (username) => {
    if (!username) return;
    setIsArchiving(true);
    try {
      const res = await fetch(`${API_BASE}/api/archive/${username}`, { method: 'POST' });
      const data = await res.json();
      if (data.status === 'started') {
        setShowTerminal(true);
      } else if (data.status === 'busy') {
        alert(data.message || '已有任务正在进行');
        setIsArchiving(false);
      }
    } catch (e) {
      console.error("startFullArchive error:", e);
      setIsArchiving(false);
    }
  };

  // 在系统资源管理器中打开本地归档文件夹
  const openArchiveFolder = async (username) => {
    if (!username) return;
    try {
      const res = await fetch(`${API_BASE}/api/archive/${username}/open_folder`, { method: 'POST' });
      const data = await res.json();
      if (data.status === 'ok') {
        // 成功打开本地文件夹
      } else {
        alert(data.message || '打开目录失败');
      }
    } catch (e) {
      console.error("openArchiveFolder error:", e);
    }
  };

  // 抓取帖子互动（评论与点赞名单）
  const fetchPostInteractions = async (username, codeOrPk, forceRefresh = false) => {
    if (!username || !codeOrPk) return;
    const targetUser = username.replace(/^@/, '').toLowerCase().trim();
    const key = String(codeOrPk);

    if (!forceRefresh && postInteractions[key] && !postInteractions[key].loading && (postInteractions[key].comments || postInteractions[key].likers)) {
      return;
    }

    setPostInteractions(prev => ({
      ...prev,
      [key]: { ...(prev[key] || {}), loading: true, error: null }
    }));
    if (forceRefresh) setIsRefreshingInteractions(true);

    try {
      const url = `${API_BASE}/api/posts/${targetUser}/${key}/interactions${forceRefresh ? '?refresh=true' : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && data.status === 'ok' && data.data) {
        setPostInteractions(prev => ({
          ...prev,
          [key]: {
            loading: false,
            comments: data.data.comments || [],
            likers: data.data.likers || [],
            total_likers_count: data.data.total_likers_count || (data.data.likers || []).length,
            comments_count: data.data.comments_count || (data.data.comments || []).length,
            updated_at: data.data.updated_at,
            error: null
          }
        }));
      } else {
        setPostInteractions(prev => ({
          ...prev,
          [key]: { ...(prev[key] || {}), loading: false, error: data?.message || 'Failed to fetch interactions' }
        }));
      }
    } catch (err) {
      console.error('Failed to fetch post interactions:', err);
      setPostInteractions(prev => ({
        ...prev,
        [key]: { ...(prev[key] || {}), loading: false, error: err.message }
      }));
    } finally {
      if (forceRefresh) setIsRefreshingInteractions(false);
    }
  };

  // 监听打开贴文 Lightbox 弹窗，自动抓取并预加载评论和点赞名单
  useEffect(() => {
    if (selectedPostModal) {
      setLightboxActiveTab('comments');
      setLikersSearchQuery('');
      setExpandedCommentReplies({});
      const targetUser = selectedPostModal.author?.username || selectedUser;
      const codeOrPk = selectedPostModal.code || selectedPostModal.pk;
      if (targetUser && codeOrPk) {
        fetchPostInteractions(targetUser, codeOrPk, false);
      }
    }
  }, [selectedPostModal]);

  // 监听打开贴文 Lightbox 弹窗，控制背景音乐播放
  useEffect(() => {
    if (!selectedPostModal) {
      if (postAudioRef.current) {
        postAudioRef.current.pause();
      }
      setIsPostAudioPlaying(false);
      return;
    }

    const music = selectedPostModal.music;
    const hasAudio = music && music.has_audio && music.audio_url;
    const isVid = selectedPostModal.is_video || selectedPostModal.video_url;

    if (hasAudio && !isVid) {
      const startSec = (music.start_time_ms || 0) / 1000;
      const timer = setTimeout(() => {
        const audioEl = postAudioRef.current;
        if (audioEl) {
          audioEl.currentTime = startSec;
          audioEl.play().then(() => {
            setIsPostAudioPlaying(true);
          }).catch(() => {
            setIsPostAudioPlaying(false);
          });
        }
      }, 150);
      return () => clearTimeout(timer);
    } else {
      setIsPostAudioPlaying(false);
      if (postAudioRef.current) {
        postAudioRef.current.pause();
      }
    }
  }, [selectedPostModal]);

  // 轮播切换时，如果切换到视频幻灯片，则暂停背景音乐；如果是图片幻灯片，若此前在播放则恢复
  useEffect(() => {
    if (!selectedPostModal?.carousel_media?.length || !postAudioRef.current) return;
    const currentSlide = selectedPostModal.carousel_media[carouselSlideIndex] || selectedPostModal.carousel_media[0];
    const isSlideVideo = currentSlide.media_type === 2 || (currentSlide.video_versions && currentSlide.video_versions.length > 0) || currentSlide.video_url;
    if (isSlideVideo && isPostAudioPlaying) {
      postAudioRef.current.pause();
      setIsPostAudioPlaying(false);
    }
  }, [carouselSlideIndex]);

  const togglePostAudio = () => {
    if (!postAudioRef.current) return;
    if (isPostAudioPlaying) {
      postAudioRef.current.pause();
      setIsPostAudioPlaying(false);
    } else {
      postAudioRef.current.play().then(() => {
        setIsPostAudioPlaying(true);
      }).catch(err => {
        console.error("Audio playback failed:", err);
      });
    }
  };

  const handlePrevHighlightStory = () => {
    setStoryProgress(0);
    if (activeHighlightStoryIndex > 0) {
      setActiveHighlightStoryIndex(prev => prev - 1);
    } else {
      // 位于当前专辑第1条时，点击上一条将 3D 立体翻转回上一个 highlight 专辑
      const allTrays = highlightsData?.trays && highlightsData.trays.length > 0 ? highlightsData.trays : (selectedHighlightTray ? [selectedHighlightTray] : []);
      if (currentTrayIdx > 0 && allTrays[currentTrayIdx - 1]) {
        const prevTrayObj = allTrays[currentTrayIdx - 1];
        setStory3DRotation({ angle: 90, isDragging: false, direction: 'prev' });
        setTimeout(() => {
          const prevIdx = currentTrayIdx - 1;
          setCurrentTrayIdx(prevIdx);
          setSelectedHighlightTray(prevTrayObj);
          setActiveHighlightStoryIndex(prevTrayObj.items?.length ? prevTrayObj.items.length - 1 : 0);
          setStoryProgress(0);
          setStory3DRotation({ angle: 0, isDragging: false, direction: null });
        }, 260);
      }
    }
  };

  const handleNextHighlightStory = () => {
    setStoryProgress(0);
    if (!selectedHighlightTray?.items) return;
    if (activeHighlightStoryIndex < selectedHighlightTray.items.length - 1) {
      setActiveHighlightStoryIndex(prev => prev + 1);
    } else {
      // 位于当前专辑最后1条时，播完或点击下一条将 3D 立体翻转到下一个 highlight 专辑
      const allTrays = highlightsData?.trays && highlightsData.trays.length > 0 ? highlightsData.trays : (selectedHighlightTray ? [selectedHighlightTray] : []);
      if (currentTrayIdx < allTrays.length - 1 && allTrays[currentTrayIdx + 1]) {
        const nextTrayObj = allTrays[currentTrayIdx + 1];
        setStory3DRotation({ angle: -90, isDragging: false, direction: 'next' });
        setTimeout(() => {
          const nextIdx = currentTrayIdx + 1;
          setCurrentTrayIdx(nextIdx);
          setSelectedHighlightTray(nextTrayObj);
          setActiveHighlightStoryIndex(0);
          setStoryProgress(0);
          setStory3DRotation({ angle: 0, isDragging: false, direction: null });
        }, 260);
      } else {
        closeActiveModal();
      }
    }
  };

  // 快拍顶部白色进度条动画驱动 (对应视频真实时长或图片5秒时长，播完自动播放下一个story)
  useEffect(() => {
    if (!selectedHighlightTray || !selectedHighlightTray.items || selectedHighlightTray.items.length === 0) {
      setStoryProgress(0);
      return;
    }
    setStoryProgress(0);

    const currentStory = selectedHighlightTray.items[activeHighlightStoryIndex];
    if (!currentStory) return;
    const isVid = currentStory.media_type === 2 || (currentStory.video_versions && currentStory.video_versions.length > 0) || currentStory.video_url;

    if (isVid) {
      let animId;
      const syncVideo = () => {
        const v = storyVideoRef.current;
        if (v && v.duration && !isNaN(v.duration) && v.duration > 0) {
          const pct = (v.currentTime / v.duration) * 100;
          setStoryProgress(Math.min(100, Math.max(0, pct)));
          // 兜底保护：若个别移动端浏览器未触发 onEnded 事件，接近结束时自动切下一条
          if (v.currentTime >= v.duration - 0.08 && v.currentTime > 0.5) {
            handleNextHighlightStory();
            return;
          }
        }
        if (!isStoryPaused) {
          animId = requestAnimationFrame(syncVideo);
        }
      };
      animId = requestAnimationFrame(syncVideo);
      return () => {
        if (animId) cancelAnimationFrame(animId);
      };
    } else {
      // 图片快拍模式：标准 5 秒自动切页
      if (isStoryPaused) return;
      const photoDuration = 5000;
      const startTime = Date.now();
      const timerId = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const pct = Math.min(100, (elapsed / photoDuration) * 100);
        setStoryProgress(pct);
        if (pct >= 100) {
          clearInterval(timerId);
          handleNextHighlightStory();
        }
      }, 25);
      return () => {
        if (timerId) clearInterval(timerId);
      };
    }
  }, [selectedHighlightTray, activeHighlightStoryIndex, isStoryPaused]);

  // 键盘快捷键监听 (左键/右键/Esc 沉浸式查看快拍故事与多图帖子)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedHighlightTray) {
        if (e.key === 'ArrowLeft') handlePrevHighlightStory();
        else if (e.key === 'ArrowRight') handleNextHighlightStory();
        else if (e.key === 'Escape') setSelectedHighlightTray(null);
      } else if (selectedPostModal) {
        if (e.key === 'Escape') {
          setSelectedPostModal(null);
        } else if (selectedPostModal.carousel_media && selectedPostModal.carousel_media.length > 1) {
          if (e.key === 'ArrowLeft') {
            setCarouselSlideIndex(prev => Math.max(0, prev - 1));
          } else if (e.key === 'ArrowRight') {
            setCarouselSlideIndex(prev => Math.min(selectedPostModal.carousel_media.length - 1, prev + 1));
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedHighlightTray, activeHighlightStoryIndex, selectedPostModal, carouselSlideIndex]);

  // 6. 历史快照与对比分析
  const [historyFiles, setHistoryFiles] = useState([]);
  const [analysisMode, setAnalysisMode] = useState(settings.analysisDefault || 'following'); // 'following' | 'followers'
  const [selectedSnapshot, setSelectedSnapshot] = useState('');
  const [selectedBaseSnapshot, setSelectedBaseSnapshot] = useState('');
  const [snapshotData, setSnapshotData] = useState(null); // 当前快照内容
  const [diffData, setDiffData] = useState(null); // 对比结果

  // 6.5 跨博主社交圈与关系分析
  const [detailsViewMode, setDetailsViewMode] = useState('history_diff'); // 'history_diff' | 'cross_network'
  const [crossUserA, setCrossUserA] = useState('');
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

  // 7. 关注/粉丝单列表数据 (简化纯净视图)
  const [followingUsers, setFollowingUsers] = useState([]);
  const [followersUsers, setFollowersUsers] = useState([]);
  const [simpleSearchQuery, setSimpleSearchQuery] = useState('');

  // 分页状态 (每页可调节 20, 50, 100)
  const [followingPage, setFollowingPage] = useState(1);
  const [followingPageSize, setFollowingPageSize] = useState(settings.pageSize || 50);

  const [followersPage, setFollowersPage] = useState(1);
  const [followersPageSize, setFollowersPageSize] = useState(settings.pageSize || 50);

  // 8. 详情分析页的筛选、搜索与分页
  const [detailsFilter, setDetailsFilter] = useState('all'); // 'all' | 'added' | 'removed' | 'story' | 'private'
  const [detailsSearchQuery, setDetailsSearchQuery] = useState('');
  const [detailsPage, setDetailsPage] = useState(1);
  const [detailsPageSize, setDetailsPageSize] = useState(50);

  // 9. 删除确认模态框
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 10. 头像预览与下载模态框
  const [avatarModalData, setAvatarModalData] = useState(null);
  const handleOpenAvatarModal = (userObj) => {
    if (!userObj) return;
    setAvatarModalData({
      username: userObj.username,
      full_name: userObj.full_name || '',
      profile_pic_url: userObj.profile_pic_url || ''
    });
    pushModalHistory('avatar');
  };

  // 11. 原始参数模态框
  const [inspectUser, setInspectUser] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // 12. 临时轻提示
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (text) => {
    setToastMessage(text);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 同步状态到 Ref 以便给 window.onpopstate (手机返回手势) 读取最新值
  const currentPageRef = useRef(currentPage);
  const selectedUserRef = useRef(selectedUser);
  const selectedPostModalRef = useRef(selectedPostModal);
  const selectedStoryMediaRef = useRef(selectedStoryMedia);
  const selectedHighlightTrayRef = useRef(selectedHighlightTray);
  const showSettingsModalRef = useRef(showSettingsModal);
  const showPwaModalRef = useRef(showPwaModal);
  const avatarModalDataRef = useRef(avatarModalData);
  const userToDeleteRef = useRef(userToDelete);
  const inspectUserRef = useRef(inspectUser);

  useEffect(() => { currentPageRef.current = currentPage; }, [currentPage]);
  useEffect(() => { selectedUserRef.current = selectedUser; }, [selectedUser]);
  useEffect(() => { selectedPostModalRef.current = selectedPostModal; }, [selectedPostModal]);
  useEffect(() => { selectedStoryMediaRef.current = selectedStoryMedia; }, [selectedStoryMedia]);
  useEffect(() => { selectedHighlightTrayRef.current = selectedHighlightTray; }, [selectedHighlightTray]);
  useEffect(() => { showSettingsModalRef.current = showSettingsModal; }, [showSettingsModal]);
  useEffect(() => { showPwaModalRef.current = showPwaModal; }, [showPwaModal]);
  useEffect(() => { avatarModalDataRef.current = avatarModalData; }, [avatarModalData]);
  useEffect(() => { userToDeleteRef.current = userToDelete; }, [userToDelete]);
  useEffect(() => { inspectUserRef.current = inspectUser; }, [inspectUser]);

  // 手机端返回手势与历史栈管理:
  const pushModalHistory = (name) => {
    const curHash = window.location.hash || '';
    if (!curHash.includes('modal=')) {
      const newHash = curHash ? `${curHash}&modal=${name}` : `#modal=${name}`;
      window.history.pushState({ modal: name }, '', newHash);
    }
  };

  // 关闭所有浮层弹窗 (优先触发 history.back 保持手机手势连贯)
  const closeActiveModal = () => {
    setStoryProgress(0);
    setIsStoryPaused(false);
    if (window.location.hash.includes('modal=') && window.history.length > 1) {
      window.history.back();
    } else {
      setSelectedPostModal(null);
      setSelectedStoryMedia(null);
      setSelectedHighlightTray(null);
      setShowSettingsModal(false);
      setShowPwaModal(false);
      setAvatarModalData(null);
      setUserToDelete(null);
      setInspectUser(null);
      if (window.location.hash.includes('modal=')) {
        const cleanHash = window.location.hash.split('&modal=')[0].replace(/^#modal=[^&]*/, '');
        window.history.replaceState(null, '', cleanHash || window.location.pathname);
      }
    }
  };

  const handleOpenPostModal = (item) => {
    setCarouselSlideIndex(0);
    setSelectedPostModal(item);
    pushModalHistory('post');
  };

  const handleOpenStoryMedia = (item) => {
    setSelectedStoryMedia(item);
    pushModalHistory('story_media');
  };

  const handleOpenHighlightModal = (tray, startIndex = 0) => {
    const allTrays = highlightsData?.trays || [];
    const tIdx = allTrays.findIndex(t => (t.id && tray.id && t.id === tray.id) || t.title === tray.title);
    setCurrentTrayIdx(tIdx >= 0 ? tIdx : 0);
    setSelectedHighlightTray(tray);
    setActiveHighlightStoryIndex(startIndex);
    setStoryProgress(0);
    setStory3DRotation({ angle: 0, isDragging: false, direction: null });
    pushModalHistory('highlight');
  };

  const handleOpenSettingsModal = () => {
    setShowSettingsModal(true);
    pushModalHistory('settings');
  };

  const handleOpenPwaModal = () => {
    setShowPwaModal(true);
    pushModalHistory('pwa');
  };

  const handleOpenDeleteModal = (username) => {
    setUserToDelete(username);
    pushModalHistory('delete');
  };

  const handleOpenInspectModal = (userObj) => {
    setInspectUser(userObj);
    pushModalHistory('inspect');
  };

  const logsEndRef = useRef(null);

  // 头像在线安全代理 (解决 Instagram CDN cross-origin-resource-policy: same-origin 浏览器防盗链拦截)
  const getAvatarProxyUrl = (rawUrl) => {
    if (!rawUrl) return '';
    if (rawUrl.startsWith('http://localhost') || rawUrl.startsWith('/data/')) return rawUrl;
    return `${API_BASE}/api/avatar_proxy?url=${encodeURIComponent(rawUrl)}`;
  };

  const [headerAvatarUrl, setHeaderAvatarUrl] = useState('');
  useEffect(() => {
    if (selectedUser) {
      if (storiesData?.profile_pic_url) {
        setHeaderAvatarUrl(storiesData.profile_pic_url);
      } else {
        const localUser = usersList.find(x => x.username.toLowerCase() === selectedUser.toLowerCase());
        if (localUser && localUser.profile_pic_url) {
          setHeaderAvatarUrl(localUser.profile_pic_url);
        } else {
          fetch(`${API_BASE}/api/user_avatar/${selectedUser}`)
            .then(r => r.json())
            .then(d => {
              if (d.profile_pic_url) {
                setHeaderAvatarUrl(d.profile_pic_url);
              }
            })
            .catch(() => {});
        }
      }
    }
  }, [selectedUser, storiesData, usersList]);

  // 计算当前博主头像 URL
  const currentProfilePicUrl = useMemo(() => {
    if (headerAvatarUrl) return headerAvatarUrl;
    if (storiesData?.profile_pic_url) return storiesData.profile_pic_url;
    const u = usersList.find(x => x.username.toLowerCase() === selectedUser.toLowerCase());
    return u?.profile_pic_url || '';
  }, [headerAvatarUrl, storiesData, usersList, selectedUser]);

  // 获取所有归档用户列表
  const fetchUsersList = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/users`);
      const data = await res.json();
      const list = data.users || [];
      setUsersList(list);

      // 安全防范：校验当前 URL Hash 中的博主是否属于当前登录用户的追踪列表
      const curHash = window.location.hash || '';
      if (curHash.startsWith('#user=')) {
        const rawUser = curHash.replace('#user=', '').split('&')[0];
        const cleanUser = sanitizeUsername(rawUser);
        const isTracked = list.some(u => u.username.toLowerCase() === cleanUser.toLowerCase());
        if (!cleanUser || !isTracked) {
          // 当前用户没有追踪此博主，杜绝展示其数据，重置回专属首页
          console.warn(`[Security] 博主 @${cleanUser} 不属于当前用户的追踪列表，自动返回看板`);
          setCurrentPage('home');
          setSelectedUser('');
          window.history.replaceState({ page: 'home', root: true }, '', window.location.pathname);
        } else if (cleanUser && currentPageRef.current !== 'profile') {
          navigateToProfile(cleanUser, 'posts', false);
        }
      } else if (currentPageRef.current === 'profile' && selectedUserRef.current) {
        const isTracked = list.some(u => u.username.toLowerCase() === selectedUserRef.current.toLowerCase());
        if (!isTracked) {
          setCurrentPage('home');
          setSelectedUser('');
          window.history.replaceState({ page: 'home', root: true }, '', window.location.pathname);
        }
      }
    } catch (e) {
      console.error("加载用户列表失败:", e);
    }
  };

  
  // 获取并轮询后端状态
  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/status`);
      const data = await res.json();
      setServerStatus(data);
      const task = data.task;

      if (task) {
        if (task.status === 'running') {
          setIsScanning(true);
          if (task.mode === 'stories') {
            setScanMessage(`正在抓取 @${task.target} 的 24h 快拍并无损合成音视频...`);
          } else if (['all_media', 'posts', 'highlights', 'reposts', 'tagged'].includes(task.mode)) {
            setScanMessage(`正在深度检索 @${task.target} 的官方帖子、精选专辑、转帖与被标记内容...`);
          } else {
            setScanMessage(`正在采集 @${task.target} 的${task.mode === 'following' ? '关注' : '粉丝'} (第 ${task.current_page || 1} 页，已收录 ${task.total_collected || 0} 人)...`);
          }
        } else if (task.status === 'completed') {
          if (isScanningRef.current || lastTaskStatusRef.current === 'running') {
            setIsScanning(false);
            setScanMessage('');
            showToast(`🎉 @${task.target} 的 ${task.mode === 'stories' ? '24h 快拍' : ['all_media', 'posts', 'highlights', 'reposts', 'tagged'].includes(task.mode) ? '全量媒体数据' : '名单'}采集完成！`);
            fetchUsersList();

            if (task.mode === 'stories') {
              loadStoriesList(task.target);
            } else if (['all_media', 'posts', 'highlights', 'reposts', 'tagged'].includes(task.mode)) {
              loadProfileMedia(task.target);
            } else {
              loadHistoryList(task.result_file, task.target);
            }
            fetchArchiveSummary(task.target || selectedUser);
            setIsArchiving(false);
          }
        } else if (task.status === 'error') {
          if (isScanningRef.current || lastTaskStatusRef.current === 'running') {
            setIsScanning(false);
            setScanMessage('');
            showToast(`❌ 抓取中断: ${task.error_msg || '未知错误'}`);
          }
        }
        lastTaskStatusRef.current = task.status;
      }
    } catch (e) {
      console.warn("API 状态轮询异常:", e);
    }
  };

  // 加载指定博主的 24h 快拍
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
  const sanitizeUsername = (raw) => {
    if (!raw || typeof raw !== 'string') return '';
    const clean = raw.replace('@', '').trim();
    if (!/^[a-zA-Z0-9._]{1,30}$/.test(clean)) return '';
    return clean;
  };

  // 进入博主专属页 (支持手机 History 记录)
  const navigateToProfile = (username, preferredTab = 'posts', pushHistory = true) => {
    const clean = sanitizeUsername(username);
    if (!clean) {
      handleBackToHome();
      return;
    }

    // 若当前已登录且有追踪列表，未追踪博主不能直接展示其数据
    if (currentUser && usersList.length > 0) {
      const isTracked = usersList.some(u => u.username.toLowerCase() === clean.toLowerCase());
      if (!isTracked) {
        showToast(lang === 'zh' ? `⚠️ 您未追踪 @${clean}，已返回您的主页` : `⚠️ @${clean} is not tracked`);
        handleBackToHome();
        return;
      }
    }

    setSelectedUser(clean);
    setActiveProfileTab(preferredTab);
    setCurrentPage('profile');
    loadStoriesList(clean);
    loadHistoryList(null, clean);
    loadProfileMedia(clean);
    fetchArchiveSummary(clean);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (pushHistory) {
      const targetHash = `#user=${clean}`;
      if (window.location.hash !== targetHash) {
        window.history.pushState({ page: 'profile', user: clean }, '', targetHash);
      }
    }
  };

  // 返回主页看板 (优先使用 history.back() 保证手机手势一致)
  const handleBackToHome = () => {
    if (window.location.hash.includes('user=') && window.history.length > 1) {
      window.history.back();
    } else {
      setCurrentPage('home');
      window.history.replaceState({ page: 'home' }, '', window.location.pathname);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };


  // 首页搜索处理
  const handleHomeSearch = () => {
    const raw = homeSearchInput.trim();
    if (!raw) return;
    const clean = raw.replace('@', '').split('/')[0].trim();
    navigateToProfile(clean, 'stories');
  };

  // 触发抓取
  const handleTriggerScrape = async (targetUser, mode) => {
    const clean = (targetUser || selectedUser || '').replace('@', '').trim();
    if (!clean) {
      alert("请输入有效的博主账号！");
      return;
    }
    if (!serverStatus.has_cookie) {
      handleOpenSettingsModal();
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
  const confirmDeleteUserData = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/api/users/${encodeURIComponent(userToDelete)}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`🗑️ ${data.message || `博主 @${userToDelete} 的全部数据已清除`}`);
        setUserToDelete(null);
        await fetchUsersList();

        if (selectedUser === userToDelete) {
          setCurrentPage('home');
        }
      } else {
        alert(data.detail || "删除失败");
      }
    } catch (e) {
      alert("删除失败: " + e.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // 初始化与定时轮询
  useEffect(() => {
    fetchUsersList();
    fetchStatus();

    // PWA 环境检测
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    setIsStandalone(isPWA);

    // 识别当前访问设备平台
    const ua = (window.navigator.userAgent || '').toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setPwaPlatform('ios');
    } else if (/android/.test(ua)) {
      setPwaPlatform('android');
    } else {
      setPwaPlatform('desktop');
    }

    // 捕获 Android / Chrome 浏览器的 PWA 原生安装弹窗事件
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
    });

    // 手机端原生返回手势监听 (通过 popstate 拦截手势，实现关闭弹窗或返回首页)
    const handlePopState = (e) => {
      // 1. 优先关闭已打开的模态框/全屏 Story/设置/PWA 弹窗
      if (
        selectedPostModalRef.current ||
        selectedStoryMediaRef.current ||
        selectedHighlightTrayRef.current ||
        showSettingsModalRef.current ||
        showPwaModalRef.current ||
        avatarModalDataRef.current ||
        userToDeleteRef.current ||
        inspectUserRef.current
      ) {
        setSelectedPostModal(null);
        setSelectedStoryMedia(null);
        setSelectedHighlightTray(null);
        setStoryProgress(0);
        setIsStoryPaused(false);
        setShowSettingsModal(false);
        setShowPwaModal(false);
        setAvatarModalData(null);
        setUserToDelete(null);
        setInspectUser(null);
        return;
      }

      // 2. 若 hash 中已不包含 user 且当前在 profile 页，安全返回主页
      const curHash = window.location.hash || '';
      if (!curHash.includes('user=') && currentPageRef.current === 'profile') {
        setCurrentPage('home');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // 3. 随 hash 变化进行博主页面切换展示（严格校验与防恶意注入）
      if (curHash.startsWith('#user=')) {
        const raw = curHash.replace('#user=', '').split('&')[0];
        const u = sanitizeUsername(raw);
        if (u) {
          const isTracked = usersListRef.current.some(item => item.username.toLowerCase() === u.toLowerCase());
          if (isTracked) {
            if (u !== selectedUserRef.current) {
              navigateToProfile(u, 'posts', false);
            }
          } else {
            setCurrentPage('home');
            window.history.replaceState({ page: 'home', root: true }, '', window.location.pathname);
            showToast(lang === 'zh' ? `⚠️ 未追踪 @${u}，已返回您的专属主页` : `⚠️ @${u} not tracked`);
          }
        } else {
          // 非法字符或路径注入，直接重置到主页
          setCurrentPage('home');
          window.history.replaceState({ page: 'home', root: true }, '', window.location.pathname);
        }
      } else {
        // 任意未知 hash（如 /... 等），直接保护重置为 home
        if (currentPageRef.current === 'profile') {
          setCurrentPage('home');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);

    // 首次加载 URL 安全清洗与防注入：
    // 若带有非标准的 hash (如 /... 或恶意注入参数)，立即清洗重置
    const initialHash = window.location.hash || '';
    if (initialHash && !initialHash.startsWith('#user=')) {
      window.history.replaceState({ page: 'home', root: true }, '', window.location.pathname);
    } else if (initialHash.startsWith('#user=')) {
      const rawUser = initialHash.replace('#user=', '').split('&')[0];
      const cleanUser = sanitizeUsername(rawUser);
      if (!cleanUser) {
        window.history.replaceState({ page: 'home', root: true }, '', window.location.pathname);
      }
      // 不在 mount 时盲目加载，等待 fetchUsersList() 校验当前用户追踪列表后再决定
    } else {
      window.history.replaceState({ page: 'home', root: true }, '', window.location.pathname);
    }

    const interval = setInterval(fetchStatus, 2000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // 触发 PWA 应用安装或弹出引导
  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsStandalone(true);
          setShowPwaModal(false);
        }
        setDeferredPrompt(null);
      } catch (err) {
        handleOpenPwaModal();
      }
    } else {
      handleOpenPwaModal();
    }
  };

  // 当切换博主时，重新加载数据
  useEffect(() => {
    if (currentPage === 'profile' && selectedUser) {
      loadStoriesList(selectedUser);
      loadHistoryList(null, selectedUser);
      loadProfileMedia(selectedUser);
      setCrossUserA(selectedUser);
    }
  }, [selectedUser, currentPage]);

  // 自动登录
  const handleAutoLogin = async () => {
    try {
      await fetch(`${API_BASE}/api/login`, { method: "POST" });
      alert("登录窗口已打开，请在窗口内完成 Instagram 登录，系统捕获凭证后将自动保存。");
    } catch (e) {
      alert("打开登录窗口失败: " + e.message);
    }
  };

  // 保存手动输入的 Cookie
  const handleSaveCookie = async () => {
    if (!manualCookie.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/api/save_cookie`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cookie: manualCookie.trim() })
      });
      const data = await res.json();
      alert(data.message);
      setManualCookie('');
      fetchStatus();
    } catch (e) {
      alert("保存失败: " + e.message);
    }
  };

  // 复制文本
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 1500);
  };

  // 导出 JSON
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

    if (!currentUser) {
    return (
      <LoginPage
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setCurrentPage('home');
          setSelectedUser('');
          window.history.replaceState({ page: 'home', root: true }, '', window.location.pathname);
          fetchUsersList();
          fetchSearchHistory();
        }}
        lang={lang}
        toggleLang={toggleLang}
        t={t}
        API_BASE={API_BASE}
        showToast={showToast}
      />
    );
  }

  return (
    <div className={`app-shell density-${settings.listDensity || 'comfortable'} ${settings.storiesSize === 'large' ? 'stories-grid-large' : ''}`}>
      {/* 1. 顶部全局 Instagram 原生极简导航栏 */}
      <div className="ig-navbar-sticky">
        <header className="ig-navbar">
          <div className="ig-nav-left" onClick={handleBackToHome}>
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
                value={homeSearchInput}
                onChange={e => setHomeSearchInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleHomeSearch()}
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
              <span className={`ig-dot ${serverStatus.has_cookie ? 'online' : 'offline'}`} />
              <span>{serverStatus.has_cookie ? t('status_ready') : t('status_offline')}</span>
            </div>

            {/* 设置按钮 */}
            <button className="ig-nav-btn" onClick={handleOpenSettingsModal}>
              <Settings size={14} />
              <span>{t('nav_settings')}</span>
            </button>
          </div>
        </header>
      </div>

      {/* 2. 页面内容分流：首页广场 (Home) vs 博主专属主页 (Profile) */}
      {currentPage === 'home' ? (
        /* ================= 首页 / 用户广场 ================= */
        <main>
          {/* Hero 区域 */}
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
                  <span>{lang === 'zh' ? `按回车或点击此处直接直达 @${homeSearchInput.trim().replace('@', '')} 专属主页` : `Press Enter or click to visit @${homeSearchInput.trim().replace('@', '')}`}</span>
                  <ChevronRight size={14} />
                </div>
              </div>
            )}
          </section>

          {/* 全局进行中任务横幅 */}
          {isScanning && (
            <div className="running-task-banner">
              <RefreshCw size={16} className="spin text-cyan" />
              <div className="running-task-pulse" />
              <span className="running-task-msg">{scanMessage}</span>
            </div>
          )}

          {/* 已收录博主卡片展区 */}
          {(() => {
            const query = homeSearchInput.trim().toLowerCase().replace('@', '');
            const displayUsers = query 
              ? usersList.filter(u => u.username.toLowerCase().includes(query))
              : usersList;

            return (
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
                        onClick={() => navigateToProfile(u.username, 'posts')}
                      >
                        {/* 单个用户快捷删除按钮 */}
                        <button 
                          className="home-delete-btn"
                          title={t('home_card_del_tip', { username: u.username })}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDeleteModal(u.username);
                          }}
                        >
                          <Trash2 size={13} />
                        </button>

                        {/* 博主头像展示 (点击可全屏预览下载) */}
                        <div 
                          className={`home-avatar-ring ${u.stories_count > 0 ? 'has-story' : 'no-story'}`}
                          title={u.stories_count > 0 ? (lang === 'zh' ? '🔥 24h内有快拍 · 点击预览原图' : '🔥 Has 24h Story · Click to preview') : (u.profile_pic_url ? t('home_card_avatar_tip') : "")}
                          onClick={(e) => {
                            if (u.profile_pic_url) {
                              e.stopPropagation();
                              handleOpenAvatarModal(u);
                            }
                          }}
                        >
                          <div className="home-avatar-inner">
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
                      onClick={() => navigateToProfile('kohyingliew', 'stories')}
                    >
                      <Play size={14} />
                      <span>{t('home_empty_btn')}</span>
                    </button>
                  </div>
                )}
              </section>
            );
          })()}

          {/* 0 基础新手极简指南 */}
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
      ) : (
        /* ================= 博主专属主页 (Profile) ================= */
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

                  {/* 一键全量保存到本地 (数据归档管理) */}
                  <button 
                    className="ig-nav-btn secondary ig-btn-archive-local"
                    onClick={() => {
                      fetchArchiveSummary(selectedUser);
                      setShowArchiveModal(true);
                    }}
                    title={t('btn_archive_local_tip')}
                  >
                    <Archive size={13} color="#0095f6" />
                    <span>{t('btn_archive_local')}</span>
                    {archiveSummary?.total_posts ? (
                      <span className="archive-counter-badge" title={lang === 'zh' ? `已归档 ${archiveSummary.total_posts} 篇帖子` : `${archiveSummary.total_posts} posts archived`}>
                        {archiveSummary.total_posts}
                      </span>
                    ) : null}
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

                        {/* 本地全量归档与备份管理 */}
                        <button 
                          className="dropdown-item highlight-feature-item" 
                          onClick={() => {
                            fetchArchiveSummary(selectedUser);
                            setShowArchiveModal(true);
                            setShowMoreActionsDropdown(false);
                          }}
                        >
                          <div className="dropdown-item-icon-box" style={{ background: 'rgba(0, 149, 246, 0.12)' }}>
                            <Archive size={16} color="#0095f6" />
                          </div>
                          <div className="dropdown-item-content">
                            <div className="dropdown-item-title">
                              {lang === 'zh' ? '全量本地归档与备份' : 'Full Local Archive'}
                            </div>
                            <div className="dropdown-item-desc">
                              {lang === 'zh' ? '下载原图视频、音频、全量留言与点赞名单' : 'Save all media, comments, and likers locally'}
                            </div>
                          </div>
                          <ChevronRight size={14} color="#8e8e8e" />
                        </button>

                        <button className="dropdown-item" onClick={() => openArchiveFolder(selectedUser)}>
                          <FolderOpen size={14} color="#0095f6" />
                          <span>{t('btn_open_local_folder')}</span>
                        </button>
                        {archiveSummary?.zip_file && (
                          <a 
                            href={`${API_BASE}/api/archive/${selectedUser}/download_zip`} 
                            download 
                            className="dropdown-item"
                            style={{ textDecoration: 'none' }}
                          >
                            <FolderDown size={14} color="#10b981" />
                            <span>{t('btn_download_archive_zip')} ({archiveSummary.zip_size_mb} MB)</span>
                          </a>
                        )}

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
      )}

      {/* 3. 模态框: 头像大图预览与下载 */}
      {avatarModalData && (
        <div className="ig-modal-overlay" onClick={closeActiveModal}>
          <div className="ig-modal-box" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="ig-modal-header">
              <span className="ig-modal-title">{t('modal_avatar_title')}</span>
              <button className="ig-modal-close" onClick={closeActiveModal}>
                <X size={16} />
              </button>
            </div>
            <div className="ig-modal-body">
              <div className="avatar-preview-box">
                <div className="avatar-preview-large-ring">
                  <div className="avatar-preview-large-inner">
                    {avatarModalData.profile_pic_url ? (
                      <img 
                        src={getAvatarProxyUrl(avatarModalData.profile_pic_url)} 
                        alt={avatarModalData.username} 
                        referrerPolicy="no-referrer"
                        className="avatar-img"
                      />
                    ) : (
                      <span>{avatarModalData.username.substring(0, 1).toUpperCase()}</span>
                    )}
                  </div>
                </div>

                <div className="avatar-preview-un">@{avatarModalData.username}</div>
                {avatarModalData.full_name && (
                  <div className="avatar-preview-fn">{avatarModalData.full_name}</div>
                )}

                {avatarModalData.profile_pic_url ? (
                  <div className="avatar-preview-actions">
                    <a 
                      href={`${API_BASE}/api/download_avatar?url=${encodeURIComponent(avatarModalData.profile_pic_url)}&username=${encodeURIComponent(avatarModalData.username)}`}
                      className="ig-nav-btn primary"
                      style={{ padding: '8px 16px', textDecoration: 'none' }}
                      download={`${avatarModalData.username}_avatar.jpg`}
                    >
                      <Download size={14} />
                      <span>{t('modal_avatar_download')}</span>
                    </a>
                    <a 
                      href={avatarModalData.profile_pic_url} 
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
      )}

      {/* 4.5. 模态框: 全量本地归档与数据管理 */}
      {showArchiveModal && (
        <div className="ig-modal-overlay" onClick={() => !isArchiving && setShowArchiveModal(false)}>
          <div className="ig-modal-box ig-archive-modal-box" onClick={e => e.stopPropagation()}>
            <div className="ig-modal-header">
              <div className="ig-modal-header-left">
                <Archive size={18} color="#0095f6" />
                <span className="ig-modal-title">
                  {t('archive_modal_title')} · @{selectedUser}
                </span>
              </div>
              <button 
                className="ig-modal-close" 
                onClick={() => !isArchiving && setShowArchiveModal(false)}
                title="关闭"
              >
                <X size={16} />
              </button>
            </div>

            <div className="ig-modal-body">
              {/* 本地目录路径与规范化提示 */}
              <div className="archive-path-box">
                <div className="archive-path-title">
                  <FolderOpen size={14} color="#0095f6" />
                  <span>本地规范保存路径:</span>
                </div>
                <div className="archive-path-code">
                  <code>{archiveSummary?.items_root || `D:\\IG_Track\\data\\${selectedUser}\\posts\\items\\`}</code>
                </div>
                <div className="archive-path-desc">
                  {t('archive_clean_folder_tip')}
                </div>
              </div>

              {/* 归档统计指标 */}
              <div className="archive-metrics-grid">
                <div className="archive-metric-card">
                  <div className="metric-num">{archiveSummary?.total_posts || postsData.count || 0}</div>
                  <div className="metric-label">{t('archive_summary_posts')}</div>
                </div>
                <div className="archive-metric-card">
                  <div className="metric-num">{archiveSummary?.total_media_files || '-'}</div>
                  <div className="metric-label">{t('archive_summary_media')}</div>
                </div>
                <div className="archive-metric-card">
                  <div className="metric-num">{archiveSummary?.total_comments_archived || '-'}</div>
                  <div className="metric-label">{t('archive_summary_comments')}</div>
                </div>
                <div className="archive-metric-card">
                  <div className="metric-num">{archiveSummary?.total_likers_archived || '-'}</div>
                  <div className="metric-label">{t('archive_summary_likers')}</div>
                </div>
              </div>

              {/* 归档状态横条 */}
              {archiveSummary ? (
                <div className="archive-status-banner success">
                  <CheckCircle2 size={16} color="#10b981" />
                  <div className="banner-content">
                    <div className="banner-title">
                      已完成本地完整归档 ({archiveSummary.archived_at})
                    </div>
                    {archiveSummary.zip_file && (
                      <div className="banner-sub">
                        离线压缩包: {archiveSummary.zip_file} ({archiveSummary.zip_size_mb} MB)
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="archive-status-banner notice">
                  <AlertCircle size={16} color="#f59e0b" />
                  <div className="banner-content">
                    <div className="banner-title">尚未对 @{selectedUser} 执行过本地归档</div>
                    <div className="banner-sub">点击下方按钮即可一键下载全量原画媒体、保存完整留言与点赞名单。</div>
                  </div>
                </div>
              )}

              {/* 目录树预览结构 */}
              <div className="archive-tree-preview">
                <div className="tree-preview-title">
                  <FileText size={13} />
                  <span>文件夹整理规范预览 (易于离线管理与直接阅读):</span>
                </div>
                <div className="tree-preview-code">
                  <pre>
{`📁 data/${selectedUser}/
   ├── 📄 profile.json (用户主页基础数据)
   ├── 📄 archive_summary.json (归档统计索引)
   ├── 📁 posts/
   │    └── 📁 items/ (每篇帖子按日期独立建档，整洁不混乱)
   │         ├── 📁 2026-05-25_DYu4tC-kpt5/
   │         │    ├── 🎬 media_01.mp4 (高清原画/原图)
   │         │    ├── 🎵 audio_bgm.mp3 (背景音乐音轨)
   │         │    ├── 📝 comments.txt (排版优美纯文本，记事本直接可读)
   │         │    ├── 📋 comments.json (全量多级结构化评论数据)
   │         │    ├── 👥 likers.txt & likers.json (点赞者名单)
   │         │    └── ℹ️ post_info.json (文案/发布时间/统计)
   │         └── ...
   └── 📁 exports/
        └── 📦 ${selectedUser}_full_archive.zip (一键打包的离线完整包)`}
                  </pre>
                </div>
              </div>
            </div>

            <div className="ig-modal-footer archive-modal-footer">
              <button 
                type="button"
                className="ig-nav-btn primary ig-btn-archive-action"
                onClick={() => startFullArchive(selectedUser)}
                disabled={isScanning || isArchiving}
              >
                {isArchiving ? <RefreshCw size={14} className="spin" /> : <Sparkles size={14} />}
                <span>{isArchiving ? '正在全量归档下载中...' : '开始 / 更新全量本地归档'}</span>
              </button>

              <button 
                type="button"
                className="ig-nav-btn secondary"
                onClick={() => openArchiveFolder(selectedUser)}
                title="直接在 Windows 电脑上打开文件夹"
              >
                <FolderOpen size={14} />
                <span>在电脑本地打开文件夹</span>
              </button>

              {archiveSummary?.zip_file && (
                <a 
                  href={`${API_BASE}/api/archive/${selectedUser}/download_zip`}
                  download
                  className="ig-nav-btn secondary"
                  title="下载打包的离线 ZIP 文件"
                >
                  <FolderDown size={14} color="#10b981" />
                  <span>下载离线 ZIP 包 ({archiveSummary.zip_size_mb} MB)</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 9. PWA 手机/桌面微端安装引导弹窗 */}
      {showPwaModal && (
        <div className="ig-modal-overlay" onClick={closeActiveModal}>
          <div className="ig-modal-box pwa-modal-box" onClick={e => e.stopPropagation()}>
            <div className="ig-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Smartphone size={18} color="#0095f6" />
                <span className="ig-modal-title">{t('pwa_modal_title')}</span>
              </div>
              <button className="ig-modal-close" onClick={closeActiveModal}>
                <X size={16} />
              </button>
            </div>

            <div className="pwa-modal-body">
              {/* App 徽标展示 */}
              <div className="pwa-app-hero">
                <img src="/icons/icon-192.png" alt="IG Tracker" className="pwa-app-icon" />
                <div className="pwa-app-info">
                  <div className="pwa-app-name">Instagram Tracker</div>
                  <div className="pwa-app-badge">PWA 极速微端 · 纯净全屏</div>
                  <div className="pwa-app-desc">
                    无需应用商店，一键在手机主屏幕生成 App 独立图标，无地址栏遮挡，秒速启动！
                  </div>
                </div>
              </div>

              {/* 平台切换 Tab (苹果 iOS / 安卓 Android / 电脑 PC) */}
              <div className="pwa-platform-tabs">
                <button 
                  className={`pwa-tab-btn ${pwaPlatform === 'ios' ? 'active' : ''}`}
                  onClick={() => setPwaPlatform('ios')}
                >
                  <span>🍎 苹果 iOS</span>
                </button>
                <button 
                  className={`pwa-tab-btn ${pwaPlatform === 'android' ? 'active' : ''}`}
                  onClick={() => setPwaPlatform('android')}
                >
                  <span>🤖 安卓 Android</span>
                </button>
                <button 
                  className={`pwa-tab-btn ${pwaPlatform === 'desktop' ? 'active' : ''}`}
                  onClick={() => setPwaPlatform('desktop')}
                >
                  <span>💻 电脑桌面</span>
                </button>
              </div>

              {/* iOS 教程 */}
              {pwaPlatform === 'ios' && (
                <div className="pwa-steps-list">
                  <div className="pwa-step-item">
                    <div className="pwa-step-num">1</div>
                    <div className="pwa-step-content">
                      <div className="pwa-step-title">使用 Safari 浏览器打开本站</div>
                      <div className="pwa-step-desc">请确保在 iPhone/iPad 自带的 <strong>Safari</strong> 浏览器中打开当前网址。</div>
                    </div>
                  </div>
                  <div className="pwa-step-item">
                    <div className="pwa-step-num">2</div>
                    <div className="pwa-step-content">
                      <div className="pwa-step-title">点击底部分享按钮</div>
                      <div className="pwa-step-desc">点击屏幕底部工具栏中央的<strong>【分享】</strong>图标（带有向上的箭头 <Share2 size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />）。</div>
                    </div>
                  </div>
                  <div className="pwa-step-item">
                    <div className="pwa-step-num">3</div>
                    <div className="pwa-step-content">
                      <div className="pwa-step-title">选取【添加到主屏幕】</div>
                      <div className="pwa-step-desc">在弹出的操作面板中向下滑动，点击<strong>【添加到主屏幕 ➕】</strong>，然后点击右上角<strong>【添加】</strong>。</div>
                    </div>
                  </div>
                  <div className="pwa-success-tip">
                    🎉 完成后手机主屏幕将出现 IG Tracker 图标，点击即可像原生 App 一样全屏沉浸式体验！
                  </div>
                </div>
              )}

              {/* Android 教程 */}
              {pwaPlatform === 'android' && (
                <div className="pwa-steps-list">
                  {deferredPrompt ? (
                    <div style={{ textAlign: 'center', padding: '16px 0' }}>
                      <p style={{ fontSize: 14, color: 'var(--ig-text)', marginBottom: 14 }}>检测到当前浏览器支持一键打包安装！</p>
                      <button className="home-search-btn" onClick={handleInstallClick} style={{ margin: '0 auto', padding: '10px 24px' }}>
                        <Download size={15} />
                        <span>立即安装为手机 App</span>
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="pwa-step-item">
                        <div className="pwa-step-num">1</div>
                        <div className="pwa-step-content">
                          <div className="pwa-step-title">打开浏览器菜单</div>
                          <div className="pwa-step-desc">在 Chrome、Edge 或自带浏览器右上角点击<strong>三个点【⋮】</strong>。</div>
                        </div>
                      </div>
                      <div className="pwa-step-item">
                        <div className="pwa-step-num">2</div>
                        <div className="pwa-step-content">
                          <div className="pwa-step-title">选择【安装应用】或【添加到主屏幕】</div>
                          <div className="pwa-step-desc">点击菜单中的<strong>【安装应用 / 添加到桌面】</strong>选项，在弹窗中点击确定即可！</div>
                        </div>
                      </div>
                    </>
                  )}
                  <div className="pwa-success-tip">
                    ⚡ 独立桌面图标、离线智能缓存、告别繁琐网址输入！
                  </div>
                </div>
              )}

              {/* 电脑桌面 教程 */}
              {pwaPlatform === 'desktop' && (
                <div className="pwa-steps-list">
                  <div className="pwa-step-item">
                    <div className="pwa-step-num">1</div>
                    <div className="pwa-step-content">
                      <div className="pwa-step-title">点击浏览器地址栏右侧图标</div>
                      <div className="pwa-step-desc">在 Chrome / Edge 地址栏右侧，点击<strong>【安装 Instagram Tracker】</strong>图标。</div>
                    </div>
                  </div>
                  <div className="pwa-step-item">
                    <div className="pwa-step-num">2</div>
                    <div className="pwa-step-content">
                      <div className="pwa-step-title">创建独立窗口运行</div>
                      <div className="pwa-step-desc">点击【安装】，应用将以独立窗口全屏运行，并固定在任务栏或桌面，随时一键调起。</div>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ marginTop: 20, textAlign: 'center' }}>
                <button 
                  className="ig-nav-btn primary" 
                  style={{ width: '100%', justifyContent: 'center', padding: '10px 0' }}
                  onClick={closeActiveModal}
                >
                  <span>{lang === 'zh' ? '我知道了 / 开始使用' : 'Got it / Continue'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. 模态框: 删除博主全部数据二次确认 */}
      {userToDelete && (
        <div className="ig-modal-overlay" onClick={() => !isDeleting && closeActiveModal()}>
          <div className="ig-modal-box" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="ig-modal-header">
              <span className="ig-modal-title" style={{ color: 'var(--ig-danger)' }}>{t('modal_delete_title')}</span>
              <button className="ig-modal-close" onClick={() => !isDeleting && closeActiveModal()}>
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
                    onClick={closeActiveModal}
                    disabled={isDeleting}
                  >
                    {t('modal_delete_cancel')}
                  </button>
                  <button 
                    className="ig-nav-btn danger" 
                    style={{ background: 'var(--ig-danger)', color: '#fff', borderColor: 'var(--ig-danger)' }}
                    onClick={confirmDeleteUserData}
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
      )}

      {/* 5. 模态框: 原始参数查看器 (面向高级校验需求) */}
      {inspectUser && (
        <div className="ig-modal-overlay" onClick={closeActiveModal}>
          <div className="ig-modal-box" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div className="ig-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Code size={16} color="#0095f6" />
                <span className="ig-modal-title">@{inspectUser.username} {lang === 'zh' ? '的完整原始参数' : 'Raw Parameters'}</span>
              </div>
              <button className="ig-modal-close" onClick={closeActiveModal}>
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
                  onClick={() => copyToClipboard(JSON.stringify(inspectUser, null, 2))}
                >
                  {copiedKey ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                  <span>{copiedKey ? (lang === 'zh' ? '已复制' : 'Copied') : (lang === 'zh' ? '复制 JSON' : 'Copy JSON')}</span>
                </button>
              </div>

              <pre className="raw-json-box">
                {JSON.stringify(inspectUser, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* 6. 模态框: 媒体全屏灯箱预览 */}
      {selectedStoryMedia && (
        <div className="ig-modal-overlay" onClick={closeActiveModal}>
          <div className="ig-modal-box" style={{ maxWidth: 640, background: '#000', padding: 16 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: '#f3f4f6' }}>{selectedStoryMedia.filename}</span>
              <button className="ig-modal-close" style={{ color: '#fff' }} onClick={closeActiveModal}>
                <X size={18} />
              </button>
            </div>
            <img 
              src={`${API_BASE}${selectedStoryMedia.url}`} 
              alt={selectedStoryMedia.filename} 
              style={{ maxWidth: '100%', maxHeight: '74vh', objectFit: 'contain', borderRadius: 8, display: 'block', margin: '0 auto' }} 
            />
            {selectedStoryMedia.mentions && selectedStoryMedia.mentions.length > 0 && (
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                <span style={{ fontSize: 11, color: '#9ca3af', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <AtSign size={12} color="#0095f6" /> {t('stories_mentions_label')}:
                </span>
                {selectedStoryMedia.mentions.map((m, mIdx) => (
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
      )}

      {/* 6.5. 模态框: 官方 Instagram Pro 级别帖子 Lightbox 查看器 */}
      {selectedPostModal && (
        <div className="ig-modal-overlay ig-post-lightbox-backdrop" onClick={closeActiveModal}>
          <button className="ig-lightbox-close" onClick={closeActiveModal} title="关闭 (Esc)">
            <X size={26} />
          </button>

          <div className="ig-post-lightbox-card" onClick={e => e.stopPropagation()}>
            {/* 左侧媒体显示区 (支持手势触摸左右滑动切换多图轮播) */}
            <div 
              className="ig-lightbox-media-container"
              onTouchStart={handlePostCarouselTouchStart}
              onTouchEnd={handlePostCarouselTouchEnd}
            >
              {(() => {
                const isCarousel = selectedPostModal.carousel_media && selectedPostModal.carousel_media.length > 0;
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
                          src={getAvatarProxyUrl(slideImgUrl)} 
                          alt="Slide" 
                          className="ig-lightbox-media-img"
                          draggable="false"
                        />
                      )}

                      {/* 左右翻页控制器 */}
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

                      {/* 轮播点导航 */}
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
                    src={getAvatarProxyUrl(selectedPostModal.image_url || selectedPostModal.display_url)} 
                    alt={selectedPostModal.caption || 'Post'} 
                    className="ig-lightbox-media-img"
                  />
                );
              })()}

              {/* 隐藏/后台音频播放器 (如果该帖子附带官方音乐且为照片/轮播) */}
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

              {/* 媒体浮动音量播放/静音快捷控制按钮 */}
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
              {(() => {
                const postKey = String(selectedPostModal.code || selectedPostModal.pk || '');
                const currentInteractions = postInteractions[postKey] || {};
                const displayLikeCount = currentInteractions.total_likers_count ?? selectedPostModal.like_count ?? 0;
                const displayCommentCount = currentInteractions.comments_count ?? selectedPostModal.comment_count ?? 0;
                const authorUsername = selectedPostModal.author?.username || selectedUser;

                return (
                  <>
                    {/* 头部: 作者信息与跳转 */}
                    <div className="ig-lightbox-author-row">
                      <div className="ig-lightbox-author-left">
                        <div className="ig-lightbox-avatar-ring">
                          {selectedPostModal.author?.profile_pic_url ? (
                            <img 
                              src={getAvatarProxyUrl(selectedPostModal.author.profile_pic_url)} 
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

                    {/* 官方风格音乐音轨栏 (如果该帖子附带官方配乐) */}
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

                    {/* 选项卡切换: 评论 (Comments) 与 点赞者 (Likers) */}
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
                          {/* 帖子原始文案 */}
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

                          {/* 被标记艾特的人 */}
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

                          {/* 评论分界线 */}
                          <div className="ig-comments-section-header">
                            <span>{lang === 'zh' ? '公开评论' : 'Public Comments'}</span>
                            {currentInteractions.comments && (
                              <span className="count-tag">{currentInteractions.comments.length}</span>
                            )}
                          </div>

                          {/* 真实抓取评论列表 */}
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
                                        src={getAvatarProxyUrl(c.user.profile_pic_url)} 
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

                                    {/* 子级回复收起/展开折叠控制器 (Child comments / Replies) */}
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
                                                        src={getAvatarProxyUrl(cc.user.profile_pic_url)} 
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
                                              src={getAvatarProxyUrl(u.profile_pic_url)} 
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
                        {(() => {
                          const isCarousel = selectedPostModal.carousel_media && selectedPostModal.carousel_media.length > 0;
                          let dlUrl = selectedPostModal.video_url || selectedPostModal.image_url || selectedPostModal.display_url;
                          if (isCarousel) {
                            const currentSlide = selectedPostModal.carousel_media[carouselSlideIndex] || selectedPostModal.carousel_media[0];
                            dlUrl = currentSlide.video_url || currentSlide.video_versions?.[0]?.url || currentSlide.image_url || currentSlide.image_versions2?.candidates?.[0]?.url || dlUrl;
                          }
                          const downloadName = `${authorUsername}_post_${selectedPostModal.code || selectedPostModal.pk || 'media'}_${carouselSlideIndex + 1}`;
                          return (
                            <>
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
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* 6.6. 模态框: 官方 Instagram 沉浸式快拍故事播放器 (3D 竖向长方形转动切换 Highlight) */}
      {selectedHighlightTray && selectedHighlightTray.items && selectedHighlightTray.items.length > 0 && (() => {
        const allTrays = highlightsData?.trays && highlightsData.trays.length > 0 ? highlightsData.trays : (selectedHighlightTray ? [selectedHighlightTray] : []);
        const foundIdx = allTrays.findIndex(t => (t.id && selectedHighlightTray?.id && t.id === selectedHighlightTray.id) || t.title === selectedHighlightTray?.title);
        const activeIdx = foundIdx >= 0 ? foundIdx : currentTrayIdx;
        const currentTray = allTrays[activeIdx] || selectedHighlightTray;
        const nextTray = activeIdx < allTrays.length - 1 ? allTrays[activeIdx + 1] : null;
        const prevTray = activeIdx > 0 ? allTrays[activeIdx - 1] : null;
        const adjacentTray = story3DRotation.angle < 0 ? nextTray : (story3DRotation.angle > 0 ? prevTray : null);

        let currentCardStyle = {};
        let adjacentCardStyle = {};

        if (storyDragOffset.y > 0) {
          // 垂直下拉退出
          currentCardStyle = {
            transformOrigin: 'center center',
            transform: `translateY(${storyDragOffset.y}px) scale(${Math.max(0.75, 1 - storyDragOffset.y / 1000)})`,
            opacity: Math.max(0.25, 1 - storyDragOffset.y / 500),
            transition: storyDragOffset.isDragging ? 'none' : 'transform 0.22s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.22s ease'
          };
        } else if (story3DRotation.angle < 0) {
          // 向左划：当前长方体以右侧为轴向后转，下一组高亮从右侧以左侧为轴切入
          currentCardStyle = {
            transformOrigin: '100% 50%',
            transform: `rotateY(${story3DRotation.angle}deg)`,
            transition: story3DRotation.isDragging ? 'none' : 'transform 0.28s cubic-bezier(0.25, 1, 0.5, 1)'
          };
          adjacentCardStyle = {
            transformOrigin: '0% 50%',
            transform: `translateX(100%) rotateY(${90 + story3DRotation.angle}deg)`,
            transition: story3DRotation.isDragging ? 'none' : 'transform 0.28s cubic-bezier(0.25, 1, 0.5, 1)',
            pointerEvents: 'none'
          };
        } else if (story3DRotation.angle > 0) {
          // 向右划：当前长方体以左侧为轴向后转，上一组高亮从左侧以右侧为轴切入
          currentCardStyle = {
            transformOrigin: '0% 50%',
            transform: `rotateY(${story3DRotation.angle}deg)`,
            transition: story3DRotation.isDragging ? 'none' : 'transform 0.28s cubic-bezier(0.25, 1, 0.5, 1)'
          };
          adjacentCardStyle = {
            transformOrigin: '100% 50%',
            transform: `translateX(-100%) rotateY(${-90 + story3DRotation.angle}deg)`,
            transition: story3DRotation.isDragging ? 'none' : 'transform 0.28s cubic-bezier(0.25, 1, 0.5, 1)',
            pointerEvents: 'none'
          };
        } else {
          currentCardStyle = {
            transformOrigin: 'center center',
            transform: 'rotateY(0deg)',
            transition: story3DRotation.isDragging ? 'none' : 'transform 0.28s cubic-bezier(0.25, 1, 0.5, 1)'
          };
        }

        const renderStoryCard = (tray, storyIdx, isInteractive, role, cardStyle) => {
          if (!tray) return null;
          const items = tray.items || [];
          const story = items[storyIdx] || items[0] || {};
          const isV = story.media_type === 2 || (story.video_versions && story.video_versions.length > 0) || story.video_url;
          const videoUrl = story.video_url || story.video_versions?.[0]?.url;
          const imgUrl = story.image_url || story.image_versions2?.candidates?.[0]?.url || story.display_url;
          const dlUrl = videoUrl || imgUrl;
          const dlName = `${selectedUser}_highlight_${tray.title}_${storyIdx + 1}`;
          const shadeOpacity = role === 'adjacent' 
            ? Math.max(0, 1 - Math.abs(story3DRotation.angle) / 90) * 0.7 
            : (Math.abs(story3DRotation.angle) / 90) * 0.65;

          return (
            <div 
              key={`${tray.id || tray.title}_${role}`}
              className="ig-story-card-frame"
              onClick={e => e.stopPropagation()}
              onTouchStart={isInteractive ? handleStoryTouchStart : undefined}
              onTouchMove={isInteractive ? handleStoryTouchMove : undefined}
              onTouchEnd={isInteractive ? handleStoryTouchEnd : undefined}
              onMouseDown={isInteractive ? handleStoryTouchStart : undefined}
              onMouseMove={isInteractive ? handleStoryTouchMove : undefined}
              onMouseUp={isInteractive ? handleStoryTouchEnd : undefined}
              style={cardStyle}
            >
              {/* 3D 转动光影立体明暗滤镜 */}
              {story3DRotation.angle !== 0 && (
                <div 
                  className="ig-story-3d-shade" 
                  style={{ opacity: shadeOpacity }} 
                />
              )}

              {/* 1. 顶部 Instagram 分段进度条 (白色进度条实时反映影片/图片时长进度) */}
              <div className="ig-story-progress-segments">
                {items.map((_, pIdx) => {
                  let fillWidth = '0%';
                  if (role === 'current') {
                    if (pIdx < activeHighlightStoryIndex) fillWidth = '100%';
                    else if (pIdx === activeHighlightStoryIndex) fillWidth = `${storyProgress}%`;
                  }
                  return (
                    <div 
                      key={pIdx} 
                      className="ig-story-segment-track"
                      onClick={(e) => {
                        if (!isInteractive) return;
                        e.stopPropagation();
                        setStoryProgress(0);
                        setActiveHighlightStoryIndex(pIdx);
                      }}
                    >
                      <div 
                        className={`ig-story-segment-fill ${role === 'current' && pIdx < activeHighlightStoryIndex ? 'completed' : role === 'current' && pIdx === activeHighlightStoryIndex ? 'active' : ''}`}
                        style={{
                          width: fillWidth,
                          transition: role === 'current' && pIdx === activeHighlightStoryIndex ? 'none' : undefined
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* 2. 头部作者信息与操作 */}
              <div className="ig-story-top-author-bar">
                <div className="ig-story-author-left">
                  <div className="ig-story-author-avatar">
                    {currentProfilePicUrl ? (
                      <img src={getAvatarProxyUrl(currentProfilePicUrl)} alt={selectedUser} />
                    ) : (
                      <span>{selectedUser.substring(0, 1).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="ig-story-author-text">
                    <span className="ig-story-author-un">@{selectedUser}</span>
                    <span className="ig-story-tray-pill">
                      <Bookmark size={10} /> {tray.title}
                    </span>
                    {story.time_display && (
                      <span className="ig-story-timestamp">{story.time_display}</span>
                    )}
                  </div>
                </div>

                <div className="ig-story-top-actions">
                  {/* 视频声音控制切换 */}
                  {isInteractive && isV && (
                    <button 
                      className="ig-story-action-icon-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setStoryMuted(prev => !prev);
                      }}
                      title={storyMuted ? (lang === 'zh' ? '开启声音' : 'Unmute') : (lang === 'zh' ? '静音' : 'Mute')}
                    >
                      {storyMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
                    </button>
                  )}

                  {/* 直接下载媒体 */}
                  {isInteractive ? (
                    <a 
                      href={`${API_BASE}/api/download_media?url=${encodeURIComponent(dlUrl)}&filename=${encodeURIComponent(dlName)}`}
                      download
                      className="ig-story-action-icon-btn"
                      title="直接下载该快拍原画"
                      onClick={e => e.stopPropagation()}
                    >
                      <Download size={17} />
                    </a>
                  ) : (
                    <div className="ig-story-action-icon-btn">
                      <Download size={17} />
                    </div>
                  )}

                  {/* 模态框关闭按钮 */}
                  {isInteractive ? (
                    <button 
                      className="ig-story-action-icon-btn"
                      onClick={closeActiveModal}
                      title="关闭"
                    >
                      <X size={18} />
                    </button>
                  ) : (
                    <div className="ig-story-action-icon-btn">
                      <X size={18} />
                    </div>
                  )}
                </div>
              </div>

              {/* 3. 核心媒体视窗 (纯净沉浸播放，无播放进度条，轻触两侧切页) */}
              <div className="ig-story-media-viewport">
                {isInteractive && (
                  <>
                    <div 
                      className="ig-story-tap-area left"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (story3DRotation.angle !== 0 || storyDragOffset.y !== 0) return;
                        handlePrevHighlightStory();
                      }}
                      title="点击切换上一条"
                    />
                    <div 
                      className="ig-story-tap-area right"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (story3DRotation.angle !== 0 || storyDragOffset.y !== 0) return;
                        handleNextHighlightStory();
                      }}
                      title="点击切换下一条"
                    />
                  </>
                )}

                {isV && videoUrl ? (
                  <video 
                    ref={isInteractive ? storyVideoRef : null}
                    key={videoUrl}
                    src={videoUrl} 
                    autoPlay 
                    playsInline 
                    muted={isInteractive ? storyMuted : true}
                    onTimeUpdate={isInteractive ? (e) => {
                      const v = e.currentTarget;
                      if (v.duration && !isNaN(v.duration) && v.duration > 0) {
                        setStoryProgress((v.currentTime / v.duration) * 100);
                      }
                    } : undefined}
                    onEnded={isInteractive ? handleNextHighlightStory : undefined}
                    className="ig-story-viewport-media"
                  />
                ) : (
                  <img 
                    key={imgUrl}
                    src={getAvatarProxyUrl(imgUrl)} 
                    alt="Story" 
                    className="ig-story-viewport-media"
                  />
                )}
              </div>

              {/* 4. 底部序号指示栏 */}
              <div className="ig-story-bottom-bar">
                <div className="ig-story-counter-pill">
                  {storyIdx + 1} / {items.length}
                </div>
              </div>
            </div>
          );
        };

        return (
          <div 
            className="ig-story-viewer-backdrop" 
            onClick={() => {
              if (storyDidDragRef.current || story3DRotation.angle !== 0) return;
              closeActiveModal();
            }}
          >
            {/* 桌面端左侧翻页大按钮 */}
            {(currentTrayIdx > 0 || activeHighlightStoryIndex > 0) && (
              <button 
                className="ig-story-side-nav prev"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevHighlightStory();
                }}
                title="上一条 (←)"
              >
                <ChevronLeft size={28} />
              </button>
            )}

            {/* 3D 旋转舞台与竖向长方体容器 */}
            <div 
              className="ig-story-3d-stage"
              onClick={e => e.stopPropagation()}
              onTouchStart={handleStoryTouchStart}
              onTouchMove={handleStoryTouchMove}
              onTouchEnd={handleStoryTouchEnd}
              onMouseDown={handleStoryTouchStart}
              onMouseMove={handleStoryTouchMove}
              onMouseUp={handleStoryTouchEnd}
            >
              <div className="ig-story-cube-wrapper">
                {/* 当前 highlight 专辑 */}
                {renderStoryCard(currentTray, activeHighlightStoryIndex, true, 'current', currentCardStyle)}

                {/* 3D 旋转时的相邻 highlight 专辑 */}
                {adjacentTray && story3DRotation.angle !== 0 && (
                  renderStoryCard(adjacentTray, 0, false, 'adjacent', adjacentCardStyle)
                )}
              </div>
            </div>

            {/* 桌面端右侧翻页大按钮 */}
            {(currentTrayIdx < allTrays.length - 1 || activeHighlightStoryIndex < currentTray.items.length - 1) && (
              <button 
                className="ig-story-side-nav next"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextHighlightStory();
                }}
                title="下一条 (→)"
              >
                <ChevronRight size={28} />
              </button>
            )}
          </div>
        );
      })()}

      {/* 7. 模态框: 账号与系统设置 (极简收纳) */}
      {showSettingsModal && (
        <div className="ig-modal-overlay" onClick={closeActiveModal}>
          <div className="ig-modal-box settings-modal-box" onClick={e => e.stopPropagation()}>
            <div className="ig-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Settings size={18} color="#0095f6" />
                <span className="ig-modal-title">{t('modal_settings_title')}</span>
              </div>
              <button className="ig-modal-close" onClick={closeActiveModal}>
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
                          onClick={() => {
                            updateSetting('pageSize', sz);
                            setFollowingPageSize(sz);
                            setFollowersPageSize(sz);
                          }}
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
                  {/* 凭证状态 */}
                  <div className="settings-section-card">
                    <div className="settings-card-title">{t('modal_settings_cookie_sec')}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                      <span className={`ig-dot ${serverStatus.has_cookie ? 'online' : 'offline'}`} style={{ width: 10, height: 10 }} />
                      <span style={{ fontSize: 13, fontWeight: 600 }}>
                        {serverStatus.has_cookie 
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
                          setApiTestStatus(null);
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
                        {(serverStatus.task?.logs || []).map((log, i) => (
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
      )}

      {/* 9. PWA 手机/桌面微端安装引导弹窗 */}
      {showPwaModal && (
        <div className="ig-modal-overlay" onClick={closeActiveModal}>
          <div className="ig-modal-box pwa-modal-box" onClick={e => e.stopPropagation()}>
            <div className="ig-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Smartphone size={18} color="#0095f6" />
                <span className="ig-modal-title">{t('pwa_modal_title')}</span>
              </div>
              <button className="ig-modal-close" onClick={closeActiveModal}>
                <X size={16} />
              </button>
            </div>

            <div className="pwa-modal-body">
              {/* App 徽标展示 */}
              <div className="pwa-app-hero">
                <img src="/icons/icon-192.png" alt="IG Tracker" className="pwa-app-icon" />
                <div className="pwa-app-info">
                  <div className="pwa-app-name">Instagram Tracker</div>
                  <div className="pwa-app-badge">PWA 极速微端 · 纯净全屏</div>
                  <div className="pwa-app-desc">
                    无需应用商店，一键在手机主屏幕生成 App 独立图标，无地址栏遮挡，秒速启动！
                  </div>
                </div>
              </div>

              {/* 平台切换 Tab (苹果 iOS / 安卓 Android / 电脑 PC) */}
              <div className="pwa-platform-tabs">
                <button 
                  className={`pwa-tab-btn ${pwaPlatform === 'ios' ? 'active' : ''}`}
                  onClick={() => setPwaPlatform('ios')}
                >
                  <span>🍎 苹果 iOS</span>
                </button>
                <button 
                  className={`pwa-tab-btn ${pwaPlatform === 'android' ? 'active' : ''}`}
                  onClick={() => setPwaPlatform('android')}
                >
                  <span>🤖 安卓 Android</span>
                </button>
                <button 
                  className={`pwa-tab-btn ${pwaPlatform === 'desktop' ? 'active' : ''}`}
                  onClick={() => setPwaPlatform('desktop')}
                >
                  <span>💻 电脑桌面</span>
                </button>
              </div>

              {/* iOS 教程 */}
              {pwaPlatform === 'ios' && (
                <div className="pwa-steps-list">
                  <div className="pwa-step-item">
                    <div className="pwa-step-num">1</div>
                    <div className="pwa-step-content">
                      <div className="pwa-step-title">使用 Safari 浏览器打开本站</div>
                      <div className="pwa-step-desc">请确保在 iPhone/iPad 自带的 <strong>Safari</strong> 浏览器中打开当前网址。</div>
                    </div>
                  </div>
                  <div className="pwa-step-item">
                    <div className="pwa-step-num">2</div>
                    <div className="pwa-step-content">
                      <div className="pwa-step-title">点击底部分享按钮</div>
                      <div className="pwa-step-desc">点击屏幕底部工具栏中央的<strong>【分享】</strong>图标（带有向上的箭头 <Share2 size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />）。</div>
                    </div>
                  </div>
                  <div className="pwa-step-item">
                    <div className="pwa-step-num">3</div>
                    <div className="pwa-step-content">
                      <div className="pwa-step-title">选取【添加到主屏幕】</div>
                      <div className="pwa-step-desc">在弹出的操作面板中向下滑动，点击<strong>【添加到主屏幕 ➕】</strong>，然后点击右上角<strong>【添加】</strong>。</div>
                    </div>
                  </div>
                  <div className="pwa-success-tip">
                    🎉 完成后手机主屏幕将出现 IG Tracker 图标，点击即可像原生 App 一样全屏沉浸式体验！
                  </div>
                </div>
              )}

              {/* Android 教程 */}
              {pwaPlatform === 'android' && (
                <div className="pwa-steps-list">
                  {deferredPrompt ? (
                    <div style={{ textAlign: 'center', padding: '16px 0' }}>
                      <p style={{ fontSize: 14, color: 'var(--ig-text)', marginBottom: 14 }}>检测到当前浏览器支持一键打包安装！</p>
                      <button className="home-search-btn" onClick={handleInstallClick} style={{ margin: '0 auto', padding: '10px 24px' }}>
                        <Download size={15} />
                        <span>立即安装为手机 App</span>
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="pwa-step-item">
                        <div className="pwa-step-num">1</div>
                        <div className="pwa-step-content">
                          <div className="pwa-step-title">打开浏览器菜单</div>
                          <div className="pwa-step-desc">在 Chrome、Edge 或自带浏览器右上角点击<strong>三个点【⋮】</strong>。</div>
                        </div>
                      </div>
                      <div className="pwa-step-item">
                        <div className="pwa-step-num">2</div>
                        <div className="pwa-step-content">
                          <div className="pwa-step-title">选择【安装应用】或【添加到主屏幕】</div>
                          <div className="pwa-step-desc">点击菜单中的<strong>【安装应用 / 添加到桌面】</strong>选项，在弹窗中点击确定即可！</div>
                        </div>
                      </div>
                    </>
                  )}
                  <div className="pwa-success-tip">
                    ⚡ 独立桌面图标、离线智能缓存、告别繁琐网址输入！
                  </div>
                </div>
              )}

              {/* 电脑桌面 教程 */}
              {pwaPlatform === 'desktop' && (
                <div className="pwa-steps-list">
                  <div className="pwa-step-item">
                    <div className="pwa-step-num">1</div>
                    <div className="pwa-step-content">
                      <div className="pwa-step-title">点击浏览器地址栏右侧图标</div>
                      <div className="pwa-step-desc">在 Chrome / Edge 地址栏右侧，点击<strong>【安装 Instagram Tracker】</strong>图标。</div>
                    </div>
                  </div>
                  <div className="pwa-step-item">
                    <div className="pwa-step-num">2</div>
                    <div className="pwa-step-content">
                      <div className="pwa-step-title">创建独立窗口运行</div>
                      <div className="pwa-step-desc">点击【安装】，应用将以独立窗口全屏运行，并固定在任务栏或桌面，随时一键调起。</div>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ marginTop: 20, textAlign: 'center' }}>
                <button 
                  className="ig-nav-btn primary" 
                  style={{ width: '100%', justifyContent: 'center', padding: '10px 0' }}
                  onClick={closeActiveModal}
                >
                  <span>{lang === 'zh' ? '我知道了 / 开始使用' : 'Got it / Continue'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. 轻量 Toast 浮动提示 */}
      {toastMessage && (
        <div className="clean-toast">
          <CheckCircle2 size={16} color="#10b981" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
