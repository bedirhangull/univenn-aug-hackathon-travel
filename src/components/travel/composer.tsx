import { BlurView } from 'expo-blur';
import { InputGroup, Spinner, cn } from 'heroui-native';
import { useCallback, useState } from 'react';
import { Keyboard, Platform, Pressable, View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SPRING, TIMING } from '../../helpers/travel/motion';
import { Icon } from './display-text';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type SendButtonProps = {
  canSend: boolean;
  isBusy: boolean;
  onPress: () => void;
};

const SendButton = ({ canSend, isBusy, onPress }: SendButtonProps) => {
  const pressed = useSharedValue(0);

  // Feedback happens on press-down, not on release. Waiting for the tap to
  // complete before showing anything is the single easiest way to make a
  // button feel dead.
  const rStyle = useAnimatedStyle(() => {
    const enabled = canSend && !isBusy;
    const scale = enabled ? 1 - pressed.value * 0.1 : 0.84;
    return {
      opacity: withTiming(enabled || isBusy ? 1 : 0.35, TIMING.fade),
      transform: [{ scale: withSpring(scale, SPRING.press) }],
    };
  });

  return (
    <AnimatedPressable
      style={rStyle}
      onPress={onPress}
      onPressIn={() => {
        pressed.value = 1;
      }}
      onPressOut={() => {
        pressed.value = 0;
      }}
      disabled={!canSend || isBusy}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel="Build an itinerary from this link"
      className="size-8 items-center justify-center rounded-full bg-accent"
    >
      {isBusy ? (
        <Spinner size="sm" color="white" />
      ) : (
        <Icon name="arrow-up" size={17} className="text-accent-foreground" />
      )}
    </AnimatedPressable>
  );
};

type ComposerProps = {
  isBusy: boolean;
  onSubmit: (text: string) => void;
};

export const Composer = ({ isBusy, onSubmit }: ComposerProps) => {
  const [value, setValue] = useState('');
  const insets = useSafeAreaInsets();

  const canSend = value.trim().length > 0;

  const handleSend = useCallback(() => {
    if (!canSend || isBusy) return;
    const text = value;
    setValue('');
    Keyboard.dismiss();
    onSubmit(text);
  }, [canSend, isBusy, value, onSubmit]);

  return (
    <View className="absolute inset-x-0 bottom-0" pointerEvents="box-none">
      <KeyboardStickyView
        offset={{ closed: 0, opened: insets.bottom }}
        style={{ paddingBottom: insets.bottom + 10 }}
      >
        {/* On iOS the bar is a translucent material and the thread scrolls
            under it. Android has no usable blur here, so it gets an honest
            solid bar with a hairline edge — a fake translucent one just turns
            the text underneath to mud. */}
        <BlurView
          intensity={Platform.OS === 'ios' ? 28 : 0}
          className={cn(
            'px-4 pt-2',
            Platform.OS === 'ios'
              ? 'bg-background/70'
              : 'border-t border-border bg-background'
          )}
        >
          <InputGroup isDisabled={isBusy}>
            <InputGroup.Prefix isDecorative>
              <Icon
                name="link-2"
                size={15}
                className="text-field-placeholder"
              />
            </InputGroup.Prefix>

            <InputGroup.Input
              value={value}
              onChangeText={setValue}
              placeholder="Paste a YouTube link"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
              keyboardType="url"
              returnKeyType="send"
              submitBehavior="submit"
              onSubmitEditing={handleSend}
              maxFontSizeMultiplier={1.4}
            />

            <InputGroup.Suffix>
              <SendButton
                canSend={canSend}
                isBusy={isBusy}
                onPress={handleSend}
              />
            </InputGroup.Suffix>
          </InputGroup>
        </BlurView>
      </KeyboardStickyView>
    </View>
  );
};
