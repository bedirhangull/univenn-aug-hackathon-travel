import { Surface, cn } from 'heroui-native';
import { View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useMountProgress } from '../../helpers/hooks/use-mount-progress';
import { ENTER_OFFSET } from '../../helpers/travel/motion';
import type { ChatMessage } from '../../helpers/travel/types';
import { shortLabel, watchUrl } from '../../helpers/travel/youtube';
import { AppText } from '../app-text';
import { Icon } from './display-text';

const AnimatedView = Animated.createAnimatedComponent(View);

type Props = {
  message: Extract<ChatMessage, { kind: 'text' }>;
};

/**
 * Bubbles enter from the side they belong to: the user's rises from the
 * composer it was typed in, the assistant's from the left edge. Motion that
 * starts where the content came from is what makes the screen feel spatial
 * instead of like a list that reflows.
 */
export const MessageBubble = ({ message }: Props) => {
  const enter = useMountProgress();
  const isUser = message.role === 'user';
  const isError = message.role === 'assistant' && message.tone === 'error';

  const rStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [
      { translateY: interpolate(enter.value, [0, 1], [ENTER_OFFSET, 0]) },
      {
        translateX: interpolate(enter.value, [0, 1], [isUser ? 12 : -12, 0]),
      },
      { scale: interpolate(enter.value, [0, 1], [0.94, 1]) },
    ],
  }));

  const videoId = isUser ? message.videoId : undefined;
  const isBareLink = Boolean(
    videoId && message.text.trim() === watchUrl(videoId)
  );

  return (
    <AnimatedView
      style={[
        rStyle,
        { transformOrigin: isUser ? 'bottom right' : 'bottom left' },
      ]}
      className={cn('max-w-[84%]', isUser ? 'self-end' : 'self-start')}
    >
      <Surface
        variant={isUser ? 'transparent' : 'secondary'}
        className={cn(
          'px-4 py-3 shadow-none',
          isUser
            ? 'bg-accent rounded-3xl rounded-br-lg border-0'
            : 'rounded-3xl rounded-bl-lg border border-border',
          isError && 'bg-danger-soft border-danger/25'
        )}
      >
        {videoId && (
          <View
            className={cn(
              'flex-row items-center gap-2 self-start rounded-full px-2.5 py-1',
              'bg-accent-foreground/15',
              !isBareLink && 'mb-2'
            )}
          >
            <Icon name="youtube" size={13} className="text-accent-foreground" />
            <AppText
              className="text-[13px] font-medium text-accent-foreground"
              maxFontSizeMultiplier={1.2}
            >
              {shortLabel(videoId)}
            </AppText>
          </View>
        )}

        {!isBareLink && (
          <View className="flex-row gap-2">
            {isError && (
              <Icon
                name="alert-triangle"
                size={15}
                className="mt-0.5 text-danger"
              />
            )}
            <AppText
              className={cn(
                'flex-1 text-[15px] leading-[21px]',
                isUser
                  ? 'text-accent-foreground'
                  : isError
                    ? 'text-danger-soft-foreground'
                    : 'text-foreground'
              )}
              maxFontSizeMultiplier={1.4}
            >
              {message.text}
            </AppText>
          </View>
        )}
      </Surface>
    </AnimatedView>
  );
};
