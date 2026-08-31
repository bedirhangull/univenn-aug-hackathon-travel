import { Chip } from 'heroui-native';
import { type FC } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  LinearTransition,
  useReducedMotion,
  ZoomIn,
} from 'react-native-reanimated';
import { AppText } from '../../app-text';

const AnimatedChip = Animated.createAnimatedComponent(Chip);

export interface ProfileChip {
  key: string;
  label: string;
}

interface Props {
  chips: ProfileChip[];
  /** Current question, 1-based. Omitted on the summary step. */
  step?: number;
  totalSteps: number;
}

/**
 * The running summary of everything answered so far.
 *
 * This doubles as the progress indicator: instead of counting dots, the flow
 * shows what it has actually learned, so the last step is this rail finished
 * rather than a screen the person has not seen before.
 */
export const ProfileRail: FC<Props> = ({ chips, step, totalSteps }) => {
  const reducedMotion = useReducedMotion();

  return (
    <View>
      <View className="flex-row items-baseline justify-between mb-2.5">
        <AppText className="text-[11px] font-semibold uppercase text-muted tracking-[2px]">
          Your travel profile
        </AppText>
        {step ? (
          <AppText className="text-[11px] font-medium text-muted">
            {step} of {totalSteps}
          </AppText>
        ) : null}
      </View>

      {chips.length === 0 ? (
        <View
          className="h-11 rounded-xl border border-separator items-start justify-center px-3.5"
          style={styles.placeholder}
        >
          <AppText className="text-sm text-muted">
            Empty for now. Three questions will fill it.
          </AppText>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2 items-center"
          className="h-11"
        >
          {chips.map((chip) => (
            <AnimatedChip
              key={chip.key}
              size="sm"
              variant="soft"
              layout={reducedMotion ? undefined : LinearTransition}
              entering={reducedMotion ? undefined : ZoomIn.springify().damping(18)}
            >
              <Chip.Label>{chip.label}</Chip.Label>
            </AnimatedChip>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  placeholder: {
    borderStyle: 'dashed',
  },
});
