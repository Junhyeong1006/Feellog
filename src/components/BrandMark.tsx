/**
 * BrandMark — Feellog 심볼(5축 성향 = 5잎 꽃) (v5: 단색).
 * 순수 SVG(에셋 없음). 제품 코어(5축 진단)와 동형인 72° 회전 체계.
 * 다색 파스텔 꽃은 폐기 — 브랜드 그린 단색 1색(실서비스 로고 문법: 결정색 하나).
 */
import Svg, { Circle, Ellipse, G } from 'react-native-svg';

import { colors, palette } from '@/tokens';

export interface BrandMarkProps {
  size?: number;
  /** 마크 색(기본 브랜드 그린 — 사진/딤 위에서는 white로) */
  color?: string;
}

export function BrandMark({ size = 40, color = colors.primary }: BrandMarkProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" accessibilityLabel="필로그">
      <G>
        {[0, 1, 2, 3, 4].map((k) => (
          <Ellipse
            key={k}
            cx={24}
            cy={13.5}
            rx={6.5}
            ry={11}
            fill={color}
            fillOpacity={0.92}
            transform={`rotate(${k * 72} 24 24)`}
          />
        ))}
        <Circle cx={24} cy={24} r={4.5} fill={palette.white} />
      </G>
    </Svg>
  );
}
