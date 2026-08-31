import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Button, Surface, useThemeColor } from 'heroui-native';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { withUniwind } from 'uniwind';
import BG from '../../../../assets/images/paywall-showcase-bg.jpeg';
import { AppText } from '../../../components/app-text';
import { LaurelIcon } from '../../../components/icons/laurel';
import { PageProvider } from '../../../components/page-provider';
import { trackEvent } from '../../../helpers/utils/track-event';

const StyledFeather = withUniwind(Feather);
const StyledIonicons = withUniwind(Ionicons);

interface Feature {
  title: string;
  description: string;
  icon: ReactNode;
}

const FEATURE_LIST: Feature[] = [
  {
    title: 'Unlimited collections',
    description: 'Group every trip, city and wishlist without a cap.',
    icon: <StyledFeather name="book-open" size={18} className="text-foreground" />,
  },
  {
    title: 'Smart tagging',
    description: 'Places are sorted for you the moment you save them.',
    icon: <StyledIonicons name="sparkles" size={18} className="text-foreground" />,
  },
  {
    title: 'Unlimited items',
    description: 'Keep as many saved places as your itinerary needs.',
    icon: <StyledFeather name="tag" size={18} className="text-foreground" />,
  },
];

const AVATARS = [
  'https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/blue.jpg',
  'https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/green.jpg',
  'https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/orange.jpg',
  'https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/purple.jpg',
];

/** Length of the countdown shown on the offer, in seconds. */
const OFFER_DURATION = 63252;

/**
 * Rolled once per app launch. Kept at module scope because the React Compiler
 * rejects impure calls made while rendering.
 */
const MEMBER_COUNT = Math.floor(Math.random() * (240 - 100 + 1)) + 100;

export default function LimitedPaywall() {
  const router = useRouter();

  const [themeColorBackground, accentColor] = useThemeColor([
    'background',
    'accent',
  ]);

  const [secondsLeft, setSecondsLeft] = useState(OFFER_DURATION);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const { h, m, s } = useMemo(() => {
    const hours = Math.floor(secondsLeft / 3600);
    const minutes = Math.floor((secondsLeft % 3600) / 60);
    const seconds = secondsLeft % 60;
    return {
      h: hours.toString().padStart(2, '0'),
      m: minutes.toString().padStart(2, '0'),
      s: seconds.toString().padStart(2, '0'),
    };
  }, [secondsLeft]);

  useEffect(() => {
    trackEvent('limited_paywall_opened');
  }, []);

  const closePaywall = () => {
    trackEvent('limited_paywall_closed');
    router.back();
  };

  const purchasePaywall = () => {
    trackEvent('limited_paywall_purchased');
    router.back();
  };

  return (
    <PageProvider>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-12"
      >
        <View className="relative w-full h-full">
          {/* Header Image and Laurel Section */}
          <View className="relative w-full h-[200px]">
            <Image
              style={{ width: '100%', height: '100%', borderRadius: 16 }}
              source={BG}
              contentFit="cover"
            />
            <Button
              isIconOnly
              variant="ghost"
              size="sm"
              className="absolute top-2 left-2 z-50"
              onPress={closePaywall}
            >
              <Feather name="x" size={24} color="white" />
            </Button>

            <LinearGradient
              colors={['transparent', themeColorBackground]}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 200,
              }}
            />

            <View className="absolute bottom-2 left-0 right-0 flex-row items-center justify-center px-6">
              <LaurelIcon size={70} color={accentColor} />

              <View className="items-center">
                <AppText className="text-sm font-bold uppercase tracking-[3px] text-foreground">
                  Editor&apos;s choice
                </AppText>
                <AppText className="text-[11px] font-medium text-muted mt-1">
                  Travel app of the year
                </AppText>
              </View>

              <View style={{ transform: [{ scaleX: -1 }] }}>
                <LaurelIcon size={70} color={accentColor} />
              </View>
            </View>
          </View>

          {/* Offer and Timer Section */}
          <View>
            <View>
              <AppText className="text-3xl font-medium text-center text-foreground">
                One time offer
              </AppText>
              <AppText className="text-sm font-medium text-muted mt-1 text-center">
                Unlock everything the app can do.
              </AppText>
            </View>
            <View className="mt-8">
              <AppText className="text-3xl font-bold text-accent text-center">
                60% off
              </AppText>
              <AppText className="text-xl font-medium text-muted text-center">
                for your first year
              </AppText>
            </View>

            {/* Timer Blocks */}
            <View className="flex-row gap-2 items-center justify-center my-4">
              {[h, m, s].map((value, i) => (
                <View
                  key={i}
                  className="h-12 w-16 rounded-lg bg-surface-secondary items-center justify-center"
                >
                  <AppText className="text-xl font-medium text-center text-foreground">
                    {value}
                  </AppText>
                </View>
              ))}
            </View>

            {/* Pricing Line */}
            <View className="flex-row items-center justify-center">
              <AppText className="text-lg font-medium mr-1 text-foreground">
                Only for
              </AppText>
              <AppText
                className="text-lg text-muted font-medium"
                style={{ textDecorationLine: 'line-through' }}
              >
                $99.99
              </AppText>
              <AppText className="text-lg font-medium ml-1 text-foreground">
                $39.99
              </AppText>
            </View>

            {/* Features List */}
            <View className="mt-4">
              {FEATURE_LIST.map((feature) => (
                <Surface
                  variant="transparent"
                  key={feature.title}
                  className="flex-row gap-4 items-center px-4"
                >
                  <View className="h-12 w-12 rounded-xl bg-surface-secondary items-center justify-center">
                    {feature.icon}
                  </View>
                  <View className="flex-1">
                    <AppText className="font-medium text-lg text-foreground">
                      {feature.title}
                    </AppText>
                    <AppText className="text-xs text-muted">
                      {feature.description}
                    </AppText>
                  </View>
                </Surface>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Footer / CTA */}
      <View className="border-t border-separator pt-2">
        <View className="my-4">
          <View className="flex-row items-center justify-center mb-2">
            {AVATARS.map((uri, index) => (
              <View
                key={uri}
                style={{
                  marginLeft: index === 0 ? 0 : -16,
                  zIndex: AVATARS.length - index,
                  borderWidth: 3,
                  borderColor: themeColorBackground,
                }}
                className="w-12 h-12 rounded-full overflow-hidden bg-surface-secondary"
              >
                <Image style={{ width: '100%', height: '100%' }} source={{ uri }} />
              </View>
            ))}
          </View>

          <AppText className="text-lg text-center font-medium text-foreground">
            {MEMBER_COUNT} people joined today
          </AppText>

          <Button onPress={purchasePaywall} className="mt-4" size="lg">
            <Button.Label className="font-bold">Claim my discount</Button.Label>
          </Button>
        </View>
      </View>
    </PageProvider>
  );
}
