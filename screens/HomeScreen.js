import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { sendMessageToDeepSeek } from '../src/services/deepseek';

export default function HomeScreen() {
  const [userMessage, setUserMessage] = useState('');
  const [aiReply, setAiReply] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!userMessage.trim()) {
      Alert.alert('请输入消息', '请先输入您要发送给 AI 的内容。');
      return;
    }

    setIsLoading(true);
    setAiReply('');

    try {
      const reply = await sendMessageToDeepSeek(userMessage.trim());
      setAiReply(reply);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI 请求失败，请稍后重试。';
      Alert.alert('请求失败', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>DeepSeek AI 对话</Text>

        <Text style={styles.label}>请输入你的问题或对话内容：</Text>
        <TextInput
          style={styles.input}
          placeholder="你好，给我介绍一下 React Native..."
          placeholderTextColor="#9CA3AF"
          value={userMessage}
          onChangeText={setUserMessage}
          multiline
        />

        <View style={styles.buttonContainer}>
          <Button title="发送给 AI" onPress={handleSend} disabled={isLoading} />
        </View>

        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>正在请求 AI，请稍候...</Text>
          </View>
        ) : null}

        {aiReply ? (
          <View style={styles.replyCard}>
            <Text style={styles.replyTitle}>AI 回复</Text>
            <Text style={styles.replyText}>{aiReply}</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    color: '#111827',
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
    color: '#374151',
  },
  input: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#FFFFFF',
    textAlignVertical: 'top',
    marginBottom: 18,
    color: '#111827',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  loading: {
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingText: {
    marginTop: 12,
    color: '#374151',
  },
  replyCard: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  replyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#111827',
  },
  replyText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
  },
});
