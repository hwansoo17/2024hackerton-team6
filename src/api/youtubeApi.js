const axios = require('axios');
require('dotenv').config();

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

const youtubeApi = async(videoId) => {
  try {
    const response = await axios.get(
      `https://www.googleapis.com/youtube/v3/videos`,
      {
        params: {
          part: 'snippet, statistics',
          id: videoId,
          key: YOUTUBE_API_KEY,
        },
      }
    );
    
    return response.data.items[0];

  } catch (error) {
    console.error(error);
    return null;
  }
}

module.exports = {
  youtubeApi,
};