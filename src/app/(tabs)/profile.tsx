import { router } from "expo-router";
import { useCallback } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Icon } from "@/components/ui/icon";
import { ListRow } from "@/components/ui/list-row";
import { LoadingState } from "@/components/ui/loading-state";
import { ScreenHeader } from "@/components/ui/screen-header";
import { Config } from "@/constants/config";
import { copy } from "@/constants/copy";
import { Spacing, UI } from "@/constants/theme";
import { useActiveChild } from "@/hooks/use-active-child";
import { useProfile } from "@/hooks/use-profile";
import { useResource } from "@/hooks/use-resource";
import { useSession } from "@/hooks/use-session";
import { screeningsService } from "@/services/screenings";
import { formatDate } from "@/utils/format";

function formatChildAge(birthDateStr: string): string {
  const birth = new Date(birthDateStr);
  if (Number.isNaN(birth.getTime())) return birthDateStr;
  const now = new Date();
  const totalMonths = Math.max(
    0,
    (now.getFullYear() - birth.getFullYear()) * 12 +
      (now.getMonth() - birth.getMonth()),
  );
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  if (years > 0 && months > 0) return copy.children.ageYearsMonths(years, months);
  if (years > 0) return copy.children.ageYears(years);
  return copy.children.ageMonths(months);
}

const services = [
  {
    icon: "doctor" as const,
    title: copy.care.doctors,
    subtitle: copy.more.doctorBody,
    href: "/doctors",
  },
  {
    icon: "hospital" as const,
    title: copy.care.hospitals,
    subtitle: copy.more.hospitalBody,
    href: "/hospitals",
  },
  {
    icon: "chat" as const,
    title: copy.chats.title,
    subtitle: copy.more.chatBody,
    href: "/chats",
  },
  {
    icon: "article" as const,
    title: copy.articles.title,
    subtitle: copy.more.articleBody,
    href: "/articles",
  },
  {
    icon: "history" as const,
    title: copy.nav.monitoring,
    subtitle: copy.more.monitoringBody,
    href: "/(tabs)/monitoring",
  },
] as const;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useSession();
  const { profile } = useProfile();
  const { activeChild, children, setActiveChild, isLoading, error, refresh } = useActiveChild();
  const childId = activeChild?.id;
  const latest = useResource(
    useCallback(
      () =>
        childId ? screeningsService.latest(childId) : Promise.resolve(null),
      [childId],
    ),
    screeningsService.subscribe,
  );
  const screening = latest.data;
  const risk = screening?.result === "risk";

  const handleSignOut = () => {
    Alert.alert(copy.auth.signOut, copy.auth.signOutConfirm, [
      { text: copy.common.cancel, style: "cancel" },
      {
        text: copy.auth.signOut,
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/(auth)/sign-in");
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-surface">
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top,
          paddingBottom: Spacing.four,
          paddingHorizontal: UI.gutter,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-content self-center gap-6">
          <ScreenHeader title={copy.profile.title} showBack={false} />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.profile.editProfile}
            onPress={() => router.push("/profile/edit")}
            className="active:opacity-80"
          >
            <Card variant="brand" className="flex-row items-center gap-3">
              <View className="relative">
                <Avatar
                  name={profile.fullName || "Bunda"}
                  source={
                    profile.avatarUri ? { uri: profile.avatarUri } : undefined
                  }
                  size="lg"
                  accessibilityLabel={copy.profile.photo}
                />
                <View className="absolute -bottom-1 -right-1 h-7 w-7 items-center justify-center rounded-full border-2 border-surface-brand bg-brand">
                  <Icon name="camera" tone="onBrand" size={UI.iconSm} />
                </View>
              </View>
              <View className="min-w-0 flex-1 gap-1">
                <Text className="text-subtitle font-bold text-ink">
                  {profile.fullName || copy.more.account}
                </Text>
                <Text className="text-label text-ink-muted">
                  {user?.email || copy.more.accountUnavailable}
                </Text>
                {profile.phone || profile.city ? (
                  <Text className="text-caption text-ink-muted">
                    {[profile.phone, profile.city].filter(Boolean).join(" · ")}
                  </Text>
                ) : (
                  <Text className="text-caption text-ink-muted">
                    {copy.profile.editCardHint}
                  </Text>
                )}
                {Config.useMockData && (
                  <Badge variant="muted" label={copy.profile.demo} />
                )}
              </View>
              <Icon name="chevronRight" tone="brand" />
            </Card>
          </Pressable>

          <View className="gap-3">
            <Text
              accessibilityRole="header"
              className="text-subtitle font-semibold text-ink"
            >
              {copy.profile.activeChild}
            </Text>
            {isLoading ? <LoadingState /> : error ? (
              <ErrorState description={copy.common.loadFailed} onAction={() => void refresh()} />
            ) : children.length === 0 ? (
              <EmptyState
                title={copy.profile.noChild}
                body={copy.profile.noChildBody}
                actionLabel={copy.profile.addChild}
                onAction={() => router.push("/children/new")}
              />
            ) : (
              <Card className="gap-2">
                {children.map((child) => {
                  const isActive = child.id === activeChild?.id;
                  return (
                    <Pressable
                      key={child.id}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: isActive }}
                      onPress={() => setActiveChild(child)}
                      className="min-h-12 flex-row items-center gap-3 py-2 active:opacity-80"
                    >
                      <Avatar name={child.name} size="sm" />
                      <View className="min-w-0 flex-1 gap-0.5">
                        <Text className="text-body font-semibold text-ink">
                          {child.name}
                        </Text>
                        <Text className="text-caption text-ink-muted">
                          {formatChildAge(child.birth_date)} •{" "}
                          {child.sex === "male"
                            ? copy.children.sexMale
                            : copy.children.sexFemale}
                        </Text>
                      </View>
                      {isActive && <Icon name="check" tone="brand" size={UI.iconMd} />}
                    </Pressable>
                  );
                })}
                <View className="flex-row flex-wrap gap-2 border-t border-subtle pt-2">
                  <Button
                    label={copy.profile.addChild}
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onPress={() => router.push("/children/new")}
                  />
                  <Button
                    label={copy.profile.manageChildren}
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                    onPress={() => router.push("/(tabs)/children")}
                  />
                </View>
              </Card>
            )}
          </View>

          <View className="gap-3">
            <Text
              accessibilityRole="header"
              className="text-subtitle font-semibold text-ink"
            >
              {copy.profile.latest}
            </Text>
            {latest.isLoading ? (
              <LoadingState />
            ) : latest.error ? (
              <ErrorState
                description={copy.common.loadFailed}
                onAction={() => void latest.reload()}
              />
            ) : screening ? (
              <Card variant={risk ? "risk" : "brand"} className="gap-2">
                <View className="flex-row items-center gap-3">
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-surface">
                    <Icon
                      name={risk ? "warning" : "check"}
                      tone={risk ? "risk" : "safe"}
                      size={UI.iconMd}
                    />
                  </View>
                  <View className="min-w-0 flex-1">
                    <Text
                      className={`text-label font-semibold ${risk ? "text-risk" : "text-brand"}`}
                    >
                      {risk
                        ? copy.dashboard.riskStatus
                        : copy.dashboard.normalStatus}
                    </Text>
                    <Text className="text-caption text-ink-muted">
                      {formatDate(screening.created_at, true)}
                    </Text>
                  </View>
                </View>
                <Button
                  label={copy.dashboard.viewDetail}
                  variant="ghost"
                  size="sm"
                  onPress={() =>
                    router.push({
                      pathname: "/history/[id]",
                      params: { id: screening.id },
                    })
                  }
                />
              </Card>
            ) : (
              <EmptyState
                title={copy.profile.noScreening}
                body={copy.profile.noScreeningBody}
              />
            )}
          </View>

          <View>
            <Text
              accessibilityRole="header"
              className="mb-2 text-subtitle font-semibold text-ink"
            >
              {copy.profile.services}
            </Text>
            {services.map((item) => (
              <ListRow
                key={item.href}
                title={item.title}
                subtitle={item.subtitle}
                leading={<Icon name={item.icon} tone="brand" />}
                onPress={() => router.push(item.href)}
              />
            ))}
          </View>

          <View>
            <Text
              accessibilityRole="header"
              className="mb-2 text-subtitle font-semibold text-ink"
            >
              {copy.profile.about}
            </Text>
            <ListRow
              title={copy.more.aboutTitle}
              subtitle={copy.more.aboutBody}
              leading={<Icon name="article" tone="brand" />}
              onPress={() => router.push("/(tabs)/more")}
            />
          </View>

          <Button
            label={copy.auth.signOut}
            variant="secondary"
            onPress={handleSignOut}
          />
          <Text className="text-center text-caption text-ink-muted">
            {copy.more.appVersion("1.0.0")}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
