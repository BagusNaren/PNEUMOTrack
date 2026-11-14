import { UI, Spacing } from "@/constants/theme";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
  FlatList,
  Linking,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { ScreenHeader } from "@/components/ui/screen-header";
import { copy } from "@/constants/copy";
import { useResource } from "@/hooks/use-resource";
import { useTheme } from "@/hooks/use-theme";
import { hospitalsService } from "@/services/hospitals";
import type { Hospital } from "@/types/domain";

export default function HospitalMapScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [search, setSearch] = useState("");
  const [openFailed, setOpenFailed] = useState(false);
  const hospitals = useResource(useCallback(() => hospitalsService.list(), []));
  const filtered =
    hospitals.data
      ?.filter((item) =>
        `${item.name} ${item.address}`
          .toLocaleLowerCase("id-ID")
          .includes(search.toLocaleLowerCase("id-ID")),
      )
      .sort((a, b) => Number(b.id === id) - Number(a.id === id)) ?? [];
  const navigate = async (hospital: Hospital) => {
    setOpenFailed(false);
    const url = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(hospital.name)}@${hospital.lat},${hospital.lng}`,
      android: `geo:0,0?q=${hospital.lat},${hospital.lng}(${encodeURIComponent(hospital.name)})`,
      default: `https://www.google.com/maps/search/?api=1&query=${hospital.lat},${hospital.lng}`,
    });
    try {
      await Linking.openURL(url);
    } catch {
      setOpenFailed(true);
    }
  };
  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      <FlatList
        className="w-full max-w-content flex-1 self-center"
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: UI.gutter,
          paddingBottom: insets.bottom + Spacing.four,
          gap: Spacing.three,
        }}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View className="gap-3">
            <ScreenHeader title={copy.care.mapTitle} />
            <Text className="text-body text-ink-muted">
              {copy.care.mapBody}
            </Text>
            <View className="min-h-12 flex-row items-center gap-2 rounded-pill border border-border bg-surface-muted pl-4">
              <Icon name="search" tone="muted" />
              <TextInput
                accessibilityLabel={copy.care.searchHospital}
                value={search}
                onChangeText={setSearch}
                placeholder={copy.care.searchHospital}
                placeholderTextColor={theme.inkMuted}
                className="min-w-0 flex-1 py-3 text-body text-ink"
              />
              {search.length > 0 && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={copy.common.clearSearch}
                  onPress={() => setSearch("")}
                  className="min-h-12 min-w-12 items-center justify-center rounded-pill active:opacity-70"
                >
                  <Icon name="close" tone="muted" />
                </Pressable>
              )}
            </View>
            {hospitals.error && (
              <ErrorState
                description={copy.common.loadFailed}
                onAction={() => void hospitals.reload()}
              />
            )}
            {openFailed && (
              <Text accessibilityRole="alert" className="text-body text-risk">
                {copy.care.mapError}
              </Text>
            )}
          </View>
        }
        ListEmptyComponent={
          hospitals.isLoading ? (
            <LoadingState />
          ) : hospitals.error ? undefined : (
            <EmptyState
              title={copy.care.noHospital}
              body={copy.care.noHospitalBody}
            />
          )
        }
        renderItem={({ item }) => (
          <Card variant={item.id === id ? "brand" : "default"}>
            {item.id === id && (
              <Badge variant="muted" label={copy.care.selectedFacility} />
            )}
            <Text className="text-subtitle font-semibold text-ink">
              {item.name}
            </Text>
            <Text className="text-label text-ink-muted">
              {item.type}
              {item.distance_km !== undefined
                ? ` · ${copy.care.distance(item.distance_km)}`
                : ""}
            </Text>
            <Text className="text-body text-ink-muted">{item.address}</Text>
            <Button label={copy.care.map} onPress={() => void navigate(item)} />
            {item.phone && (
              <Button
                label={copy.care.callHospital}
                variant="secondary"
                onPress={() => {
                  void Linking.openURL(`tel:${item.phone}`).catch(() =>
                    setOpenFailed(true),
                  );
                }}
              />
            )}
          </Card>
        )}
      />
    </View>
  );
}
