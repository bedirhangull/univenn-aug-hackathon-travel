import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import {
  Button,
  Checkbox,
  ControlField,
  Description,
  Label,
  Separator,
  Surface,
  TagGroup,
} from 'heroui-native';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  FadeInDown,
  useReducedMotion,
} from 'react-native-reanimated';
import { withUniwind } from 'uniwind';
import { AppText } from '../../../components/app-text';
import { PageProvider } from '../../../components/page-provider';
import { ChoiceCard } from '../../../components/showcases/travel-onboarding/choice-card';
import {
  ProfileRail,
  type ProfileChip,
} from '../../../components/showcases/travel-onboarding/profile-rail';
import {
  ACCESS_NEEDS,
  ALLERGIES,
  COMPANIONS,
  DIETS,
  KID_AGES,
  type Option,
  type OptionId,
  railLabelFor,
  resolveSelection,
} from '../../../components/showcases/travel-onboarding/questions';
import { trackEvent } from '../../../helpers/utils/track-event';

const StyledFeather = withUniwind(Feather);

const TOTAL_STEPS = 3;

/** Turns a set of chosen ids into rail chips, in the order they were asked. */
const chipsFor = (
  options: Option[],
  selected: Set<OptionId>,
  prefix: string
): ProfileChip[] =>
  options
    .filter((option) => selected.has(option.id))
    .map((option) => ({
      key: `${prefix}-${option.id}`,
      label: railLabelFor(options, option.id),
    }));

export default function TravelOnboarding() {
  const router = useRouter();

  const reducedMotion = useReducedMotion();

  const [step, setStep] = useState(0);
  const [companion, setCompanion] = useState<OptionId | null>(null);
  const [kidAges, setKidAges] = useState<Set<OptionId>>(new Set());
  const [access, setAccess] = useState<Set<OptionId>>(new Set());
  const [allergies, setAllergies] = useState<Set<OptionId>>(new Set());
  const [diets, setDiets] = useState<Set<OptionId>>(new Set());

  const isFamily = companion === 'family';

  const chips = useMemo<ProfileChip[]>(
    () => [
      ...(companion
        ? [
            {
              key: `who-${companion}`,
              label: railLabelFor(COMPANIONS, companion),
            },
          ]
        : []),
      ...(isFamily ? chipsFor(KID_AGES, kidAges, 'kids') : []),
      ...chipsFor(ACCESS_NEEDS, access, 'access'),
      ...chipsFor(ALLERGIES, allergies, 'allergy'),
      ...chipsFor(DIETS, diets, 'diet'),
    ],
    [companion, isFamily, kidAges, access, allergies, diets]
  );

  const toggle = (
    options: Option[],
    selected: Set<OptionId>,
    setSelected: (next: Set<OptionId>) => void
  ) => {
    return (id: OptionId) => {
      const next = new Set(selected);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      setSelected(resolveSelection(options, next, selected));
    };
  };

  const onTagSelection = (
    options: Option[],
    selected: Set<OptionId>,
    setSelected: (next: Set<OptionId>) => void
  ) => {
    return (keys: Set<string | number>) => {
      const next = new Set(Array.from(keys, String));
      setSelected(resolveSelection(options, next, selected));
    };
  };

  const toggleAccess = toggle(ACCESS_NEEDS, access, setAccess);

  const goBack = () => {
    if (step === 0) {
      trackEvent('travel_onboarding_abandoned', { step });
      router.back();
      return;
    }

    setStep(step - 1);
  };

  const goNext = () => {
    if (step === TOTAL_STEPS) {
      trackEvent('travel_onboarding_finished');
      router.back();
      return;
    }

    trackEvent('travel_onboarding_step_completed', { step });
    setStep(step + 1);
  };

  const canContinue = step !== 0 || companion !== null;

  const ctaLabel = ['Continue', 'Continue', 'Build my profile', 'Start exploring'][step];

  return (
    <PageProvider>
      <View className="flex-row items-center mb-5">
        <Button isIconOnly variant="ghost" size="sm" onPress={goBack}>
          <StyledFeather
            name={step === 0 ? 'x' : 'arrow-left'}
            size={22}
            className="text-foreground"
          />
        </Button>
      </View>

      <ProfileRail
        chips={chips}
        step={step < TOTAL_STEPS ? step + 1 : undefined}
        totalSteps={TOTAL_STEPS}
      />

      <Separator className="my-5" />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-8"
      >
        <Animated.View
          key={step}
          entering={reducedMotion ? undefined : FadeInDown.duration(320)}
        >
          {step === 0 ? (
            <View className="gap-6">
              <View className="gap-2">
                <AppText className="text-[11px] font-semibold uppercase text-muted tracking-[2px]">
                  Who&apos;s going
                </AppText>
                <AppText style={styles.display} className="text-foreground">
                  Who&apos;s coming with you?
                </AppText>
                <AppText className="text-base text-muted leading-6">
                  This shapes almost everything we suggest.
                </AppText>
              </View>

              <View className="gap-3">
                <View className="flex-row gap-3">
                  {COMPANIONS.slice(0, 2).map((option) => (
                    <ChoiceCard
                      key={option.id}
                      option={option}
                      isSelected={companion === option.id}
                      onPress={() => setCompanion(option.id)}
                    />
                  ))}
                </View>
                <View className="flex-row gap-3">
                  {COMPANIONS.slice(2).map((option) => (
                    <ChoiceCard
                      key={option.id}
                      option={option}
                      isSelected={companion === option.id}
                      onPress={() => setCompanion(option.id)}
                    />
                  ))}
                </View>
              </View>

              {isFamily ? (
                <Animated.View
                  entering={reducedMotion ? undefined : FadeInDown.duration(260)}
                  className="gap-3"
                >
                  <TagGroup
                    aria-label="Ages of the children travelling"
                    selectionMode="multiple"
                    selectedKeys={kidAges}
                    onSelectionChange={onTagSelection(
                      KID_AGES,
                      kidAges,
                      setKidAges
                    )}
                  >
                    <Label>
                      <Label.Text>How old are they?</Label.Text>
                    </Label>
                    <TagGroup.List>
                      {KID_AGES.map((option) => (
                        <TagGroup.Item key={option.id} id={option.id}>
                          {option.label}
                        </TagGroup.Item>
                      ))}
                    </TagGroup.List>
                  </TagGroup>
                </Animated.View>
              ) : null}
            </View>
          ) : null}

          {step === 1 ? (
            <View className="gap-6">
              <View className="gap-2">
                <AppText className="text-[11px] font-semibold uppercase text-muted tracking-[2px]">
                  Getting around
                </AppText>
                <AppText style={styles.display} className="text-foreground">
                  Anything we should plan around?
                </AppText>
                <AppText className="text-base text-muted leading-6">
                  We&apos;ll leave out places that won&apos;t work for you.
                </AppText>
              </View>

              <Surface className="py-1">
                {ACCESS_NEEDS.map((option, index) => (
                  <View key={option.id}>
                    {index > 0 ? <Separator className="my-1" /> : null}
                    <ControlField
                      isSelected={access.has(option.id)}
                      onSelectedChange={() => toggleAccess(option.id)}
                      className="py-3"
                    >
                      <View className="flex-1">
                        <Label>
                          <Label.Text maxFontSizeMultiplier={1.4}>
                            {option.label}
                          </Label.Text>
                        </Label>
                      </View>
                      <ControlField.Indicator>
                        <Checkbox className="size-5 rounded-md">
                          <Checkbox.Indicator iconProps={{ size: 14 }} />
                        </Checkbox>
                      </ControlField.Indicator>
                    </ControlField>
                  </View>
                ))}
              </Surface>
            </View>
          ) : null}

          {step === 2 ? (
            <View className="gap-6">
              <View className="gap-2">
                <AppText className="text-[11px] font-semibold uppercase text-muted tracking-[2px]">
                  At the table
                </AppText>
                <AppText style={styles.display} className="text-foreground">
                  How do you eat?
                </AppText>
                <AppText className="text-base text-muted leading-6">
                  Allergies come first. We treat those as hard rules, not
                  preferences.
                </AppText>
              </View>

              <TagGroup
                aria-label="Allergies"
                selectionMode="multiple"
                selectedKeys={allergies}
                onSelectionChange={onTagSelection(
                  ALLERGIES,
                  allergies,
                  setAllergies
                )}
              >
                <Label>
                  <Label.Text>Allergies</Label.Text>
                </Label>
                <TagGroup.List>
                  {ALLERGIES.map((option) => (
                    <TagGroup.Item key={option.id} id={option.id}>
                      {option.label}
                    </TagGroup.Item>
                  ))}
                </TagGroup.List>
              </TagGroup>

              <TagGroup
                aria-label="Dietary preferences"
                selectionMode="multiple"
                selectedKeys={diets}
                onSelectionChange={onTagSelection(DIETS, diets, setDiets)}
              >
                <Label>
                  <Label.Text>Preferences</Label.Text>
                </Label>
                <TagGroup.List>
                  {DIETS.map((option) => (
                    <TagGroup.Item key={option.id} id={option.id}>
                      {option.label}
                    </TagGroup.Item>
                  ))}
                </TagGroup.List>
                <Description>
                  Nothing here is locked in. Change it any time in Settings.
                </Description>
              </TagGroup>
            </View>
          ) : null}

          {step === 3 ? (
            <View className="gap-6">
              <View className="gap-2">
                <AppText style={styles.display} className="text-foreground">
                  That&apos;s everything.
                </AppText>
                <AppText className="text-base text-muted leading-6">
                  Every plan we build starts from this.
                </AppText>
              </View>

              <Surface className="gap-4 p-5">
                <SummaryRow
                  label="Travelling as"
                  values={
                    companion
                      ? [
                          railLabelFor(COMPANIONS, companion),
                          ...(isFamily
                            ? Array.from(kidAges, (id) =>
                                railLabelFor(KID_AGES, id)
                              )
                            : []),
                        ]
                      : []
                  }
                />
                <Separator />
                <SummaryRow
                  label="Getting around"
                  values={Array.from(access, (id) =>
                    railLabelFor(ACCESS_NEEDS, id)
                  )}
                />
                <Separator />
                <SummaryRow
                  label="Allergies"
                  values={Array.from(allergies, (id) =>
                    railLabelFor(ALLERGIES, id)
                  )}
                />
                <Separator />
                <SummaryRow
                  label="Food"
                  values={Array.from(diets, (id) => railLabelFor(DIETS, id))}
                />
              </Surface>
            </View>
          ) : null}
        </Animated.View>
      </ScrollView>

      <Button size="lg" onPress={goNext} isDisabled={!canContinue}>
        <Button.Label className="font-semibold">{ctaLabel}</Button.Label>
      </Button>
    </PageProvider>
  );
}

interface SummaryRowProps {
  label: string;
  values: string[];
}

const SummaryRow = ({ label, values }: SummaryRowProps) => (
  <View className="flex-row gap-4">
    <AppText className="text-sm text-muted w-[104px]">{label}</AppText>
    <AppText className="flex-1 text-sm font-medium text-foreground leading-5">
      {values.length > 0 ? values.join(', ') : 'Nothing noted'}
    </AppText>
  </View>
);

const styles = StyleSheet.create({
  display: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 30,
    lineHeight: 35,
    letterSpacing: -0.7,
  },
});
