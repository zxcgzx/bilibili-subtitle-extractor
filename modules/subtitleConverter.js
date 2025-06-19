/**
 * Bilibili字幕转换器 - 纯前端实现
 * 基于牧尘bsrt.html的算法思路，优化扩展
 */

class SubtitleConverter {
    constructor() {
        this.supportedFormats = ['srt', 'vtt', 'txt', 'ass', 'lrc'];
    }

    /**
     * 解析Bilibili字幕JSON数据
     * @param {string} jsonContent - JSON字符串
     * @returns {Object} 解析结果
     */
    parseSubtitleJSON(jsonContent) {
        try {
            const data = JSON.parse(jsonContent);
            
            // 检查数据结构
            if (!data || !Array.isArray(data.body)) {
                throw new Error('无效的字幕JSON格式：缺少body数组');
            }

            const subtitles = data.body;
            
            // 验证字幕条目格式
            for (let i = 0; i < subtitles.length; i++) {
                const item = subtitles[i];
                if (typeof item.from !== 'number' || 
                    typeof item.to !== 'number' || 
                    typeof item.content !== 'string') {
                    throw new Error(`字幕条目 ${i + 1} 格式错误`);
                }
            }

            return {
                success: true,
                subtitles: subtitles,
                count: subtitles.length,
                duration: subtitles.length > 0 ? subtitles[subtitles.length - 1].to : 0
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                details: error
            };
        }
    }

    /**
     * 格式化时间为 HH:MM:SS,mmm 格式 (SRT标准)
     * @param {number} seconds - 秒数(浮点数)
     * @param {boolean} useVttFormat - 是否使用VTT格式(.而不是,)
     * @returns {string} 格式化的时间字符串
     */
    formatTime(seconds, useVttFormat = false) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.round((seconds % 1) * 1000);
        
        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        const separator = useVttFormat ? '.' : ',';
        
        return `${timeString}${separator}${ms.toString().padStart(3, '0')}`;
    }

    /**
     * 转换为SRT格式
     * @param {Array} subtitles - 字幕数组
     * @param {Object} options - 转换选项
     * @returns {string} SRT格式字符串
     */
    convertToSRT(subtitles, options = {}) {
        const { lineBreak = '\n' } = options;
        
        return subtitles.map((subtitle, index) => {
            const startTime = this.formatTime(subtitle.from);
            const endTime = this.formatTime(subtitle.to);
            
            return [
                index + 1,
                `${startTime} --> ${endTime}`,
                subtitle.content,
                ''
            ].join(lineBreak);
        }).join(lineBreak);
    }

    /**
     * 转换为VTT格式
     * @param {Array} subtitles - 字幕数组
     * @param {Object} options - 转换选项
     * @returns {string} VTT格式字符串
     */
    convertToVTT(subtitles, options = {}) {
        const { lineBreak = '\n' } = options;
        
        const header = `WEBVTT${lineBreak}${lineBreak}`;
        
        const content = subtitles.map((subtitle, index) => {
            const startTime = this.formatTime(subtitle.from, true);
            const endTime = this.formatTime(subtitle.to, true);
            
            return [
                `${index + 1}`,
                `${startTime} --> ${endTime}`,
                subtitle.content,
                ''
            ].join(lineBreak);
        }).join(lineBreak);
        
        return header + content;
    }

    /**
     * 转换为TXT格式(纯文本)
     * @param {Array} subtitles - 字幕数组
     * @param {Object} options - 转换选项
     * @returns {string} TXT格式字符串
     */
    convertToTXT(subtitles, options = {}) {
        const { lineBreak = '\n', includeTimestamp = false } = options;
        
        if (includeTimestamp) {
            return subtitles.map(subtitle => {
                const timestamp = this.formatTime(subtitle.from);
                return `[${timestamp}] ${subtitle.content}`;
            }).join(lineBreak);
        }
        
        return subtitles.map(subtitle => subtitle.content).join(lineBreak);
    }

    /**
     * 转换为ASS格式
     * @param {Array} subtitles - 字幕数组
     * @param {Object} options - 转换选项
     * @returns {string} ASS格式字符串
     */
    convertToASS(subtitles, options = {}) {
        const { lineBreak = '\n' } = options;
        
        // ASS文件头
        const header = [
            '[Script Info]',
            'Title: Bilibili Subtitle',
            'ScriptType: v4.00+',
            '',
            '[V4+ Styles]',
            'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
            'Style: Default,Arial,20,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,2,0,2,10,10,10,1',
            '',
            '[Events]',
            'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text'
        ].join(lineBreak) + lineBreak;
        
        // 转换字幕条目
        const events = subtitles.map(subtitle => {
            const startTime = this.formatTimeForASS(subtitle.from);
            const endTime = this.formatTimeForASS(subtitle.to);
            const text = subtitle.content.replace(/\n/g, '\\N'); // ASS换行符
            
            return `Dialogue: 0,${startTime},${endTime},Default,,0,0,0,,${text}`;
        }).join(lineBreak);
        
        return header + events;
    }

    /**
     * ASS格式时间格式化
     * @param {number} seconds - 秒数
     * @returns {string} H:MM:SS.cc格式
     */
    formatTimeForASS(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        const centiseconds = Math.floor((seconds % 1) * 100);
        
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
    }

    /**
     * 转换为LRC格式(歌词格式)
     * @param {Array} subtitles - 字幕数组
     * @param {Object} options - 转换选项
     * @returns {string} LRC格式字符串
     */
    convertToLRC(subtitles, options = {}) {
        const { lineBreak = '\n' } = options;
        
        // LRC文件头
        const header = [
            '[ti:Bilibili Video Subtitle]',
            '[ar:Unknown]',
            '[al:Unknown]',
            '[by:Bilibili Subtitle Extractor]',
            ''
        ].join(lineBreak);
        
        // 转换字幕条目
        const lyrics = subtitles.map(subtitle => {
            const timestamp = this.formatTimeForLRC(subtitle.from);
            return `[${timestamp}]${subtitle.content}`;
        }).join(lineBreak);
        
        return header + lyrics;
    }

    /**
     * LRC格式时间格式化
     * @param {number} seconds - 秒数
     * @returns {string} MM:SS.cc格式
     */
    formatTimeForLRC(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const centiseconds = Math.floor((seconds % 1) * 100);
        
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
    }

    /**
     * 通用转换方法
     * @param {Array} subtitles - 字幕数组
     * @param {string} format - 目标格式
     * @param {Object} options - 转换选项
     * @returns {string} 转换后的字符串
     */
    convert(subtitles, format, options = {}) {
        if (!Array.isArray(subtitles)) {
            throw new Error('字幕数据必须是数组格式');
        }

        if (!this.supportedFormats.includes(format.toLowerCase())) {
            throw new Error(`不支持的格式: ${format}`);
        }

        switch (format.toLowerCase()) {
            case 'srt':
                return this.convertToSRT(subtitles, options);
            case 'vtt':
                return this.convertToVTT(subtitles, options);
            case 'txt':
                return this.convertToTXT(subtitles, options);
            case 'ass':
                return this.convertToASS(subtitles, options);
            case 'lrc':
                return this.convertToLRC(subtitles, options);
            default:
                throw new Error(`未实现的格式转换: ${format}`);
        }
    }

    /**
     * 获取转换选项的默认值
     * @param {string} format - 格式
     * @returns {Object} 默认选项
     */
    getDefaultOptions(format) {
        const baseOptions = {
            lineBreak: '\n',
            encoding: 'utf-8'
        };

        switch (format.toLowerCase()) {
            case 'txt':
                return {
                    ...baseOptions,
                    includeTimestamp: false
                };
            case 'srt':
            case 'vtt':
            case 'ass':
            case 'lrc':
            default:
                return baseOptions;
        }
    }

    /**
     * 创建下载文件
     * @param {string} content - 文件内容
     * @param {string} filename - 文件名
     * @param {string} mimeType - MIME类型
     */
    downloadFile(content, filename, mimeType = 'text/plain') {
        const blob = new Blob([content], { type: `${mimeType}; charset=utf-8` });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // 清理URL对象
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }

    /**
     * 批量转换并下载
     * @param {Array} subtitles - 字幕数组
     * @param {Array} formats - 要转换的格式数组
     * @param {string} baseFilename - 基础文件名
     * @param {Object} options - 转换选项
     */
    batchConvertAndDownload(subtitles, formats, baseFilename = 'subtitle', options = {}) {
        const mimeTypes = {
            srt: 'application/x-subrip',
            vtt: 'text/vtt',
            txt: 'text/plain',
            ass: 'text/x-ssa',
            lrc: 'application/x-lrc'
        };

        formats.forEach((format, index) => {
            try {
                const content = this.convert(subtitles, format, options);
                const filename = `${baseFilename}.${format}`;
                const mimeType = mimeTypes[format] || 'text/plain';
                
                // 添加延迟，避免浏览器阻止多个下载
                setTimeout(() => {
                    this.downloadFile(content, filename, mimeType);
                }, index * 200);
                
            } catch (error) {
                console.error(`转换${format}格式失败:`, error);
            }
        });
    }

    /**
     * 获取字幕统计信息
     * @param {Array} subtitles - 字幕数组
     * @returns {Object} 统计信息
     */
    getStatistics(subtitles) {
        if (!Array.isArray(subtitles) || subtitles.length === 0) {
            return {
                count: 0,
                duration: 0,
                totalChars: 0,
                averageChars: 0
            };
        }

        const totalChars = subtitles.reduce((sum, sub) => sum + sub.content.length, 0);
        const duration = subtitles[subtitles.length - 1].to;

        return {
            count: subtitles.length,
            duration: Math.round(duration),
            totalChars: totalChars,
            averageChars: Math.round(totalChars / subtitles.length),
            formatDuration: this.formatDuration(duration)
        };
    }

    /**
     * 格式化持续时间
     * @param {number} seconds - 秒数
     * @returns {string} 格式化的时间
     */
    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hours > 0) {
            return `${hours}小时${minutes}分钟${secs}秒`;
        } else if (minutes > 0) {
            return `${minutes}分钟${secs}秒`;
        } else {
            return `${secs}秒`;
        }
    }
}

// 创建全局实例
window.subtitleConverter = new SubtitleConverter();

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SubtitleConverter;
}