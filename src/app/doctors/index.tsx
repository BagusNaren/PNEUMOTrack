import { UI, Spacing } from "@/constants/theme";
import { Icon } from "@/components/ui/icon";
import { ListRow } from "@/components/ui/list-row";
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
        className="w-full max-w-content flex-1 self-center"
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: UI.gutter,
          paddingBottom: insets.bottom + Spacing.four,
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
            <View className="min-h-12 flex-row items-center gap-2 rounded-pill border border-border bg-surface-muted pl-4 mb-4">
              <Icon name="search" tone="muted" />
              <TextInput accessibilityLabel={copy.care.searchDoctor} value={search} onChangeText={setSearch} placeholder={copy.care.searchDoctor} placeholderTextColor={theme.inkMuted} className="min-w-0 flex-1 py-3 text-body text-ink" />
              {search.length > 0 && <Pressable accessibilityRole="button" accessibilityLabel={copy.common.clearSearch} onPress={() => setSearch("")} className="min-h-12 min-w-12 items-center justify-center rounded-pill active:opacity-70"><Icon name="close" tone="muted" /></Pressable>}
            </View>
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
          <ListRow
            onPress={() => router.push({ pathname: "/doctors/[id]", params: { id: item.id } })}
            leading={<Avatar size="md" name={item.name} source={item.photo_url ? { uri: item.photo_url } : undefined} accessibilityLabel={item.name} />}
            title={item.name}
            subtitle={<View className="gap-1"><Text className="text-label text-brand">{item.specialty}</Text><Text className="text-caption text-ink-muted">{item.hospital_name}{item.rating !== null ? ` · ★ ${item.rating.toLocaleString("id-ID", { minimumFractionDigits: 1 })}` : ""}</Text></View>}
          />
        )}
      />
    </View>
  );
}
