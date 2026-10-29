import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings } from 'lucide-react';
import { useApp } from '../context/AppContext';
import SettingsModal from '../components/modals/SettingsModal';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { 
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
    usersList, 
    historyFiles, 
    currentUser, 
    logout, 
    t, 
    lang, 
    API_BASE 
  } = useApp();

  return (
    <main style={{ maxWidth: 760, margin: '24px auto', padding: '0 16px' }}>
      <button 
        className="back-to-home-btn" 
        onClick={() => navigate('/page/home')}
        style={{ marginBottom: 16 }}
      >
        <ArrowLeft size={14} />
        <span>{t('profile_back_btn')}</span>
      </button>

      <div style={{ background: 'var(--ig-bg-card, #fff)', border: '1px solid var(--ig-border-subtle, #dbdbdb)', borderRadius: 12, padding: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Settings size={22} color="#0095f6" />
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{t('modal_settings_title')}</h1>
        </div>

        <SettingsModal 
          show={true}
          onClose={() => navigate('/page/home')}
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
            navigate('/page/login');
          }}
          t={t}
          lang={lang}
          API_BASE={API_BASE}
        />
      </div>
    </main>
  );
}
