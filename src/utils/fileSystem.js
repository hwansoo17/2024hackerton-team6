const fs = require('fs');

/**
 * JSON 파일 읽기
 * @param {string} filePath
 * @returns {Array}
 */

const readDataFromFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
};

/**
 * JSON 파일 쓰기
 * @param {string} filePath
 * @param {Object} data
 */
const writeDataToFile = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

module.exports = {
  readDataFromFile,
  writeDataToFile,
};
