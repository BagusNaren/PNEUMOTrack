import { useAudioPlayer, useAudioPlayerStatus, type AudioSource } from "expo-audio";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { Icon } from "@/components/ui/icon";
import { UI } from "@/constants/theme";
import { copy } from "@/constants/copy";

function formatPlaybackTime(value: number) {
  if (!Number.isFinite(value) || value < 0) return "0:00";
  const total = Math.floor(value);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

export function AudioPlayback({
  source,
  demo = false,
}: {
  source: AudioSource;
  demo?: boolean;
}) {
  const player = useAudioPlayer(source);
  const status = useAudioPlayerStatus(player);
  const [failed, setFailed] = useState(false);
  const duration = status.duration || 0;
  const progress = duration > 0 ? Math.min(1, status.currentTime / duration) : 0;
  const loaded = status.isLoaded;
  const playing = status.playing;

  useEffect(() => () => player.pause(), [player]);

  return (
    <View className="gap-2">
      <View className="flex-row items-center gap-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            playing ? copy.record.pausePlayback : copy.record.play
          }
          accessibilityState={{ disabled: !loaded }}
          disabled={!loaded}
          onPress={async () => {
            try {
              setFailed(false);
              if (playing) {
                player.pause();
                return;
              }
              if (status.didJustFinish || status.currentTime >= duration) {
                await player.seekTo(0);
              }
              player.play();
            } catch {
              setFailed(true);
            }
          }}
          className={`h-12 w-12 items-center justify-center rounded-full ${
            loaded
              ? "bg-brand active:opacity-80 dark:bg-brand-light"
              : "bg-surface-muted dark:bg-surface-muted-dark"
          }`}
        >
          <Icon
            name={playing ? "pause" : "play"}
            tone={loaded ? "onBrand" : "muted"}
            size={UI.iconMd}
          />
        </Pressable>
        <View className="min-w-0 flex-1 gap-0.5">
          <Text className="text-label font-semibold text-ink dark:text-ink-dark">
            {demo ? copy.history.demoAudio : copy.history.recording}
          </Text>
          {demo && (
            <Text className="text-caption text-ink-muted dark:text-ink-dark-muted">
              {copy.history.demoAudioHint}
            </Text>
          )}
        </View>
        <Text className="text-caption tabular-nums text-ink-muted dark:text-ink-dark-muted">
          {loaded
            ? `${formatPlaybackTime(status.currentTime)} / ${formatPlaybackTime(duration)}`
            : "--:--"}
        </Text>
      </View>
      <View
        className="h-1.5 overflow-hidden rounded-full bg-surface-muted dark:bg-surface-muted-dark"
        accessibilityRole="progressbar"
        accessibilityValue={{
          min: 0,
          max: 100,
          now: Math.round(progress * 100),
        }}
      >
        <View
          className="h-full rounded-full bg-brand dark:bg-brand-light"
          style={{ width: `${progress * 100}%` }}
        />
      </View>
      {(status.error || failed) && (
        <Text
          accessibilityRole="alert"
          className="text-caption text-risk dark:text-risk-light"
        >
          {copy.record.playbackError}
        </Text>
      )}
    </View>
  );
}
