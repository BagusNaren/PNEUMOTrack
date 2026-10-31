import { Text } from "react-native";
import { copy } from "@/constants/copy";
export function Disclaimer() {
  return (
    <Text
      selectable
      className="text-caption text-ink-muted dark:text-ink-dark-muted"
    >
      {copy.disclaimer}
    </Text>
  );
}
