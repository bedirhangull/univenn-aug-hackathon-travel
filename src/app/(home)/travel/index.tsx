import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef } from 'react';
import { ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Composer } from '../../../components/travel/composer';
import { EmptyState } from '../../../components/travel/empty-state';
import { ItineraryCard } from '../../../components/travel/itinerary-card';
import { MessageBubble } from '../../../components/travel/message-bubble';
import { StageProgress } from '../../../components/travel/stage-progress';
import { useAppTheme } from '../../../contexts/app-theme-context';
import useHeaderHeight from '../../../helpers/hooks/use-header-height';
import { useTravelChat } from '../../../helpers/hooks/use-travel-chat';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

/** Input bar + its padding, so the thread never rests underneath the chrome. */
const COMPOSER_HEIGHT = 62;

export default function TravelScreen() {
  const { messages, stages, isBusy, submit, reset } = useTravelChat();
  const { isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const scrollRef = useRef<ScrollView>(null);

  const isWorking = stages !== null;
  const isEmpty = messages.length === 0 && !isWorking;

  // Wait a frame so the newly mounted bubble is measured before we scroll to it.
  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  }, []);

  useEffect(() => {
    if (isEmpty) return;
    scrollToEnd();
  }, [messages.length, isWorking, isEmpty, scrollToEnd]);

  return (
    <View className="flex-1 bg-background">
      <AnimatedScrollView
        ref={scrollRef}
        contentContainerStyle={{
          paddingTop: headerHeight + 8,
          paddingBottom: insets.bottom + COMPOSER_HEIGHT + 28,
          paddingHorizontal: 20,
          gap: 12,
        }}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
        // The keyboard tracks the drag 1:1 instead of snapping shut on release.
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={isEmpty ? undefined : scrollToEnd}
      >
        {isEmpty ? <EmptyState /> : null}

        {messages.map((message) =>
          message.kind === 'plan' ? (
            <ItineraryCard
              key={message.id}
              plan={message.plan}
              onReset={reset}
            />
          ) : (
            <MessageBubble key={message.id} message={message} />
          )
        )}

        {stages ? <StageProgress stages={stages} /> : null}
      </AnimatedScrollView>

      <Composer isBusy={isBusy} onSubmit={submit} />

      <StatusBar style={isDark ? 'light' : 'dark'} />
    </View>
  );
}
