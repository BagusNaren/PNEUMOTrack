import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import type { Article } from "@/types/domain";
import { formatDate } from "@/utils/format";
import { Avatar } from "./avatar";

export function ArticleRow({ article }: { article: Article }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() =>
        router.push({ pathname: "/articles/[id]", params: { id: article.id } })
      }
      className="min-h-12 flex-row items-center gap-3 border-b border-border/40 py-4 active:opacity-70"
    >
      <Avatar
        name={article.category}
        source={article.cover_url ? { uri: article.cover_url } : undefined}
        accessibilityLabel={article.category}
      />
      <View className="min-w-0 flex-1 gap-1">
        <Text className="text-body font-semibold text-ink">
          {article.title}
        </Text>
        <Text className="text-caption text-ink-muted">
          {article.category} · {formatDate(article.published_at)}
        </Text>
      </View>
    </Pressable>
  );
}
