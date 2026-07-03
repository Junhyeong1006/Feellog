/**
 * BrandMark — Feellog 심볼(5축 성향 = 5잎 꽃).
 * 순수 SVG(에셋 없음). 제품 코어(5축 진단)와 동형인 72° 회전 체계.
 * 용도: 로그인/스플래시 히어로, 헤더·사이드바 락업(워드마크 왼쪽), 아바타 폴백 모티프.
 */
import Svg, { Circle, Ellipse, G } from 'react-native-svg';

import { palette } from '@/tokens';

export interface BrandMarkProps {
  size?: number;
  /** 꽃잎 색 오버라이드(단색 마크가 필요할 때) */
  monochrome?: string;
}

// 5잎 색 순환: 블루 중심 + 코랄/민트 포인트(브랜드 3색)
const PETALS = [palette.blue500, palette.coral, palette.mintStrong, palette.blue500, palette.coral];

export function BrandMark({ size = 40, monochrome }: BrandMarkProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" accessibilityLabel="필로그">
      <G>
        {PETALS.map((fill, k) => (
          <Ellipse
            key={k}
            cx={24}
            cy={13.5}
            rx={6.5}
            ry={11}
            fill={monochrome ?? fill}
            fillOpacity={0.9}
            transform={`rotate(${k * 72} 24 24)`}
          />
        ))}
        <Circle cx={24} cy={24} r={4.5} fill={palette.paper} />
      </G>
    </Svg>
  );
}
