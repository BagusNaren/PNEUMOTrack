import { useCallback, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArticleRow } from "@/components/ui/article-row";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Icon } from "@/components/ui/icon";
import { LoadingState } from "@/components/ui/loading-state";
import { ScreenHeader } from "@/components/ui/screen-header";
import { copy } from "@/constants/copy";
import { Spacing, UI } from "@/constants/theme";
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
        className="w-full max-w-content flex-1 self-center"
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: UI.gutter,
          paddingBottom: insets.bottom + Spacing.four,
        }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={articles.isRefreshing}
            onRefresh={() => void articles.reload()}
          />
        }
        ListHeaderComponent={
          <View className="gap-3 pb-2">
            <ScreenHeader title={copy.articles.title} />
            <View className="min-h-12 flex-row items-center gap-2 rounded-pill border border-border bg-surface-muted pl-4">
              <Icon name="search" tone="muted" />
              <TextInput
                accessibilityLabel={copy.articles.search}
                placeholder={copy.articles.search}
                placeholderTextColor={theme.inkMuted}
                value={search}
                onChangeText={setSearch}
                className="min-w-0 flex-1 py-3 text-body text-ink"
              />
              {search.length > 0 && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={copy.common.clearSearch}
                  onPress={() => setSearch("")}
                  className="min-h-12 min-w-12 items-center justify-center rounded-pill active:opacity-70"
                >
                  <Icon name="close" tone="muted" />
                </Pressable>
              )}
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                gap: Spacing.two,
                paddingVertical: Spacing.one,
              }}
            >
              {categories.map((item) => (
                <Pressable
                  key={item}
                  accessibilityRole="button"
                  accessibilityState={{ selected: item === category }}
                  onPress={() => setCategory(item)}
                  className={`min-h-11 items-center justify-center rounded-pill px-4 py-2 active:opacity-90 ${item === category ? "bg-brand" : "bg-surface-brand-soft"}`}
                >
                  <Text
                    className={`text-label font-semibold ${item === category ? "text-on-brand" : "text-brand"}`}
                  >
                    {item}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            {articles.error && (
              <ErrorState
                description={copy.common.loadFailed}
                onAction={() => void articles.reload()}
              />
            )}
          </View>
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
