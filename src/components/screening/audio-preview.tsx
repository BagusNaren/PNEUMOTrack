import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useState } from "react";
import { Text, View } from "react-native";
import { Button } from "@/components/ui/button";
import { copy } from "@/constants/copy";
import { useSingleFlight } from "@/hooks/use-single-flight";

export function AudioPreview({
  uri,
  busy,
  onAnalyze,
  onRerecord,
}: {
  uri: string;
  busy: boolean;
  onAnalyze: () => boolean | void | Promise<boolean | void>;
  onRerecord: () => void | Promise<unknown>;
}) {
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);
  const [playbackFailed, setPlaybackFailed] = useState(false);
  const actionGate = useSingleFlight();
  return (
    <View className="gap-3">
      <Text
        accessibilityRole="header"
        className="text-subtitle font-semibold text-ink dark:text-ink-dark"
      >
        {copy.record.preview}
      </Text>
      <Text className="text-body text-ink-muted dark:text-ink-dark-muted">
        {copy.record.previewHint}
      </Text>
      <Button
        label={status.playing ? copy.record.pausePlayback : copy.record.play}
        variant="secondary"
        disabled={busy || !status.isLoaded}
        onPress={async () => {
          try {
            setPlaybackFailed(false);
            if (status.playing) player.pause();
            else {
              if (status.didJustFinish || status.currentTime >= status.duration)
                await player.seekTo(0);
              player.play();
            }
          } catch {
            setPlaybackFailed(true);
          }
        }}
      />
      {(status.error || playbackFailed) && (
        <Text
          accessibilityRole="alert"
          className="text-body text-ink dark:text-ink-dark"
        >
          {copy.record.playbackError}
        </Text>
      )}
      <Button
        label={copy.record.send}
        loading={busy}
        onPress={() => {
          void actionGate.navigate(() => {
            player.pause();
            return onAnalyze();
          });
        }}
      />
      <Button
        label={copy.common.rerecord}
        variant="secondary"
        disabled={busy}
        onPress={() => {
          void actionGate.run(() => {
            player.pause();
            return onRerecord();
          });
        }}
      />
    </View>
  );
}
