// ==UserScript==
// @name             微软文档优先中文简体
// @description      微软文档自动切换中文简体，支持悬浮球手动切回中英文。[Microsoft, Learn, Docs]
// @namespace        https://github.com/bilenth/chinese-first
// @supportURL       https://github.com/bilenth/chinese-first/issues
// @version          1.0.0
// @match            *docs.microsoft.com/*
// @match            *support.microsoft.com/*
// @match            *learn.microsoft.com/*
// @match            *azure.microsoft.com/*
// @grant            GM_addStyle
// @grant            GM_getValue
// @grant            GM_setValue
// @author           Bilenth <bilenth@outlook.com>
// @license          MIT
// ==/UserScript==

(() => {
    'use strict';

    // ==================== 配置常量 ====================
    const TARGET_LANG = '/zh-cn/';           // /zh-hk/, /zh-tw/
    const FALLBACK_LANG = '/en-us/';
    const EXCLUDED_PATHS = ['/answers/'];
    const SESSION_KEY = 'msdocs_auto_switched_session';
    const LANG_REGEX = /^\/[a-z]{2}(?:-[a-z]{2})?\//i;

    // ==================== 工具函数 ====================
    const currentUrl = new URL(location.href);
    const currentPath = currentUrl.pathname;

    /** 提取文档唯一标识（去掉语言前缀） */
    function getDocKey(url) {
        return new URL(url).pathname.replace(LANG_REGEX, '/');
    }

    /** 从 sessionStorage 读取已切换文档集合 */
    function loadSwitchedSet() {
        try {
            const raw = sessionStorage.getItem(SESSION_KEY);
            return raw ? new Set(JSON.parse(raw)) : new Set();
        } catch {
            return new Set();
        }
    }

    /** 保存已切换文档集合到 sessionStorage */
    function saveSwitchedSet(set) {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify([...set]));
    }

    /** 重定向到指定语言版本 */
    function redirectToLanguage(targetLang, excludedPaths = []) {
        if (currentPath.startsWith(targetLang)) return;
        if (excludedPaths.some(p => currentPath.includes(p))) return;

        const cleanPath = currentPath.replace(LANG_REGEX, '/');
        const newUrl = currentUrl.origin + targetLang + cleanPath.slice(1) + currentUrl.search + currentUrl.hash;
        location.replace(newUrl);
    }

    // ==================== 自动切换逻辑 ====================
    const docKey = getDocKey(location.href);
    const switchedSet = loadSwitchedSet();

    if (!switchedSet.has(docKey)) {
        if (!currentPath.startsWith(TARGET_LANG)) {
            redirectToLanguage(TARGET_LANG, EXCLUDED_PATHS);
        }
        switchedSet.add(docKey);
        saveSwitchedSet(switchedSet);
    }

    // ==================== 悬浮球手动切换 ====================
    const manualTargetLang = currentPath.startsWith(TARGET_LANG) ? FALLBACK_LANG : TARGET_LANG;

    GM_addStyle(`
        .float-ball-container {
            position: fixed;
            right: 3px;
            z-index: 999999;
            pointer-events: auto;
            opacity: 0.5;
            transition: opacity 0.3s ease;
        }

        .float-ball-container:hover {
            opacity: 1;
        }

        .float-ball {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
            cursor: pointer;
            position: relative;
            transition: all 0.3s ease;
        }

        .float-ball:hover {
            transform: scale(1);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
        }

        .close-btn {
            position: absolute;
            bottom: -9px;
            left: -9px;
            width: 14px;
            height: 14px;
            background: #ccc;
            border-radius: 50%;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 15px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
            z-index: 10;
            opacity: 0;
            transform: scale(0.8);
            transition: all 0.3s ease;
        }

        .float-ball:hover .close-btn {
            opacity: 1;
        }

        .close-btn:hover {
            background: #ff2e43;
        }

        .ball-icon {
            width: 20px;
            height: 20px;
            fill: white;
        }
    `);

    const container = document.createElement('div');
    container.className = 'float-ball-container';

    const ball = document.createElement('div');
    ball.className = 'float-ball';

    const closeBtn = document.createElement('div');
    closeBtn.className = 'close-btn';
    closeBtn.textContent = '×';

    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('viewBox', '0 0 576 512');
    icon.setAttribute('class', 'ball-icon');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M160 0c17.7 0 32 14.3 32 32l0 32 128 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-9.6 0-8.4 23.1c-16.4 45.2-41.1 86.5-72.2 122 14.2 8.8 29 16.6 44.4 23.5l50.4 22.4 62.2-140c5.1-11.6 16.6-19 29.2-19s24.1 7.4 29.2 19l128 288c7.2 16.2-.1 35.1-16.2 42.2s-35.1-.1-42.2-16.2l-20-45-157.5 0-20 45c-7.2 16.2-26.1 23.4-42.2 16.2s-23.4-26.1-16.2-42.2l39.8-89.5-50.4-22.4c-23-10.2-45-22.4-65.8-36.4-21.3 17.2-44.6 32.2-69.5 44.7L78.3 380.6c-15.8 7.9-35 1.5-42.9-14.3s-1.5-35 14.3-42.9l34.5-17.3c16.3-8.2 31.8-17.7 46.4-28.3-13.8-12.7-26.8-26.4-38.9-40.9L81.6 224.7c-11.3-13.6-9.5-33.8 4.1-45.1s33.8-9.5 45.1 4.1l10.2 12.2c11.5 13.9 24.1 26.8 37.4 38.7 27.5-30.4 49.2-66.1 63.5-105.4l.5-1.2-210.3 0C14.3 128 0 113.7 0 96S14.3 64 32 64l96 0 0-32c0-17.7 14.3-32 32-32zM416 270.8L365.7 384 466.3 384 416 270.8z');
    path.setAttribute('fill', 'currentColor');
    icon.appendChild(path);

    ball.append(closeBtn, icon);
    container.appendChild(ball);
    document.body.appendChild(container);

    // 恢复或初始化位置
    const savedPos = GM_getValue('floatBallPosition');
    container.style.top = savedPos !== undefined
        ? `${savedPos}px`
        : `${window.innerHeight / 2 - ball.offsetHeight / 2}px`;

    // 拖拽状态
    let isDragging = false;
    let startY = 0;
    let offsetY = 0;
    let dragStartTime = 0;
    let isClick = false;

    /** 保存悬浮球位置 */
    function persistPosition() {
        const top = parseFloat(container.style.top);
        if (!isNaN(top)) GM_setValue('floatBallPosition', top);
    }

    /** 限制位置在视口内 */
    function clampPosition(y) {
        const maxY = window.innerHeight - ball.offsetHeight;
        return Math.max(0, Math.min(y, maxY));
    }

    /** 判断是否为点击（轻触+短时） */
    function checkClick(endY, duration) {
        return Math.abs(endY - startY) <= 5 && duration < 200;
    }

    /** 启动拖拽 */
    function startDrag(clientY) {
        isDragging = true;
        dragStartTime = Date.now();
        startY = clientY;
        offsetY = clientY - parseFloat(getComputedStyle(container).top);
        ball.style.cursor = 'grabbing';
    }

    /** 移动悬浮球 */
    function moveDrag(clientY) {
        if (!isDragging) return;
        container.style.top = `${clampPosition(clientY - offsetY)}px`;
    }

    /** 结束拖拽 */
    function endDrag(endY) {
        if (!isDragging) return;
        const duration = Date.now() - dragStartTime;

        if (checkClick(endY, duration)) {
            isClick = true;
            ball.dispatchEvent(new MouseEvent('click'));
        } else {
            isClick = false;
        }

        isDragging = false;
        ball.style.cursor = 'pointer';
        persistPosition();
    }

    // 鼠标事件
    ball.addEventListener('mousedown', (e) => {
        if (e.target === closeBtn) return;
        startDrag(e.clientY);
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => moveDrag(e.clientY));
    document.addEventListener('mouseup', (e) => endDrag(e.clientY));

    // 触摸事件
    ball.addEventListener('touchstart', (e) => {
        if (e.target === closeBtn) return;
        startDrag(e.touches[0].clientY);
        e.preventDefault();
    }, { passive: false });

    document.addEventListener('touchmove', (e) => moveDrag(e.touches[0].clientY));
    document.addEventListener('touchend', (e) => endDrag(e.changedTouches[0]?.clientY ?? 0));

    // 点击切换语言
    ball.addEventListener('click', () => {
        if (isClick) {
            console.log('悬浮球手动切换语言');
            redirectToLanguage(manualTargetLang, EXCLUDED_PATHS);
            isClick = false;
        }
    });

    // 关闭按钮
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        container.style.display = 'none';
    });

    // 窗口 resize
    window.addEventListener('resize', () => {
        const top = parseFloat(container.style.top);
        const maxY = window.innerHeight - ball.offsetHeight;
        if (top > maxY) {
            container.style.top = `${maxY}px`;
            persistPosition();
        }
    });

})();