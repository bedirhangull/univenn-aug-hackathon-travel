import Feather from '@expo/vector-icons/Feather';
import { cn, PressableFeedback } from 'heroui-native';
import { type FC } from 'react';
import { View } from 'react-native';
import { withUniwind } from 'uniwind';
import { AppText } from '../../app-text';
import type { CompanionOption } from './questions';

const StyledFeather = withUniwind(Feather);

interface Props {
  option: CompanionOption;
  isSelected: boolean;
  onPress: () => void;
}

/**
 * One of the four "who is coming" cards.
 *
 * This is the only question answered with cards rather than a list or tags —
 * it carries the most weight in what gets recommended, so it gets the room.
 */
export const ChoiceCard: FC<Props> = ({ option, isSelected, onPress }) => {
  return (
    <PressableFeedback
      className="flex-1"
      animation={{ scale: { value: 0.97 } }}
      onPress={onPress}
      role="radio"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={`${option.label}. ${option.detail}`}
    >
      <View
        className={cn(
          'rounded-2xl border p-4 gap-3 min-h-[132px] justify-between',
          isSelected
            ? 'bg-accent-soft border-accent'
            : 'bg-surface border-border'
        )}
      >
        <StyledFeather
          name={option.icon}
          size={22}
          className={cn(
            isSelected ? 'text-accent-soft-foreground' : 'text-muted'
          )}
        />
        <View className="gap-0.5">
          <AppText
            maxFontSizeMultiplier={1.3}
            className={cn(
              'text-base font-semibold',
              isSelected ? 'text-accent-soft-foreground' : 'text-foreground'
            )}
          >
            {option.label}
          </AppText>
          <AppText
            maxFontSizeMultiplier={1.3}
            className="text-xs leading-4 text-muted"
          >
            {option.detail}
          </AppText>
        </View>
      </View>
    </PressableFeedback>
  );
};
