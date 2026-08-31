import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Button, Chip, Surface, Switch, useThemeColor } from 'heroui-native';
import { useEffect, useState } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, View } from 'react-native';
import { withUniwind } from 'uniwind';
import { AppText } from '../../../components/app-text';
import { LaurelIcon } from '../../../components/icons/laurel';
import { PageProvider } from '../../../components/page-provider';
import { trackEvent } from '../../../helpers/utils/track-event';

const StyledFeather = withUniwind(Feather);

const AVATARS = [
  'https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/blue.jpg',
  'https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/orange.jpg',
  'https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/purple.jpg',
];

interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  date: string;
}

const REVIEWS: Review[] = [
  {
    id: '1',
    name: 'Amelia Hart',
    rating: 5,
    comment:
      'I planned a two week trip in an afternoon. Everything I needed was in one place.',
    date: 'March 14',
  },
  {
    id: '2',
    name: 'Noah Bennett',
    rating: 5,
    comment:
      'The offline maps alone paid for the year. I used them every single day abroad.',
    date: 'April 2',
  },
  {
    id: '3',
    name: 'Sofia Marino',
    rating: 5,
    comment:
      'Worth it for the shared itineraries. My whole group finally stopped arguing.',
    date: 'April 28',
  },
];

export default function FirstPaywall() {
  const router = useRouter();

  const [accentColor, defaultColor] = useThemeColor(['accent', 'default']);

  const [index, setIndex] = useState(0);
  const [isTrialEnabled, setIsTrialEnabled] = useState(false);

  // Held in state rather than a ref: the values are read while rendering the
  // review card, which the React Compiler does not allow for refs.
  const [fadeAnim] = useState(() => new Animated.Value(1));
  const [slideAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
          easing: Easing.out(Easing.quad),
        }),
        Animated.timing(slideAnim, {
          toValue: -8,
          duration: 400,
          useNativeDriver: true,
          easing: Easing.out(Easing.quad),
        }),
      ]).start(() => {
        setIndex((prev) => (prev + 1) % REVIEWS.length);
        slideAnim.setValue(8);

        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
            easing: Easing.in(Easing.quad),
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
            easing: Easing.in(Easing.quad),
          }),
        ]).start();
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    trackEvent('first_paywall_opened');
  }, []);

  const closePaywall = () => {
    trackEvent('first_paywall_closed');
    router.back();
  };

  const purchasePaywall = () => {
    trackEvent('first_paywall_purchased');
    router.back();
  };

  return (
    <PageProvider>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-12"
      >
        <View className="relative pt-16 pb-12">
          <LinearGradient
            colors={['transparent', accentColor, 'transparent']}
            locations={[0, 0.5, 1]}
            style={styles.accentWash}
          />

          <Button
            isIconOnly
            variant="ghost"
            size="sm"
            className="absolute top-0 left-0 z-50"
            onPress={closePaywall}
          >
            <StyledFeather name="x" size={24} className="text-foreground" />
          </Button>

          <View className="flex-row items-center justify-center gap-2">
            {AVATARS.map((uri, i) => (
              <View
                key={uri}
                className={`border-2 border-background rounded-xl p-2 items-center justify-center bg-surface-secondary ${
                  i === 0 ? '-rotate-12' : i === 2 ? 'rotate-12' : ''
                }`}
                style={{ width: 82, height: 82 }}
              >
                <Image
                  style={styles.avatarTile}
                  source={{ uri }}
                  contentFit="cover"
                />
              </View>
            ))}
          </View>

          {/* Social Proof Stats */}
          <View className="absolute -bottom-12 left-0 right-0 flex-row items-center justify-center px-6">
            <LaurelIcon size={70} color={accentColor} />
            <View className="items-center px-4">
              <AppText className="text-3xl font-bold text-accent">
                120K+
              </AppText>
              <AppText className="text-[11px] font-bold text-muted mt-1 uppercase tracking-widest">
                Happy travelers
              </AppText>
            </View>
            <View style={styles.mirrored}>
              <LaurelIcon size={70} color={accentColor} />
            </View>
          </View>
        </View>

        {/* Reviews Section */}
        <View className="mt-16 px-1">
          <View className="items-center justify-center" style={styles.reviews}>
            <Animated.View
              style={{
                width: '100%',
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }}
            >
              <Surface variant="default" className="p-6">
                <View className="flex-row justify-between items-center mb-4">
                  <View>
                    <AppText className="font-bold text-lg leading-6 text-foreground">
                      {REVIEWS[index].name}
                    </AppText>
                    <AppText className="text-xs text-muted">
                      {REVIEWS[index].date}
                    </AppText>
                  </View>
                  <View className="flex-row items-center gap-0.5">
                    {Array.from({ length: REVIEWS[index].rating }).map(
                      (_, i) => (
                        <Feather
                          key={i}
                          name="star"
                          size={16}
                          color={accentColor}
                        />
                      )
                    )}
                  </View>
                </View>
                <AppText className="text-sm leading-5 text-muted italic">
                  &ldquo;{REVIEWS[index].comment}&rdquo;
                </AppText>
              </Surface>
            </Animated.View>
            {/* Stacked card peeking out from behind the active review */}
            <Surface
              variant="secondary"
              className="absolute -z-10 rounded-2xl"
              style={styles.ghostCard}
            />
          </View>
        </View>

        {/* Plan Info */}
        <View className="flex-row items-center">
          <AppText className="text-xl font-bold text-foreground">
            Yearly
          </AppText>
          <Chip size="sm" className="ml-2">
            <Chip.Label className="uppercase font-medium">Save 60%</Chip.Label>
          </Chip>
        </View>

        <View>
          <AppText className="text-2xl font-bold mt-4 text-foreground">
            <AppText className="line-through text-muted text-xl">
              $99.99
            </AppText>
            {' / '}
            $39.99
          </AppText>
          <AppText className="text-xs text-muted mt-2">
            Billed once a year. Cancel anytime.
          </AppText>
        </View>

        {/* Trial Switch */}
        <Surface
          variant="secondary"
          className="flex-row items-center justify-between mt-6 px-6 py-4"
        >
          <View className="flex-1 pr-4">
            <AppText className="font-bold text-base text-foreground">
              Not sure yet? Enable your free 7 day trial
            </AppText>
          </View>

          <Switch
            isSelected={isTrialEnabled}
            onSelectedChange={setIsTrialEnabled}
            className="w-[56px] h-[32px]"
            animation={{
              backgroundColor: {
                value: [defaultColor, accentColor],
              },
            }}
          >
            <Switch.Thumb
              className="size-[24px]"
              animation={{
                left: {
                  value: 4,
                  springConfig: { damping: 20, stiffness: 200 },
                },
              }}
            />
          </Switch>
        </Surface>

        <Button className="mt-6" onPress={purchasePaywall}>
          <Button.Label className="font-bold">
            {isTrialEnabled ? 'Start my free trial' : 'Continue'}
          </Button.Label>
        </Button>
      </ScrollView>
    </PageProvider>
  );
}

const styles = StyleSheet.create({
  accentWash: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    opacity: 0.15,
  },
  avatarTile: {
    width: 72,
    height: 72,
    borderRadius: 8,
  },
  mirrored: {
    transform: [{ scaleX: -1 }],
  },
  reviews: {
    height: 180,
  },
  ghostCard: {
    width: '92%',
    height: 140,
    top: 25,
    opacity: 0.5,
  },
});
