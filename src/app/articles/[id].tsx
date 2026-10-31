// src/app/articles/[id].tsx
// Article detail view.

import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Image,
  Linking,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScreenHeader } from '@/components/ui/screen-header';
import { articlesService } from '@/services/articles';
import type { Article } from '@/types/domain';

export default function ArticleDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    articlesService
      .get(id)
      .then(setArticle)
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading || !article) {
    return (
      <View className="flex-1 items-center justify-center bg-surface dark:bg-surface-dark">
        <Text className="text-body text-ink-muted">Memuat artikel…</Text>
      </View>
    );
  }

  const handleOpenSource = () => {
    Linking.openURL('https://www.idai.or.id').catch(() => {});
  };

  return (
    <ScrollView
      className="flex-1 bg-surface dark:bg-surface-dark"
      contentContainerStyle={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom + 24,
        paddingHorizontal: 20,
      }}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader title="Baca Artikel" />

      {/* Hero Header */}
      <View className="my-3 gap-2">
        <View className="flex-row items-center gap-2">
          <Badge label={article.category} variant="brand" />
          <Text className="text-caption text-ink-muted">
            {new Date(article.published_at).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </Text>
        </View>

        <Text className="text-title font-bold text-ink dark:text-ink-dark leading-8">
          {article.title}
        </Text>

        <Text className="text-caption font-semibold text-brand dark:text-brand-light">
          Sumber Edukasi: {article.source ?? 'Ikatan Dokter Anak Indonesia (IDAI)'}
        </Text>
      </View>

      {/* Article Cover Graphic */}
      <View className="h-44 w-full rounded-2xl bg-surface-brand-soft items-center justify-center my-3 overflow-hidden border border-border">
        <Text className="text-6xl">🫁</Text>
        <Text className="mt-2 text-caption font-medium text-brand">
          PNEUMOTrack Health Education
        </Text>
      </View>

      {/* Article Body */}
      <Card variant="default" className="my-3 p-5 gap-4">
        <Text className="text-body text-ink dark:text-ink-dark leading-7">
          {article.body_md}
        </Text>

        <View className="pt-3 border-t border-border gap-2">
          <Text className="text-caption font-bold text-ink">Catatan Penting:</Text>
          <Text className="text-caption text-ink-muted leading-5">
            Informasi dalam artikel ini bersifat edukasi dan disadur dari pedoman klinis resmi. Jika si kecil menunjukkan gejala pneumonia seperti demam tinggi, napas cepat, atau tarikan dinding dada, segera konsultasikan langsung dengan dokter spesialis anak.
          </Text>
        </View>
      </Card>

      {/* CTA to Consultation */}
      <View className="my-4 gap-3">
        <Button
          label="Konsultasi dengan Dokter Spesialis"
          size="lg"
          variant="primary"
          icon={<Text className="text-lg">👨‍⚕️</Text>}
          onPress={() => router.push('/doctors')}
        />
        <Button
          label="Buka Pedoman Asli IDAI"
          size="md"
          variant="secondary"
          onPress={handleOpenSource}
        />
      </View>
    </ScrollView>
  );
}

