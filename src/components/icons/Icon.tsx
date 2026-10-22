import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { ICON_SHAPES, IconName } from './paths';

// One of the Spotted line icons.
//   <Icon name="pin" size={20} color={palette.red} />
//   <Icon name="bookmark" filled color={palette.red} />     (a filled bookmark, for "saved")
//
// Icons are decoration by default (screen readers skip them). Give `label` when the icon alone
// carries meaning, and it is read out instead.
export function Icon({
  name,
  size = 20,
  color = '#000000',
  strokeWidth = 2,
  filled = false,
  label,
}: {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  filled?: boolean;
  label?: string;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      accessible={!!label}
      accessibilityRole={label ? 'image' : undefined}
      accessibilityLabel={label}>
      {ICON_SHAPES[name].map((shape, index) => {
        const common = {
          stroke: color,
          strokeWidth,
          strokeLinecap: 'round' as const,
          strokeLinejoin: 'round' as const,
          fill: filled ? color : 'none',
        };
        if (shape.type === 'path') return <Path key={index} d={shape.d} {...common} />;
        if (shape.type === 'circle') return <Circle key={index} cx={shape.cx} cy={shape.cy} r={shape.r} {...common} />;
        return <Rect key={index} x={shape.x} y={shape.y} width={shape.width} height={shape.height} rx={shape.rx} {...common} />;
      })}
    </Svg>
  );
}
