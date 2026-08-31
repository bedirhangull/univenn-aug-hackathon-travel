import React from 'react';
import Svg, { G, Path } from 'react-native-svg';
import { withUniwind } from 'uniwind';
import type { IconProps } from '../../helpers/types/icons';

/** A single leaf, pointed at both ends, centred on the origin. */
const LEAF = 'M-3.6 0 Q0 -1.9 3.6 0 Q0 1.9 -3.6 0 Z';

/**
 * Leaves on the outer edge of the curve. They lean up and to the left, away
 * from the stem, which runs down their right-hand side.
 */
const OUTER_LEAVES: [number, number][] = [
  [13.2, 18.4],
  [10.2, 15.2],
  [7.7, 11.4],
  [5.8, 7.0],
];

/** Leaves on the inner edge, leaning the opposite way for the same reason. */
const INNER_LEAVES: [number, number][] = [
  [18.0, 20.4],
  [15.0, 17.2],
  [12.5, 13.4],
  [10.6, 9.0],
];

/**
 * Laurel icon component - React Native SVG implementation
 * Wrapped with withUniwind to enable className-based styling
 *
 * Renders a single laurel branch, growing from the bottom right to the top
 * left. Mirror it with a `scaleX: -1` transform to get the matching branch on
 * the other side of an award badge.
 */
const LaurelIconComponent: React.FC<IconProps> = ({
  size = 20,
  color = 'currentColor',
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M19 22C13 18 8.5 12 7 3"
        stroke={color}
        strokeWidth={1}
        strokeLinecap="round"
        fill="none"
      />
      {OUTER_LEAVES.map(([x, y]) => (
        <G key={`outer-${x}-${y}`} transform={`translate(${x} ${y}) rotate(45)`}>
          <Path d={LEAF} fill={color} />
        </G>
      ))}
      {INNER_LEAVES.map(([x, y]) => (
        <G key={`inner-${x}-${y}`} transform={`translate(${x} ${y}) rotate(-55)`}>
          <Path d={LEAF} fill={color} />
        </G>
      ))}
      {/* The tip leaf closes the branch off, standing almost upright. */}
      <G transform="translate(7 3.4) rotate(-80)">
        <Path d={LEAF} fill={color} />
      </G>
    </Svg>
  );
};

/**
 * Laurel icon component wrapped with withUniwind for className-based styling
 *
 * Usage examples:
 * ```tsx
 * // Using className props:
 * <LaurelIcon colorClassName="accent-accent" />
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
