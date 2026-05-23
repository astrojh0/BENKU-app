// Google Vision API 代理 (Vercel 格式)

module.exports = async (req, res) => {
  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageBase64 } = req.body;

    console.log('[vercel] 收到 OCR 请求');
    console.log('[vercel] 图片数据长度:', imageBase64 ? imageBase64.length : 0);

    if (!imageBase64) {
      return res.status(400).json({ error: 'Missing imageBase64' });
    }

    const apiKey = process.env.GOOGLE_VISION_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'Google Vision API key not configured' });
    }

    console.log('[vercel] 正在调用 Google Vision API, API Key 前几位:', apiKey.slice(0, 6));

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

    console.log('[vercel] Google API 响应状态:', response.status);

    const data = await response.json();

    if (data.error) {
      console.error('[vercel] Google API 错误:', JSON.stringify(data.error));
      return res.status(500).json({ error: data.error.message });
    }

    const result = data.responses[0];
    const text = result.fullTextAnnotation?.text || result.textAnnotations?.[0]?.text || '';

    console.log('[vercel] 返回前端数据:', text.substring(0, 100) + (text.length > 100 ? '...' : ''));

    return res.status(200).json({ text });
  } catch (error) {
    console.error('[vercel] 函数错误:', error);
    return res.status(500).json({ error: 'OCR processing failed' });
  }
};
