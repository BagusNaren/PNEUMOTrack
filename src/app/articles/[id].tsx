import { router, useLocalSearchParams } from "expo-router";
import { useCallback } from "react";
import { ScrollView, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { Disclaimer } from "@/components/ui/disclaimer";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { ScreenHeader } from "@/components/ui/screen-header";
import { copy } from "@/constants/copy";
import { useResource } from "@/hooks/use-resource";
import { articlesService } from "@/services/articles";
import { formatDate } from "@/utils/format";

export default function ArticleDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const record = useResource(
    useCallback(
      () => (id ? articlesService.get(id) : Promise.resolve(null)),
      [id],
    ),
  );
  const article = record.data;
  return (
    <ScrollView
      className="flex-1 bg-surface"
      contentContainerStyle={{
        paddingTop: insets.top,
        paddingHorizontal: 20,
        paddingBottom: insets.bottom + 24,
        gap: 16,
      }}
    >
      <ScreenHeader title={copy.articles.read} />
      {record.isLoading ? (
        <LoadingState />
      ) : (
        <>
          {record.error && (
            <ErrorState
              description={copy.common.loadFailed}
              onAction={() => void record.reload()}
            />
          )}
          {article ? (
            <>
              <Text className="text-caption text-ink-muted">
                {article.category} · {formatDate(article.published_at)}
              </Text>
              <Text
                accessibilityRole="header"
                className="text-title font-bold text-ink"
              >
                {article.title}
              </Text>
              {article.source && (
                <Text selectable className="text-label text-brand">
                  {copy.articles.source}: {article.source}
                </Text>
              )}
              <Text selectable className="text-body text-ink">
                {article.body_md}
              </Text>
              <Disclaimer />
              <Button
                label={copy.care.consult}
                onPress={() => router.push("/doctors")}
              />
            </>
          ) : (
            !record.error && (
              <EmptyState
                title={copy.articles.unavailable}
                body={copy.dashboard.articlesEmptyBody}
              />
            )
          )}
        </>
      )}
    </ScrollView>
  );
}
