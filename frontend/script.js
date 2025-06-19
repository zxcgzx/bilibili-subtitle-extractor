// 应用程序主类
class BilibiliSubtitleExtractor {
    constructor() {
        this.currentSubtitles = null;
        this.currentVideoInfo = null;
        this.apiBaseUrl = window.location.origin;
        this.currentMode = 'smart-mode'; // 当前模式：smart-mode 或 file-mode
        this.apiFailureCount = 0; // API失败次数
        this.maxApiFailures = 2; // 最大失败次数，超过后自动引导到文件模式
        
        this.initializeElements();
        this.bindEvents();
        this.initializeApp();
        this.initializeTutorialToggle();
    }
    
    // 初始化DOM元素引用
    initializeElements() {
        this.elements = {
            // 选项卡相关
            tabBtns: document.querySelectorAll('.tab-btn'),
            tabContents: document.querySelectorAll('.tab-content'),
            smartModeTab: document.getElementById('smart-mode'),
            fileModeTab: document.getElementById('file-mode'),
            
            // 智能提取模式
            videoUrl: document.getElementById('videoUrl'),
            extractBtn: document.getElementById('extractBtn'),
            btnText: document.getElementById('extractBtn')?.querySelector('.btn-text'),
            btnLoader: document.getElementById('extractBtn')?.querySelector('.btn-loader'),
            apiFallbackNotice: document.getElementById('apiFallbackNotice'),
            switchModeBtn: document.querySelector('.switch-mode-btn'),
            
            // 文件上传模式
            uploadArea: document.getElementById('uploadArea'),
            fileInput: document.getElementById('fileInput'),
            selectFileBtn: document.getElementById('selectFileBtn'),
            fileInfo: document.getElementById('fileInfo'),
            convertActions: document.getElementById('convertActions'),
            
            // 结果显示
            errorSection: document.getElementById('errorSection'),
            downloadBtns: document.querySelectorAll('.download-btn'),
            errorMessage: document.getElementById('errorMessage'),
            retryBtn: document.getElementById('retryBtn'),
            
            // 全局元素
            loadingOverlay: document.getElementById('loadingOverlay'),
            toast: document.getElementById('toast'),
            toastMessage: document.getElementById('toastMessage')
        };
        
        // 获取提取按钮的引用
        this.extractBtn = document.getElementById('extractBtn');
    }
    
    // 绑定事件处理器
    bindEvents() {
        // 选项卡切换事件
        this.elements.tabBtns?.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.getAttribute('data-tab');
                this.switchTab(targetTab);
            });
        });
        
        // 模式切换按钮
        this.elements.switchModeBtn?.addEventListener('click', (e) => {
            const targetMode = e.target.getAttribute('data-target');
            this.switchTab(targetMode);
        });
        
        // 智能提取模式事件
        this.extractBtn?.addEventListener('click', () => this.handleExtract());
        
        this.elements.videoUrl?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleExtract();
            }
        });
        
        this.elements.videoUrl?.addEventListener('input', () => {
            this.validateInput();
        });
        
        this.elements.retryBtn?.addEventListener('click', () => this.handleExtract());
        
        // 智能提取模式下载按钮事件
        this.elements.downloadBtns?.forEach(btn => {
            // 只绑定结果区域的下载按钮，文件模式的下载按钮由fileHandler处理
            if (!btn.closest('#file-mode')) {
                btn.addEventListener('click', () => {
                    const format = btn.getAttribute('data-format');
                    this.handleDownload(format);
                });
            }
        });
        
        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                if (this.currentMode === 'smart-mode') {
                    this.handleExtract();
                }
            }
        });
        
        // 教程折叠功能
        const tutorialToggle = document.getElementById('tutorialToggle');
        const tutorialContent = document.getElementById('tutorialContent');
        
        if (tutorialToggle && tutorialContent) {
            tutorialToggle.addEventListener('click', () => {
                const isVisible = tutorialContent.style.display !== 'none';
                tutorialContent.style.display = isVisible ? 'none' : 'block';
                const arrow = tutorialToggle.querySelector('.toggle-arrow');
                if (arrow) {
                    arrow.textContent = isVisible ? '▼' : '▲';
                }
            });
        }
    }
    
    // 初始化应用程序
    initializeApp() {
        console.log('🎬 Bilibili字幕提取工具已加载');
        this.validateInput();
        
        // 检查URL参数
        const urlParams = new URLSearchParams(window.location.search);
        const videoUrl = urlParams.get('url');
        if (videoUrl) {
            this.elements.videoUrl.value = decodeURIComponent(videoUrl);
            this.validateInput();
        }
    }
    
    // 验证输入
    validateInput() {
        const url = this.elements.videoUrl?.value.trim();
        const isValid = this.isValidBilibiliUrl(url);
        
        if (this.extractBtn) {
            this.extractBtn.disabled = !isValid;
        }
        
        return isValid;
    }
    
    // 切换选项卡
    switchTab(targetTab) {
        // 更新选项卡按钮状态
        this.elements.tabBtns?.forEach(btn => {
            const isActive = btn.getAttribute('data-tab') === targetTab;
            btn.classList.toggle('active', isActive);
        });
        
        // 更新选项卡内容显示
        this.elements.tabContents?.forEach(content => {
            const isActive = content.id === targetTab;
            content.classList.toggle('active', isActive);
        });
        
        // 更新当前模式
        this.currentMode = targetTab;
        
        // 隐藏结果和错误区域
        this.hideResults();
        this.hideError();
        
        console.log(`切换到模式: ${targetTab}`);
    }
    
    // 显示API降级提示
    showApiFallbackNotice(show = true) {
        if (this.elements.apiFallbackNotice) {
            this.elements.apiFallbackNotice.style.display = show ? 'block' : 'none';
        }
    }
    
    // 智能降级策略
    handleApiFallback() {
        this.apiFailureCount++;
        
        if (this.apiFailureCount >= this.maxApiFailures) {
            console.log('API失败次数达到阈值，启动智能降级');
            this.showApiFallbackNotice(true);
            
            // 自动切换到文件模式的逻辑可以在这里添加
            setTimeout(() => {
                if (confirm('智能提取已多次失败，是否切换到文件上传模式？')) {
                    this.switchTab('file-mode');
                }
            }, 2000);
        }
    }
    
    // 重置API失败计数
    resetApiFailureCount() {
        this.apiFailureCount = 0;
        this.showApiFallbackNotice(false);
    }
    
    // 验证是否为有效的bilibili链接
    isValidBilibiliUrl(url) {
        if (!url) return false;
        
        const patterns = [
            /(?:https?:\/\/)?(?:www\.)?bilibili\.com\/video\/(BV\w+)/,
            /(?:https?:\/\/)?(?:www\.)?bilibili\.com\/video\/(av\d+)/,
            /(?:https?:\/\/)?(?:m\.)?bilibili\.com\/video\/(BV\w+)/,
            /(?:https?:\/\/)?(?:m\.)?bilibili\.com\/video\/(av\d+)/
        ];
        
        return patterns.some(pattern => pattern.test(url));
    }
    
    // 处理字幕提取
    async handleExtract() {
        const url = this.elements.videoUrl?.value.trim();
        
        if (!this.isValidBilibiliUrl(url)) {
            this.showError('请输入有效的Bilibili视频链接');
            return;
        }
        
        try {
            this.setLoadingState(true);
            this.hideError();
            this.hideResults();
            
            console.log('开始提取字幕:', url);
            
            const response = await fetch(`${this.apiBaseUrl}/api/extract-subtitle`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || '提取失败');
            }
            
            if (data.success) {
                this.currentSubtitles = data.data.subtitles;
                this.currentVideoInfo = {
                    title: data.data.title,
                    bvid: data.data.bvid
                };
                
                this.displayResults(data.data);
                this.showToast('字幕提取成功！');
                
                // 重置API失败计数
                this.resetApiFailureCount();
                
                // 更新URL参数
                const newUrl = new URL(window.location);
                newUrl.searchParams.set('url', encodeURIComponent(url));
                window.history.replaceState({}, '', newUrl);
                
            } else {
                throw new Error(data.error || '未知错误');
            }
            
        } catch (error) {
            console.error('提取字幕失败:', error);
            this.showError(error.message);
            
            // 启动智能降级策略
            this.handleApiFallback();
        } finally {
            this.setLoadingState(false);
        }
    }
    
    // 显示结果
    displayResults(data) {
        // 显示字幕预览（使用新的预览区域）
        this.displaySubtitlePreview(data.subtitles);
    }
    
    // 显示字幕预览
    displaySubtitlePreview(subtitles) {
        const previewTextarea = document.getElementById('previewTextarea');
        if (!previewTextarea) return;
        
        const maxPreviewItems = 20; // 限制预览条数
        const previewSubtitles = subtitles.slice(0, maxPreviewItems);
        
        // 生成SRT格式预览（默认）
        const previewText = previewSubtitles.map((subtitle, index) => {
            const startTime = this.formatTime(subtitle.from);
            const endTime = this.formatTime(subtitle.to);
            
            return `${index + 1}\n${startTime} --> ${endTime}\n${subtitle.content}\n`;
        }).join('\n');
        
        let fullText = previewText;
        
        if (subtitles.length > maxPreviewItems) {
            fullText += `\n... 还有 ${subtitles.length - maxPreviewItems} 条字幕 ...\n`;
        }
        
        previewTextarea.value = fullText;
        
        // 显示预览区域
        const previewSection = document.getElementById('previewSection');
        if (previewSection) {
            previewSection.style.display = 'block';
        }
        
        // 显示转换按钮
        const convertActions = document.getElementById('convertActions');
        if (convertActions) {
            convertActions.style.display = 'block';
        }
    }
    
    // 处理下载
    async handleDownload(format) {
        if (!this.currentSubtitles || !this.currentVideoInfo) {
            this.showError('没有可下载的字幕数据');
            return;
        }
        
        try {
            console.log('开始下载字幕:', format);
            
            const response = await fetch(`${this.apiBaseUrl}/api/convert-subtitle`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    subtitles: this.currentSubtitles,
                    format: format
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || '格式转换失败');
            }
            
            if (data.success) {
                this.downloadFile(data.data.content, data.data.fileName, format);
                this.showToast(`${format.toUpperCase()}格式字幕下载成功！`);
            } else {
                throw new Error(data.error || '下载失败');
            }
            
        } catch (error) {
            console.error('下载失败:', error);
            this.showError(`下载失败: ${error.message}`);
        }
    }
    
    // 下载文件
    downloadFile(content, fileName, format) {
        const mimeTypes = {
            'srt': 'text/srt',
            'vtt': 'text/vtt',
            'txt': 'text/plain'
        };
        
        const blob = new Blob([content], { 
            type: mimeTypes[format] || 'text/plain' 
        });
        
        // 生成文件名
        const videoTitle = this.currentVideoInfo.title
            .replace(/[^\w\s\u4e00-\u9fa5]/g, '') // 移除特殊字符，保留中文
            .replace(/\s+/g, '_') // 空格替换为下划线
            .substring(0, 50); // 限制长度
        
        const finalFileName = `${videoTitle}_${this.currentVideoInfo.bvid}.${format}`;
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = finalFileName;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // 释放URL对象
        URL.revokeObjectURL(url);
    }
    
    // 设置加载状态
    setLoadingState(isLoading) {
        if (!this.extractBtn) return;
        
        const btnText = this.extractBtn.querySelector('.btn-text');
        const btnLoader = this.extractBtn.querySelector('.btn-loader');
        
        if (isLoading) {
            this.extractBtn.disabled = true;
            if (btnText) btnText.style.display = 'none';
            if (btnLoader) btnLoader.style.display = 'flex';
        } else {
            this.extractBtn.disabled = false;
            if (btnText) btnText.style.display = 'block';
            if (btnLoader) btnLoader.style.display = 'none';
        }
    }
    
    // 显示错误
    showError(message) {
        if (this.elements.errorMessage) {
            this.elements.errorMessage.textContent = message;
        }
        if (this.elements.errorSection) {
            this.elements.errorSection.style.display = 'block';
        }
        
        // 滚动到错误区域
        this.elements.errorSection?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }
    
    // 隐藏错误
    hideError() {
        if (this.elements.errorSection) {
            this.elements.errorSection.style.display = 'none';
        }
    }
    
    // 隐藏结果
    hideResults() {
        if (this.elements.resultSection) {
            this.elements.resultSection.style.display = 'none';
        }
    }
    
    // 显示Toast提示
    showToast(message, duration = 3000) {
        if (!this.elements.toast || !this.elements.toastMessage) return;
        
        this.elements.toastMessage.textContent = message;
        this.elements.toast.style.display = 'block';
        
        setTimeout(() => {
            if (this.elements.toast) {
                this.elements.toast.style.display = 'none';
            }
        }, duration);
    }
    
    // 格式化时间
    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
    }
    
    // HTML转义
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 工具函数
const Utils = {
    // 复制到剪贴板
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            console.error('复制失败:', err);
            return false;
        }
    },
    
    // 格式化文件大小
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    // 防抖函数
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // 节流函数
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

// 错误处理
window.addEventListener('error', (e) => {
    console.error('全局错误:', e.error);
    
    // 用户友好的错误提示
    if (window.app && typeof window.app.showError === 'function') {
        window.app.showError('应用程序遇到了一个错误，请刷新页面重试');
    }
});

// 网络状态检测
window.addEventListener('online', () => {
    console.log('网络已连接');
    if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('网络连接已恢复');
    }
});

window.addEventListener('offline', () => {
    console.log('网络已断开');
    if (window.app && typeof window.app.showError === 'function') {
        window.app.showError('网络连接已断开，请检查网络设置');
    }
});

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM加载完成，初始化应用...');
    
    try {
        window.app = new BilibiliSubtitleExtractor();
        console.log('应用初始化成功');
    } catch (error) {
        console.error('应用初始化失败:', error);
        alert('应用初始化失败，请刷新页面重试');
    }
});

// 页面可见性变化处理
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        console.log('页面已激活');
    } else {
        console.log('页面已隐藏');
    }
});

// 页面卸载前的清理
window.addEventListener('beforeunload', () => {
    console.log('页面即将卸载');
    // 清理工作
});

// 调试模式
if (window.location.search.includes('debug=true')) {
    console.log('调试模式已启用');
    window.debug = true;
    
    // 添加调试工具
    window.debugTools = {
        app: () => window.app,
        testExtract: (url) => {
            if (window.app) {
                window.app.elements.videoUrl.value = url;
                window.app.handleExtract();
            }
        },
        clearResults: () => {
            if (window.app) {
                window.app.hideResults();
                window.app.hideError();
            }
        }
    };

    // 初始化教程折叠功能
    initializeTutorialToggle() {
        const tutorialToggle = document.getElementById('tutorialToggle');
        const tutorialContent = document.getElementById('tutorialContent');
        
        if (tutorialToggle && tutorialContent) {
            tutorialToggle.addEventListener('click', () => {
                const isVisible = tutorialContent.style.display !== 'none';
                
                if (isVisible) {
                    tutorialContent.style.display = 'none';
                    tutorialToggle.classList.remove('active');
                } else {
                    tutorialContent.style.display = 'block';
                    tutorialToggle.classList.add('active');
                }
            });
        }
    }
}

// 导出到全局（用于调试）
window.BilibiliSubtitleExtractor = BilibiliSubtitleExtractor;
window.Utils = Utils;