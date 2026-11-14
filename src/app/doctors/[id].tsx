import { UI } from "@/constants/theme";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { Screen } from "@/components/ui/screen";
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
    <View className="flex-1 bg-surface">
      <Screen bottomInset={!doctor}>
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
                <Card variant="brand">
                  <View className="items-center gap-3">
                    <Avatar
                      size="xl"
                      name={doctor.name}
                      source={
                        doctor.photo_url ? { uri: doctor.photo_url } : undefined
                      }
                      accessibilityLabel={doctor.name}
                    />
                    <View className="min-w-0 items-center gap-1">
                      <Text className="text-center text-title font-bold text-ink">
                        {doctor.name}
                      </Text>
                      <Text className="text-center text-body font-semibold text-brand">
                        {doctor.specialty}
                      </Text>
                      {doctor.hospital_name && (
                        <Text className="text-center text-body text-ink-muted">
                          {doctor.hospital_name}
                        </Text>
                      )}
                    </View>
                    {doctor.rating !== null && (
                      <Badge
                        variant="muted"
                        label={copy.care.rating(doctor.rating)}
                      />
                    )}
                  </View>
                </Card>
                <Card>
                  <Text
                    accessibilityRole="header"
                    className="text-subtitle font-semibold text-ink"
                  >
                    {copy.care.about}
                  </Text>
                  <Text className="text-body text-ink-muted">
                    {doctor.bio || copy.care.noBio}
                  </Text>
                </Card>
                <Card>
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
                </Card>
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
      </Screen>
      {doctor && (
        <View
          className="w-full max-w-content self-center border-t border-subtle bg-surface px-5 pt-3"
          style={{ paddingBottom: insets.bottom + UI.gap }}
        >
          <Button
            label={copy.care.consult}
            onPress={() =>
              router.push({
                pathname: "/chats/[id]",
                params: { id: doctor.id },
              })
            }
          />
        </View>
      )}
    </View>
  );
}
