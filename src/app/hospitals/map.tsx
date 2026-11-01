import { useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
  FlatList,
  Linking,
  Platform,
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
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 24,
          gap: 16,
        }}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View className="gap-3">
            <ScreenHeader title={copy.care.mapTitle} />
            <Text className="text-body text-ink-muted">
              {copy.care.mapBody}
            </Text>
            <Text className="text-label font-semibold text-ink">
              {copy.care.searchHospital}
            </Text>
            <TextInput
              accessibilityLabel={copy.care.searchHospital}
              value={search}
              onChangeText={setSearch}
              placeholder={copy.care.searchHospital}
              placeholderTextColor={theme.inkMuted}
              className="min-h-12 rounded-xl border border-border px-4 py-3 text-body text-ink"
            />
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
          <Card>
            <Text className="text-subtitle font-semibold text-ink">
              {item.name}
            </Text>
            <Text className="text-body text-ink-muted">{item.address}</Text>
            <Button label={copy.care.map} onPress={() => void navigate(item)} />
          </Card>
        )}
      />
    </View>
  );
}
