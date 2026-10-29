import React from 'react';
import { X, Smartphone, Share2, Download } from 'lucide-react';

export default function PwaModal({ 
  show, 
  onClose, 
  pwaPlatform, 
  setPwaPlatform, 
  deferredPrompt, 
  handleInstallClick, 
  t, 
  lang 
}) {
  if (!show) return null;

  return (
    <div className="ig-modal-overlay" onClick={onClose}>
      <div className="ig-modal-box pwa-modal-box" onClick={e => e.stopPropagation()}>
        <div className="ig-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Smartphone size={18} color="#0095f6" />
            <span className="ig-modal-title">{t('pwa_modal_title')}</span>
          </div>
          <button className="ig-modal-close" onClick={onClose}>
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
              onClick={onClose}
            >
              <span>{lang === 'zh' ? '我知道了 / 开始使用' : 'Got it / Continue'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
