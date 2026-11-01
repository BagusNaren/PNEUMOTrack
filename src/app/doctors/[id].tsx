import { router, useLocalSearchParams } from "expo-router";
import { useCallback } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { ScreenHeader } from "@/components/ui/screen-header";
import { copy } from "@/constants/copy";
import { useResource } from "@/hooks/use-resource";
import { doctorsService } from "@/services/doctors";

export default function DoctorDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const record = useResource(
    useCallback(
      () => (id ? doctorsService.get(id) : Promise.resolve(null)),
      [id],
    ),
  );
  const doctor = record.data;
  return (
    <ScrollView
      className="flex-1 bg-surface"
      contentContainerStyle={{
        paddingTop: insets.top,
        paddingHorizontal: 20,
        paddingBottom: insets.bottom + 24,
        gap: 20,
      }}
    >
      <ScreenHeader title={copy.care.doctorDetail} />
      {record.isLoading ? (
        <LoadingState />
      ) : (
        <>
          {record.error && (
            <ErrorState
              description={copy.common.loadFailed}
              onAction={() => void record.reload()}
            />
          )}
          {doctor ? (
            <>
              <View className="flex-row items-center gap-3">
                <Avatar
                  name={doctor.name}
                  source={
                    doctor.photo_url ? { uri: doctor.photo_url } : undefined
                  }
                  accessibilityLabel={doctor.name}
                />
                <View className="min-w-0 flex-1 gap-1">
                  <Text className="text-title font-bold text-ink">
                    {doctor.name}
                  </Text>
                  <Text className="text-body text-ink-muted">
                    {doctor.specialty}
                  </Text>
                </View>
              </View>
              {doctor.rating !== null && (
                <Text className="text-label text-brand">
                  {copy.care.rating(doctor.rating)}
                </Text>
              )}
              <View className="gap-2">
                <Text
                  accessibilityRole="header"
                  className="text-subtitle font-semibold text-ink"
                >
                  {copy.care.about}
                </Text>
                <Text className="text-body text-ink-muted">
                  {doctor.bio || copy.care.noBio}
                </Text>
              </View>
              <View className="gap-2">
                <Text
                  accessibilityRole="header"
                  className="text-subtitle font-semibold text-ink"
                >
                  {copy.care.schedule}
                </Text>
                {doctor.schedule?.length ? (
                  doctor.schedule.map((slot, index) => (
                    <Text
                      key={`${slot.day}-${index}`}
                      className="text-body text-ink"
                    >
                      {slot.day}: {slot.time}
                    </Text>
                  ))
                ) : (
                  <Text className="text-body text-ink-muted">
                    {copy.care.noSchedule}
                  </Text>
                )}
                {doctor.hospital_name && (
                  <Text className="text-body text-ink-muted">
                    {doctor.hospital_name}
                  </Text>
                )}
              </View>
              <Button
                label={copy.care.consult}
                onPress={() =>
                  router.push({
                    pathname: "/chats/[id]",
                    params: { id: doctor.id },
                  })
                }
              />
            </>
          ) : (
            !record.error && (
              <EmptyState
                title={copy.care.noDoctor}
                body={copy.care.noDoctorBody}
              />
            )
          )}
        </>
      )}
    </ScrollView>
  );
}
