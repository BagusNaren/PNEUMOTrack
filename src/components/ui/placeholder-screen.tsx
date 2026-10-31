import { router } from "expo-router";
import { copy } from "@/constants/copy";
import { EmptyState } from "./empty-state";
import { Screen } from "./screen";
import { ScreenHeader } from "./screen-header";

export function PlaceholderScreen({
  title,
  tab = false,
  screening = false,
}: {
  title: string;
  tab?: boolean;
  screening?: boolean;
}) {
  return (
    <Screen bottomInset={!tab}>
      <ScreenHeader title={title} back={!tab} />
      <EmptyState
        title={copy.placeholder.title}
        description={
          screening ? copy.placeholder.screening : copy.placeholder.description
        }
        actionLabel={copy.common.home}
        onAction={() => router.replace("/(tabs)")}
      />
    </Screen>
  );
}
