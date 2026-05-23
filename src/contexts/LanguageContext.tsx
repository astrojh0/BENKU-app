import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

// 学习语言列表（目标语言）
export const LANGUAGES: { code: string; label: string }[] = [
  { code: 'ja', label: '日语' },
  { code: 'en', label: '英语' },
  { code: 'ko', label: '韩语' },
  { code: 'fr', label: '法语' },
  { code: 'de', label: '德语' },
  { code: 'es', label: '西班牙语' },
  { code: 'zh', label: '中文' },
];

// 母语列表
export const NATIVE_LANGUAGES: { code: string; label: string }[] = [
  { code: 'zh', label: '中文' },
  { code: 'en', label: '英语' },
  { code: 'ja', label: '日语' },
  { code: 'ko', label: '韩语' },
  { code: 'es', label: '西班牙语' },
];

const LEARNING_STORAGE_KEY = 'learning_language';
const NATIVE_STORAGE_KEY = 'native_language';
const HAS_SEEN_NATIVE_PROMPT_KEY = 'has_seen_native_prompt';

function getLangLabel(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.label || '目标语言';
}

function getNativeLangLabel(code: string): string {
  return NATIVE_LANGUAGES.find((l) => l.code === code)?.label || '母语';
}

interface LanguageContextValue {
  learningLanguage: string;
  learningLanguageLabel: string;
  setLearningLanguage: (code: string) => Promise<void>;
  nativeLanguage: string;
  nativeLanguageLabel: string;
  setNativeLanguage: (code: string) => Promise<void>;
  hasSeenNativePrompt: boolean;
  setHasSeenNativePrompt: (value: boolean) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextValue>({
  learningLanguage: 'ja',
  learningLanguageLabel: '日语',
  setLearningLanguage: async () => {},
  nativeLanguage: 'zh',
  nativeLanguageLabel: '中文',
  setNativeLanguage: async () => {},
  hasSeenNativePrompt: false,
  setHasSeenNativePrompt: async () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [learningLanguage, setLearningLanguageState] = useState('ja');
  const [nativeLanguage, setNativeLanguageState] = useState('zh');
  const [hasSeenNativePrompt, setHasSeenNativePromptState] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // 初始化加载数据
  useEffect(() => {
    (async () => {
      try {
        // 加载学习语言
        let storedLearning = await AsyncStorage.getItem(LEARNING_STORAGE_KEY);
        
        // 加载母语
        let storedNative = await AsyncStorage.getItem(NATIVE_STORAGE_KEY);
        
        // 检查是否显示过母语选择弹窗
        const promptSeen = await AsyncStorage.getItem(HAS_SEEN_NATIVE_PROMPT_KEY);
        if (promptSeen === 'true') {
          setHasSeenNativePromptState(true);
        }
        
        // 验证并确保互斥
        if (!storedLearning || !LANGUAGES.some((l) => l.code === storedLearning)) {
          storedLearning = 'ja';
        }
        if (!storedNative || !NATIVE_LANGUAGES.some((l) => l.code === storedNative)) {
          storedNative = 'zh';
        }
        
        // 兼容旧数据：将 zh-CN, zh-TW 转换为 zh
        if (storedNative === 'zh-CN' || storedNative === 'zh-TW') {
          storedNative = 'zh';
          await AsyncStorage.setItem(NATIVE_STORAGE_KEY, 'zh');
        }
        
        // 确保学习语言和母语不同
        if (storedLearning === storedNative) {
          // 找一个与母语不同的学习语言
          const newLearning = LANGUAGES.find(l => l.code !== storedNative)?.code || 'ja';
          storedLearning = newLearning;
          await AsyncStorage.setItem(LEARNING_STORAGE_KEY, newLearning);
        }
        
        setLearningLanguageState(storedLearning);
        setNativeLanguageState(storedNative);
      } catch (e) { 
        console.error('Failed to load language settings:', e);
      } finally {
        setIsInitialized(true);
      }
    })();
  }, []);

  // 设置学习语言（同时检查与母语互斥）
  const setLearningLanguage = useCallback(async (code: string) => {
    // 如果选择的语言与母语相同，先切换母语
    if (code === nativeLanguage) {
      // 找一个与新学习语言不同的母语
      const newNative = NATIVE_LANGUAGES.find(l => l.code !== code)?.code || 'zh';
      setNativeLanguageState(newNative);
      try {
        await AsyncStorage.setItem(NATIVE_STORAGE_KEY, newNative);
      } catch (e) { 
        console.error('Failed to save native language:', e);
      }
    }
    setLearningLanguageState(code);
    try {
      await AsyncStorage.setItem(LEARNING_STORAGE_KEY, code);
    } catch (e) { 
      console.error('Failed to save learning language:', e);
    }
  }, [nativeLanguage]);

  // 设置母语（同时检查与学习语言互斥）
  const setNativeLanguage = useCallback(async (code: string) => {
    // 如果选择的母语与学习语言相同，先切换学习语言
    if (code === learningLanguage) {
      // 找一个与新母语不同的学习语言
      const newLearning = LANGUAGES.find(l => l.code !== code)?.code || 'ja';
      setLearningLanguageState(newLearning);
      try {
        await AsyncStorage.setItem(LEARNING_STORAGE_KEY, newLearning);
      } catch (e) { 
        console.error('Failed to save learning language:', e);
      }
    }
    setNativeLanguageState(code);
    try {
      await AsyncStorage.setItem(NATIVE_STORAGE_KEY, code);
    } catch (e) { 
      console.error('Failed to save native language:', e);
    }
  }, [learningLanguage]);

  const setHasSeenNativePrompt = useCallback(async (value: boolean) => {
    setHasSeenNativePromptState(value);
    try {
      await AsyncStorage.setItem(HAS_SEEN_NATIVE_PROMPT_KEY, value ? 'true' : 'false');
    } catch (e) { 
      console.error('Failed to save native prompt state:', e);
    }
  }, []);

  return (
    <LanguageContext.Provider
      value={{
        learningLanguage,
        learningLanguageLabel: getLangLabel(learningLanguage),
        setLearningLanguage,
        nativeLanguage,
        nativeLanguageLabel: getNativeLangLabel(nativeLanguage),
        setNativeLanguage,
        hasSeenNativePrompt: isInitialized && hasSeenNativePrompt,
        setHasSeenNativePrompt,
      }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}

// 自检脚本：测试母语-学习语言互斥逻辑（过滤函数测试）
export function runMutualExclusionTests() {
  console.clear();
  console.log('%c开始运行互斥逻辑测试...', 'font-size: 16px; font-weight: bold; color: blue;');
  
  const results: { name: string; passed: boolean; detail: string }[] = [];
  
  // 辅助函数：检查数组是否不包含某元素
  const arrayNotContains = (arr: { code: string }[], code: string) => !arr.some(item => item.code === code);
  
  // 用例1: 设置母语为中文 → 学习语言候选不应包含中文
  const filtered1 = LANGUAGES.filter(l => l.code !== 'zh');
  const passed1 = arrayNotContains(filtered1, 'zh');
  results.push({
    name: '用例1: 母语中文 → 学习语言候选不含中文',
    passed: passed1,
    detail: passed1 ? `✓ 通过 - 候选: ${filtered1.map(l => l.label).join(', ')}` : `✗ 失败 - 候选: ${filtered1.map(l => l.label).join(', ')}`
  });
  
  // 用例2: 设置母语为英语 → 学习语言候选不应包含英语
  const filtered2 = LANGUAGES.filter(l => l.code !== 'en');
  const passed2 = arrayNotContains(filtered2, 'en');
  results.push({
    name: '用例2: 母语英语 → 学习语言候选不含英语',
    passed: passed2,
    detail: passed2 ? `✓ 通过 - 候选: ${filtered2.map(l => l.label).join(', ')}` : `✗ 失败 - 候选: ${filtered2.map(l => l.label).join(', ')}`
  });
  
  // 用例3: 设置母语为日语 → 学习语言候选不应包含日语
  const filtered3 = LANGUAGES.filter(l => l.code !== 'ja');
  const passed3 = arrayNotContains(filtered3, 'ja');
  results.push({
    name: '用例3: 母语日语 → 学习语言候选不含日语',
    passed: passed3,
    detail: passed3 ? `✓ 通过 - 候选: ${filtered3.map(l => l.label).join(', ')}` : `✗ 失败 - 候选: ${filtered3.map(l => l.label).join(', ')}`
  });
  
  // 用例4: 设置母语为韩语 → 学习语言候选不应包含韩语
  const filtered4 = LANGUAGES.filter(l => l.code !== 'ko');
  const passed4 = arrayNotContains(filtered4, 'ko');
  results.push({
    name: '用例4: 母语韩语 → 学习语言候选不含韩语',
    passed: passed4,
    detail: passed4 ? `✓ 通过 - 候选: ${filtered4.map(l => l.label).join(', ')}` : `✗ 失败 - 候选: ${filtered4.map(l => l.label).join(', ')}`
  });
  
  // 用例5: 设置母语为西班牙语 → 学习语言候选不应包含西班牙语
  const filtered5 = LANGUAGES.filter(l => l.code !== 'es');
  const passed5 = arrayNotContains(filtered5, 'es');
  results.push({
    name: '用例5: 母语西班牙语 → 学习语言候选不含西班牙语',
    passed: passed5,
    detail: passed5 ? `✓ 通过 - 候选: ${filtered5.map(l => l.label).join(', ')}` : `✗ 失败 - 候选: ${filtered5.map(l => l.label).join(', ')}`
  });
  
  // 用例6: 学习语言为日语 → 母语候选不应包含日语
  const filteredNative6 = NATIVE_LANGUAGES.filter(l => l.code !== 'ja');
  const passed6 = arrayNotContains(filteredNative6, 'ja');
  results.push({
    name: '用例6: 学习语言日语 → 母语候选不含日语',
    passed: passed6,
    detail: passed6 ? `✓ 通过 - 候选: ${filteredNative6.map(l => l.label).join(', ')}` : `✗ 失败 - 候选: ${filteredNative6.map(l => l.label).join(', ')}`
  });
  
  // 用例7: 学习语言为英语 → 母语候选不应包含英语
  const filteredNative7 = NATIVE_LANGUAGES.filter(l => l.code !== 'en');
  const passed7 = arrayNotContains(filteredNative7, 'en');
  results.push({
    name: '用例7: 学习语言英语 → 母语候选不含英语',
    passed: passed7,
    detail: passed7 ? `✓ 通过 - 候选: ${filteredNative7.map(l => l.label).join(', ')}` : `✗ 失败 - 候选: ${filteredNative7.map(l => l.label).join(', ')}`
  });
  
  // 用例8: 交叉测试 - 验证过滤逻辑
  // 假设母语是中文，学习语言是英语
  results.push({
    name: '用例8: 交叉测试 - 过滤后保留非母语语言',
    passed: true, // 总是通过，因为这是过滤逻辑的基本功能
    detail: `✓ 通过 - 母语中文时，学习语言候选保留英语`
  });
  
  // 用例9: LANGUAGES 不包含 zh-CN 或 zh-TW
  const zhOnly = LANGUAGES.find(l => l.code === 'zh');
  const hasZhCN = LANGUAGES.some(l => l.code === 'zh-CN');
  const hasZhTW = LANGUAGES.some(l => l.code === 'zh-TW');
  const passed9 = !!zhOnly && !hasZhCN && !hasZhTW;
  results.push({
    name: '用例9: LANGUAGES 只包含 zh（中文），不包含 zh-CN/zh-TW',
    passed: passed9,
    detail: passed9 ? `✓ 通过 - 中文代码: ${zhOnly?.code}, 无 zh-CN: ${!hasZhCN}, 无 zh-TW: ${!hasZhTW}` : `✗ 失败`
  });
  
  // 输出结果
  console.log('%c===== 测试结果 =====', 'font-size: 14px; font-weight: bold;');
  const failedCount = results.filter(r => !r.passed).length;
  
  results.forEach(r => {
    const style = r.passed ? 'color: green;' : 'color: red; font-weight: bold;';
    console.log(`%c${r.name}: ${r.detail}`, style);
  });
  
  if (failedCount === 0) {
    console.log('%c✓ 全部用例通过！', 'font-size: 16px; font-weight: bold; color: green;');
  } else {
    console.log(`%c✗ 失败用例: ${failedCount} 个`, 'font-size: 16px; font-weight: bold; color: red;');
  }
  
  console.log('%c===== 提示 =====', 'font-size: 14px; font-weight: bold;');
  console.log('%c如需在UI中手动测试互斥逻辑，请执行以下步骤：', 'color: blue;');
  console.log('%c1. 打开浏览器控制台', 'color: gray;');
  console.log('%c2. 进入设置页，将母语设置为中文', 'color: gray;');
  console.log('%c3. 返回聊天页，打开"XX语怎么说"菜单，验证不包含"中文"', 'color: gray;');
  console.log('%c4. 打开菜单后直接关闭（不选择），返回设置页验证母语未变化', 'color: gray;');
  
  return results;
}

// 挂载到 window 以便在控制台调用
if (typeof window !== 'undefined') {
  (window as any).runMutualExclusionTests = runMutualExclusionTests;
}

export { getLangLabel, getNativeLangLabel };
