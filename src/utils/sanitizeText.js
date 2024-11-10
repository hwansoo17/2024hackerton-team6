/**
 * 텍스트 정리
 * @param {string} text
 * @returns {string}
 */
const sanitizeText = (text) =>
  text
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/\\n/g, '')
    .replace(/\s+/g, ' ');

module.exports = {
  sanitizeText,
};
