import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Button, Chip, Separator, Surface, cn } from 'heroui-native';
import { useCallback, useEffect, useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useMountProgress } from '../../helpers/hooks/use-mount-progress';
import { ENTER_OFFSET, SPRING, STAGGER_MS } from '../../helpers/travel/motion';
import type { PlaceKind, PlanDay, PlanPlace, TravelPlan } from '../../helpers/travel/types';
import { CROWD_COLOR, CROWD_LABEL } from '../../helpers/travel/crowd';
import { timestampToSeconds, watchUrlAt } from '../../helpers/travel/youtube';
import { AppText } from '../app-text';
import { DisplayText, Icon } from './display-text';

const AnimatedView = Animated.createAnimatedComponent(View);

const KIND_ICON: Record<PlaceKind, React.ComponentProps<typeof Icon>['name']> = {
  sight: 'camera',
  food: 'coffee',
  stay: 'home',
  activity: 'compass',
  transit: 'navigation',
};

// -- Place --------------------------------------------------------------------

type PlaceRowProps = {
  place: PlanPlace;
  videoId: string;
};

const PlaceRow = ({ place, videoId }: PlaceRowProps) => {
  const seconds = place.sourceTimestamp
    ? timestampToSeconds(place.sourceTimestamp)
    : null;

  const openAtTimestamp = useCallback(() => {
    if (seconds === null) return;
    Haptics.selectionAsync().catch(() => {});
    Linking.openURL(watchUrlAt(videoId, seconds)).catch(() => {});
  }, [seconds, videoId]);

  return (
    <View className="flex-row gap-3">
      <View className="mt-0.5 size-6 items-center justify-center rounded-lg bg-surface-tertiary">
        <Icon name={KIND_ICON[place.kind]} size={12} className="text-muted" />
      </View>

      <View className="flex-1">
        <View className="flex-row items-start justify-between gap-2">
          <View className="flex-1 flex-row flex-wrap items-baseline gap-x-2">
            <AppText
              className="text-[15px] font-medium text-foreground"
              maxFontSizeMultiplier={1.3}
            >
              {place.name}
            </AppText>
            {place.timeHint && (
              <AppText
                className="text-[12px] text-muted"
                maxFontSizeMultiplier={1.2}
              >
                {place.timeHint}
              </AppText>
            )}
          </View>

          {/* How busy the stop is, on every stop. It is the whole reason the
              plan looks the way it does, so it is not an optional detail. */}
          <View className="mt-0.5 flex-row items-center gap-1">
            <View
              className="size-2 rounded-full"
              style={{ backgroundColor: CROWD_COLOR[place.crowdLevel] }}
            />
            <AppText
              className="text-[11px] font-medium text-muted"
              maxFontSizeMultiplier={1.2}
            >
              {CROWD_LABEL[place.crowdLevel]}
            </AppText>
          </View>
        </View>

        {place.note && (
          <AppText
            className="mt-1 text-[13px] leading-[19px] text-foreground/70"
            maxFontSizeMultiplier={1.4}
          >
            {place.note}
          </AppText>
        )}

        {place.alternativeTo && (
          <View className="mt-1.5 flex-row items-center gap-1.5">
            <Icon name="repeat" size={10} className="text-accent" />
            <AppText
              className="flex-1 text-[11.5px] text-accent"
              maxFontSizeMultiplier={1.2}
            >
              {`Instead of ${place.alternativeTo}`}
            </AppText>
          </View>
        )}

        {place.sourceTimestamp && (
          <Pressable
            onPress={openAtTimestamp}
            disabled={seconds === null}
            hitSlop={8}
            className="mt-1.5 flex-row items-center gap-1.5 self-start rounded-full bg-accent-soft px-2 py-0.5"
            accessibilityRole="link"
            accessibilityLabel={`Open the video at ${place.sourceTimestamp}`}
          >
            <Icon
              name="play"
              size={9}
              className="text-accent-soft-foreground"
            />
            <AppText
              className="text-[11.5px] font-medium text-accent-soft-foreground"
              maxFontSizeMultiplier={1.2}
            >
              {place.sourceTimestamp}
            </AppText>
          </Pressable>
        )}
      </View>
    </View>
  );
};

// -- Day ----------------------------------------------------------------------

type DayRowProps = {
  day: PlanDay;
  index: number;
  videoId: string;
  isExpanded: boolean;
  onToggle: (day: number) => void;
};

const DayRow = ({ day, index, videoId, isExpanded, onToggle }: DayRowProps) => {
  const enter = useMountProgress(160 + index * STAGGER_MS);
  const [contentHeight, setContentHeight] = useState(0);

  // One progress value drives the height, the content's opacity and the
  // chevron. Three separate animations would drift; sharing the spring means
  // the chevron is always exactly as far along as the drawer.
  const progress = useSharedValue(0);
  const pressed = useSharedValue(0);

  useEffect(() => {
    if (contentHeight === 0) return;
    progress.value = withSpring(isExpanded ? 1 : 0, SPRING.sheet);
  }, [isExpanded, contentHeight, progress]);

  const rRowStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ translateY: interpolate(enter.value, [0, 1], [10, 0]) }],
  }));

  // Press feedback is a background tint rather than a scale: a full-width row
  // that scales looks like it detached from the card.
  const rPressStyle = useAnimatedStyle(() => ({
    opacity: withSpring(pressed.value, SPRING.press),
  }));

  const rContentStyle = useAnimatedStyle(() => ({
    height: contentHeight * progress.value,
    opacity: interpolate(progress.value, [0, 0.35, 1], [0, 0.25, 1]),
  }));

  const rChevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(progress.value, [0, 1], [0, 90])}deg` }],
  }));

  const handlePress = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    onToggle(day.day);
  }, [day.day, onToggle]);

  return (
    <AnimatedView style={rRowStyle}>
      <Pressable
        onPress={handlePress}
        onPressIn={() => {
          pressed.value = 1;
        }}
        onPressOut={() => {
          pressed.value = 0;
        }}
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded }}
        accessibilityLabel={`Day ${day.day}, ${day.title}`}
      >
        <AnimatedView
          style={rPressStyle}
          className="absolute inset-0 bg-surface-secondary"
        />

        <View className="flex-row items-start gap-3 px-5 py-3.5">
          <DisplayText size="md" weight="bold" className="w-7 text-accent">
            {String(day.day).padStart(2, '0')}
          </DisplayText>

          <View className="flex-1">
            <AppText
              className="text-[15px] font-medium text-foreground"
              maxFontSizeMultiplier={1.3}
            >
              {day.title}
            </AppText>
            {day.summary ? (
              <AppText
                numberOfLines={isExpanded ? 3 : 1}
                className="mt-0.5 text-[13px] leading-[18px] text-muted"
                maxFontSizeMultiplier={1.3}
              >
                {day.summary}
              </AppText>
            ) : null}
          </View>

          <AnimatedView style={rChevronStyle} className="mt-1">
            <Icon name="chevron-right" size={16} className="text-muted" />
          </AnimatedView>
        </View>
      </Pressable>

      <AnimatedView style={rContentStyle} className="overflow-hidden">
        <View
          onLayout={(event) => {
            const next = event.nativeEvent.layout.height;
            setContentHeight((current) =>
              Math.abs(current - next) > 0.5 ? next : current
            );
          }}
          // Collapsed content stays mounted for the height measurement, so it
          // has to be taken out of the accessibility tree explicitly.
          accessibilityElementsHidden={!isExpanded}
          importantForAccessibility={
            isExpanded ? 'auto' : 'no-hide-descendants'
          }
          pointerEvents={isExpanded ? 'auto' : 'none'}
          className="gap-3.5 pb-4 pl-[52px] pr-5"
        >
          {day.places.map((place, placeIndex) => (
            <PlaceRow
              key={`${place.name}-${placeIndex}`}
              place={place}
              videoId={videoId}
            />
          ))}
        </View>
      </AnimatedView>
    </AnimatedView>
  );
};

// -- Card ---------------------------------------------------------------------

type ItineraryCardProps = {
  plan: TravelPlan;
  onReset: () => void;
};

export const ItineraryCard = ({ plan, onReset }: ItineraryCardProps) => {
  const enter = useMountProgress();
  const router = useRouter();
  const [expandedDays, setExpandedDays] = useState<number[]>([1]);

  const toggleDay = useCallback((day: number) => {
    setExpandedDays((current) =>
      current.includes(day)
        ? current.filter((entry) => entry !== day)
        : [...current, day]
    );
  }, []);

  const rStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [
      { translateY: interpolate(enter.value, [0, 1], [ENTER_OFFSET + 6, 0]) },
      { scale: interpolate(enter.value, [0, 1], [0.96, 1]) },
    ],
  }));

  const isOutline = plan.generatedBy === 'outline';
  const meta = [plan.bestSeason, plan.budgetLabel].filter(Boolean).join('  ·  ');

  const openVideo = useCallback(() => {
    Linking.openURL(plan.source.url).catch(() => {});
  }, [plan.source.url]);

  const openMap = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    router.push('/travel/map');
  }, [router]);

  return (
    <AnimatedView
      style={[rStyle, { transformOrigin: 'bottom center' }]}
      className="w-full"
    >
      <Surface className="overflow-hidden rounded-[28px] border border-border p-0 shadow-none">
        {/* Header */}
        <View className="px-5 pb-4 pt-5">
          <View className="mb-3.5 flex-row items-center justify-between">
            <View className="size-8 items-center justify-center rounded-full bg-accent-soft">
              <Icon name="map" size={15} className="text-accent-soft-foreground" />
            </View>

            <View className="flex-row items-center gap-2">
              <Chip size="sm" variant="secondary">
                <Chip.Label>{plan.durationLabel}</Chip.Label>
              </Chip>
              <Chip
                size="sm"
                variant="secondary"
                className={cn(
                  isOutline ? 'bg-warning-soft' : 'bg-accent-soft',
                  'border-0'
                )}
              >
                <Chip.Label
                  className={cn(
                    isOutline
                      ? 'text-warning-soft-foreground'
                      : 'text-accent-soft-foreground'
                  )}
                >
                  {isOutline ? 'Outline' : 'AI plan'}
                </Chip.Label>
              </Chip>
            </View>
          </View>

          <DisplayText size="xl">{plan.destination}</DisplayText>

          <AppText
            className="mt-2 text-[15px] leading-[21px] text-muted"
            maxFontSizeMultiplier={1.4}
          >
            {plan.tagline}
          </AppText>

          {meta ? (
            <AppText
              className="mt-2.5 text-[12.5px] text-foreground/55"
              maxFontSizeMultiplier={1.2}
            >
              {meta}
            </AppText>
          ) : null}

          {/* The promise of the whole app, stated up front rather than left for
              the reader to infer from the crowd dots further down. */}
          {plan.crowdSummary ? (
            <View className="mt-3.5 flex-row gap-2.5 rounded-2xl bg-accent-soft px-3.5 py-3">
              <Icon
                name="users"
                size={13}
                className="mt-0.5 text-accent-soft-foreground"
              />
              <AppText
                className="flex-1 text-[12.5px] leading-[18px] text-accent-soft-foreground"
                maxFontSizeMultiplier={1.4}
              >
                {plan.crowdSummary}
              </AppText>
            </View>
          ) : null}
        </View>

        <Separator />

        {/* Days */}
        <View className="py-1">
          {plan.days.map((day, index) => (
            <DayRow
              key={day.day}
              day={day}
              index={index}
              videoId={plan.source.videoId}
              isExpanded={expandedDays.includes(day.day)}
              onToggle={toggleDay}
            />
          ))}
        </View>

        {/* What the plan gave up, and what it swapped in. Showing the trade
            openly is the difference between a recommendation and a nudge the
            traveller cannot check. */}
        {plan.avoided.length > 0 && (
          <>
            <Separator />
            <View className="gap-3.5 px-5 py-4">
              <DisplayText size="sm" className="text-muted uppercase">
                Routed around
              </DisplayText>

              {plan.avoided.map((spot, index) => (
                <View key={`${spot.name}-${index}`} className="gap-1">
                  <View className="flex-row items-center gap-2">
                    <Icon name="slash" size={11} className="text-danger" />
                    <AppText
                      className="flex-1 text-[14px] font-medium text-foreground/60 line-through"
                      maxFontSizeMultiplier={1.3}
                    >
                      {spot.name}
                    </AppText>
                  </View>

                  {spot.reason ? (
                    <AppText
                      className="pl-[19px] text-[12.5px] leading-[18px] text-muted"
                      maxFontSizeMultiplier={1.4}
                    >
                      {spot.reason}
                    </AppText>
                  ) : null}

                  <View className="flex-row items-center gap-1.5 pl-[19px]">
                    <Icon name="arrow-right" size={11} className="text-accent" />
                    <AppText
                      className="flex-1 text-[12.5px] font-medium text-accent"
                      maxFontSizeMultiplier={1.3}
                    >
                      {spot.insteadGo}
                    </AppText>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {plan.tips.length > 0 && (
          <>
            <Separator />
            <View className="gap-2 px-5 py-4">
              <DisplayText size="sm" className="mb-0.5 text-muted uppercase">
                Good to know
              </DisplayText>
              {plan.tips.map((tip, index) => (
                <View key={index} className="flex-row gap-2.5">
                  <View className="mt-[7px] size-1 rounded-full bg-accent" />
                  <AppText
                    className="flex-1 text-[13px] leading-[19px] text-foreground/75"
                    maxFontSizeMultiplier={1.4}
                  >
                    {tip}
                  </AppText>
                </View>
              ))}
            </View>
          </>
        )}

        <Separator />

        {/* Provenance — the plan is only as good as what we read. The line
            itself opens the video, which keeps the source one tap away without
            spending a button on it. */}
        <View className="px-5 py-4">
          <Pressable
            onPress={openVideo}
            hitSlop={8}
            className="mb-3 flex-row items-center gap-1.5 self-start"
            accessibilityRole="link"
            accessibilityLabel="Open the source video on YouTube"
          >
            <Icon name="youtube" size={12} className="text-foreground/50" />
            <AppText
              className="text-[12px] text-foreground/50"
              maxFontSizeMultiplier={1.2}
            >
              {`Read ${plan.source.cueCount} transcript lines${
                plan.source.chapterCount
                  ? ` and ${plan.source.chapterCount} chapters`
                  : ''
              }`}
            </AppText>
          </Pressable>

          <View className="flex-row gap-2.5">
            <Button size="sm" onPress={openMap} className="flex-1">
              {/* Each variant tints its own label, so the icon has to match it
                  or the button reads as two colours. */}
              <Icon name="map" size={13} className="text-accent-foreground" />
              <Button.Label>View my plan</Button.Label>
            </Button>
            <Button size="sm" variant="ghost" onPress={onReset}>
              <Icon name="rotate-ccw" size={13} className="text-foreground" />
              <Button.Label>New link</Button.Label>
            </Button>
          </View>
        </View>
      </Surface>
    </AnimatedView>
  );
};
