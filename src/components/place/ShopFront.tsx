import Svg, { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';

import { Place } from '@/src/data/mock';
import { POPPINS } from '@/src/theme/fonts';

// The illustrated shop front (prototype: the hero SVG on the Place page), used when a place has no photo.
// The awning stripes and the signboard use the place's own colours. It shows a shop only: no people.
export function ShopFront({ place }: { place: Pick<Place, 'name' | 'c1' | 'c2'> }) {
  const { c1, c2 } = place;
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 390 270"
      preserveAspectRatio="xMidYMid slice"
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Front entrance and signboard of ${place.name}`}>
      <Rect x={0} y={0} width={390} height={270} fill="#F3E6FF" />
      <Rect x={0} y={0} width={390} height={270} fill={c2} opacity={0.28} />
      <Rect x={30} y={30} width={330} height={240} fill="#FFF8F0" />
      <Rect x={30} y={30} width={330} height={20} fill="#E9DCCB" />
      {/* the signboard with the name */}
      <Rect x={70} y={58} width={250} height={50} rx={10} fill={c1} />
      <Rect x={76} y={64} width={238} height={38} rx={7} fill="none" stroke="#FFFFFF" strokeOpacity={0.45} strokeWidth={1.5} />
      <SvgText x={195} y={91} textAnchor="middle" fontFamily={POPPINS.extraBold} fontSize={place.name.length > 16 ? 17 : 21} fill="#FFFFFF">
        {place.name}
      </SvgText>
      {/* the striped awning: ten stripes, alternating the place colour and white, with a scalloped edge */}
      {Array.from({ length: 10 }, (_, i) => (
        <Rect key={i} x={30 + i * 33} y={122} width={33} height={34} fill={i % 2 === 0 ? c1 : '#FFFFFF'} />
      ))}
      <Path
        d={'M30 156' + ' q16.5 14 33 0'.repeat(10)}
        fill={c1}
        opacity={0.9}
      />
      {/* two shop windows and the door */}
      <Rect x={52} y={180} width={96} height={76} rx={6} fill="#BFD8EE" />
      <Path d="M58 186 L95 186 L64 250 L58 250 Z" fill="#FFFFFF" opacity={0.45} />
      <Rect x={242} y={180} width={96} height={76} rx={6} fill="#BFD8EE" />
      <Path d="M248 186 L285 186 L254 250 L248 250 Z" fill="#FFFFFF" opacity={0.45} />
      <Rect x={165} y={176} width={60} height={94} rx={4} fill="#5B3A29" />
      <Rect x={171} y={182} width={48} height={56} rx={3} fill="#BFD8EE" opacity={0.8} />
      <Circle cx={212} cy={246} r={3} fill="#F1C40F" />
      {/* two potted bushes and the pavement */}
      <G>
        <Rect x={12} y={232} width={26} height={30} rx={4} fill="#8D5A3B" />
        <Circle cx={25} cy={222} r={17} fill="#3F8F4E" />
        <Rect x={352} y={232} width={26} height={30} rx={4} fill="#8D5A3B" />
        <Circle cx={365} cy={222} r={17} fill="#3F8F4E" />
      </G>
      <Rect x={0} y={262} width={390} height={8} fill="#D8CBBE" />
    </Svg>
  );
}
