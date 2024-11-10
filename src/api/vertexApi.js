const { VertexAI } = require('@google-cloud/vertexai');
const { sanitizeText } = require('../utils/sanitizeText');

const vertex_ai = new VertexAI({
  project: 'weighty-gasket-439803-e3',
  location: 'asia-northeast3',
});
const model = 'gemini-1.5-flash-002';

// VertexAI 요청 함수
const summarizeWithGemini = async (reviews, type) => {
  console.log(reviews,'@@@@@@@@@@@@@@');
  try {
    const review = reviews.map((review, index) => `${index + 1}. ${review}`).join('\n')

    console.log(review, type);
    const prompt = `
      다음은 ${type === 'positive' ? '긍정적' : '부정적'} 리뷰 목록입니다. 
      전체 내용을 읽고 한 문장으로 요약하세요.

      리뷰:
      ${reviews.map((review, index) => `${index + 1}. ${review}`).join('\n')}

      요약:
    `;

    const req = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
    };
    console.log('Request sent to Vertex AI:', req)
    
    const streamingResp = await vertex_ai.preview.getGenerativeModel({
      model: model,
      generationConfig: {
        maxOutputTokens: 256, // 요약 결과를 제한
        temperature: 0.7,
        topP: 0.9,
      },
    }).generateContentStream(req);
    console.log(streamingResp, '@@@@@@@')
  
    console.log(JSON.stringify((await streamingResp.response).candidates[0].content.parts[0].text));

    let result = '';
    result = JSON.stringify((await streamingResp.response).candidates[0].content.parts[0].text);
    result = sanitizeText(result)
    return result; // 요약된 내용을 리턴
  } catch (error) {
    console.error('Error summarizing reviews with Gemini:', error);
    throw new Error('Failed to summarize reviews.');
  }
};

module.exports = {
  summarizeWithGemini,
};
