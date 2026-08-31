import { Surface, cn } from 'heroui-native';
import { View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useTravelSession } from '../../contexts/travel-session-context';
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
    icon: 'users' as const,
    title: 'I find the crowd points',
    body: 'The handful of spots the video sends everyone to.',
  },
  {
    icon: 'map' as const,
    title: 'You get a quieter route',
    body: 'Substitutions nearby, on a map, with the trade shown.',
  },
];

const PROVIDER_NOTE: Record<typeof activeProvider, string> = {
  gemini: 'Routes are written by Gemini 2.5 Flash.',
  anthropic: 'Routes are written by Claude Opus 5.',
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
  const { profile } = useTravelSession();
  const hasSerpApiKey = Boolean(SERPAPI_KEY);

  const rHeaderStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [
      { translateY: interpolate(enter.value, [0, 1], [16, 0]) },
      { scale: interpolate(enter.value, [0, 1], [0.96, 1]) },
    ],
  }));

  // What the onboarding answers actually buy, said back to the traveller so
  // the questions do not feel like they went nowhere.
  const profileLine = profile
    ? [
        profile.companion,
        ...profile.kidAges,
        ...profile.accessNeeds,
        ...profile.allergies.map((item) => `no ${item.toLowerCase()}`),
        ...profile.diets,
      ]
        .filter(Boolean)
        .join(' · ')
    : null;

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
          The same trip,{'\n'}without the queue
        </DisplayText>
        {/* Body copy sits in its own plain View rather than directly under the
            animated, transform-origin'd wrapper: measured against that ancestor
            a long line came out ~8px too wide, so the last word rendered past
            the gutter instead of wrapping. */}
        <View className="w-full">
          <AppText
            className="text-[15px] leading-[22px] text-muted"
            maxFontSizeMultiplier={1.4}
          >
            A vlog with a million views turns four places into a bottleneck.
            Send me one and I will swap them for quieter spots nearby.
          </AppText>
        </View>
      </AnimatedView>

      <View className="gap-5">
        {STEPS.map((step, index) => (
          <Row key={step.title} index={index} {...step} />
        ))}
      </View>

      <View className="gap-2.5">
        {profileLine ? (
          <Surface
            variant="secondary"
            className="flex-row gap-2.5 rounded-2xl border border-border px-3.5 py-3 shadow-none"
          >
            <Icon name="check-circle" size={14} className="mt-0.5 text-accent" />
            <View className="flex-1">
              <AppText
                className="text-[13px] font-medium text-foreground"
                maxFontSizeMultiplier={1.3}
              >
                Planning around your profile
              </AppText>
              <AppText
                className="mt-0.5 text-[12.5px] leading-[18px] text-muted"
                maxFontSizeMultiplier={1.4}
              >
                {profileLine}
              </AppText>
            </View>
          </Surface>
        ) : null}

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
