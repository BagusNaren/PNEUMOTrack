import { router } from "expo-router";
import { useCallback, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { ScreenHeader } from "@/components/ui/screen-header";
import { copy } from "@/constants/copy";
import { useResource } from "@/hooks/use-resource";
import { useTheme } from "@/hooks/use-theme";
import { doctorsService } from "@/services/doctors";

export default function DoctorsScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const [search, setSearch] = useState("");
  const doctors = useResource(useCallback(() => doctorsService.list(), []));
  const query = search.toLocaleLowerCase("id-ID");
  const filtered =
    doctors.data?.filter((doctor) =>
      `${doctor.name} ${doctor.specialty} ${doctor.hospital_name ?? ""}`
        .toLocaleLowerCase("id-ID")
        .includes(query),
    ) ?? [];
  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 24,
        }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={doctors.isRefreshing}
            onRefresh={() => void doctors.reload()}
          />
        }
        ListHeaderComponent={
          <>
            <ScreenHeader title={copy.care.doctors} />
            <Text className="mb-2 text-label font-semibold text-ink">
              {copy.care.searchDoctor}
            </Text>
            <TextInput
              accessibilityLabel={copy.care.searchDoctor}
              value={search}
              onChangeText={setSearch}
              placeholder={copy.care.searchDoctor}
              placeholderTextColor={theme.inkMuted}
              className="mb-4 min-h-12 rounded-xl border border-border px-4 py-3 text-body text-ink"
            />
            {doctors.error && (
              <ErrorState
                description={copy.common.loadFailed}
                onAction={() => void doctors.reload()}
              />
            )}
          </>
        }
        ListEmptyComponent={
          doctors.isLoading ? (
            <LoadingState />
          ) : doctors.error ? undefined : (
            <EmptyState
              title={copy.care.noDoctor}
              body={copy.care.noDoctorBody}
            />
          )
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: "/doctors/[id]",
                params: { id: item.id },
              })
            }
            className="min-h-12 flex-row items-center gap-3 border-b border-border/40 py-4 active:opacity-70"
          >
            <Avatar
              name={item.name}
              source={item.photo_url ? { uri: item.photo_url } : undefined}
              accessibilityLabel={item.name}
            />
            <View className="min-w-0 flex-1 gap-1">
              <Text className="text-subtitle font-semibold text-ink">
                {item.name}
              </Text>
              <Text className="text-body text-ink-muted">{item.specialty}</Text>
              {item.hospital_name && (
                <Text className="text-label text-ink-muted">
                  {item.hospital_name}
                </Text>
              )}
              {item.rating !== null && (
                <Text className="text-caption text-brand">
                  {copy.care.rating(item.rating)}
                </Text>
              )}
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
