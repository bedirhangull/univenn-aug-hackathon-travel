import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import {
  Button,
  Chip,
  Description,
  Label,
  Radio,
  RadioGroup,
  Surface,
} from 'heroui-native';
import { type ComponentProps, useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { withUniwind } from 'uniwind';
import { AppText } from '../../../components/app-text';
import { PageProvider } from '../../../components/page-provider';
import { trackEvent } from '../../../helpers/utils/track-event';

const StyledFeather = withUniwind(Feather);

interface Step {
  icon: ComponentProps<typeof Feather>['name'];
  label: string;
  description: string;
  isActive: boolean;
  connectorClassName: string;
}

const STEPS: Step[] = [
  {
    icon: 'check',
    label: 'Today',
    description: 'Unlock every plan, map and guide instantly.',
    isActive: true,
    connectorClassName: 'h-16',
  },
  {
    icon: 'bell',
    label: 'Day 5',
    description: 'We remind you before the trial ends. No surprises.',
    isActive: false,
    connectorClassName: 'h-16',
  },
  {
    icon: 'star',
    label: 'Day 7',
    description: 'Your subscription starts. Cancel any time before then.',
    isActive: false,
    connectorClassName: 'h-8',
  },
];

export default function SecondPaywall() {
  const [seeAllPlans, setSeeAllPlans] = useState<boolean>(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('yearly');

  const router = useRouter();

  useEffect(() => {
    trackEvent('second_paywall_opened');
  }, []);

  const closePaywall = () => {
    trackEvent('second_paywall_closed');
    router.back();
  };

  const purchasePaywall = () => {
    trackEvent('second_paywall_purchased');
    router.back();
  };

  const toggleSeeAllPlans = () => {
    trackEvent('second_paywall_see_all_plans');
    setSeeAllPlans(!seeAllPlans);
  };

  return (
    <PageProvider>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="flex-row justify-between items-center">
          <Button isIconOnly variant="ghost" size="sm" onPress={closePaywall}>
            <StyledFeather name="x" size={24} className="text-foreground" />
          </Button>
        </View>

        <View className="mt-8 mb-10">
          <AppText className="text-4xl font-bold text-foreground">
            How your free trial works
          </AppText>
          <AppText className="text-xl text-muted mt-2">
            Seven days on us. Cancel whenever you like.
          </AppText>
        </View>

        <View>
          {STEPS.map((step) => (
            <View key={step.label} className="flex-row">
              <View className="items-center">
                <View
                  className={`rounded-full p-3 z-10 ${
                    step.isActive ? 'bg-accent' : 'bg-default'
                  }`}
                >
                  <StyledFeather
                    name={step.icon}
                    size={24}
                    className={
                      step.isActive
                        ? 'text-accent-foreground'
                        : 'text-default-foreground'
                    }
                  />
                </View>
                <View
                  className={`w-0.5 bg-separator ${step.connectorClassName}`}
                />
              </View>
              <View className="ml-4 pt-0.5">
                <AppText className="font-bold text-lg text-foreground">
                  {step.label}
                </AppText>
                <AppText className="text-muted">{step.description}</AppText>
              </View>
            </View>
          ))}

          {seeAllPlans ? (
            <RadioGroup
              value={selectedPlan}
              onValueChange={setSelectedPlan}
              className="gap-4"
            >
              <View>
                <Chip size="sm" className="absolute -top-3 right-12 z-20">
                  <Chip.Label className="uppercase font-medium">
                    Save 60%
                  </Chip.Label>
                </Chip>
                <RadioGroup.Item
                  className="bg-accent-soft border border-accent/35 px-4 py-4 rounded-lg"
                  value="yearly"
                >
                  <View className="flex-1">
                    <Label>
                      <Label.Text
                        maxFontSizeMultiplier={1.4}
                        className="text-lg font-bold"
                      >
                        Yearly
                      </Label.Text>
                    </Label>
                    <AppText className="text-lg text-foreground">
                      $39.99 / 12 months
                    </AppText>
                    <Description maxFontSizeMultiplier={1.4}>
                      Billed once a year
                    </Description>
                  </View>
                  <Radio />
                </RadioGroup.Item>
              </View>

              <RadioGroup.Item
                className="px-4 py-4 rounded-lg bg-surface-secondary"
                value="monthly"
              >
                <View className="flex-1">
                  <Label>
                    <Label.Text
                      maxFontSizeMultiplier={1.4}
                      className="text-lg font-bold"
                    >
                      Monthly
                    </Label.Text>
                  </Label>
                  <AppText className="text-lg text-foreground">
                    $9.99 / 1 month
                  </AppText>
                  <Description maxFontSizeMultiplier={1.4}>
                    Billed every month
                  </Description>
                </View>
                <Radio />
              </RadioGroup.Item>
            </RadioGroup>
          ) : (
            <Surface variant="secondary" className="p-4">
              <View className="self-start">
                <Chip size="sm">
                  <Chip.Label className="uppercase font-medium">
                    7 days free
                  </Chip.Label>
                </Chip>
              </View>
              <View className="flex-row items-baseline mt-4">
                <AppText className="text-muted font-medium">
                  then{' '}
                  <AppText className="text-3xl font-bold text-foreground">
                    $29.99
                  </AppText>{' '}
                  per year
                </AppText>
              </View>
              <View className="mt-4">
                <AppText className="text-sm text-muted">
                  That works out to $2.49 per month.
                </AppText>
              </View>
            </Surface>
          )}
        </View>
      </ScrollView>

      <View className="mt-6">
        <Button onPress={purchasePaywall} size="lg" className="h-14">
          <Button.Label className="font-bold text-lg">
            Start my free trial
          </Button.Label>
        </Button>
        <Pressable onPress={toggleSeeAllPlans} className="mt-4 py-2">
          <AppText className="text-center text-muted font-medium">
            {seeAllPlans ? 'Back' : 'See all plans'}
          </AppText>
        </Pressable>
      </View>
    </PageProvider>
  );
}
