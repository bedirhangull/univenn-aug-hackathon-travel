import { Surface, cn } from 'heroui-native';
import { View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useMountProgress } from '../../helpers/hooks/use-mount-progress';
import { SERPAPI_KEY, activeProvider } from '../../helpers/travel/config';
import { STAGGER_MS } from '../../helpers/travel/motion';
import { AppText } from '../app-text';
import { DisplayText, Icon } from './display-text';

const AnimatedView = Animated.createAnimatedComponent(View);

const STEPS = [
  {
    icon: 'link-2' as const,
    title: 'Paste a link',
    body: 'Watch, youtu.be, and shorts URLs all work.',
  },
  {
    icon: 'align-left' as const,
    title: 'I read the transcript',
    body: 'Captions and chapters come back through SerpAPI.',
  },
  {
    icon: 'map' as const,
    title: 'You get a route',
    body: 'Days, stops, and the timestamp each one came from.',
  },
];

const PROVIDER_NOTE: Record<typeof activeProvider, string> = {
  gemini: 'Itineraries are written by Gemini 2.5 Flash.',
  anthropic: 'Itineraries are written by Claude Opus 5.',
  none: 'No AI key set, so you will get a transcript outline rather than a planned route. Add EXPO_PUBLIC_GEMINI_API_KEY to .env.local.',
};

const Row = ({
  index,
  icon,
  title,
  body,
}: {
  index: number;
  icon: (typeof STEPS)[number]['icon'];
  title: string;
  body: string;
}) => {
  const enter = useMountProgress(220 + index * STAGGER_MS * 2);

  const rStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ translateY: interpolate(enter.value, [0, 1], [12, 0]) }],
  }));

  return (
    <AnimatedView style={rStyle} className="flex-row items-start gap-3.5">
      <View className="mt-0.5 size-7 items-center justify-center rounded-xl bg-surface-secondary">
        <Icon name={icon} size={14} className="text-foreground/70" />
      </View>
      <View className="flex-1">
        <AppText
          className="text-[15px] font-medium text-foreground"
          maxFontSizeMultiplier={1.3}
        >
          {title}
        </AppText>
        <AppText
          className="mt-0.5 text-[13.5px] leading-[19px] text-muted"
          maxFontSizeMultiplier={1.4}
        >
          {body}
        </AppText>
      </View>
    </AnimatedView>
  );
};

export const EmptyState = () => {
  const enter = useMountProgress();
  const hasSerpApiKey = Boolean(SERPAPI_KEY);

  const rHeaderStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [
      { translateY: interpolate(enter.value, [0, 1], [16, 0]) },
      { scale: interpolate(enter.value, [0, 1], [0.96, 1]) },
    ],
  }));

  return (
    <View className="gap-7 pt-4">
      <AnimatedView
        style={[rHeaderStyle, { transformOrigin: 'top left' }]}
        className="gap-3"
      >
        <View className="size-14 items-center justify-center rounded-[20px] bg-accent-soft">
          <Icon name="map" size={24} className="text-accent-soft-foreground" />
        </View>
        <DisplayText size="xl" className="mt-1">
          A travel video,{'\n'}turned into a route
        </DisplayText>
        <AppText
          className="text-[15px] leading-[22px] text-muted"
          maxFontSizeMultiplier={1.4}
        >
          Send a vlog and I will read what the creator actually visited, then lay
          it out as a day-by-day plan you can follow.
        </AppText>
      </AnimatedView>

      <View className="gap-5">
        {STEPS.map((step, index) => (
          <Row key={step.title} index={index} {...step} />
        ))}
      </View>

      <View className="gap-2.5">
        {!hasSerpApiKey && (
          <Surface
            variant="transparent"
            className="flex-row gap-2.5 rounded-2xl border border-danger/30 bg-danger-soft px-3.5 py-3 shadow-none"
          >
            <Icon name="alert-triangle" size={14} className="mt-0.5 text-danger" />
            <AppText
              className="flex-1 text-[13px] leading-[19px] text-danger-soft-foreground"
              maxFontSizeMultiplier={1.4}
            >
              No SerpAPI key found. Add EXPO_PUBLIC_SERPAPI_KEY to .env.local and
              restart the dev server, or transcripts will fail.
            </AppText>
          </Surface>
        )}

        <View className="flex-row gap-2.5">
          <Icon
            name={activeProvider === 'none' ? 'alert-circle' : 'zap'}
            size={13}
            className={cn(
              'mt-0.5',
              activeProvider === 'none' ? 'text-warning' : 'text-muted'
            )}
          />
          <AppText
            className="flex-1 text-[12.5px] leading-[18px] text-muted"
            maxFontSizeMultiplier={1.3}
          >
            {PROVIDER_NOTE[activeProvider]}
          </AppText>
        </View>
      </View>
    </View>
  );
};
