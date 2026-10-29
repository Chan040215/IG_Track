import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Volume2, 
  VolumeX, 
  Bookmark, 
  Download, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';
import { getAvatarProxyUrl } from '../../utils/api';

/**
 * HighlightLightboxModal - 快拍精选集 3D 长方棱柱翻页灯箱
 * 
 * 严格保留原始 3D 棱柱旋转几何学设计 (True 3D Rectangular Prism Rotation)：
 * 1. 采用舞台中心 perspective: 1200px 与 translateZ(-R) rotateY(θ)
 * 2. 指针捕捉 (PointerCapture) 1:1 跟手拖曳、120ms 释放瞬时速度检测 (VelocityX)
 * 3. 前后侧面三面布局 (Front Face 0deg, Right Face +90deg, Left Face -90deg)
 * 4. 动态环境渐变阴影 (3D Shade) 与平滑 Settle 过渡，静止状态无偏移
 */
export default function HighlightLightboxModal({
  selectedHighlightTray,
  setSelectedHighlightTray,
  activeHighlightStoryIndex,
  setActiveHighlightStoryIndex,
  currentProfilePicUrl,
  selectedUser,
  highlightsData,
  onClose,
  t,
  lang,
  API_BASE
}) {
  const cubeWrapperRef = useRef(null);
  const storyTouchRef = useRef({
    pointerId: null,
    startX: 0,
    startY: 0,
    startTime: 0,
    isMoving: false,
    direction: null,
    history: []
  });

  const [storyDragOffset, setStoryDragOffset] = useState({ x: 0, y: 0, isDragging: false });
  const [story3DRotation, setStory3DRotation] = useState({ angle: 0, isDragging: false, isSettling: false, direction: null, width: 420 });
  const [currentTrayIdx, setCurrentTrayIdx] = useState(0);
  const [storyMuted, setStoryMuted] = useState(false);
  const [storyProgress, setStoryProgress] = useState(0);
  const [isStoryPaused, setIsStoryPaused] = useState(false);
  const storyVideoRef = useRef(null);
  const storyHoldTimeoutRef = useRef(null);
  const storyDidDragRef = useRef(false);

  const allTrays = highlightsData?.trays && highlightsData.trays.length > 0 
    ? highlightsData.trays 
    : (selectedHighlightTray ? [selectedHighlightTray] : []);

  useEffect(() => {
    if (selectedHighlightTray) {
      const found = allTrays.findIndex(t => (t.id && selectedHighlightTray?.id && t.id === selectedHighlightTray.id) || t.title === selectedHighlightTray?.title);
      setCurrentTrayIdx(found >= 0 ? found : 0);
      setStoryProgress(0);
    }
  }, [selectedHighlightTray]);

  if (!selectedHighlightTray || !selectedHighlightTray.items || selectedHighlightTray.items.length === 0) {
    return null;
  }

  const getPrismWidth = () => {
    if (cubeWrapperRef.current && cubeWrapperRef.current.offsetWidth > 0) {
      return cubeWrapperRef.current.offsetWidth;
    }
    return window.innerWidth <= 768 ? window.innerWidth : 420;
  };

  const handleStoryPointerDown = (e) => {
    if (e.isPrimary === false) return;
    storyDidDragRef.current = false;
    const clientX = e.clientX;
    const clientY = e.clientY;
    const now = performance.now();
    const W = getPrismWidth();

    storyTouchRef.current = {
      pointerId: e.pointerId,
      startX: clientX,
      startY: clientY,
      startTime: now,
      isMoving: false,
      direction: null,
      history: [{ x: clientX, time: now }]
    };

    setStoryDragOffset({ x: 0, y: 0, isDragging: true });
    setStory3DRotation(prev => ({ ...prev, isDragging: true, isSettling: false, width: W }));

    // 长按暂停 (Instagram Hold to Pause)
    if (storyHoldTimeoutRef.current) {
      clearTimeout(storyHoldTimeoutRef.current);
    }
    storyHoldTimeoutRef.current = setTimeout(() => {
      if (!storyTouchRef.current.isMoving) {
        setIsStoryPaused(true);
        if (storyVideoRef.current && !storyVideoRef.current.paused) {
          storyVideoRef.current.pause();
        }
      }
    }, 220);
  };

  const handleStoryPointerMove = (e) => {
    if (!storyTouchRef.current.startTime) return;
    if (storyTouchRef.current.pointerId !== null && e.pointerId !== storyTouchRef.current.pointerId) return;

    const clientX = e.clientX;
    const clientY = e.clientY;
    const now = performance.now();
    const deltaX = clientX - storyTouchRef.current.startX;
    const deltaY = clientY - storyTouchRef.current.startY;

    // 记录 120ms 历史滑动点以计算释放瞬时速度 (velocity)
    const history = storyTouchRef.current.history || [];
    history.push({ x: clientX, time: now });
    storyTouchRef.current.history = history.filter(pt => now - pt.time <= 120);

    if (!storyTouchRef.current.isMoving) {
      if (Math.abs(deltaX) > 7 || Math.abs(deltaY) > 7) {
        storyTouchRef.current.isMoving = true;
        storyTouchRef.current.direction = Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical';
        storyDidDragRef.current = true;
        if (storyHoldTimeoutRef.current) {
          clearTimeout(storyHoldTimeoutRef.current);
          storyHoldTimeoutRef.current = null;
        }
        try {
          if (e.currentTarget && e.currentTarget.setPointerCapture) {
            e.currentTarget.setPointerCapture(e.pointerId);
          }
        } catch (err) {}
      }
    }

    if (!storyTouchRef.current.isMoving) return;

    if (storyTouchRef.current.direction === 'horizontal') {
      const W = getPrismWidth();
      const progressRatio = deltaX / W;

      const foundIdx = allTrays.findIndex(t => (t.id && selectedHighlightTray?.id && t.id === selectedHighlightTray.id) || t.title === selectedHighlightTray?.title);
      const activeIdx = foundIdx >= 0 ? foundIdx : currentTrayIdx;
      const hasNext = activeIdx < allTrays.length - 1;
      const hasPrev = activeIdx > 0;

      if (deltaX < 0) {
        // 向左拖动 (目标: 下一个 Highlight 专辑)
        if (hasNext) {
          // 3D 棱柱绕 Y 轴 1:1 跟手旋转 (角度范围 [-90deg, 0deg])
          const rawAngle = Math.max(-90, Math.min(0, progressRatio * 90));
          setStory3DRotation({ angle: rawAngle, isDragging: true, isSettling: false, direction: 'next', width: W });
          setStoryDragOffset({ x: 0, y: 0, isDragging: true });
        } else {
          // 最后一个 highlight 右滑到最末尾：只做平移回弹退出
          setStory3DRotation({ angle: 0, isDragging: true, isSettling: false, direction: null, width: W });
          setStoryDragOffset({ x: deltaX, y: 0, isDragging: true });
        }
      } else {
        // 向右拖动 (目标: 上一个 Highlight 专辑)
        if (hasPrev) {
          // 3D 棱柱绕 Y 轴 1:1 跟手旋转 (角度范围 [0deg, 90deg])
          const rawAngle = Math.max(0, Math.min(90, progressRatio * 90));
          setStory3DRotation({ angle: rawAngle, isDragging: true, isSettling: false, direction: 'prev', width: W });
          setStoryDragOffset({ x: 0, y: 0, isDragging: true });
        } else {
          // 首个专辑阻尼拉动
          const dampedX = deltaX * 0.25;
          setStory3DRotation({ angle: 0, isDragging: true, isSettling: false, direction: null, width: W });
          setStoryDragOffset({ x: dampedX, y: 0, isDragging: true });
        }
      }
    } else if (storyTouchRef.current.direction === 'vertical' && deltaY > 0) {
      // 垂直向下滑动退出
      setStoryDragOffset({ x: 0, y: deltaY, isDragging: true });
    }
  };

  const handleStoryPointerUp = (e) => {
    if (storyHoldTimeoutRef.current) {
      clearTimeout(storyHoldTimeoutRef.current);
      storyHoldTimeoutRef.current = null;
    }
    setIsStoryPaused(false);
    if (storyVideoRef.current && storyVideoRef.current.paused) {
      storyVideoRef.current.play().catch(() => {});
    }

    try {
      if (e.currentTarget && e.currentTarget.releasePointerCapture && storyTouchRef.current.pointerId !== null) {
        e.currentTarget.releasePointerCapture(storyTouchRef.current.pointerId);
      }
    } catch (err) {}

    if (!storyTouchRef.current.startTime) return;
    const now = performance.now();
    const deltaTime = now - storyTouchRef.current.startTime;
    const wasMoving = storyTouchRef.current.isMoving;
    const dir = storyTouchRef.current.direction;
    const currentAngle = story3DRotation.angle;
    const currentX = storyDragOffset.x;
    const currentY = storyDragOffset.y;
    const W = getPrismWidth();

    // 计算滑动释放瞬时速度 (px/ms)
    let velocityX = 0;
    const history = storyTouchRef.current.history || [];
    if (history.length >= 2) {
      const first = history[0];
      const last = history[history.length - 1];
      const dt = last.time - first.time;
      if (dt > 10) {
        velocityX = (last.x - first.x) / dt;
      }
    }

    storyTouchRef.current = { pointerId: null, startX: 0, startY: 0, startTime: 0, isMoving: false, direction: null, history: [] };

    if (!wasMoving) {
      setStoryDragOffset({ x: 0, y: 0, isDragging: false });
      setStory3DRotation({ angle: 0, isDragging: false, isSettling: false, direction: null, width: W });
      return;
    }

    storyDidDragRef.current = true;
    setTimeout(() => { storyDidDragRef.current = false; }, 400);

    if (dir === 'horizontal') {
      const foundIdx = allTrays.findIndex(t => (t.id && selectedHighlightTray?.id && t.id === selectedHighlightTray.id) || t.title === selectedHighlightTray?.title);
      const activeIdx = foundIdx >= 0 ? foundIdx : currentTrayIdx;
      const hasNext = activeIdx < allTrays.length - 1;
      const hasPrev = activeIdx > 0;

      if (currentAngle < 0 || currentX < 0) {
        // 向左翻动
        if (hasNext) {
          // 判定翻页还是回弹: 超过 28度 或 快速划过 (velocityX < -0.3)
          const isFlipNext = (currentAngle < -28) || (currentAngle < -8 && velocityX < -0.3) || (currentAngle < -15 && deltaTime < 320);
          if (isFlipNext) {
            setStory3DRotation({ angle: -90, isDragging: false, isSettling: true, direction: 'next', width: W });
            setTimeout(() => {
              const nextIdx = activeIdx + 1;
              const nextTrayObj = allTrays[nextIdx];
              setCurrentTrayIdx(nextIdx);
              if (setSelectedHighlightTray) setSelectedHighlightTray(nextTrayObj);
              setActiveHighlightStoryIndex(0);
              setStoryProgress(0);
              setStory3DRotation({ angle: 0, isDragging: false, isSettling: false, direction: null, width: W });
            }, 280);
          } else {
            // 回弹当前
            setStory3DRotation({ angle: 0, isDragging: false, isSettling: true, direction: null, width: W });
            setTimeout(() => {
              setStory3DRotation(prev => ({ ...prev, isSettling: false }));
            }, 280);
          }
        } else {
          // 末尾 highlight 向左快速滑动退出
          const isSwipeExit = (currentX < -45) || (currentX < -15 && (velocityX < -0.3 || deltaTime < 320));
          if (isSwipeExit) {
            setStoryDragOffset({ x: -window.innerWidth * 1.15, y: 0, isDragging: false });
            setTimeout(() => {
              onClose();
              setStoryDragOffset({ x: 0, y: 0, isDragging: false });
              setStory3DRotation({ angle: 0, isDragging: false, isSettling: false, direction: null, width: W });
            }, 220);
          } else {
            setStoryDragOffset({ x: 0, y: 0, isDragging: false });
          }
        }
      } else if (currentAngle > 0 || currentX > 0) {
        // 向右翻动
        if (hasPrev) {
          // 判定翻页还是回弹: 超过 +28度 或 快速划过 (velocityX > 0.3)
          const isFlipPrev = (currentAngle > 28) || (currentAngle > 8 && velocityX > 0.3) || (currentAngle > 15 && deltaTime < 320);
          if (isFlipPrev) {
            setStory3DRotation({ angle: 90, isDragging: false, isSettling: true, direction: 'prev', width: W });
            setTimeout(() => {
              const prevIdx = activeIdx - 1;
              const prevTrayObj = allTrays[prevIdx];
              setCurrentTrayIdx(prevIdx);
              if (setSelectedHighlightTray) setSelectedHighlightTray(prevTrayObj);
              setActiveHighlightStoryIndex(prevTrayObj.items?.length ? prevTrayObj.items.length - 1 : 0);
              setStoryProgress(0);
              setStory3DRotation({ angle: 0, isDragging: false, isSettling: false, direction: null, width: W });
            }, 280);
          } else {
            // 回弹当前
            setStory3DRotation({ angle: 0, isDragging: false, isSettling: true, direction: null, width: W });
            setTimeout(() => {
              setStory3DRotation(prev => ({ ...prev, isSettling: false }));
            }, 280);
          }
        } else {
          setStoryDragOffset({ x: 0, y: 0, isDragging: false });
        }
      } else {
        setStoryDragOffset({ x: 0, y: 0, isDragging: false });
        setStory3DRotation({ angle: 0, isDragging: false, isSettling: false, direction: null, width: W });
      }
    } else if (dir === 'vertical') {
      if (currentY > 80 || (currentY > 30 && deltaTime < 250)) {
        // 下滑退出
        setStoryDragOffset({ x: 0, y: window.innerHeight * 0.9, isDragging: false });
        setTimeout(() => {
          onClose();
          setStoryDragOffset({ x: 0, y: 0, isDragging: false });
        }, 220);
      } else {
        setStoryDragOffset({ x: 0, y: 0, isDragging: false });
      }
    } else {
      setStoryDragOffset({ x: 0, y: 0, isDragging: false });
      setStory3DRotation({ angle: 0, isDragging: false, isSettling: false, direction: null, width: W });
    }
  };

  const handlePrevHighlightStory = () => {
    setStoryProgress(0);
    if (activeHighlightStoryIndex > 0) {
      setActiveHighlightStoryIndex(prev => prev - 1);
    } else {
      if (currentTrayIdx > 0 && allTrays[currentTrayIdx - 1]) {
        const prevTrayObj = allTrays[currentTrayIdx - 1];
        const W = getPrismWidth();
        setStory3DRotation({ angle: 90, isDragging: false, isSettling: true, direction: 'prev', width: W });
        setTimeout(() => {
          const prevIdx = currentTrayIdx - 1;
          setCurrentTrayIdx(prevIdx);
          if (setSelectedHighlightTray) setSelectedHighlightTray(prevTrayObj);
          setActiveHighlightStoryIndex(prevTrayObj.items?.length ? prevTrayObj.items.length - 1 : 0);
          setStoryProgress(0);
          setStory3DRotation({ angle: 0, isDragging: false, isSettling: false, direction: null, width: W });
        }, 280);
      }
    }
  };

  const handleNextHighlightStory = () => {
    setStoryProgress(0);
    const activeTray = allTrays[currentTrayIdx] || selectedHighlightTray;
    if (!activeTray?.items) return;
    if (activeHighlightStoryIndex < activeTray.items.length - 1) {
      setActiveHighlightStoryIndex(prev => prev + 1);
    } else {
      if (currentTrayIdx < allTrays.length - 1 && allTrays[currentTrayIdx + 1]) {
        const nextTrayObj = allTrays[currentTrayIdx + 1];
        const W = getPrismWidth();
        setStory3DRotation({ angle: -90, isDragging: false, isSettling: true, direction: 'next', width: W });
        setTimeout(() => {
          const nextIdx = currentTrayIdx + 1;
          setCurrentTrayIdx(nextIdx);
          if (setSelectedHighlightTray) setSelectedHighlightTray(nextTrayObj);
          setActiveHighlightStoryIndex(0);
          setStoryProgress(0);
          setStory3DRotation({ angle: 0, isDragging: false, isSettling: false, direction: null, width: W });
        }, 280);
      } else {
        onClose();
      }
    }
  };

  // 基础数据与邻近专辑查找
  const foundIdx = allTrays.findIndex(t => (t.id && selectedHighlightTray?.id && t.id === selectedHighlightTray.id) || t.title === selectedHighlightTray?.title);
  const activeIdx = foundIdx >= 0 ? foundIdx : currentTrayIdx;
  const currentTray = allTrays[activeIdx] || selectedHighlightTray;
  const nextTray = activeIdx < allTrays.length - 1 ? allTrays[activeIdx + 1] : null;
  const prevTray = activeIdx > 0 ? allTrays[activeIdx - 1] : null;

  // 3D 棱柱长宽几何计算
  const isRotating3D = story3DRotation.angle !== 0 || story3DRotation.isDragging || story3DRotation.isSettling;
  const W = story3DRotation.width || getPrismWidth();
  const R = W / 2;

  let cubeWrapperTransform = 'none';
  let cubeWrapperTransition = 'none';
  let cubeWrapperOpacity = 1;

  if (storyDragOffset.y > 0) {
    // 垂直下滑退出
    cubeWrapperTransform = `translateY(${storyDragOffset.y}px) scale(${Math.max(0.75, 1 - storyDragOffset.y / 1000)})`;
    cubeWrapperOpacity = Math.max(0.25, 1 - storyDragOffset.y / 500);
    cubeWrapperTransition = storyDragOffset.isDragging ? 'none' : 'transform 0.22s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.22s ease';
  } else if (storyDragOffset.x !== 0 && story3DRotation.angle === 0) {
    // 末尾 highlight 边界向左退出
    cubeWrapperTransform = `translateX(${storyDragOffset.x}px) scale(${Math.max(0.85, 1 - Math.abs(storyDragOffset.x) / 3000)})`;
    cubeWrapperOpacity = Math.max(0.05, 1 - Math.abs(storyDragOffset.x) / (window.innerWidth * 1.05));
    cubeWrapperTransition = storyDragOffset.isDragging ? 'none' : 'transform 0.22s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.22s ease';
  } else if (isRotating3D) {
    // 3D 旋转 (跟手与释放后 settle)
    cubeWrapperTransform = `translateZ(-${R}px) rotateY(${story3DRotation.angle}deg)`;
    cubeWrapperTransition = story3DRotation.isSettling
      ? 'transform 0.28s cubic-bezier(0.22, 1, 0.36, 1)'
      : 'none';
  } else {
    // 静止状态：完全不使用 translateZ(-R)，卡片 100% 自然平铺居中，无任何偏移或漂移
    cubeWrapperTransform = 'none';
    cubeWrapperTransition = 'none';
  }

  // 3D 棱柱三面 (Front Face, Right Face, Left Face)
  const frontFaceStyle = {
    position: 'absolute',
    inset: 0,
    transform: isRotating3D ? `rotateY(0deg) translateZ(${R}px)` : 'none',
    transformOrigin: '50% 50%',
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
  };

  const rightFaceStyle = {
    position: 'absolute',
    inset: 0,
    transform: `rotateY(90deg) translateZ(${R}px)`,
    transformOrigin: '50% 50%',
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    pointerEvents: 'none',
  };

  const leftFaceStyle = {
    position: 'absolute',
    inset: 0,
    transform: `rotateY(-90deg) translateZ(${R}px)`,
    transformOrigin: '50% 50%',
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    pointerEvents: 'none',
  };

  const renderStoryCard = (tray, storyIdx, isInteractive, role, cardStyle) => {
    if (!tray) return null;
    const items = tray.items || [];
    const story = items[storyIdx] || items[0] || {};
    const isV = story.media_type === 2 || (story.video_versions && story.video_versions.length > 0) || story.video_url;
    const videoUrl = story.video_url || story.video_versions?.[0]?.url;
    const imgUrl = story.image_url || story.image_versions2?.candidates?.[0]?.url || story.display_url;
    const dlUrl = videoUrl || imgUrl;
    const dlName = `${selectedUser}_highlight_${tray.title}_${storyIdx + 1}`;

    // 阴影: 离去逐渐变暗, 迎面逐渐恢复
    let shadeOpacity = 0;
    if (role === 'current') {
      shadeOpacity = Math.min(0.65, (Math.abs(story3DRotation.angle) / 90) * 0.65);
    } else if (role === 'next' || role === 'prev') {
      shadeOpacity = Math.max(0, (1 - Math.abs(story3DRotation.angle) / 90) * 0.65);
    }

    return (
      <div 
        key={`${tray.id || tray.title}_${role}`}
        className="ig-story-card-frame"
        onClick={e => e.stopPropagation()}
        style={cardStyle}
      >
        {/* 3D 棱柱动态阴影 */}
        {shadeOpacity > 0.005 && (
          <div 
            className="ig-story-3d-shade" 
            style={{ 
              opacity: shadeOpacity,
              transition: story3DRotation.isDragging ? 'none' : 'opacity 0.28s linear'
            }} 
          />
        )}

        {/* 1. 顶部 Instagram 分段进度条 */}
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

        {/* 2. 头部作者信息条 */}
        <div className="ig-story-top-author-bar">
          <div className="ig-story-author-left">
            <div className="ig-story-author-avatar">
              {currentProfilePicUrl ? (
                <img src={getAvatarProxyUrl(currentProfilePicUrl, API_BASE)} alt={selectedUser} />
              ) : (
                <span>{(selectedUser || '').substring(0, 1).toUpperCase()}</span>
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
            {/* 静音切换 */}
            {isInteractive && isV && (
              <button 
                className="ig-story-action-icon-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setStoryMuted(prev => !prev);
                }}
                title={storyMuted ? (lang === 'zh' ? '取消静音' : 'Unmute') : (lang === 'zh' ? '静音' : 'Mute')}
              >
                {storyMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
              </button>
            )}

            {/* 直接下载当前快拍原文件 */}
            {isInteractive ? (
              <a 
                href={`${API_BASE}/api/download_media?url=${encodeURIComponent(dlUrl)}&filename=${encodeURIComponent(dlName)}`}
                download
                className="ig-story-action-icon-btn"
                title="直接下载该快拍原文件"
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
                onClick={onClose}
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

        {/* 3. 媒体视口 (单张照片或视频卡片) */}
        <div className="ig-story-media-viewport">
          {isInteractive && (
            <>
              <div 
                className="ig-story-tap-area left"
                onClick={(e) => {
                  e.stopPropagation();
                  if (story3DRotation.angle !== 0 || storyDragOffset.x !== 0 || storyDragOffset.y !== 0) return;
                  handlePrevHighlightStory();
                }}
                title="切换上一张"
              />
              <div 
                className="ig-story-tap-area right"
                onClick={(e) => {
                  e.stopPropagation();
                  if (story3DRotation.angle !== 0 || storyDragOffset.x !== 0 || storyDragOffset.y !== 0) return;
                  handleNextHighlightStory();
                }}
                title="切换下一张"
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
              src={getAvatarProxyUrl(imgUrl, API_BASE)} 
              alt="Story" 
              className="ig-story-viewport-media"
            />
          )}
        </div>

        {/* 4. 底部指示条 */}
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
        onClose();
      }}
    >
      {/* 左侧翻页按钮 */}
      {(currentTrayIdx > 0 || activeHighlightStoryIndex > 0) && (
        <button 
          className="ig-story-side-nav prev"
          onClick={(e) => {
            e.stopPropagation();
            handlePrevHighlightStory();
          }}
          title="上一篇 (左箭头)"
        >
          <ChevronLeft size={28} />
        </button>
      )}

      {/* 3D 舞台与长方棱柱 */}
      <div 
        className="ig-story-3d-stage"
        onClick={e => e.stopPropagation()}
        onPointerDown={handleStoryPointerDown}
        onPointerMove={handleStoryPointerMove}
        onPointerUp={handleStoryPointerUp}
        onPointerCancel={handleStoryPointerUp}
      >
        <div 
          ref={cubeWrapperRef}
          className="ig-story-cube-wrapper"
          style={{
            transform: cubeWrapperTransform,
            transition: cubeWrapperTransition,
            opacity: cubeWrapperOpacity,
          }}
        >
          {/* 1. 当前 Highlight 专辑 (Front Face) */}
          {renderStoryCard(currentTray, activeHighlightStoryIndex, true, 'current', frontFaceStyle)}

          {/* 2. 下一个 Highlight 专辑 (Right Face, 位于 +90deg 侧面) */}
          {nextTray && (story3DRotation.angle < 0 || story3DRotation.direction === 'next') && (
            renderStoryCard(nextTray, 0, false, 'next', rightFaceStyle)
          )}

          {/* 3. 上一个 Highlight 专辑 (Left Face, 位于 -90deg 侧面) */}
          {prevTray && (story3DRotation.angle > 0 || story3DRotation.direction === 'prev') && (
            renderStoryCard(prevTray, 0, false, 'prev', leftFaceStyle)
          )}
        </div>
      </div>

      {/* 右侧翻页按钮 */}
      {(currentTrayIdx < allTrays.length - 1 || activeHighlightStoryIndex < currentTray.items.length - 1) && (
        <button 
          className="ig-story-side-nav next"
          onClick={(e) => {
            e.stopPropagation();
            handleNextHighlightStory();
          }}
          title="下一篇 (右箭头)"
        >
          <ChevronRight size={28} />
        </button>
      )}
    </div>
  );
}
