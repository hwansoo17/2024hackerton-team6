/**
 * 유튜브 URL에서 Video ID 추출
 * @param {string} url
 * @returns {string|null}
 */
const extractVideoId = (url) => {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname.includes('youtube.com')) {
      return urlObj.searchParams.get('v');
    }
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.substring(1);
    }
    return null;
  } catch {
    return null;
  }
};

module.exports = {
  extractVideoId,
};