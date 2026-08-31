import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useThemeColor } from 'heroui-native';
import { Pressable, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useMountProgress } from '../../helpers/hooks/use-mount-progress';
import { SPRING } from '../../helpers/travel/motion';
import { AppText } from '../app-text';
import { DisplayText, Icon } from './display-text';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const WayfareEntryCard = () => {
  const router = useRouter();
  const enter = useMountProgress();
  const pressed = useSharedValue(0);
  const [accent, accentHover] = useThemeColor(['accent', 'accent-hover']);

  const rStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [
      { translateY: interpolate(enter.value, [0, 1], [16, 0]) },
      // Two scale entries rather than one combined number: transforms compose,
      // so the entrance and the press spring stay independent and a press
      // mid-entrance layers on instead of cancelling it.
      { scale: interpolate(enter.value, [0, 1], [0.96, 1]) },
      { scale: withSpring(1 - pressed.value * 0.02, SPRING.press) },
    ],
  }));

  return (
    <AnimatedPressable
      style={rStyle}
      onPress={() => router.push('/travel')}
      onPressIn={() => {
        pressed.value = 1;
      }}
      onPressOut={() => {
        pressed.value = 0;
      }}
      accessibilityRole="button"
      accessibilityLabel="Wayfare — turn a travel video into a route"
      className="overflow-hidden rounded-3xl"
    >
      <LinearGradient
        colors={[accent, accentHover]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View className="gap-1 p-5">
          <View className="mb-1 flex-row items-center gap-2">
            <Icon name="map" size={14} className="text-accent-foreground" />
            <AppText
              className="text-[12px] font-medium tracking-wider text-accent-foreground/75"
              maxFontSizeMultiplier={1.2}
            >
              NEW
            </AppText>
          </View>

          <View className="flex-row items-end gap-4">
            <View className="flex-1">
              <DisplayText size="lg" className="text-accent-foreground">
                Wayfare
              </DisplayText>
              <AppText
                className="mt-1 text-[14px] leading-[19px] text-accent-foreground/80"
                maxFontSizeMultiplier={1.3}
              >
                Paste a travel vlog, get a day-by-day route.
              </AppText>
            </View>

            <View className="size-9 items-center justify-center rounded-3xl bg-accent-foreground/20">
              <Icon
                name="arrow-up-right"
                size={18}
                className="text-accent-foreground"
              />
            </View>
          </View>
        </View>
      </LinearGradient>
    </AnimatedPressable>
  );
};
