import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import type { Article } from "@/types/domain";
import { formatDate } from "@/utils/format";
import { Image } from "expo-image";
import { Icon } from "./icon";
import { UI } from "@/constants/theme";

export function ArticleRow({ article }: { article: Article }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() =>
        router.push({ pathname: "/articles/[id]", params: { id: article.id } })
      }
      className="min-h-12 flex-row items-center gap-3 border-b border-subtle py-4 active:opacity-70"
    >
      {article.cover_url ? <Image source={{ uri: article.cover_url }} contentFit="cover" style={{ width: UI.diagramSize, height: UI.diagramSize, borderRadius: UI.gap }} /> : <View className="h-12 w-12 items-center justify-center rounded-xl bg-surface-brand-soft"><Icon name="article" tone="brand" /></View>}
      <View className="min-w-0 flex-1 gap-1">
        <Text numberOfLines={2} className="text-body font-semibold text-ink">
          {article.title}
        </Text>
        <Text className="text-caption text-ink-muted">
          {article.category} · {formatDate(article.published_at)}
        </Text>
      </View>
      <Icon name="chevronRight" tone="muted" />
    </Pressable>
  );
}
