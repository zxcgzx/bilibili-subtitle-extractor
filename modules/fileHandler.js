/**
 * JSON处理器 - 处理JSON输入、解析、转换等功能
 * 支持文本输入、多种编码、错误处理等
 */

class JSONHandler {
    constructor() {
        this.currentData = null;
        this.currentSubtitles = null;
        
        this.initializeEventListeners();
    }

    /**
     * 初始化事件监听器
     */
    initializeEventListeners() {
        // JSON文本框
        const jsonTextarea = document.getElementById('jsonTextarea');
        if (jsonTextarea) {
            jsonTextarea.addEventListener('input', () => this.handleTextInput());
            jsonTextarea.addEventListener('paste', () => {
                // 延迟处理粘贴事件，确保内容已粘贴
                setTimeout(() => this.handleTextInput(), 100);
            });
        }

        // 操作按钮
        const clearJsonBtn = document.getElementById('clearJsonBtn');
        const pasteJsonBtn = document.getElementById('pasteJsonBtn');
        const parseJsonBtn = document.getElementById('parseJsonBtn');
        
        if (clearJsonBtn) {
            clearJsonBtn.addEventListener('click', () => this.clearJSON());
        }
        
        if (pasteJsonBtn) {
            pasteJsonBtn.addEventListener('click', () => this.pasteFromClipboard());
        }
        
        if (parseJsonBtn) {
            parseJsonBtn.addEventListener('click', () => this.parseJSON());
        }

        // 转换按钮
        const convertBtns = document.querySelectorAll('#main-content .convert-btn');
        convertBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const format = e.currentTarget.getAttribute('data-format');
                this.handleConvert(format);
            });
        });

        // 预览格式切换
        const formatTabs = document.querySelectorAll('.format-tab');
        formatTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const format = e.currentTarget.getAttribute('data-format');
                this.switchPreviewFormat(format);
            });
        });

        // 刷新预览按钮
        const refreshPreviewBtn = document.getElementById('refreshPreviewBtn');
        if (refreshPreviewBtn) {
            refreshPreviewBtn.addEventListener('click', () => {
                this.refreshPreview();
            });
        }
    }

    /**
     * 处理文本输入
     */
    handleTextInput() {
        const jsonTextarea = document.getElementById('jsonTextarea');
        if (!jsonTextarea) return;
        
        const content = jsonTextarea.value.trim();
        
        // 如果内容为空，重置状态
        if (!content) {
            this.resetState();
            return;
        }
        
        // 如果内容看起来像JSON，自动尝试解析
        if (content.startsWith('{') && content.endsWith('}')) {
            // 延迟解析，避免频繁解析
            clearTimeout(this.parseTimeout);
            this.parseTimeout = setTimeout(() => {
                this.parseJSON(false); // 静默解析，不显示成功消息
            }, 1000);
        }
    }

    /**
     * 从剪贴板粘贴
     */
    async pasteFromClipboard() {
        try {
            if (!navigator.clipboard) {
                this.showError('您的浏览器不支持剪贴板API');
                return;
            }
            
            const text = await navigator.clipboard.readText();
            const jsonTextarea = document.getElementById('jsonTextarea');
            
            if (jsonTextarea) {
                jsonTextarea.value = text;
                this.handleTextInput();
                this.showToast('已从剪贴板粘贴内容');
            }
        } catch (error) {
            console.error('粘贴失败:', error);
            this.showError('粘贴失败，请手动粘贴或检查浏览器权限');
        }
    }

    /**
     * 解析JSON
     * @param {boolean} showSuccess - 是否显示成功消息
     */
    parseJSON(showSuccess = true) {
        const jsonTextarea = document.getElementById('jsonTextarea');
        if (!jsonTextarea) return;
        
        const content = jsonTextarea.value.trim();
        
        if (!content) {
            this.showError('请先输入JSON数据');
            return;
        }
        
        try {
            // 使用字幕转换器解析JSON
            const parseResult = window.subtitleConverter.parseSubtitleJSON(content);
            
            if (!parseResult.success) {
                this.showError(`JSON解析失败: ${parseResult.error}`);
                this.resetState();
                return;
            }
            
            // 保存数据
            this.currentData = content;
            this.currentSubtitles = parseResult.subtitles;
            
            // 显示JSON信息
            this.displayJSONInfo(parseResult);
            
            // 显示转换选项和预览
            this.showConvertActions(true);
            this.showPreviewSection(true);
            this.updatePreview('srt'); // 默认显示SRT格式预览
            
            if (showSuccess) {
                this.showToast('JSON解析成功！');
            }
            
        } catch (error) {
            console.error('JSON解析失败:', error);
            this.showError(`JSON格式错误: ${error.message}`);
            this.resetState();
        }
    }

    /**
     * 清空JSON输入
     */
    clearJSON() {
        const jsonTextarea = document.getElementById('jsonTextarea');
        if (jsonTextarea) {
            jsonTextarea.value = '';
            jsonTextarea.focus();
        }
        
        this.resetState();
        this.showToast('已清空输入内容');
    }

    /**
     * 重置状态
     */
    resetState() {
        this.currentData = null;
        this.currentSubtitles = null;
        
        this.showJSONInfo(false);
        this.showConvertActions(false);
        this.showPreviewSection(false);
    }

    /**
     * 验证文件
     * @param {File} file - 文件对象
     * @returns {Object} 验证结果
     */
    validateFile(file) {
        // 检查文件大小
        if (file.size > this.maxFileSize) {
            return {
                valid: false,
                error: `文件大小超过限制 (${this.formatFileSize(this.maxFileSize)})`
            };
        }

        // 检查文件类型
        if (!file.name.toLowerCase().endsWith('.json')) {
            return {
                valid: false,
                error: '只支持JSON格式文件'
            };
        }

        return { valid: true };
    }

    /**
     * 读取文件内容
     * @param {File} file - 文件对象
     * @param {string} encoding - 编码格式
     * @returns {Promise<string>} 文件内容
     */
    readFile(file, encoding = 'utf-8') {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    resolve(e.target.result);
                } catch (error) {
                    reject(new Error('文件读取失败'));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('文件读取错误'));
            };

            // 根据编码选择读取方式
            if (encoding === 'utf-8') {
                reader.readAsText(file, 'UTF-8');
            } else {
                // 对于GBK/GB2312，先读取为ArrayBuffer，然后用TextDecoder解码
                const arrayBufferReader = new FileReader();
                arrayBufferReader.onload = (e) => {
                    try {
                        const buffer = e.target.result;
                        const decoder = new TextDecoder(encoding);
                        const text = decoder.decode(buffer);
                        resolve(text);
                    } catch (error) {
                        // 如果解码失败，尝试UTF-8
                        const utf8Decoder = new TextDecoder('utf-8');
                        const text = utf8Decoder.decode(buffer);
                        resolve(text);
                    }
                };
                arrayBufferReader.readAsArrayBuffer(file);
            }
        });
    }

    /**
     * 获取选中的编码
     * @returns {string} 编码格式
     */
    getSelectedEncoding() {
        const encodingSelect = document.querySelector('select[name="encoding"]');
        return encodingSelect ? encodingSelect.value : 'utf-8';
    }

    /**
     * 获取选中的换行符
     * @returns {string} 换行符
     */
    getSelectedLineBreak() {
        const lineBreakSelect = document.querySelector('select[name="linebreak"]');
        if (lineBreakSelect) {
            return lineBreakSelect.value === 'crlf' ? '\r\n' : '\n';
        }
        return '\n';
    }

    /**
     * 显示JSON信息
     * @param {Object} parseResult - 解析结果
     */
    displayJSONInfo(parseResult) {
        const jsonInfo = document.getElementById('jsonInfo');
        const jsonSubtitleCount = document.getElementById('jsonSubtitleCount');
        const jsonDuration = document.getElementById('jsonDuration');
        const jsonCharCount = document.getElementById('jsonCharCount');

        if (jsonSubtitleCount || jsonDuration || jsonCharCount) {
            const stats = window.subtitleConverter.getStatistics(parseResult.subtitles);
            
            if (jsonSubtitleCount) {
                jsonSubtitleCount.textContent = stats.count;
            }
            if (jsonDuration) {
                jsonDuration.textContent = stats.formatDuration;
            }
            if (jsonCharCount) {
                jsonCharCount.textContent = stats.totalChars;
            }
        }
        
        this.showJSONInfo(true);
    }

    /**
     * 显示/隐藏JSON信息
     * @param {boolean} show - 是否显示
     */
    showJSONInfo(show) {
        const jsonInfo = document.getElementById('jsonInfo');
        if (jsonInfo) {
            jsonInfo.style.display = show ? 'block' : 'none';
        }
    }

    /**
     * 处理格式转换
     * @param {string} format - 目标格式
     */
    async handleConvert(format) {
        if (!this.currentSubtitles) {
            this.showError('没有可转换的数据，请先解析JSON');
            return;
        }

        try {
            const options = {
                lineBreak: this.getSelectedLineBreak()
            };

            const content = window.subtitleConverter.convert(this.currentSubtitles, format, options);
            
            // 生成文件名
            const currentTime = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const fileName = `bilibili-subtitle-${currentTime}.${format}`;

            // 下载文件
            window.subtitleConverter.downloadFile(content, fileName);
            
            // 显示成功提示
            this.showToast(`${format.toUpperCase()}格式文件已生成并下载！`);
            
        } catch (error) {
            console.error('转换失败:', error);
            this.showError(`转换失败: ${error.message}`);
        }
    }


    /**
     * 显示/隐藏转换操作
     * @param {boolean} show - 是否显示
     */
    showConvertActions(show) {
        const convertActions = document.getElementById('convertActions');
        if (convertActions) {
            convertActions.style.display = show ? 'block' : 'none';
        }
    }

    /**
     * 显示/隐藏加载状态
     * @param {boolean} loading - 是否加载中
     */
    showLoadingState(loading) {
        const uploadArea = document.getElementById('uploadArea');
        if (uploadArea) {
            if (loading) {
                uploadArea.classList.add('loading');
            } else {
                uploadArea.classList.remove('loading');
            }
        }
    }

    /**
     * 格式化文件大小
     * @param {number} bytes - 字节数
     * @returns {string} 格式化的大小
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * 显示错误信息
     * @param {string} message - 错误信息
     */
    showError(message) {
        if (window.app && typeof window.app.showError === 'function') {
            window.app.showError(message);
        } else {
            alert(message);
        }
    }

    /**
     * 显示成功提示
     * @param {string} message - 提示信息
     */
    showToast(message) {
        if (window.app && typeof window.app.showToast === 'function') {
            window.app.showToast(message);
        } else {
            console.log(message);
        }
    }

    /**
     * 批量转换所有格式
     */
    convertAllFormats() {
        if (!this.currentData) {
            this.showError('没有可转换的数据');
            return;
        }

        const formats = ['srt', 'vtt', 'txt'];
        const baseFileName = this.currentFile ? 
            this.currentFile.name.replace('.json', '') : 
            'subtitle';

        const options = {
            lineBreak: this.getSelectedLineBreak()
        };

        window.subtitleConverter.batchConvertAndDownload(
            this.currentData, 
            formats, 
            baseFileName, 
            options
        );

        this.showToast('批量转换已开始，请查看下载文件');
    }

    /**
     * 获取当前文件统计信息
     * @returns {Object|null} 统计信息
     */
    getStatistics() {
        if (!this.currentData) return null;
        return window.subtitleConverter.getStatistics(this.currentData);
    }

    /**
     * 预览字幕内容
     * @param {number} maxItems - 最大显示条数
     * @returns {Array} 预览数据
     */
    previewSubtitles(maxItems = 10) {
        if (!this.currentData) return [];
        return this.currentData.slice(0, maxItems);
    }

    /**
     * 显示/隐藏预览区域
     * @param {boolean} show - 是否显示
     */
    showPreviewSection(show) {
        const previewSection = document.getElementById('previewSection');
        if (previewSection) {
            previewSection.style.display = show ? 'block' : 'none';
        }
    }

    /**
     * 切换预览格式
     * @param {string} format - 目标格式
     */
    switchPreviewFormat(format) {
        // 更新格式标签状态
        const formatTabs = document.querySelectorAll('.format-tab');
        formatTabs.forEach(tab => {
            if (tab.getAttribute('data-format') === format) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // 更新预览内容
        this.updatePreview(format);
    }

    /**
     * 更新预览内容
     * @param {string} format - 目标格式
     */
    updatePreview(format) {
        if (!this.currentSubtitles) return;

        try {
            const options = {
                lineBreak: this.getSelectedLineBreak()
            };

            const content = window.subtitleConverter.convert(this.currentSubtitles, format, options);
            
            // 限制预览内容长度，避免过长
            const maxPreviewLength = 3000;
            const previewContent = content.length > maxPreviewLength 
                ? content.substring(0, maxPreviewLength) + '\n\n... (内容已截断，完整内容请下载文件查看)'
                : content;

            const previewTextarea = document.getElementById('previewTextarea');
            if (previewTextarea) {
                previewTextarea.value = previewContent;
            }
        } catch (error) {
            console.error('预览生成失败:', error);
            const previewTextarea = document.getElementById('previewTextarea');
            if (previewTextarea) {
                previewTextarea.value = `预览生成失败: ${error.message}`;
            }
        }
    }

    /**
     * 刷新预览
     */
    refreshPreview() {
        const activeTab = document.querySelector('.format-tab.active');
        if (activeTab) {
            const format = activeTab.getAttribute('data-format');
            this.updatePreview(format);
            this.showToast('预览已刷新');
        }
    }
}

// 创建全局实例
window.jsonHandler = new JSONHandler();

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = JSONHandler;
}