// OCR 识别 - 使用 Google Cloud Vision API

// 语言类型
export type DetectedLanguage = 'japanese' | 'chinese' | 'other';

// 检测文本中的语言类型
export function detectLanguage(text: string): DetectedLanguage {
  // 移除空格和换行
  const cleanText = text.replace(/[\s\n]/g, '');
  
  // 检查是否包含日语字符（平假名或片假名）
  const hiraganaRegex = /[\u3040-\u309F]/;
  const katakanaRegex = /[\u30A0-\u30FF]/;
  const hasJapanese = hiraganaRegex.test(cleanText) || katakanaRegex.test(cleanText);
  
  // 检查是否包含中文字符
  const chineseRegex = /[\u4E00-\u9FFF]/;
  const hasChinese = chineseRegex.test(cleanText);
  
  // 如果有日语假名，视为日语
  if (hasJapanese) {
    return 'japanese';
  }
  
  // 如果有中文且没有日语，视为中文
  if (hasChinese) {
    return 'chinese';
  }
  
  // 其他语言
  return 'other';
}

// 将文件转换为 base64（不含前缀）
async function fileToBase64(file: File): Promise<string> {
  console.log('[OCR] 图片获取成功，大小:', file.size, 'bytes');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // 移除 data:image/xxx;base64, 前缀
      const base64 = result.split(',')[1];
      console.log('[OCR] FileReader 加载完成，Base64 长度:', base64.length);
      resolve(base64);
    };
    reader.onerror = (e) => {
      console.error('[OCR] FileReader 错误:', e);
      reject(e);
    };
    reader.readAsDataURL(file);
  });
}

// OCR 识别图片中的文字（使用 Google Vision API）
export async function recognizeText(
  imageSource: File | string,
  onProgress?: (progress: number) => void
): Promise<{ text: string; language: DetectedLanguage }> {
  try {
    let base64Image: string;

    if (typeof imageSource === 'string') {
      // 如果是字符串（可能是 base64 或 URL）
      if (imageSource.startsWith('data:')) {
        // 移除 data:image/xxx;base64, 前缀
        base64Image = imageSource.split(',')[1];
      } else if (imageSource.startsWith('http')) {
        // 如果是 URL，需要先下载
        const response = await fetch(imageSource);
        const blob = await response.blob();
        base64Image = await fileToBase64(new File([blob], 'image'));
      } else {
        // 已经是 base64（不含前缀）
        base64Image = imageSource;
      }
    } else {
      // File 对象
      base64Image = await fileToBase64(imageSource);
    }

    console.log('[OCR] Base64 转换完成，长度:', base64Image.length);

    onProgress?.(30);

    console.log('[OCR] 发送请求到代理');

    // 调用 Netlify 函数
    const response = await fetch('/api/google-vision', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageBase64: base64Image }),
    });

    onProgress?.(70);

    console.log('[OCR] 代理响应状态:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[OCR] 代理响应错误:', errorData);
      throw new Error(errorData.error || 'OCR 识别失败');
    }

    const data = await response.json();

    console.log('[OCR] 代理返回数据:', JSON.stringify(data).substring(0, 200));

    onProgress?.(100);

    const text = (data.text || '').trim();
    
    if (!text) {
      throw new Error('未识别到文字，请确保图片包含清晰的文字');
    }

    const language = detectLanguage(text);

    return { text, language };
  } catch (error) {
    console.error('OCR识别失败:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('文字识别失败，请重试');
  }
}

// 检查文本是否主要包含日语（用于判断是否自动发送）
export function isJapaneseText(text: string): boolean {
  return detectLanguage(text) === 'japanese';
}

// 保留原有函数名以兼容旧代码
export async function recognizeImage(
  imageSource: File | string,
  onProgress?: (progress: number) => void
): Promise<{ text: string; language: DetectedLanguage }> {
  return recognizeText(imageSource, onProgress);
}
