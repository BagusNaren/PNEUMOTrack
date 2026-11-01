import { useRef, useState } from "react";
import { Linking, Text, View } from "react-native";
import { copy } from "@/constants/copy";
import { Button } from "./button";
import { Card } from "./card";
import { Disclaimer } from "./disclaimer";

export function DangerSignsBox({
  showEmergencyAction = false,
  includeDisclaimer = false,
}: {
  showEmergencyAction?: boolean;
  includeDisclaimer?: boolean;
}) {
  const [callFailed, setCallFailed] = useState(false);
  const [calling, setCalling] = useState(false);
  const callingRef = useRef(false);
  async function callEmergency() {
    if (callingRef.current) return;
    callingRef.current = true;
    setCalling(true);
    setCallFailed(false);
    try {
      const supported = await Linking.canOpenURL("tel:119");
      if (!supported) {
        setCallFailed(true);
        return;
      }
      await Linking.openURL("tel:119");
    } catch {
      setCallFailed(true);
    } finally {
      callingRef.current = false;
      setCalling(false);
    }
  }
  return (
    <Card>
      {includeDisclaimer && <Disclaimer />}
      <View className="flex-row flex-wrap">
        <Text className="min-w-0 flex-1 text-label font-semibold text-risk dark:text-risk-light">
          {copy.dangerSigns.title}
        </Text>
      </View>
      {copy.dangerSigns.items.map((item) => (
        <View key={item} className="flex-row flex-wrap items-start gap-2">
          <Text
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            className="shrink-0 text-body text-ink dark:text-ink-dark"
          >
            •
          </Text>
          <Text className="min-w-0 flex-1 text-body text-ink dark:text-ink-dark">
            {item}
          </Text>
        </View>
      ))}
      {showEmergencyAction && (
        <Button
          label={copy.common.emergency}
          variant="risk"
          loading={calling}
          onPress={() => {
            void callEmergency();
          }}
        />
      )}
      {callFailed && (
        <Text
          accessibilityRole="alert"
          className="text-body text-ink dark:text-ink-dark"
        >
          {copy.common.callError}
        </Text>
      )}
    </Card>
  );
}
