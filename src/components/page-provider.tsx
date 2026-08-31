import { cn } from 'heroui-native';
import { type FC, type PropsWithChildren } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  className?: string;
}

/**
 * Full screen container for the paywall showcases.
 *
 * The showcases stack renders without a header, so every screen owns its own
 * safe area insets and horizontal gutter.
 */
export const PageProvider: FC<PropsWithChildren<Props>> = ({
  children,
  className,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      className={cn('flex-1 bg-background px-4', className)}
      style={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }}
    >
      {children}
    </View>
  );
};
