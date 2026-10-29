import React from 'react';
import { 
  HashRouter, 
  Routes, 
  Route, 
  Navigate, 
  useNavigate,
  useLocation
} from 'react-router-dom';
import './App.css';
import { AppProvider, useApp } from './context/AppContext';

// 页面引入 (单独开拆独立 Page 文件)
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';

// 全局共用组件与模态框
import Navbar from './components/Navbar';
import Toast from './components/Toast';
import AvatarModal from './components/modals/AvatarModal';
import DeleteConfirmModal from './components/modals/DeleteConfirmModal';
import InspectModal from './components/modals/InspectModal';
import SettingsModal from './components/modals/SettingsModal';
import PwaModal from './components/modals/PwaModal';

// 商业版登录守卫 (Route Guard)
function RequireAuth({ children }) {
  const { currentUser, authLoading } = useApp();

  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', color: 'var(--ig-text-secondary)' }}>
          <div className="running-task-pulse" style={{ margin: '0 auto 12px' }} />
          <span>正在加载商业工作空间...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/page/login" replace />;
  }

  return children;
}

// 主应用外壳 (包含了全局导航、路由分发与全局模态框)
function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    currentUser, 
    logout, 
    settings, 
    lang, 
    toggleLang, 
    serverStatus, 
    toastMessage, 
    isStandalone, 
    handleInstallClick, 
    showPwaModal, 
    setShowPwaModal, 
    pwaPlatform, 
    setPwaPlatform, 
    deferredPrompt, 
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
    setActiveSettingsTab, 
    updateSetting, 
    resetSettings, 
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
    usersList, 
    historyFiles, 
    t, 
    API_BASE 
  } = useApp();

  const hideGlobalNav = !currentUser || location.pathname.includes('/login');

  return (
    <div className={`app-shell density-${settings.listDensity || 'comfortable'} ${settings.storiesSize === 'large' ? 'stories-grid-large' : ''}`}>
      {/* 顶部全局导航栏 (登录页或未登录状态下不渲染全局导航栏，避免双 Logo 堆叠) */}
      {!hideGlobalNav && (
        <Navbar 
          onBackToHome={() => navigate('/page/home')}
          onSearch={(cleanUser) => navigate(`/page/profile/${cleanUser}`)}
          isStandalone={isStandalone}
          handleInstallClick={handleInstallClick}
          lang={lang}
          toggleLang={toggleLang}
          serverStatus={serverStatus}
          onOpenSettings={() => setShowSettingsModal(true)}
          currentUser={currentUser}
          onLogout={() => {
            logout();
            navigate('/page/login');
          }}
          t={t}
        />
      )}

      {/* 独立页面路由分发: 完整支持 https://still-sea-4a4c.ts-chank.workers.dev/page/... 风格 */}
      <Routes>
        {/* 1. 登录页面 */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/page/login" element={<LoginPage />} />
        <Route path="/pages/login" element={<LoginPage />} />

        {/* 2. 首页 / 广场 */}
        <Route path="/" element={<RequireAuth><HomePage /></RequireAuth>} />
        <Route path="/home" element={<RequireAuth><HomePage /></RequireAuth>} />
        <Route path="/page/home" element={<RequireAuth><HomePage /></RequireAuth>} />
        <Route path="/pages/home" element={<RequireAuth><HomePage /></RequireAuth>} />

        {/* 3. 博主专属页 */}
        <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
        <Route path="/profile/:username" element={<RequireAuth><ProfilePage /></RequireAuth>} />
        <Route path="/page/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
        <Route path="/page/profile/:username" element={<RequireAuth><ProfilePage /></RequireAuth>} />
        <Route path="/pages/profile/:username" element={<RequireAuth><ProfilePage /></RequireAuth>} />

        {/* 4. 系统与账号设置页 */}
        <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
        <Route path="/page/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
        <Route path="/pages/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />

        {/* 5. 兜底重定向 */}
        <Route path="*" element={<Navigate to="/page/home" replace />} />
      </Routes>

      {/* 全局挂载模态框与轻量通知 */}
      <AvatarModal 
        data={avatarModalData}
        onClose={() => setAvatarModalData(null)}
        t={t}
        lang={lang}
        API_BASE={API_BASE}
      />

      <DeleteConfirmModal 
        userToDelete={deleteModalUser}
        isDeleting={isDeletingUser}
        onClose={() => setDeleteModalUser(null)}
        onConfirm={() => deleteTrackedUser(deleteModalUser)}
        t={t}
        lang={lang}
      />

      <InspectModal 
        inspectUser={inspectUserData}
        onClose={() => setInspectUserData(null)}
        lang={lang}
      />

      <SettingsModal 
        show={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        activeSettingsTab={activeSettingsTab}
        setActiveSettingsTab={setActiveSettingsTab}
        settings={settings}
        updateSetting={updateSetting}
        resetSettings={resetSettings}
        serverStatus={serverStatus}
        manualCookie={manualCookie}
        setManualCookie={setManualCookie}
        handleSaveCookie={handleSaveCookie}
        handleAutoLogin={handleAutoLogin}
        customApiUrl={customApiUrl}
        setCustomApiUrl={setCustomApiUrl}
        handleTestApiConnection={handleTestApiConnection}
        handleSaveApiUrl={handleSaveApiUrl}
        isTestingApi={isTestingApi}
        apiTestStatus={apiTestStatus}
        showLogs={showLogs}
        setShowLogs={setShowLogs}
        usersList={usersList}
        historyFiles={historyFiles}
        currentUser={currentUser}
        onLogout={() => {
          logout();
          setShowSettingsModal(false);
          navigate('/page/login');
        }}
        t={t}
        lang={lang}
        API_BASE={API_BASE}
      />

      <PwaModal 
        show={showPwaModal}
        onClose={() => setShowPwaModal(false)}
        pwaPlatform={pwaPlatform}
        setPwaPlatform={setPwaPlatform}
        deferredPrompt={deferredPrompt}
        handleInstallClick={handleInstallClick}
        t={t}
        lang={lang}
      />

      <Toast message={toastMessage} />
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppProvider>
        <AppShell />
      </AppProvider>
    </HashRouter>
  );
}
