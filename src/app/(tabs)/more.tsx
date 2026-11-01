import { router, type Href } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon, type IconName } from "@/components/ui/icon";
import { ScreenHeader } from "@/components/ui/screen-header";
import { copy } from "@/constants/copy";
import { useSession } from "@/hooks/use-session";

const items = [
  {
    icon: "doctor",
    title: copy.care.doctors,
    body: copy.more.doctorBody,
    href: "/doctors",
  },
  {
    icon: "hospital",
    title: copy.care.hospitals,
    body: copy.more.hospitalBody,
    href: "/hospitals",
  },
  {
    icon: "chat",
    title: copy.chats.title,
    body: copy.more.chatBody,
    href: "/chats",
  },
  {
    icon: "article",
    title: copy.articles.title,
    body: copy.more.articleBody,
    href: "/articles",
  },
  {
    icon: "history",
    title: copy.history.title,
    body: copy.more.historyBody,
    href: "/history",
  },
  {
    icon: "mic",
    title: copy.nav.monitoring,
    body: copy.more.monitoringBody,
    href: "/(tabs)/monitoring",
  },
] as const satisfies readonly {
  icon: IconName;
  title: string;
  body: string;
  href: Href;
}[];

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useSession();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const handleSignOut = () =>
    Alert.alert(copy.auth.signOut, copy.auth.signOutConfirm, [
      { text: copy.common.cancel, style: "cancel" },
      {
        text: copy.auth.signOut,
        style: "destructive",
        onPress: async () => {
          setBusy(true);
          setFailed(false);
          try {
            await signOut();
            router.replace("/(auth)/sign-in");
          } catch {
            setFailed(true);
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  const name = user?.user_metadata?.full_name;
  return (
    <ScrollView
      className="flex-1 bg-surface"
      contentContainerStyle={{
        paddingTop: insets.top,
        paddingHorizontal: 20,
        paddingBottom: 24,
        gap: 20,
      }}
    >
      <ScreenHeader title={copy.nav.more} />
      <Card variant="brand" className="flex-row items-center gap-3">
        <Avatar name={name} />
        <View className="min-w-0 flex-1 gap-1">
          <Text className="text-subtitle font-semibold text-ink">
            {name || copy.more.account}
          </Text>
          <Text className="text-label text-ink-muted">
            {user?.email || copy.more.accountUnavailable}
          </Text>
        </View>
      </Card>
      <View>
        <Text
          accessibilityRole="header"
          className="text-subtitle font-semibold text-ink"
        >
          {copy.more.services}
        </Text>
        {items.map((item) => (
          <Pressable
            key={item.href}
            accessibilityRole="button"
            onPress={() => router.push(item.href)}
            className="min-h-12 flex-row items-center gap-3 border-b border-border/40 py-4 active:opacity-70"
          >
            <Icon name={item.icon} tone="brand" />
            <View className="min-w-0 flex-1 gap-1">
              <Text className="text-body font-semibold text-ink">
                {item.title}
              </Text>
              <Text className="text-caption text-ink-muted">{item.body}</Text>
            </View>
            <Icon name="chevronRight" tone="muted" />
          </Pressable>
        ))}
      </View>
      <View className="gap-2">
        <Text
          accessibilityRole="header"
          className="text-subtitle font-semibold text-ink"
        >
          {copy.more.aboutTitle}
        </Text>
        <Text className="text-body text-ink-muted">{copy.more.aboutBody}</Text>
      </View>
      {failed && (
        <Text accessibilityRole="alert" className="text-body text-risk">
          {copy.common.loadFailed}
        </Text>
      )}
      <Button
        label={copy.auth.signOut}
        variant="secondary"
        loading={busy}
        onPress={handleSignOut}
      />
    </ScrollView>
  );
}
