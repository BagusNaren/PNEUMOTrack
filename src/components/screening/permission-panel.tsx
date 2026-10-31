import { Text, View } from "react-native";
import { Button } from "@/components/ui/button";
import { copy } from "@/constants/copy";
import type { useRecorder } from "@/hooks/use-recorder";

export function PermissionPanel({
  recorder,
}: {
  recorder: ReturnType<typeof useRecorder>;
}) {
  if (recorder.permission === "granted") return null;
  const blocked = recorder.permission === "blocked";
  return (
    <View className="gap-3">
      <Text className="text-body text-ink dark:text-ink-dark">
        {blocked ? copy.record.denied : copy.record.permission}
      </Text>
      <Button
        label={blocked ? copy.record.settings : copy.record.permissionAction}
        loading={recorder.busy}
        onPress={() => {
          void (blocked
            ? recorder.openSettings()
            : recorder.requestPermission());
        }}
      />
    </View>
  );
}
