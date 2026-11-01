import { useCallback, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArticleRow } from "@/components/ui/article-row";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { ScreenHeader } from "@/components/ui/screen-header";
import { copy } from "@/constants/copy";
import { useResource } from "@/hooks/use-resource";
import { useTheme } from "@/hooks/use-theme";
import { articlesService } from "@/services/articles";
import type { ArticleCategory } from "@/types/domain";

const categories = [
  copy.articles.all,
  "Gejala",
  "Pencegahan",
  "Penanganan",
  "Edukasi",
] as const;

export default function ArticlesScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const [category, setCategory] = useState<
    ArticleCategory | typeof copy.articles.all
  >(copy.articles.all);
  const [search, setSearch] = useState("");
  const articles = useResource(useCallback(() => articlesService.list(), []));
  const filtered =
    articles.data?.filter(
      (article) =>
        (category === copy.articles.all || article.category === category) &&
        article.title
          .toLocaleLowerCase("id-ID")
          .includes(search.toLocaleLowerCase("id-ID")),
    ) ?? [];
  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 24,
        }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={articles.isRefreshing}
            onRefresh={() => void articles.reload()}
          />
        }
        ListHeaderComponent={
          <>
            <ScreenHeader title={copy.articles.title} />
            <Text className="mb-2 text-label font-semibold text-ink">
              {copy.articles.search}
            </Text>
            <TextInput
              accessibilityLabel={copy.articles.search}
              placeholder={copy.articles.search}
              placeholderTextColor={theme.inkMuted}
              value={search}
              onChangeText={setSearch}
              className="min-h-12 rounded-xl border border-border px-4 py-3 text-body text-ink"
            />
            <View className="my-4 flex-row flex-wrap gap-2">
              {categories.map((item) => (
                <Pressable
                  key={item}
                  accessibilityRole="button"
                  accessibilityState={{ selected: item === category }}
                  onPress={() => setCategory(item)}
                  className={`min-h-12 justify-center rounded-pill px-4 py-3 active:opacity-90 ${item === category ? "bg-brand" : "bg-surface-brand-soft"}`}
                >
                  <Text
                    className={`text-label font-semibold ${item === category ? "text-on-brand" : "text-brand"}`}
                  >
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>
            {articles.error && (
              <ErrorState
                description={copy.common.loadFailed}
                onAction={() => void articles.reload()}
              />
            )}
          </>
        }
        ListEmptyComponent={
          articles.isLoading ? (
            <LoadingState />
          ) : articles.error ? undefined : (
            <EmptyState
              title={copy.articles.empty}
              body={
                articles.data?.length
                  ? copy.articles.noResults
                  : copy.dashboard.articlesEmptyBody
              }
            />
          )
        }
        renderItem={({ item }) => <ArticleRow article={item} />}
      />
    </View>
  );
}
