import Feather from '@expo/vector-icons/Feather';
import { cn } from 'heroui-native';
import React from 'react';
import { Text as RNText, type TextProps } from 'react-native';
import { withUniwind } from 'uniwind';

/** Single icon family across the whole feature — mixing sets reads as careless. */
export const Icon = withUniwind(Feather);

/**
 * Display typography for the travel screens.
 *
 * Tracking and leading are size-specific, never one value reused across sizes:
 * letters read too far apart as type grows, so large sizes get negative
 * tracking and tight leading, while small labels get a positive bump for
 * legibility. Space Grotesk carries the display voice; body copy stays on the
 * app's own font scale so the contrast is deliberate rather than accidental.
 */
const SCALE = {
  xl: { fontSize: 32, lineHeight: 34, letterSpacing: -0.9 },
  lg: { fontSize: 24, lineHeight: 27, letterSpacing: -0.55 },
  md: { fontSize: 18, lineHeight: 23, letterSpacing: -0.2 },
  sm: { fontSize: 13, lineHeight: 16, letterSpacing: 0.3 },
} as const;

const FAMILY = {
  medium: 'SpaceGrotesk_500Medium',
  semibold: 'SpaceGrotesk_600SemiBold',
  bold: 'SpaceGrotesk_700Bold',
} as const;

type DisplayTextProps = TextProps & {
  size?: keyof typeof SCALE;
  weight?: keyof typeof FAMILY;
};

export const DisplayText = React.forwardRef<RNText, DisplayTextProps>(
  ({ size = 'lg', weight = 'semibold', className, style, ...rest }, ref) => (
    <RNText
      ref={ref}
      className={cn('text-foreground', className)}
      style={[{ fontFamily: FAMILY[weight] }, SCALE[size], style]}
      {...rest}
    />
  )
);

DisplayText.displayName = 'DisplayText';
