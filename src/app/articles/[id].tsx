import { router, useLocalSearchParams } from "expo-router";
import { useCallback, type ReactNode } from "react";
import { Text, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Disclaimer } from "@/components/ui/disclaimer";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { Screen } from "@/components/ui/screen";
import { ScreenHeader } from "@/components/ui/screen-header";
import { copy } from "@/constants/copy";
import { useResource } from "@/hooks/use-resource";
import { articlesService } from "@/services/articles";
import { formatDate } from "@/utils/format";

function renderInlineBold(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <Text key={idx} className="font-semibold text-ink">
          {part.slice(2, -2)}
        </Text>
      );
    }
    return part;
  });
}

function ArticleMarkdown({ markdown }: { markdown: string }) {
  const blocks = markdown.split(/\n\n+/);
  return (
    <View className="gap-4">
      {blocks.map((block, bIdx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;
        if (trimmed.startsWith("## ")) {
          return (
            <Text
              key={bIdx}
              selectable
              accessibilityRole="header"
              className="mt-2 text-subtitle font-bold text-ink"
            >
              {renderInlineBold(trimmed.replace(/^##\s+/, ""))}
            </Text>
          );
        }
        const lines = trimmed.split("\n");
        const isList = lines.every((l) => /^(-|\d+\.)\s+/.test(l.trim()));
        if (isList) {
          return (
            <View key={bIdx} className="gap-2">
              {lines.map((line, lIdx) => {
                const match = line.trim().match(/^(-|\d+\.)\s+(.*)$/);
                if (!match) return null;
                const marker = match[1] === "-" ? "•" : match[1];
                const content = match[2];
                return (
                  <View key={lIdx} className="flex-row items-start gap-2.5">
                    <Text className="min-w-4 text-body font-semibold text-brand">
                      {marker}
                    </Text>
                    <Text selectable className="flex-1 text-body text-ink">
                      {renderInlineBold(content)}
                    </Text>
                  </View>
                );
              })}
            </View>
          );
        }
        return (
          <Text key={bIdx} selectable className="text-body text-ink">
            {renderInlineBold(trimmed)}
          </Text>
        );
      })}
    </View>
  );
}

export default function ArticleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const record = useResource(
    useCallback(
      () => (id ? articlesService.get(id) : Promise.resolve(null)),
      [id],
    ),
  );
  const article = record.data;
  return (
    <Screen>
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
            <View className="gap-4">
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
              <ArticleMarkdown markdown={article.body_md} />
              <Disclaimer />
              <Button
                label={copy.care.consult}
                onPress={() => router.push("/doctors")}
              />
            </View>
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
    </Screen>
  );
}
