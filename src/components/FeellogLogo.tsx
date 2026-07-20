/**
 * FeellogLogo — 손글씨 'Feellog' 워드마크 (Figma 추출 SVG).
 * 구름체 폰트는 임베딩 라이선스가 불명이라 폰트 대신 벡터 패스를 쓴다(라이선스 리스크 0).
 * 색은 SVG에 파랑(#5793F4)으로 박혀 있음 — 흰색 버전이 필요하면 white prop.
 */
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

// 추출 원본 viewBox 137x38
const RATIO = 38 / 137;

const LOGO_BLUE = require('../../assets/figma/logo-feellog.svg');

export interface FeellogLogoProps {
  /** 표시 폭(높이는 비율 자동) */
  width?: number;
  accessibilityLabel?: string;
}

export function FeellogLogo({ width = 141, accessibilityLabel = 'Feellog' }: FeellogLogoProps) {
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={{ width, height: Math.round(width * RATIO) }}
    >
      <Image source={LOGO_BLUE} style={styles.fill} contentFit="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    width: '100%',
    height: '100%',
  },
});
