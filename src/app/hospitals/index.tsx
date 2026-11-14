import { UI, Spacing } from "@/constants/theme";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ListRow } from "@/components/ui/list-row";
import { router } from "expo-router";
import { useCallback } from "react";
import { FlatList, RefreshControl, Text, View } from "react-native";
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
        className="w-full max-w-content flex-1 self-center"
        data={hospitals.data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: UI.gutter,
          paddingBottom: insets.bottom + Spacing.four,
        }}
        refreshControl={
          <RefreshControl
            refreshing={hospitals.isRefreshing}
            onRefresh={() => void hospitals.reload()}
          />
        }
        ListHeaderComponent={
          <View className="gap-3 pb-2">
            <ScreenHeader title={copy.care.hospitals} />
            {isDefaultFallback && (
              <Card variant="warning">
                <Text className="text-body text-ink">
                  {copy.care.locationFallback}
                </Text>
                <Button
                  label={copy.care.locationRetry}
                  variant="secondary"
                  onPress={() => void requestLocation()}
                />
              </Card>
            )}
            <Button
              label={copy.care.mapTitle}
              icon={<Icon name="map" tone="brand" />}
              variant="secondary"
              onPress={() => router.push("/hospitals/map")}
            />
            {hospitals.error && (
              <ErrorState
                description={copy.common.loadFailed}
                onAction={() => void hospitals.reload()}
              />
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
          <ListRow
            title={item.name}
            leading={
              <View className="h-11 w-11 items-center justify-center rounded-xl bg-surface-brand-soft">
                <Icon name="hospital" tone="brand" />
              </View>
            }
            subtitle={
              <View className="gap-1.5">
                <Text className="text-label text-ink-muted">
                  {item.type} · {item.address}
                </Text>
                {!isDefaultFallback && item.distance_km !== undefined && (
                  <Text className="text-caption text-ink-muted">
                    {copy.care.distance(item.distance_km)}
                  </Text>
                )}
                {item.has_pediatric && (
                  <Badge variant="brand" label={copy.care.pediatric} />
                )}
              </View>
            }
            onPress={() =>
              router.push({
                pathname: "/hospitals/map",
                params: { id: item.id },
              })
            }
          />
        )}
      />
    </View>
  );
}
