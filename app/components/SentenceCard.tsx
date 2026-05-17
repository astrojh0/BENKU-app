import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing, FontSize } from '../../src/theme';

export interface FuriganaData {
  [kanji: string]: string;
}

interface SentenceCardProps {
  sentence: string;
  translation?: string;
  furiganaData?: FuriganaData;
  accent?: boolean;
}

function renderFuriganaText(sentence: string, furiganaData?: FuriganaData): React.ReactNode {
  if (!furiganaData || Object.keys(furiganaData).length === 0) {
    return <Text style={styles.sentenceText}>{sentence}</Text>;
  }

  const parts: React.ReactNode[] = [];
  let remaining = sentence;
  let keyIndex = 0;

  while (remaining.length > 0) {
    let matched = false;

    const sortedKanji = Object.keys(furiganaData).sort((a, b) => b.length - a.length);

    for (const kanji of sortedKanji) {
      if (remaining.startsWith(kanji)) {
        parts.push(
          <Text key={`fg-${keyIndex++}`}>
            <Text style={styles.sentenceText}>{kanji}</Text>
            <Text style={styles.furiganaText}>({furiganaData[kanji]})</Text>
          </Text>,
        );
        remaining = remaining.slice(kanji.length);
        matched = true;
        break;
      }
    }

    if (!matched) {
      const nextChar = remaining.charAt(0);
      parts.push(
        <Text key={`fg-${keyIndex++}`} style={styles.sentenceText}>
          {nextChar}
        </Text>,
      );
      remaining = remaining.slice(1);
    }
  }

  return <Text>{parts}</Text>;
}

export default function SentenceCard({ sentence, translation, furiganaData, accent }: SentenceCardProps) {
  return (
    <View style={[styles.card, accent && styles.cardAccent]}>
      <View style={styles.sentenceRow}>
        {renderFuriganaText(sentence, furiganaData)}
      </View>
      {translation ? (
        <>
          <View style={styles.divider} />
          <Text style={styles.translationText}>{translation}</Text>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Spacing.cardRadius,
    paddingVertical: Spacing.cardPaddingV,
    paddingHorizontal: Spacing.cardPaddingH,
    marginBottom: 12,
  },
  cardAccent: {
    borderLeftWidth: Spacing.accentBorderWidth,
    borderLeftColor: Colors.accentBorder,
  },
  sentenceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
  },
  sentenceText: {
    color: Colors.textPrimary,
    fontSize: FontSize.sentence,
    fontWeight: '500',
    lineHeight: 24,
  },
  furiganaText: {
    color: Colors.textFurigana,
    fontSize: FontSize.furigana,
    lineHeight: 18,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.divider,
    marginVertical: 8,
  },
  translationText: {
    color: Colors.textSecondary,
    fontSize: FontSize.translation,
    lineHeight: 20,
  },
});