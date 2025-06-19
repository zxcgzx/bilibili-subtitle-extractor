const axios = require('axios');
const cheerio = require('cheerio');

// 用户代理，模拟浏览器访问
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

/**
 * 从bilibili链接提取BV号或AV号
 * @param {string} url - bilibili视频链接
 * @returns {Object} - 包含类型和ID的对象
 */
function parseVideoId(url) {
  const bvMatch = url.match(/(?:BV)(\w+)/);
  const avMatch = url.match(/(?:av)(\d+)/);
  
  if (bvMatch) {
    return { type: 'bv', id: 'BV' + bvMatch[1] };
  } else if (avMatch) {
    return { type: 'av', id: avMatch[1] };
  }
  
  throw new Error('无法解析视频ID');
}

/**
 * 获取视频基本信息
 * @param {Object} videoId - 视频ID对象
 * @returns {Object} - 视频信息
 */
async function getVideoInfo(videoId) {
  try {
    let apiUrl;
    if (videoId.type === 'bv') {
      apiUrl = `https://api.bilibili.com/x/web-interface/view?bvid=${videoId.id}`;
    } else {
      apiUrl = `https://api.bilibili.com/x/web-interface/view?aid=${videoId.id}`;
    }

    const response = await axios.get(apiUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        'Referer': 'https://www.bilibili.com',
      }
    });

    if (response.data.code !== 0) {
      throw new Error(response.data.message || '获取视频信息失败');
    }

    const data = response.data.data;
    return {
      title: data.title,
      bvid: data.bvid,
      aid: data.aid,
      cid: data.cid,
      pages: data.pages || []
    };
  } catch (error) {
    console.error('获取视频信息失败:', error.message);
    throw new Error('获取视频信息失败');
  }
}

/**
 * 获取字幕列表
 * @param {number} cid - 视频CID
 * @returns {Array} - 字幕列表
 */
async function getSubtitleList(cid) {
  try {
    const apiUrl = `https://api.bilibili.com/x/player/v2?cid=${cid}`;
    
    const response = await axios.get(apiUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        'Referer': 'https://www.bilibili.com',
      }
    });

    if (response.data.code !== 0) {
      throw new Error('获取字幕列表失败');
    }

    const subtitleList = response.data.data?.subtitle?.subtitles || [];
    return subtitleList;
  } catch (error) {
    console.error('获取字幕列表失败:', error.message);
    return [];
  }
}

/**
 * 下载字幕内容
 * @param {string} subtitleUrl - 字幕URL
 * @returns {Array} - 字幕内容数组
 */
async function downloadSubtitle(subtitleUrl) {
  try {
    // 确保URL是完整的
    const fullUrl = subtitleUrl.startsWith('http') ? subtitleUrl : `https:${subtitleUrl}`;
    
    const response = await axios.get(fullUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        'Referer': 'https://www.bilibili.com',
      }
    });

    const subtitleData = response.data;
    
    if (subtitleData && subtitleData.body) {
      return subtitleData.body.map(item => ({
        from: item.from,
        to: item.to,
        content: item.content
      }));
    }
    
    return [];
  } catch (error) {
    console.error('下载字幕失败:', error.message);
    return [];
  }
}

/**
 * 主要的字幕提取函数
 * @param {string} url - bilibili视频链接
 * @returns {Object} - 提取结果
 */
async function extractSubtitles(url) {
  try {
    console.log('开始解析视频链接...');
    
    // 解析视频ID
    const videoId = parseVideoId(url);
    console.log('视频ID:', videoId);
    
    // 获取视频信息
    console.log('获取视频信息...');
    const videoInfo = await getVideoInfo(videoId);
    console.log('视频标题:', videoInfo.title);
    
    // 获取字幕列表
    console.log('获取字幕列表...');
    const subtitleList = await getSubtitleList(videoInfo.cid);
    
    if (subtitleList.length === 0) {
      return {
        success: false,
        error: '该视频没有可用的字幕'
      };
    }
    
    console.log(`找到 ${subtitleList.length} 个字幕版本`);
    
    // 下载第一个可用字幕（通常是中文字幕）
    const subtitle = subtitleList[0];
    console.log('下载字幕:', subtitle.lan_doc);
    
    const subtitleContent = await downloadSubtitle(subtitle.subtitle_url);
    
    if (subtitleContent.length === 0) {
      return {
        success: false,
        error: '字幕内容为空或下载失败'
      };
    }
    
    console.log(`字幕提取成功，共 ${subtitleContent.length} 条字幕`);
    
    return {
      success: true,
      title: videoInfo.title,
      bvid: videoInfo.bvid,
      subtitles: subtitleContent,
      formats: ['srt', 'vtt', 'txt'],
      subtitleInfo: {
        language: subtitle.lan_doc,
        languageCode: subtitle.lan
      }
    };
    
  } catch (error) {
    console.error('字幕提取失败:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 搜索并提取多个字幕版本
 * @param {string} url - bilibili视频链接
 * @returns {Object} - 包含所有可用字幕的结果
 */
async function extractAllSubtitles(url) {
  try {
    const videoId = parseVideoId(url);
    const videoInfo = await getVideoInfo(videoId);
    const subtitleList = await getSubtitleList(videoInfo.cid);
    
    if (subtitleList.length === 0) {
      return {
        success: false,
        error: '该视频没有可用的字幕'
      };
    }
    
    const allSubtitles = [];
    
    for (const subtitle of subtitleList) {
      console.log(`下载字幕: ${subtitle.lan_doc}`);
      const content = await downloadSubtitle(subtitle.subtitle_url);
      
      if (content.length > 0) {
        allSubtitles.push({
          language: subtitle.lan_doc,
          languageCode: subtitle.lan,
          subtitles: content
        });
      }
    }
    
    return {
      success: true,
      title: videoInfo.title,
      bvid: videoInfo.bvid,
      allSubtitles: allSubtitles,
      formats: ['srt', 'vtt', 'txt']
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  extractSubtitles,
  extractAllSubtitles,
  parseVideoId,
  getVideoInfo
};