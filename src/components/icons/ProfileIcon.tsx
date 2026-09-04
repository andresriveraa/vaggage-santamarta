import React from 'react';
import Svg, {Circle, Path} from 'react-native-svg';

type Props = {
  size?: number;
  color?: string;
};

const ProfileIcon = ({size = 20, color = '#FFFFFF'}: Props) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={8} r={4} stroke={color} strokeWidth={2} />
    <Path
      d="M4 20C4 16.134 7.58172 13 12 13C16.4183 13 20 16.134 20 20"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

export default ProfileIcon;
