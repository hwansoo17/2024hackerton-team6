const fs = require('fs');
const path = require('path');
const express = require('express');
const axios = require('axios');
const {summarizeWithGemini} = require('./src/api/vertexApi');
const { extractVideoId }= require('./src/utils/extractVideoId');
const { readDataFromFile, writeDataToFile } = require('./src/utils/fileSystem');
const { sanitizeText } = require('./src/utils/sanitizeText');
const { youtubeApi } = require('./src/api/youtubeApi');
require('dotenv').config();

const app = express();
const PORT = 2024;

app.get('/video/basic_info', async (req, res) => {
  const { url } = req.query;
  const videoId = extractVideoId(url);
  console.log(videoId);
  if (!url) {
    return res.status(400).json({ error: 'videoId parameter is required' });
  }
  try {
    const videoData = await youtubeApi(videoId);
    console.log(videoData);
    if (!videoData) {
      return res.status(404).json({ error: 'Video not found' });
    }
    const videoInfo = {
      title: videoData.snippet.title,
      description: sanitizeText(videoData.snippet.description),
      channelTitle: videoData.snippet.channelTitle,
      Views: videoData.statistics.viewCount,
      Likes: videoData.statistics.likeCount,
      commentCount: videoData.statistics.commentCount,
      publishedAt: videoData.snippet.publishedAt,
    };
    res.json(videoInfo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch video information' });
  }
});




const DATA_FILE = path.join(__dirname, 'reviews.json');

// POST /video/ratings_reviews 엔드포인트
app.post('/video/ratings_reviews', express.json(), (req, res) => {
  const { url } = req.query;
  const { rating, content } = req.body;

  // 입력값 검증
  if (!url) {
    return res.status(400).json({ error: '비디오 URL이 필요합니다.' });
  }

  if (!rating || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ error: '평점은 1~5 사이의 정수여야 합니다.' });
  }

  if (!content || typeof content !== 'string' || content.length > 300) {
    return res.status(400).json({ error: '후기는 300자 이하의 문자열이어야 합니다.' });
  }

  // 기존 데이터 가져오기
  const reviews = readDataFromFile(DATA_FILE);

  // 새 데이터 추가
  const newReview = {
    url,
    rating,
    content,
    createdAt: new Date().toISOString(),
  };
  reviews.push(newReview);

  // 데이터 저장
  writeDataToFile(DATA_FILE ,reviews);

  // 성공 응답
  return res.status(201).json({
    message: '평점과 후기가 성공적으로 등록되었습니다.',
    data: newReview,
  });
});

// 리뷰 점수 평균 및 제목 가져오기
app.get('/video/ratings/mean', async (req, res) => {
  const { url } = req.query;
  // 입력값 검증
  if (!url) {
    return res.status(400).json({ error: '비디오 URL이 필요합니다.' });
  }

  const videoId = extractVideoId(url);
  if (!videoId) {
    return res.status(400).json({ error: '유효한 YouTube URL이 아닙니다.' });
  }
  try {
    const videoData = await youtubeApi(videoId);
    const title = videoData.snippet.title;
    // 2. reviews.json 파일에서 해당 영상의 평균 평점 계산
    const reviews = readDataFromFile(DATA_FILE);
    const videoReviews = reviews.filter((review) => review.url === url);
    // 평균 평점 계산
    const averageRating =
      videoReviews.length > 0
        ? videoReviews.reduce((sum, review) => sum + review.rating, 0) /
          videoReviews.length
        : 0;
    // 결과 반환
    return res.json({
      title,
      averageRating: parseFloat(averageRating.toFixed(2)), // 소수점 2자리로 제한
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch video information or reviews' });
  }
});

// 영상별 리뷰 요약 가져오기
app.get('/video/reviews/summary', async (req, res) => {
  const { url } = req.query;

  // 입력값 검증
  if (!url) {
    return res.status(400).json({ error: '비디오 URL이 필요합니다.' });
  }

  try {
    // 기존 데이터 가져오기
    const reviews = readDataFromFile(DATA_FILE);
    const videoReviews = reviews.filter((review) => review.url === url);

    if (videoReviews.length === 0) {
      return res.status(404).json({ error: '해당 비디오에 대한 리뷰가 없습니다.' });
    }

    // 1. 부정적 후기: 평점 2 이하
    const negativeReviews = videoReviews
    .filter((review) => review.rating <= 2)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // 최신 순 정렬
    .slice(0, 2) // 최근 2개 선택
    .map((review) => review.content); // content 항목만 선택
  
  // 2. 긍정적 후기: 평점 4 이상
  const positiveReviews = videoReviews
    .filter((review) => review.rating >= 4)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // 최신 순 정렬
    .slice(0, 2) // 최근 2개 선택
    .map((review) => review.content); // content 항목만 선택

    // 3. Gemini API를 활용하여 요약 생성
    const [negativeSummary, positiveSummary] = await Promise.all([
      summarizeWithGemini(negativeReviews, 'negative'),
      summarizeWithGemini(positiveReviews, 'positive'),
    ]);
    
    // 최종 응답 데이터 생성
    res.json({
      message: '요청이 성공적으로 처리되었습니다.',
      videoURL: url,
      reviewSummary: {
        negativeSummary,
        positiveSummary,
      },
      reviews: {
        negativeReviews,
        positiveReviews,
      },
    });

  } catch (error) {
    console.error('Error summarizing reviews:', error);
    res.status(500).json({ error: 'Failed to summarize reviews' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
