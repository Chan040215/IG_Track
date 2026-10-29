import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Flame, 
  ShieldCheck, 
  History, 
  CheckCircle2, 
  Globe, 
  Sparkles, 
  AlertCircle, 
  RefreshCw, 
  Lock,
  ArrowRight,
  LogOut
} from 'lucide-react';
import './LoginPage.css';
import { useApp } from '../context/AppContext';
import { GOOGLE_CLIENT_ID, setAuthToken } from '../utils/api';

/**
 * LoginPage - 独立商业版用户登录/注册模块
 * 
 * 路由：/page/login 及 /login
 * 作用：
 * 1. 纯 Google Direct Login / Sign-in 官方一键直连，免密码输入
 * 2. 多租户数据空间隔离说明与指引
 * 3. 独立状态管理与 Google GIS 渲染
 */
export default function LoginPage(props) {
  const navigate = useNavigate();
  const context = useApp();

  const lang = props.lang || context.lang;
  const toggleLang = props.toggleLang || context.toggleLang;
  const API_BASE = props.API_BASE !== undefined ? props.API_BASE : context.API_BASE;
  const showToast = props.showToast || context.showToast;
  const currentUser = context.currentUser;
  const setCurrentUser = context.setCurrentUser;
  const logout = context.logout;

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState('');

  // 处理 Google 官方授权凭据回调
  const handleGoogleCredentialResponse = async (response) => {
    if (!response || !response.credential) return;
    try {
      setIsAuthenticating(true);
      setAuthError('');

      const res = await fetch(`${API_BASE}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_token: response.credential })
      });

      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setAuthToken(data.token, data.user);
        if (setCurrentUser) {
          setCurrentUser(data.user);
        }
        if (showToast) {
          showToast(lang === 'zh' ? `🎉 欢迎使用商业版，${data.user.name}！` : `🎉 Welcome, ${data.user.name}!`);
        }
        if (props.onLoginSuccess) {
          props.onLoginSuccess(data.user);
        }
        navigate('/page/home');
      } else {
        setAuthError(data.detail || (lang === 'zh' ? 'Google 登录失败，请重试' : 'Google sign-in failed, please retry'));
      }
    } catch (err) {
      setAuthError(err.message || (lang === 'zh' ? '网络连接异常，无法完成登录' : 'Network error during sign-in'));
    } finally {
      setIsAuthenticating(false);
    }
  };

  // 开发者 / 本地环境快速模拟登录 (便于无缝离线调试与测试)
  const handleDevLogin = async (email, name) => {
    try {
      setIsAuthenticating(true);
      setAuthError('');

      const res = await fetch(`${API_BASE}/api/auth/dev_login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name })
      });

      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setAuthToken(data.token, data.user);
        if (setCurrentUser) {
          setCurrentUser(data.user);
        }
        if (showToast) {
          showToast(lang === 'zh' ? `🎉 欢迎体验商业专属工作台: ${data.user.name}！` : `🎉 Logged in as: ${data.user.name}`);
        }
        if (props.onLoginSuccess) {
          props.onLoginSuccess(data.user);
        }
        navigate('/page/home');
      } else {
        setAuthError(data.detail || '模拟授权失败');
      }
    } catch (err) {
      setAuthError(err.message || '连接服务器异常');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // 初始化与渲染 Google Identity Services 按钮
  const renderGoogleButton = () => {
    if (typeof window === 'undefined') return;
    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        const btnContainer = document.getElementById('googleSignInStandaloneBtn');
        if (btnContainer) {
          btnContainer.innerHTML = '';
          window.google.accounts.id.renderButton(btnContainer, {
            theme: 'filled_blue',
            size: 'large',
            shape: 'pill',
            width: 300,
            text: 'signin_with',
            locale: lang === 'zh' ? 'zh-CN' : 'en'
          });
        }
      } catch (e) {
        console.warn('[LoginPage] GIS 初始化警告:', e);
      }
    }
  };

  useEffect(() => {
    renderGoogleButton();

    const timer = setInterval(() => {
      if (window.google?.accounts?.id) {
        renderGoogleButton();
      }
    }, 1200);

    return () => clearInterval(timer);
  }, [lang]);

  return (
    <div className="login-page-root">
      {/* 1. 顶部品牌条 */}
      <header className="login-page-nav">
        <div className="login-brand-group" onClick={() => navigate('/page/home')} style={{ cursor: 'pointer' }}>
          <div className="login-logo-badge">
            <Flame size={20} />
          </div>
          <span className="login-brand-title">Instagram Tracker</span>
        </div>

        {toggleLang && (
          <button className="login-lang-btn" onClick={toggleLang}>
            <Globe size={14} />
            <span>{lang === 'zh' ? 'English' : '中文'}</span>
          </button>
        )}
      </header>

      {/* 2. 核心登录卡片 */}
      <main className="login-main-container">
        <div className="login-card">
          <div className="login-tag-badge">
            <Sparkles size={13} />
            <span>{lang === 'zh' ? '商业版 · 专属多用户数据隔离' : 'Business Edition · Isolated Workspaces'}</span>
          </div>

          <h1 className="login-title">
            {lang === 'zh' ? '欢迎使用商业工作台' : 'Welcome to Business Tracker'}
          </h1>

          <p className="login-subtitle">
            {lang === 'zh'
              ? '每个商业账号拥有完全独立私密的博主追踪看板与搜索历史，数据隔离互不干涉。无需输入密码，通过 Google 账号一键秒级直接登录。'
              : 'Every business account has an isolated creator archive and private search history. No password required, sign in directly with Google.'}
          </p>

          {/* 如果已登录，给出快速直达看板与切换账号提示 */}
          {currentUser && (
            <div style={{
              background: 'rgba(0, 149, 246, 0.08)',
              border: '1px solid rgba(0, 149, 246, 0.25)',
              borderRadius: 10,
              padding: '14px 16px',
              marginBottom: 20,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 13, color: 'var(--ig-text)', marginBottom: 8 }}>
                {lang === 'zh' ? `当前已登录为: ` : `Currently signed in as: `}
                <strong>{currentUser.name}</strong> ({currentUser.email})
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button 
                  className="home-search-btn" 
                  style={{ padding: '8px 18px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  onClick={() => navigate('/page/home')}
                >
                  <span>{lang === 'zh' ? '直接进入主页看板' : 'Go to Dashboard'}</span>
                  <ArrowRight size={14} />
                </button>
                <button 
                  className="ig-nav-btn" 
                  style={{ padding: '8px 14px' }}
                  onClick={() => {
                    if (logout) logout();
                  }}
                >
                  <LogOut size={13} />
                  <span>{lang === 'zh' ? '切换其他账号' : 'Switch Account'}</span>
                </button>
              </div>
            </div>
          )}

          {/* 错误提示横幅 */}
          {authError && (
            <div className="login-error-banner">
              <AlertCircle size={15} />
              <span>{authError}</span>
            </div>
          )}

          {/* 3 大核心商业特性展示 */}
          <div className="login-features-list">
            <div className="login-feature-item">
              <div className="login-feature-icon">
                <ShieldCheck size={16} />
              </div>
              <div className="login-feature-text">
                <div className="login-feature-heading">
                  {lang === 'zh' ? '多租户数据空间隔离' : 'Multi-tenant Data Isolation'}
                </div>
                <div className="login-feature-desc">
                  {lang === 'zh'
                    ? '博主追踪卡片、快拍与归档仅属于您自己，不同账号互不影响'
                    : 'Tracked creators, stories, and archives are strictly private to your account'}
                </div>
              </div>
            </div>

            <div className="login-feature-item">
              <div className="login-feature-icon">
                <History size={16} />
              </div>
              <div className="login-feature-text">
                <div className="login-feature-heading">
                  {lang === 'zh' ? '专属私密搜索记录' : 'Personal Search Records'}
                </div>
                <div className="login-feature-desc">
                  {lang === 'zh'
                    ? '搜索历史独立存储沉淀，随时回溯快速直达，他人无法探查'
                    : 'Search queries are stored privately with one-click re-visit access'}
                </div>
              </div>
            </div>

            <div className="login-feature-item">
              <div className="login-feature-icon">
                <CheckCircle2 size={16} />
              </div>
              <div className="login-feature-text">
                <div className="login-feature-heading">
                  {lang === 'zh' ? 'Google 官方安全直连' : 'Direct Google Sign-In'}
                </div>
                <div className="login-feature-desc">
                  {lang === 'zh'
                    ? '无需记忆与设置繁琐密码，采用 Google OAuth 2.0 官方秒级直接授权'
                    : 'No password to manage, official one-click Google OAuth 2.0 authorization'}
                </div>
              </div>
            </div>
          </div>

          {/* Google 登录主操作区 */}
          <div className="login-action-box">
            {isAuthenticating ? (
              <div className="login-loading-indicator">
                <RefreshCw size={16} className="spin" />
                <span>{lang === 'zh' ? '正在连接 Google 验证授权...' : 'Verifying Google account...'}</span>
              </div>
            ) : (
              <div id="googleSignInStandaloneBtn" className="google-btn-wrapper"></div>
            )}
          </div>

          {/* 开发者 / 自动化测试快速通道 */}
          <div className="login-dev-box">
            <button 
              type="button"
              className="login-dev-btn"
              onClick={() => handleDevLogin('chankahhao0215@gmail.com', 'Kah Hao')}
            >
              {lang === 'zh' ? '主理人快捷模拟授权: user_760501527 (chankahhao0215@gmail.com)' : 'Primary Fast Sign-in: user_760501527 (chankahhao0215@gmail.com)'}
            </button>
          </div>
        </div>
      </main>

      {/* 3. 底部安全背书 */}
      <footer className="login-page-footer">
        <Lock size={12} />
        <span>{lang === 'zh' ? 'Google OAuth 2.0 官方安全保护 · 商业数据多租户隔离' : 'Secured by Google OAuth 2.0 · Enterprise Multi-tenant Isolation'}</span>
      </footer>
    </div>
  );
}
