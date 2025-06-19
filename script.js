// 纯静态版本的字幕提取器 - 适用于GitHub Pages
class BilibiliSubtitleExtractor {
    constructor() {
        this.currentSubtitles = null;
        this.currentVideoInfo = null;
        
        this.initializeElements();
        this.bindEvents();
        this.initializeApp();
        this.initializeTutorialToggle();
    }
    
    // 初始化DOM元素引用
    initializeElements() {
        this.elements = {
            // JSON输入相关
            jsonTextarea: document.getElementById('jsonTextarea'),
            parseJsonBtn: document.getElementById('parseJsonBtn'),
            clearJsonBtn: document.getElementById('clearJsonBtn'),
            pasteJsonBtn: document.getElementById('pasteJsonBtn'),
            jsonInfo: document.getElementById('jsonInfo'),
            jsonSubtitleCount: document.getElementById('jsonSubtitleCount'),
            jsonDuration: document.getElementById('jsonDuration'),
            jsonCharCount: document.getElementById('jsonCharCount'),
            
            // 预览和格式选择
            previewSection: document.getElementById('previewSection'),
            previewTextarea: document.getElementById('previewTextarea'),
            formatTabs: document.querySelectorAll('.format-tab'),
            refreshPreviewBtn: document.getElementById('refreshPreviewBtn'),
            
            // 转换和下载
            convertActions: document.getElementById('convertActions'),
            convertBtns: document.querySelectorAll('.convert-btn'),
            
            // 设置
            encodingSelect: document.querySelector('select[name="encoding"]'),
            linebreakSelect: document.querySelector('select[name="linebreak"]'),
            
            // 全局元素
            loadingOverlay: document.getElementById('loadingOverlay'),
            toast: document.getElementById('toast'),
            toastMessage: document.getElementById('toastMessage'),
            errorSection: document.getElementById('errorSection'),
            errorMessage: document.getElementById('errorMessage'),
            retryBtn: document.getElementById('retryBtn')
        };
    }
    
    // 绑定事件监听器
    bindEvents() {
        // JSON处理按钮
        this.elements.parseJsonBtn?.addEventListener('click', () => this.parseJsonData());
        this.elements.clearJsonBtn?.addEventListener('click', () => this.clearJsonInput());
        this.elements.pasteJsonBtn?.addEventListener('click', () => this.pasteFromClipboard());
        
        // 格式标签页切换
        this.elements.formatTabs?.forEach(tab => {
            tab.addEventListener('click', (e) => this.switchPreviewFormat(e.target.dataset.format));
        });
        
        // 刷新预览
        this.elements.refreshPreviewBtn?.addEventListener('click', () => this.refreshPreview());
        
        // 转换和下载按钮
        this.elements.convertBtns?.forEach(btn => {
            btn.addEventListener('click', (e) => this.downloadSubtitle(e.currentTarget.dataset.format));
        });
        
        // 错误重试
        this.elements.retryBtn?.addEventListener('click', () => this.hideError());
        
        // JSON文本框变化
        this.elements.jsonTextarea?.addEventListener('input', () => this.onJsonInputChange());
    }
    
    // 初始化应用
    initializeApp() {
        this.hideAllSections();
        this.loadDemoData();
    }
    
    // 加载演示数据
    loadDemoData() {
        const demoData = {
            "body": [
                {
                    "from": 0.0,
                    "to": 3.5,
                    "content": "欢迎使用Bilibili字幕提取工具"
                },
                {
                    "from": 3.5,
                    "to": 7.0,
                    "content": "请按照教程获取字幕JSON数据"
                },
                {
                    "from": 7.0,
                    "to": 11.0,
                    "content": "粘贴到文本框中即可转换为各种格式"
                }
            ]
        };
        
        if (this.elements.jsonTextarea) {
            this.elements.jsonTextarea.value = JSON.stringify(demoData, null, 2);
            setTimeout(() => this.parseJsonData(), 500);
        }
    }
    
    // 解析JSON数据
    async parseJsonData() {
        const jsonText = this.elements.jsonTextarea?.value.trim();
        
        if (!jsonText) {
            this.showError('请先粘贴字幕JSON数据');
            return;
        }
        
        try {
            this.showLoading();
            
            // 解析JSON
            const jsonData = JSON.parse(jsonText);
            
            // 验证数据格式
            if (!this.validateJsonData(jsonData)) {
                throw new Error('JSON格式不正确，请确保包含有效的字幕数据');
            }
            
            // 处理数据
            this.currentSubtitles = this.processSubtitleData(jsonData);
            
            // 更新UI
            this.updateJsonInfo();
            this.showPreviewSection();
            this.showConvertActions();
            this.refreshPreview();
            
            this.hideLoading();
            this.showToast('JSON解析成功！');
            
        } catch (error) {
            this.hideLoading();
            this.showError(`JSON解析失败: ${error.message}`);
        }
    }
    
    // 验证JSON数据格式
    validateJsonData(jsonData) {
        // 检查基本结构
        if (!jsonData || typeof jsonData !== 'object') {
            return false;
        }
        
        // 查找字幕数组
        let subtitleArray = null;
        
        if (Array.isArray(jsonData.body)) {
            subtitleArray = jsonData.body;
        } else if (Array.isArray(jsonData.data)) {
            subtitleArray = jsonData.data;
        } else if (Array.isArray(jsonData)) {
            subtitleArray = jsonData;
        } else if (jsonData.data && Array.isArray(jsonData.data.body)) {
            subtitleArray = jsonData.data.body;
        }
        
        if (!subtitleArray || !Array.isArray(subtitleArray)) {
            return false;
        }
        
        // 检查字幕项格式
        return subtitleArray.length > 0 && subtitleArray.every(item => 
            typeof item === 'object' && 
            (typeof item.from === 'number' || typeof item.location === 'number') &&
            (typeof item.to === 'number' || typeof item.duration === 'number') &&
            typeof item.content === 'string'
        );
    }
    
    // 处理字幕数据
    processSubtitleData(jsonData) {
        let subtitleArray = null;
        
        // 查找字幕数组
        if (Array.isArray(jsonData.body)) {
            subtitleArray = jsonData.body;
        } else if (Array.isArray(jsonData.data)) {
            subtitleArray = jsonData.data;
        } else if (Array.isArray(jsonData)) {
            subtitleArray = jsonData;
        } else if (jsonData.data && Array.isArray(jsonData.data.body)) {
            subtitleArray = jsonData.data.body;
        }
        
        // 标准化格式
        return subtitleArray.map(item => ({
            from: item.from || item.location || 0,
            to: item.to || (item.location + item.duration) || 0,
            content: item.content || ''
        })).sort((a, b) => a.from - b.from);
    }
    
    // 更新JSON信息显示
    updateJsonInfo() {
        if (!this.currentSubtitles || !this.elements.jsonInfo) return;
        
        const count = this.currentSubtitles.length;
        const duration = Math.max(...this.currentSubtitles.map(s => s.to));
        const charCount = this.currentSubtitles.reduce((sum, s) => sum + s.content.length, 0);
        
        if (this.elements.jsonSubtitleCount) {
            this.elements.jsonSubtitleCount.textContent = count;
        }
        if (this.elements.jsonDuration) {
            this.elements.jsonDuration.textContent = this.formatTime(duration);
        }
        if (this.elements.jsonCharCount) {
            this.elements.jsonCharCount.textContent = charCount;
        }
        
        this.elements.jsonInfo.style.display = 'block';
    }
    
    // 格式化时间
    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        }
    }
    
    // 切换预览格式
    switchPreviewFormat(format) {
        // 更新标签页状态
        this.elements.formatTabs?.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.format === format);
        });
        
        // 更新预览内容
        this.updatePreviewContent(format);
    }
    
    // 更新预览内容
    updatePreviewContent(format) {
        if (!this.currentSubtitles || !this.elements.previewTextarea) return;
        
        let content = '';
        
        switch (format) {
            case 'srt':
                content = this.convertToSRT(this.currentSubtitles);
                break;
            case 'vtt':
                content = this.convertToVTT(this.currentSubtitles);
                break;
            case 'txt':
                content = this.convertToTXT(this.currentSubtitles);
                break;
        }
        
        this.elements.previewTextarea.value = content;
    }
    
    // 刷新预览
    refreshPreview() {
        const activeTab = document.querySelector('.format-tab.active');
        const format = activeTab?.dataset.format || 'srt';
        this.updatePreviewContent(format);
    }
    
    // 转换为SRT格式
    convertToSRT(subtitles) {
        return subtitles.map((subtitle, index) => {
            const startTime = this.formatSRTTime(subtitle.from);
            const endTime = this.formatSRTTime(subtitle.to);
            
            return `${index + 1}\n${startTime} --> ${endTime}\n${subtitle.content}\n`;
        }).join('\n');
    }
    
    // 转换为VTT格式
    convertToVTT(subtitles) {
        const header = 'WEBVTT\n\n';
        const content = subtitles.map(subtitle => {
            const startTime = this.formatVTTTime(subtitle.from);
            const endTime = this.formatVTTTime(subtitle.to);
            
            return `${startTime} --> ${endTime}\n${subtitle.content}\n`;
        }).join('\n');
        
        return header + content;
    }
    
    // 转换为TXT格式
    convertToTXT(subtitles) {
        return subtitles.map(subtitle => subtitle.content).join('\n');
    }
    
    // 格式化SRT时间
    formatSRTTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 1000);
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
    }
    
    // 格式化VTT时间
    formatVTTTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 1000);
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
    }
    
    // 下载字幕文件
    async downloadSubtitle(format) {
        if (!this.currentSubtitles) {
            this.showError('没有可下载的字幕数据');
            return;
        }
        
        try {
            let content = '';
            let filename = '';
            let mimeType = '';
            
            switch (format) {
                case 'srt':
                    content = this.convertToSRT(this.currentSubtitles);
                    filename = 'subtitle.srt';
                    mimeType = 'text/plain';
                    break;
                case 'vtt':
                    content = this.convertToVTT(this.currentSubtitles);
                    filename = 'subtitle.vtt';
                    mimeType = 'text/vtt';
                    break;
                case 'txt':
                    content = this.convertToTXT(this.currentSubtitles);
                    filename = 'subtitle.txt';
                    mimeType = 'text/plain';
                    break;
                default:
                    throw new Error('不支持的格式');
            }
            
            // 应用编码设置
            const encoding = this.elements.encodingSelect?.value || 'utf-8';
            const linebreak = this.elements.linebreakSelect?.value || 'lf';
            
            // 处理换行符
            if (linebreak === 'crlf') {
                content = content.replace(/\n/g, '\r\n');
            }
            
            // 创建并下载文件
            this.downloadFile(content, filename, mimeType);
            this.showToast(`${format.toUpperCase()}文件下载成功！`);
            
        } catch (error) {
            this.showError(`下载失败: ${error.message}`);
        }
    }
    
    // 下载文件
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }
    
    // 从剪贴板粘贴
    async pasteFromClipboard() {
        try {
            if (navigator.clipboard && navigator.clipboard.readText) {
                const text = await navigator.clipboard.readText();
                if (this.elements.jsonTextarea) {
                    this.elements.jsonTextarea.value = text;
                    this.onJsonInputChange();
                }
                this.showToast('已从剪贴板粘贴内容');
            } else {
                // 兜底方案
                this.showToast('请手动粘贴内容到文本框');
            }
        } catch (error) {
            this.showToast('无法访问剪贴板，请手动粘贴');
        }
    }
    
    // 清空JSON输入
    clearJsonInput() {
        if (this.elements.jsonTextarea) {
            this.elements.jsonTextarea.value = '';
            this.onJsonInputChange();
        }
        this.hideAllSections();
        this.showToast('已清空输入内容');
    }
    
    // JSON输入变化
    onJsonInputChange() {
        const hasContent = this.elements.jsonTextarea?.value.trim().length > 0;
        
        if (!hasContent) {
            this.hideAllSections();
        }
    }
    
    // 显示/隐藏相关区域
    showPreviewSection() {
        if (this.elements.previewSection) {
            this.elements.previewSection.style.display = 'block';
        }
    }
    
    showConvertActions() {
        if (this.elements.convertActions) {
            this.elements.convertActions.style.display = 'block';
        }
    }
    
    hideAllSections() {
        if (this.elements.jsonInfo) {
            this.elements.jsonInfo.style.display = 'none';
        }
        if (this.elements.previewSection) {
            this.elements.previewSection.style.display = 'none';
        }
        if (this.elements.convertActions) {
            this.elements.convertActions.style.display = 'none';
        }
    }
    
    // 显示加载状态
    showLoading() {
        if (this.elements.loadingOverlay) {
            this.elements.loadingOverlay.style.display = 'flex';
        }
    }
    
    hideLoading() {
        if (this.elements.loadingOverlay) {
            this.elements.loadingOverlay.style.display = 'none';
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
    }
    
    hideError() {
        if (this.elements.errorSection) {
            this.elements.errorSection.style.display = 'none';
        }
    }
    
    // 显示提示
    showToast(message) {
        if (this.elements.toastMessage) {
            this.elements.toastMessage.textContent = message;
        }
        if (this.elements.toast) {
            this.elements.toast.style.display = 'block';
            setTimeout(() => {
                this.elements.toast.style.display = 'none';
            }, 3000);
        }
    }
    
    // 初始化教程切换
    initializeTutorialToggle() {
        const tutorialToggle = document.getElementById('tutorialToggle');
        const tutorialContent = document.getElementById('tutorialContent');
        const toggleArrow = tutorialToggle?.querySelector('.toggle-arrow');
        
        tutorialToggle?.addEventListener('click', () => {
            const isVisible = tutorialContent.style.display !== 'none';
            
            tutorialContent.style.display = isVisible ? 'none' : 'block';
            if (toggleArrow) {
                toggleArrow.textContent = isVisible ? '▼' : '▲';
            }
        });
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.subtitleExtractor = new BilibiliSubtitleExtractor();
});