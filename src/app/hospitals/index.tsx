import { router } from "expo-router";
import { useCallback } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Icon } from "@/components/ui/icon";
import { LoadingState } from "@/components/ui/loading-state";
import { ScreenHeader } from "@/components/ui/screen-header";
import { copy } from "@/constants/copy";
import { useLocation } from "@/hooks/use-location";
import { useResource } from "@/hooks/use-resource";
import { hospitalsService } from "@/services/hospitals";

export default function HospitalsScreen() {
  const insets = useSafeAreaInsets();
  const { lat, lng, isDefaultFallback, requestLocation } = useLocation();
  const hospitals = useResource(
    useCallback(() => hospitalsService.nearest(lat, lng, 15), [lat, lng]),
  );
  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      <FlatList
        data={hospitals.data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 24,
        }}
        refreshControl={
          <RefreshControl
            refreshing={hospitals.isRefreshing}
            onRefresh={() => void hospitals.reload()}
          />
        }
        ListHeaderComponent={
          <>
            <ScreenHeader title={copy.care.hospitals} />
            {isDefaultFallback && (
              <View className="mb-4 gap-2">
                <Text className="text-body text-ink-muted">
                  {copy.care.locationFallback}
                </Text>
                <Button
                  label={copy.care.locationRetry}
                  variant="secondary"
                  onPress={() => void requestLocation()}
                />
              </View>
            )}
            <Button
              label={copy.care.mapTitle}
              variant="secondary"
              onPress={() => router.push("/hospitals/map")}
            />
            {hospitals.error && (
              <ErrorState
                description={copy.common.loadFailed}
                onAction={() => void hospitals.reload()}
              />
            )}
          </>
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
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: "/hospitals/map",
                params: { id: item.id },
              })
            }
            className="min-h-12 flex-row items-center gap-3 border-b border-border/40 py-4 active:opacity-70"
          >
            <Icon name="hospital" tone="brand" />
            <View className="min-w-0 flex-1 gap-1">
              <Text className="text-subtitle font-semibold text-ink">
                {item.name}
              </Text>
              <Text className="text-label text-ink-muted">
                {item.type} · {item.address}
              </Text>
              {!isDefaultFallback && item.distance_km !== undefined && (
                <Text className="text-caption text-ink-muted">
                  {copy.care.distance(item.distance_km)}
                </Text>
              )}
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
