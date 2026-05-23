// Google Vision API 代理
exports.handler = async (event, context) => {
  // 只允许 POST 请求
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { imageBase64 } = JSON.parse(event.body);

    console.log('[netlify] 收到 OCR 请求');
    console.log('[netlify] 图片数据长度:', imageBase64 ? imageBase64.length : 0);

    if (!imageBase64) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing imageBase64' }),
      };
    }

    const apiKey = process.env.GOOGLE_VISION_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Google Vision API key not configured' }),
      };
    }

    console.log('[netlify] 正在调用 Google Vision API, API Key 前几位:', apiKey.slice(0, 6));

    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: imageBase64,
              },
              features: [
                {
                  type: 'DOCUMENT_TEXT_DETECTION',
                },
                {
                  type: 'TEXT_DETECTION',
                },
              ],
            },
          ],
        }),
      }
    );

    console.log('[netlify] Google API 响应状态:', response.status);

    const data = await response.json();

    if (data.error) {
      console.error('[netlify] Google API 错误:', JSON.stringify(data.error));
      return {
        statusCode: 500,
        body: JSON.stringify({ error: data.error.message }),
      };
    }

    const result = data.responses[0];
    const text = result.fullTextAnnotation?.text || result.textAnnotations?.[0]?.text || '';

    console.log('[netlify] 返回前端数据:', text.substring(0, 100) + (text.length > 100 ? '...' : ''));

    return {
      statusCode: 200,
      body: JSON.stringify({ text }),
    };
  } catch (error) {
    console.error('[netlify] 函数错误:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'OCR processing failed' }),
    };
  }
};
