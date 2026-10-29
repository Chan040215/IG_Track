import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { 
  getStoredUser, 
  setAuthToken, 
  clearAuth, 
  getApiBase, 
  API_BASE as DEFAULT_API_BASE, 
  setupFetchInterceptor,
  sanitizeUsername 
} from '../utils/api';
import { getTranslation, formatToAmPm } from '../i18n';

// 启动 Fetch 拦截器
setupFetchInterceptor();

const AppContext = createContext(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

const DEFAULT_SETTINGS = {
  listDensity: 'comfortable', // 'compact' | 'comfortable' | 'large'
  storiesSize: 'standard',    // 'standard' | 'large'
  pageSize: 50,               // 25 | 50 | 100
  timeFormat: '12h',          // '12h' | '24h'
  analysisDefault: 'following',// 'following' | 'followers'
};

export const AppProvider = ({ children }) => {
  // 1. 多语言支持
  const [lang, setLang] = useState(() => localStorage.getItem('ig_track_lang') || 'zh');
  const t = useCallback((key, params) => getTranslation(key, lang, params), [lang]);
  const toggleLang = useCallback(() => {
    const next = lang === 'zh' ? 'en' : 'zh';
    setLang(next);
    localStorage.setItem('ig_track_lang', next);
  }, [lang]);

  // 2. 当前商业版登录用户
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());
  const [authLoading, setAuthLoading] = useState(true);

  // 3. 通用系统与偏好设置
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('ig_tracker_general_settings');
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {}
    return DEFAULT_SETTINGS;
  });

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

  // 4. API 基础路径与远程隧道测试
  const [customApiUrl, setCustomApiUrl] = useState(() => localStorage.getItem('ig_api_base') || '');
  const [API_BASE, setApiBase] = useState(() => getApiBase());
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [apiTestStatus, setApiTestStatus] = useState(null);

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
    setApiBase(getApiBase());
    window.location.reload();
  };

  // 5. 后端与服务状态
  const [serverStatus, setServerStatus] = useState({ has_cookie: false, cookie_preview: '', task: {} });
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  const [manualCookie, setManualCookie] = useState('');
  const [showLogs, setShowLogs] = useState(false);
  const isScanningRef = useRef(false);
  const lastTaskStatusRef = useRef('idle');

  useEffect(() => {
    isScanningRef.current = isScanning;
  }, [isScanning]);

  // 6. 模态框统一控制
  const [avatarModalData, setAvatarModalData] = useState(null);
  const [deleteModalUser, setDeleteModalUser] = useState(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [inspectUserData, setInspectUserData] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState('appearance');

  // 7. PWA 安装引导
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPwaModal, setShowPwaModal] = useState(false);
  const [pwaPlatform, setPwaPlatform] = useState('ios');

  useEffect(() => {
    const checkStandalone = () => {
      const isIosStandalone = window.navigator.standalone === true;
      const isMediaStandalone = window.matchMedia('(display-mode: standalone)').matches;
      setIsStandalone(isIosStandalone || isMediaStandalone);
    };
    checkStandalone();

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setPwaPlatform('ios');
    } else if (/android/.test(ua)) {
      setPwaPlatform('android');
    } else {
      setPwaPlatform('desktop');
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          setDeferredPrompt(null);
          setIsStandalone(true);
        }
      });
    } else {
      setShowPwaModal(true);
    }
  };

  // 8. 浮动 Toast 提示
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  // 9. 用户收录列表与搜索历史
  const [usersList, setUsersList] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);

  const fetchUsersList = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/users`);
      if (res.ok) {
        const data = await res.json();
        setUsersList(data.users || []);
      }
    } catch (e) {
      console.warn('获取用户列表失败:', e);
    }
  }, [API_BASE]);

  const fetchSearchHistory = useCallback(async () => {
    try {
      const token = localStorage.getItem('ig_user_token');
      if (!token) return;
      const res = await fetch(`${API_BASE}/api/user/searches`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSearchHistory(data.searches || []);
      }
    } catch (e) {
      console.warn('获取搜索历史失败:', e);
    }
  }, [API_BASE]);

  const addSearchRecord = useCallback(async (query) => {
    const clean = sanitizeUsername(query);
    if (!clean) return;
    try {
      const token = localStorage.getItem('ig_user_token');
      if (!token) return;
      const res = await fetch(`${API_BASE}/api/user/searches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ query: clean })
      });
      if (res.ok) {
        const data = await res.json();
        setSearchHistory(data.searches || []);
      }
    } catch (e) {}
  }, [API_BASE]);

  const removeSearchRecord = useCallback(async (query) => {
    try {
      const token = localStorage.getItem('ig_user_token');
      if (!token) return;
      const url = query 
        ? `${API_BASE}/api/user/searches?query=${encodeURIComponent(query)}` 
        : `${API_BASE}/api/user/searches`;
      const res = await fetch(url, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSearchHistory(data.searches || []);
      }
    } catch (e) {}
  }, [API_BASE]);

  // 10. 后端服务轮询与状态同步
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/status`);
      if (res.ok) {
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
              showToast(`🎉 @${task.target} 的采集任务完成！`);
              fetchUsersList();
            }
          } else if (task.status === 'failed') {
            if (isScanningRef.current || lastTaskStatusRef.current === 'running') {
              setIsScanning(false);
              setScanMessage('');
              showToast(`⚠️ 采集任务失败: ${task.error || '未知错误'}`);
            }
          }
          lastTaskStatusRef.current = task.status || 'idle';
        }
      }
    } catch (e) {}
  }, [API_BASE, fetchUsersList, showToast]);

  // 初始化鉴权验证
  useEffect(() => {
    const token = localStorage.getItem('ig_user_token');
    if (token) {
      fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        // 后端返回格式为 { user: {...}, tracked_count: ..., searches_count: ... }
        if (data && data.user) {
          setCurrentUser(data.user);
          localStorage.setItem('ig_user_profile', JSON.stringify(data.user));
          if (data.searches) {
            setSearchHistory(data.searches);
          }
        } else {
          clearAuth();
          setCurrentUser(null);
        }
      })
      .catch((err) => {
        console.warn('[AppContext] /api/auth/me 校验未通过或网络中断:', err);
        // 网络中断或临时异常时，保留本地已登录的用户凭证，不强行清空退出
      })
      .finally(() => {
        setAuthLoading(false);
      });
    } else {
      setAuthLoading(false);
    }
  }, [API_BASE]);

  // 定时轮询后端状态与任务进度
  useEffect(() => {
    fetchStatus();
    const timer = setInterval(fetchStatus, 3000);
    return () => clearInterval(timer);
  }, [fetchStatus]);

  // 加载博主列表
  useEffect(() => {
    if (currentUser) {
      fetchUsersList();
      fetchSearchHistory();
    }
  }, [currentUser, fetchUsersList, fetchSearchHistory]);

  const logout = useCallback(() => {
    clearAuth();
    setCurrentUser(null);
    showToast(lang === 'zh' ? '已安全退出登录' : 'Logged out successfully');
  }, [lang, showToast]);

  const handleSaveCookie = async () => {
    if (!manualCookie.trim()) {
      alert("请先粘贴 Cookie 字符串");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/save_cookie`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cookie: manualCookie.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        showToast("✅ Cookie 保存成功，凭证已就绪！");
        setManualCookie('');
        fetchStatus();
      } else {
        alert(`❌ 保存失败: ${data.detail || '未知错误'}`);
      }
    } catch (e) {
      alert("❌ 无法连接后端服务器，请检查网络");
    }
  };

  const handleAutoLogin = async () => {
    try {
      await fetch(`${API_BASE}/api/login`, { method: "POST" });
      showToast("🚀 已在本地调起浏览器，请在弹出的窗口内登录");
    } catch (e) {
      alert("调起浏览器失败，请确认后端正在本机运行");
    }
  };

  const deleteTrackedUser = async (username) => {
    if (!username) return;
    setIsDeletingUser(true);
    try {
      const res = await fetch(`${API_BASE}/api/users/${encodeURIComponent(username)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.status === 'ok') {
        showToast(lang === 'zh' ? `🗑️ 已彻底清除 @${username} 的全部本地数据` : `🗑️ Removed @${username}`);
        setDeleteModalUser(null);
        fetchUsersList();
      } else {
        alert(data.detail || data.error || '删除失败');
      }
    } catch (e) {
      alert('网络连接错误，无法删除');
    } finally {
      setIsDeletingUser(false);
    }
  };

  const value = {
    lang,
    setLang,
    t,
    toggleLang,
    currentUser,
    setCurrentUser,
    authLoading,
    logout,
    settings,
    updateSetting,
    resetSettings,
    formatTime,
    API_BASE,
    customApiUrl,
    setCustomApiUrl,
    handleTestApiConnection,
    handleSaveApiUrl,
    isTestingApi,
    apiTestStatus,
    serverStatus,
    isScanning,
    scanMessage,
    manualCookie,
    setManualCookie,
    handleSaveCookie,
    handleAutoLogin,
    showLogs,
    setShowLogs,
    usersList,
    fetchUsersList,
    searchHistory,
    fetchSearchHistory,
    addSearchRecord,
    removeSearchRecord,
    toastMessage,
    showToast,
    isStandalone,
    deferredPrompt,
    handleInstallClick,
    showPwaModal,
    setShowPwaModal,
    pwaPlatform,
    setPwaPlatform,
    avatarModalData,
    setAvatarModalData,
    deleteModalUser,
    setDeleteModalUser,
    isDeletingUser,
    deleteTrackedUser,
    inspectUserData,
    setInspectUserData,
    showSettingsModal,
    setShowSettingsModal,
    activeSettingsTab,
    setActiveSettingsTab
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
