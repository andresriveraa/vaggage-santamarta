import React from 'react';
import Svg, {Path, Polyline, Line} from 'react-native-svg';

type Props = {
  size?: number;
  color?: string;
};

const DownloadIcon = ({size = 20, color = '#FFFFFF'}: Props) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Polyline
      points="7 10 12 15 17 10"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Line
      x1={12}
      y1={15}
      x2={12}
      y2={3}
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

export default DownloadIcon;
