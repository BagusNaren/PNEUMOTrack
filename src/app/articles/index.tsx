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

import { EmptyState } from '@/components/ui/empty-state';
import { ScreenHeader } from '@/components/ui/screen-header';
import { articlesService } from '@/services/articles';
import type { Article } from '@/types/domain';

type ArticleCategoryKey = 'Pneumonia' | 'Lung' | 'Breath';

export default function ArticlesScreen() {
  const insets = useSafeAreaInsets();

  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedCat, setSelectedCat] = useState<ArticleCategoryKey>('Pneumonia');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadArticles = useCallback(async () => {
    try {
      const list = await articlesService.list();
      setArticles(list);
    } catch {
      // Fallback handled by empty state
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    articlesService
      .list()
      .then((list) => {
        if (active) setArticles(list);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const onRefresh = () => {
    setIsRefreshing(true);
    void loadArticles();
  };

  const categories: ArticleCategoryKey[] = ['Pneumonia', 'Lung', 'Breath'];

  const filtered = articles.filter((a) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || a.title.toLowerCase().includes(q) || a.body_md.toLowerCase().includes(q);
    if (!matchesSearch) return false;

    if (selectedCat === 'Pneumonia') {
      return a.title.toLowerCase().includes('pneumonia');
    }
    if (selectedCat === 'Lung') {
      return a.title.toLowerCase().includes('paru') || a.title.toLowerCase().includes('pneumonia');
    }
    if (selectedCat === 'Breath') {
      return a.title.toLowerCase().includes('napas') || a.category === 'Gejala' || a.category === 'Pencegahan';
    }
    return true;
  });

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
        title="Article & News"
        rightAction={<Text className="text-xl font-bold text-ink-muted">⋮</Text>}
      />

      <View className="my-3">
        <View className="h-11 flex-row items-center rounded-pill border border-border bg-surface-muted px-4 dark:border-border-dark dark:bg-surface-card-dark">
          <Text className="mr-2 text-icon-muted">🔍</Text>
          <TextInput
            className="flex-1 text-label text-ink dark:text-ink-dark"
            placeholder="Search articles, news..."
            placeholderTextColor="#AEB7C2"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View className="my-2">
        <Text className="text-label font-bold text-ink dark:text-ink-dark mb-2.5">
          Popular Articles
        </Text>
        <View className="flex-row gap-2.5">
          {categories.map((cat) => {
            const isActive = selectedCat === cat;
            return (
              <Pressable
                key={cat}
                onPress={() => setSelectedCat(cat)}
                className={`rounded-pill px-5 py-2 active:opacity-80 ${
                  isActive ? 'bg-brand' : 'bg-surface-brand-soft'
                }`}
              >
                <Text
                  className={`text-caption font-bold ${
                    isActive ? 'text-on-brand' : 'text-brand'
                  }`}
                >
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="my-4">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-subtitle font-bold text-ink dark:text-ink-dark">
            Trending Articles
          </Text>
          <Text className="text-caption font-semibold text-brand">See all</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="-mx-5 px-5"
          contentContainerStyle={{ gap: 14 }}
        >
          {filtered.slice(0, 3).map((item) => (
            <Pressable
              key={item.id}
              onPress={() => router.push(`/articles/${item.id}` as any)}
              className="w-56 rounded-2xl border border-border bg-surface-card p-3 active:opacity-75 dark:border-border-dark dark:bg-surface-card-dark"
            >
              <View className="h-28 w-full rounded-xl bg-surface-brand-soft items-center justify-center mb-2.5">
                <Text className="text-4xl">💊</Text>
              </View>

              <View className="self-start rounded-pill bg-surface-brand-soft px-2.5 py-0.5 mb-1.5">
                <Text className="text-caption font-semibold text-brand">
                  Pneumonia
                </Text>
              </View>

              <Text
                numberOfLines={2}
                className="text-body font-bold text-ink dark:text-ink-dark"
              >
                {item.title}
              </Text>

              <Text className="mt-1.5 text-caption text-ink-muted">
                Nov 20, 2024 • 5 min read
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View className="my-2">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-subtitle font-bold text-ink dark:text-ink-dark">
            Related Articles
          </Text>
          <Text className="text-caption font-semibold text-brand">See all</Text>
        </View>

        {filtered.length === 0 ? (
          <EmptyState
            title="No Articles"
            body="No articles found matching your search."
            className="my-4"
          />
        ) : (
          <View className="gap-3">
            {filtered.slice(3).concat(filtered.slice(0, 2)).map((item, idx) => (
              <Pressable
                key={`${item.id}-${idx}`}
                onPress={() => router.push(`/articles/${item.id}` as any)}
                className="flex-row items-center gap-3 rounded-2xl border border-border bg-surface-card p-3 active:opacity-75 dark:border-border-dark dark:bg-surface-card-dark"
              >
                <View className="h-16 w-16 rounded-xl bg-surface-brand-soft items-center justify-center">
                  <Text className="text-2xl">🥗</Text>
                </View>

                <View className="flex-1 pr-1">
                  <Text
                    numberOfLines={2}
                    className="text-label font-bold text-ink dark:text-ink-dark"
                  >
                    {item.title}
                  </Text>
                  <Text className="mt-1 text-caption text-ink-muted">
                    Jun 10, 2024 • 3 min read
                  </Text>
                </View>

                <Text className="text-base text-brand">🔖</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
