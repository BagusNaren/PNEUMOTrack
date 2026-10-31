// src/app/articles/index.tsx
// Educational articles directory — matches article page_user.png.

import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ScreenHeader } from '@/components/ui/screen-header';
import { articlesService } from '@/services/articles';
import type { Article, ArticleCategory } from '@/types/domain';

type CategoryFilter = 'Semua' | ArticleCategory;

export default function ArticlesScreen() {
  const insets = useSafeAreaInsets();

  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadArticles = useCallback(async () => {
    try {
      const cat = selectedCategory === 'Semua' ? undefined : (selectedCategory as ArticleCategory);
      const list = await articlesService.list(cat);
      setArticles(list);
    } catch {
      // fallback
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadArticles();
  };

  const categories: CategoryFilter[] = [
    'Semua',
    'Gejala',
    'Pencegahan',
    'Penanganan',
    'Edukasi',
  ];

  const filtered = articles.filter((a) =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const popularArticles = filtered.slice(0, 3);
  const remainingArticles = filtered.slice(3);

  return (
    <ScrollView
      className="flex-1 bg-surface dark:bg-surface-dark"
      contentContainerStyle={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom + 24,
        paddingHorizontal: 20,
      }}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        title="Artikel & Berita"
        subtitle="Panduan kesehatan pernapasan anak"
      />

      {/* Search Bar */}
      <View className="my-3">
        <View className="h-12 flex-row items-center rounded-pill border border-border bg-surface-muted px-4 dark:border-border-dark dark:bg-surface-card-dark">
          <Text className="mr-2 text-icon-muted">🔍</Text>
          <TextInput
            className="flex-1 text-body text-ink dark:text-ink-dark"
            placeholder="Cari topik pneumonia anak…"
            placeholderTextColor="#AEB7C2"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Category Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="-mx-5 px-5 my-2"
        contentContainerStyle={{ gap: 8 }}
      >
        {categories.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <Pressable
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              className={`rounded-pill px-4 py-2 border ${
                isActive
                  ? 'bg-brand border-brand'
                  : 'bg-surface-card border-border dark:border-border-dark dark:bg-surface-card-dark'
              }`}
            >
              <Text
                className={`text-caption font-bold ${
                  isActive ? 'text-on-brand' : 'text-ink-muted'
                }`}
              >
                {cat}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Popular Articles Carousel */}
      {popularArticles.length > 0 && (
        <View className="my-3">
          <Text className="text-label font-bold text-ink dark:text-ink-dark mb-3">
            Artikel Populer
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="-mx-5 px-5"
            contentContainerStyle={{ gap: 14 }}
          >
            {popularArticles.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => router.push(`/articles/${item.id}` as any)}
                className="w-56 rounded-card border border-border bg-surface-card p-3 active:opacity-75 dark:border-border-dark dark:bg-surface-card-dark"
              >
                <View className="h-28 w-full rounded-xl bg-surface-brand-soft items-center justify-center mb-2.5">
                  <Text className="text-4xl">🫁</Text>
                </View>
                <View className="self-start rounded-pill bg-surface-brand px-2 py-0.5 mb-1.5">
                  <Text className="text-caption font-semibold text-brand">
                    {item.category}
                  </Text>
                </View>
                <Text
                  numberOfLines={2}
                  className="text-body font-bold text-ink dark:text-ink-dark"
                >
                  {item.title}
                </Text>
                <Text className="mt-1 text-caption text-ink-muted">
                  Sumber: {item.source ?? 'Kemenkes RI'}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Related / Remaining Articles List */}
      <View className="my-3">
        <Text className="text-label font-bold text-ink dark:text-ink-dark mb-3">
          Semua Artikel Terkait
        </Text>

        {filtered.length === 0 ? (
          <EmptyState
            title="Artikel Tidak Ditemukan"
            body="Belum ada artikel yang cocok dengan filter atau kata kunci Anda."
            actionLabel="Reset Filter"
            onAction={() => {
              setSelectedCategory('Semua');
              setSearchQuery('');
            }}
            className="my-6"
          />
        ) : (
          <View className="gap-3">
            {(remainingArticles.length > 0 ? remainingArticles : filtered).map((item) => (
              <Pressable
                key={item.id}
                onPress={() => router.push(`/articles/${item.id}` as any)}
                className="flex-row items-center gap-3 rounded-card border border-border bg-surface-card p-3 active:opacity-75 dark:border-border-dark dark:bg-surface-card-dark"
              >
                <View className="h-16 w-16 rounded-xl bg-surface-brand-soft items-center justify-center">
                  <Text className="text-2xl">📄</Text>
                </View>
                <View className="flex-1 pr-1">
                  <View className="self-start rounded-pill bg-surface-brand-soft px-2 py-0.5 mb-1">
                    <Text className="text-caption font-semibold text-brand">
                      {item.category}
                    </Text>
                  </View>
                  <Text
                    numberOfLines={2}
                    className="text-label font-bold text-ink dark:text-ink-dark"
                  >
                    {item.title}
                  </Text>
                  <Text className="mt-0.5 text-caption text-ink-muted">
                    {item.source ?? 'IDAI'} • {new Date(item.published_at).toLocaleDateString('id-ID')}
                  </Text>
                </View>
                <Text className="text-lg text-icon-muted">›</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

