import { Surface, cn } from 'heroui-native';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  FadeOut,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useMountProgress } from '../../helpers/hooks/use-mount-progress';
import { ENTER_OFFSET, SPRING, STAGGER_MS, TIMING } from '../../helpers/travel/motion';
import type { Stage } from '../../helpers/travel/types';
import { AppText } from '../app-text';
import { Icon } from './display-text';

const AnimatedView = Animated.createAnimatedComponent(View);

const LABEL_OPACITY: Record<Stage['status'], number> = {
  pending: 0.4,
  active: 1,
  done: 0.6,
  failed: 1,
};

const ROW_HEIGHT = 34;

type StageRowProps = {
  stage: Stage;
  index: number;
  isLast: boolean;
};

const StageRow = ({ stage, index, isLast }: StageRowProps) => {
  const enter = useMountProgress(index * STAGGER_MS);
  const reducedMotion = useReducedMotion();
  const pulse = useSharedValue(0);

  const isActive = stage.status === 'active';
  const isDone = stage.status === 'done';
  const isFailed = stage.status === 'failed';

  useEffect(() => {
    if (isActive && !reducedMotion) {
      pulse.value = withRepeat(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        -1,
        true
      );
    } else {
      pulse.value = withTiming(0, TIMING.fade);
    }
  }, [isActive, reducedMotion, pulse]);

  const rRowStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ translateY: interpolate(enter.value, [0, 1], [8, 0]) }],
  }));

  const rLabelStyle = useAnimatedStyle(() => ({
    opacity: withTiming(LABEL_OPACITY[stage.status], TIMING.fade),
  }));

  // The halo breathes outward from the dot rather than blinking it on and off —
  // an expanding ring reads as "still working", a blink reads as an error.
  const rHaloStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.32, 0]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 2.1]) }],
  }));

  // The fill and the glyph share one target, so the check lands on the same
  // frame the dot finishes growing rather than a beat behind it.
  const rDotStyle = useAnimatedStyle(() => {
    const filled = isDone || isFailed;
    return {
      opacity: withTiming(filled ? 1 : 0, TIMING.fade),
      transform: [{ scale: withSpring(filled ? 1 : 0.55, SPRING.momentum) }],
    };
  });

  const rGlyphStyle = useAnimatedStyle(() => {
    const filled = isDone || isFailed;
    return {
      opacity: withTiming(filled ? 1 : 0, TIMING.fade),
      transform: [{ scale: withSpring(filled ? 1 : 0.4, SPRING.momentum) }],
    };
  });

  const rCoreStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isActive ? 1 : 0, TIMING.fade),
    transform: [{ scale: withSpring(isActive ? 1 : 0.3, SPRING.momentum) }],
  }));

  const rRailStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: withSpring(isDone ? 1 : 0, SPRING.ui) }],
  }));

  return (
    <AnimatedView
      style={rRowStyle}
      className="flex-row items-center"
      // Screen readers get the state as words; the dot alone says nothing.
      accessibilityRole="text"
      accessibilityLabel={`${stage.label}: ${stage.status}`}
    >
      <View className="w-4 items-center" style={{ height: ROW_HEIGHT }}>
        <View className="flex-1 items-center justify-center">
          {isActive && (
            <AnimatedView
              style={rHaloStyle}
              className="absolute size-4 rounded-full bg-accent"
            />
          )}
          <View
            className={cn(
              'size-4 rounded-full items-center justify-center border',
              isFailed
                ? 'border-danger'
                : isDone || isActive
                  ? 'border-accent'
                  : 'border-border'
            )}
          >
            <AnimatedView
              style={rDotStyle}
              className={cn(
                'absolute inset-0 rounded-full',
                isFailed ? 'bg-danger' : 'bg-accent'
              )}
            />
            <AnimatedView
              style={rCoreStyle}
              className="absolute size-1.5 rounded-full bg-accent"
            />
            <AnimatedView style={rGlyphStyle}>
              <Icon
                name={isFailed ? 'x' : 'check'}
                size={10}
                className={
                  isFailed ? 'text-danger-foreground' : 'text-accent-foreground'
                }
              />
            </AnimatedView>
          </View>
        </View>

        {!isLast && (
          <View className="absolute left-[7.5px] top-[26px] h-2 w-px bg-border">
            <AnimatedView
              style={[rRailStyle, { transformOrigin: 'top' }]}
              className="absolute inset-0 bg-accent"
            />
          </View>
        )}
      </View>

      <AnimatedView style={rLabelStyle} className="ml-3 flex-1">
        <AppText
          className={cn(
            'text-[15px] font-medium',
            isFailed ? 'text-danger' : 'text-foreground'
          )}
          maxFontSizeMultiplier={1.3}
        >
          {stage.label}
        </AppText>
      </AnimatedView>
    </AnimatedView>
  );
};

export const StageProgress = ({ stages }: { stages: Stage[] }) => {
  const enter = useMountProgress();

  // Blur radius and scale move together so the card reads as a surface
  // arriving, not a rectangle fading up. Scale stays shallow — 0.94 is enough
  // to register as depth without looking like a zoom.
  const rStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [
      { translateY: interpolate(enter.value, [0, 1], [ENTER_OFFSET, 0]) },
      { scale: interpolate(enter.value, [0, 1], [0.94, 1]) },
    ],
  }));

  return (
    <AnimatedView
      style={[rStyle, { transformOrigin: 'bottom left' }]}
      // The card leaves along the way it arrived — it hands off to the plan
      // that replaces it, so a hard unmount would read as a glitch.
      exiting={FadeOut.duration(180)}
      className="self-start max-w-[86%]"
    >
      <Surface
        variant="secondary"
        className="rounded-3xl rounded-bl-lg px-4 py-3 border border-border shadow-none"
      >
        <View>
          {stages.map((stage, index) => (
            <StageRow
              key={stage.id}
              stage={stage}
              index={index}
              isLast={index === stages.length - 1}
            />
          ))}
        </View>
      </Surface>
    </AnimatedView>
  );
};
