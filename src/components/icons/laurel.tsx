import React from 'react';
import Svg, { Ellipse, Path } from 'react-native-svg';
import { withUniwind } from 'uniwind';
import type { IconProps } from '../../helpers/types/icons';

/** Leaves growing on the outer side of the stem. */
const OUTER_LEAVES: [number, number][] = [
  [13.7, 18.6],
  [11.1, 14.8],
  [8.7, 11.1],
  [6.6, 7.4],
  [4.9, 4.0],
];

/** Shorter leaves growing on the inner side of the stem. */
const INNER_LEAVES: [number, number][] = [
  [18.2, 20.0],
  [15.6, 16.2],
  [13.2, 12.5],
  [11.1, 8.8],
];

/**
 * Laurel icon component - React Native SVG implementation
 * Wrapped with withUniwind to enable className-based styling
 *
 * Renders a single laurel branch. Mirror it with a `scaleX: -1` transform to
 * get the matching branch on the opposite side of an award badge.
 */
const LaurelIconComponent: React.FC<IconProps> = ({
  size = 20,
  color = 'currentColor',
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M17.5 21.5C12 17 8 11 6.5 3.5"
        stroke={color}
        strokeWidth={1.2}
        strokeLinecap="round"
        fill="none"
      />
      {OUTER_LEAVES.map(([cx, cy]) => (
        <Ellipse
          key={`outer-${cx}-${cy}`}
          cx={cx}
          cy={cy}
          rx={2.2}
          ry={1.05}
          fill={color}
          transform={`rotate(-55 ${cx} ${cy})`}
        />
      ))}
      {INNER_LEAVES.map(([cx, cy]) => (
        <Ellipse
          key={`inner-${cx}-${cy}`}
          cx={cx}
          cy={cy}
          rx={1.7}
          ry={0.85}
          fill={color}
          transform={`rotate(-15 ${cx} ${cy})`}
        />
      ))}
    </Svg>
  );
};

/**
 * Laurel icon component wrapped with withUniwind for className-based styling
 *
 * Usage examples:
 * ```tsx
 * // Using className props:
 * <LaurelIcon colorClassName="accent-foreground" />
 *
 * // Using direct props:
 * <LaurelIcon size={64} color="#ff6344" />
 * ```
 */
export const LaurelIcon = withUniwind(LaurelIconComponent, {
  color: {
    fromClassName: 'colorClassName',
    styleProperty: 'accentColor',
  },
});
