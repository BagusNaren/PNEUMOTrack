// src/app/(tabs)/children.tsx
// Children profile list and active child switcher.

import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ScreenHeader } from "@/components/ui/screen-header";
import { copy } from "@/constants/copy";
import { useActiveChild } from "@/hooks/use-active-child";
import { childrenService } from "@/services/children";
import type { Child } from "@/types/domain";

export default function ChildrenScreen() {
  const insets = useSafeAreaInsets();
  const { activeChild, children, setActiveChild, refresh, isLoading, error } =
    useActiveChild();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  const handleDelete = (child: Child) => {
    Alert.alert(
      copy.children.deleteTitle,
      copy.children.deleteBody(child.name),
      [
        { text: copy.common.cancel, style: "cancel" },
        {
          text: copy.common.delete,
          style: "destructive",
          onPress: async () => {
            try {
              await childrenService.remove(child.id);
              await refresh();
            } catch (err: unknown) {
              const msg =
                err instanceof Error ? err.message : copy.children.deleteFailed;
              Alert.alert(copy.common.errorTitle, msg);
            }
          },
        },
      ],
    );
  };

  const getAgeString = (birthDateStr: string) => {
    const birth = new Date(birthDateStr);
    const now = new Date();
    const diffMonths =
      (now.getFullYear() - birth.getFullYear()) * 12 +
      (now.getMonth() - birth.getMonth());
    const years = Math.floor(diffMonths / 12);
    const months = diffMonths % 12;
    if (years > 0 && months > 0)
      return copy.children.ageYearsMonths(years, months);
    if (years > 0) return copy.children.ageYears(years);
    return copy.children.ageMonths(months);
  };

  return (
    <View className="flex-1 bg-surface dark:bg-surface-dark">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: insets.top,
          paddingBottom: 24,
          paddingHorizontal: 20,
        }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title={copy.children.listTitle} showBack={false} />

        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState
            description={copy.common.loadFailed}
            onAction={() => void refresh()}
          />
        ) : children.length === 0 ? (
          <EmptyState
            title={copy.children.emptyTitle}
            body={copy.children.emptyBody}
            className="mt-12"
          />
        ) : (
          <View className="gap-3 mt-2">
            {children.map((child) => {
              const isActive = activeChild?.id === child.id;

              return (
                <Card
                  key={child.id}
                  variant={isActive ? "brand" : "default"}
                  className="gap-3"
                >
                  <View className="flex-row items-center gap-3">
                    <Avatar
                      name={child.name}
                      accessibilityLabel={copy.children.avatarLabel(child.name)}
                    />

                    <View className="flex-1">
                      <View className="flex-row flex-wrap items-center gap-2">
                        <Text className="text-subtitle font-bold text-ink dark:text-ink-dark">
                          {child.name}
                        </Text>
                        {isActive && (
                          <Badge
                            label={copy.children.activeLabel}
                            variant="brand"
                          />
                        )}
                      </View>

                      <Text className="text-caption text-ink-muted">
                        {getAgeString(child.birth_date)} •{" "}
                        {child.sex === "male"
                          ? copy.children.sexMale
                          : copy.children.sexFemale}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/40">
                    {!isActive && (
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => setActiveChild(child)}
                        className="min-h-12 justify-center py-3 active:opacity-90"
                      >
                        <Text className="text-label font-semibold text-brand">
                          {copy.children.setActive}
                        </Text>
                      </Pressable>
                    )}

                    <Pressable
                      accessibilityRole="button"
                      onPress={() => handleDelete(child)}
                      className="min-h-12 min-w-12 justify-center px-3 py-3 active:opacity-90"
                    >
                      <Text className="text-label font-semibold text-risk">
                        {copy.common.delete}
                      </Text>
                    </Pressable>
                  </View>
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View className="px-5 pb-4">
        <Button
          label={copy.children.addButton}
          size="md"
          variant="secondary"
          onPress={() => router.push("/children/new")}
        />
      </View>
    </View>
  );
}
