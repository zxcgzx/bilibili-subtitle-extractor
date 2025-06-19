const express = require('express');
const cors = require('cors');
const path = require('path');
const { extractSubtitles } = require('./utils/subtitle');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件配置
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// 健康检查接口
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Bilibili字幕提取服务运行正常' });
});

// 字幕提取接口
app.post('/api/extract-subtitle', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ 
        error: '请提供视频链接',
        code: 'MISSING_URL'
      });
    }

    // 验证是否为bilibili链接
    const bilibiliRegex = /(?:https?:\/\/)?(?:www\.)?bilibili\.com\/video\/(BV\w+|av\d+)/;
    if (!bilibiliRegex.test(url)) {
      return res.status(400).json({ 
        error: '请提供有效的bilibili视频链接',
        code: 'INVALID_URL'
      });
    }

    console.log(`开始提取字幕: ${url}`);
    
    // 提取字幕
    const result = await extractSubtitles(url);
    
    if (!result.success) {
      return res.status(404).json({ 
        error: result.error || '字幕提取失败',
        code: 'EXTRACTION_FAILED'
      });
    }

    res.json({
      success: true,
      data: {
        title: result.title,
        subtitles: result.subtitles,
        formats: result.formats,
        bvid: result.bvid
      }
    });

  } catch (error) {
    console.error('字幕提取错误:', error);
    res.status(500).json({ 
      error: '服务器内部错误',
      code: 'SERVER_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 字幕格式转换接口
app.post('/api/convert-subtitle', (req, res) => {
  try {
    const { subtitles, format } = req.body;
    
    if (!subtitles || !format) {
      return res.status(400).json({ 
        error: '缺少必要参数',
        code: 'MISSING_PARAMS'
      });
    }

    let convertedContent = '';
    const fileName = `subtitle.${format}`;

    switch (format) {
      case 'srt':
        convertedContent = convertToSRT(subtitles);
        break;
      case 'vtt':
        convertedContent = convertToVTT(subtitles);
        break;
      case 'txt':
        convertedContent = convertToTXT(subtitles);
        break;
      default:
        return res.status(400).json({ 
          error: '不支持的格式',
          code: 'UNSUPPORTED_FORMAT'
        });
    }

    res.json({
      success: true,
      data: {
        content: convertedContent,
        fileName: fileName,
        format: format
      }
    });

  } catch (error) {
    console.error('格式转换错误:', error);
    res.status(500).json({ 
      error: '格式转换失败',
      code: 'CONVERSION_ERROR'
    });
  }
});

// 首页路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// 字幕格式转换函数
function convertToSRT(subtitles) {
  return subtitles.map((sub, index) => {
    const start = formatTime(sub.from);
    const end = formatTime(sub.to);
    return `${index + 1}\n${start} --> ${end}\n${sub.content}\n`;
  }).join('\n');
}

function convertToVTT(subtitles) {
  const header = 'WEBVTT\n\n';
  const content = subtitles.map((sub, index) => {
    const start = formatTime(sub.from, true);
    const end = formatTime(sub.to, true);
    return `${index + 1}\n${start} --> ${end}\n${sub.content}\n`;
  }).join('\n');
  return header + content;
}

function convertToTXT(subtitles) {
  return subtitles.map(sub => sub.content).join('\n');
}

function formatTime(seconds, isVTT = false) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  
  if (isVTT) {
    return `${timeString}.${ms.toString().padStart(3, '0')}`;
  } else {
    return `${timeString},${ms.toString().padStart(3, '0')}`;
  }
}

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 Bilibili字幕提取服务启动成功`);
  console.log(`🌐 服务地址: http://localhost:${PORT}`);
  console.log(`📡 API地址: http://localhost:${PORT}/api`);
});

module.exports = app;