import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Button, Surface, cn } from 'heroui-native';
import { useMemo } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../../components/app-text';
import { DisplayText, Icon } from '../../../components/travel/display-text';
import { PlanMap, mapPointsFor } from '../../../components/travel/plan-map';
import { useAppTheme } from '../../../contexts/app-theme-context';
import { useTravelSession } from '../../../contexts/travel-session-context';
import useHeaderHeight from '../../../helpers/hooks/use-header-height';
import {
  CROWD_COLOR,
  CROWD_LABEL,
  CROWD_ORDER,
} from '../../../helpers/travel/crowd';

export default function PlanMapScreen() {
  const { activePlan } = useTravelSession();
  const { isDark } = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  const points = useMemo(
    () => (activePlan ? mapPointsFor(activePlan) : []),
    [activePlan]
  );

  const unmappedCount = useMemo(() => {
    if (!activePlan) return 0;
    const total = activePlan.days.reduce(
      (sum, day) => sum + day.places.length,
      0
    );
    return total - points.length;
  }, [activePlan, points.length]);

  if (!activePlan) {
    return (
      <View
        className="flex-1 items-center justify-center gap-4 bg-background px-8"
        style={{ paddingTop: headerHeight }}
      >
        <Icon name="map" size={28} className="text-muted" />
        <AppText className="text-center text-[15px] leading-[21px] text-muted">
          No plan yet. Send a travel video and the stops will show up here.
        </AppText>
        <Button size="sm" variant="secondary" onPress={() => router.back()}>
          <Button.Label>Back to the planner</Button.Label>
        </Button>
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <View style={{ paddingTop: headerHeight }} />

      <View className="gap-1.5 px-5 pb-3.5">
        <DisplayText size="lg">{activePlan.destination}</DisplayText>
        {activePlan.crowdSummary ? (
          <AppText
            className="text-[13.5px] leading-[19px] text-muted"
            maxFontSizeMultiplier={1.4}
          >
            {activePlan.crowdSummary}
          </AppText>
        ) : null}
      </View>

      <View className="flex-1">
        <PlanMap points={points} isDark={isDark} />

        {/* Legend floats over the map so the map keeps the full width. The pin
            colour is the only thing that encodes crowding, so it has to be
            spelled out somewhere. */}
        <Surface
          className={cn(
            'absolute left-4 flex-row gap-3 rounded-2xl border border-border px-3 py-2 shadow-none',
            isDark ? 'bg-background/85' : 'bg-background/90'
          )}
          style={{ bottom: insets.bottom + 14 }}
        >
          {CROWD_ORDER.map((level) => (
            <View key={level} className="flex-row items-center gap-1.5">
              <View
                className="size-2.5 rounded-full"
                style={{ backgroundColor: CROWD_COLOR[level] }}
              />
              <AppText
                className="text-[11.5px] font-medium text-foreground"
                maxFontSizeMultiplier={1.2}
              >
                {CROWD_LABEL[level]}
              </AppText>
            </View>
          ))}
        </Surface>

        {unmappedCount > 0 ? (
          <Surface
            className={cn(
              'absolute right-4 top-3 flex-row items-center gap-1.5 rounded-2xl border border-border px-2.5 py-1.5 shadow-none',
              isDark ? 'bg-background/85' : 'bg-background/90'
            )}
          >
            <Icon name="alert-circle" size={11} className="text-warning" />
            <AppText
              className="text-[11px] font-medium text-foreground"
              maxFontSizeMultiplier={1.2}
            >
              {`${unmappedCount} stop${unmappedCount === 1 ? '' : 's'} unmapped`}
            </AppText>
          </Surface>
        ) : null}
      </View>

      <StatusBar style={isDark ? 'light' : 'dark'} />
    </View>
  );
}
