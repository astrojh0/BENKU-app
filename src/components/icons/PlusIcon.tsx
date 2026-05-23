import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface PlusIconProps {
  size?: number;
  color?: string;
}

export default function PlusIcon({ size = 20, color = '#777777' }: PlusIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 1024 1024" fill="none">
      <Path
        d="M903.2 601.7H601.7v298.7c0 33-26.7 59.7-59.7 59.7h-59.7c-33 0-59.8-26.7-59.8-59.7V601.7H121c-31.5 0-57-25.5-57-57v-65.3c0-31.5 25.5-57 57-57h301.5V123.7c0-33 26.8-59.7 59.8-59.7H542c33 0 59.7 26.8 59.7 59.7v298.7h301.5c31.5 0 57 25.5 57 57v65.3c0 31.4-25.5 57-57 57z"
        fill={color}
      />
    </Svg>
  );
}
