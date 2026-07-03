/**
 * EmptyState — 빈/완료/오류 상태 공용 컴포넌트(이모지 빈 화면 대체).
 * 듀오톤 스팟 일러스트(순수 SVG, 도형 3~4개) + 제목 + 설명 + 행동 1개.
 * 일러스트 문법: 뒷층 틴트 블롭 → 흰 면+잉크 라운드 스트로크 오브젝트 → 코랄 포인트.
 * 이 컴포넌트 안에서만 중앙 정렬을 허용한다(전역 좌정렬 원칙의 예외).
 */
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors, palette, spacing } from '@/tokens';
import { AppText } from '@/ui';

export type SpotKind = 'compass' | 'chat' | 'heart' | 'search' | 'cloud';

export interface EmptyStateProps {
  spot: SpotKind;
  title: string;
  body?: string;
  /** 행동 버튼(하나만) */
  action?: React.ReactNode;
}

/** 매끄러운 4앵커 블롭(접선 정렬 — 꺾임 없음) */
function Blob({ fill }: { fill: string }) {
  return (
    <Path
      d="M60,14 C86,12 98,34 99,59 C100,82 86,108 62,109 C36,110 17,87 18,62 C17,35 36,16 60,14 Z"
      fill={fill}
    />
  );
}

const STROKE = { stroke: palette.blue700, strokeWidth: 5, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

export function SpotIllustration({ kind, size = 112 }: { kind: SpotKind; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      {kind === 'compass' && (
        <>
          <Blob fill={palette.blueTint} />
          <Circle cx={60} cy={60} r={26} fill={palette.white} {...STROKE} />
          {/* 나침반 바늘: 코랄 상단 + 잉크 하단 */}
          <Path d="M60,42 L67,60 L60,58 L53,60 Z" fill={palette.coral} />
          <Path d="M60,78 L53,60 L60,62 L67,60 Z" fill={palette.blue700} fillOpacity={0.35} />
          <Circle cx={60} cy={60} r={3} fill={palette.blue700} />
        </>
      )}
      {kind === 'chat' && (
        <>
          <Blob fill={palette.blueTint} />
          <Rect x={28} y={34} width={64} height={44} rx={14} fill={palette.white} {...STROKE} />
          <Path d="M46,78 L42,92 L58,78" fill={palette.white} {...STROKE} />
          <Circle cx={48} cy={56} r={3.5} fill={palette.coral} />
          <Circle cx={60} cy={56} r={3.5} fill={palette.coral} />
          <Circle cx={72} cy={56} r={3.5} fill={palette.coral} />
        </>
      )}
      {kind === 'heart' && (
        <>
          <Blob fill={palette.coralTint} />
          <Circle cx={60} cy={60} r={27} fill={palette.white} {...STROKE} stroke={palette.coralDeep} />
          <Path
            d="M60,72 C52,65 47,60 47,54.5 C47,50 50.5,47 54.5,47 C57,47 59,48.5 60,50.5 C61,48.5 63,47 65.5,47 C69.5,47 73,50 73,54.5 C73,60 68,65 60,72 Z"
            fill={palette.coral}
          />
        </>
      )}
      {kind === 'search' && (
        <>
          <Blob fill={palette.mint} />
          <Circle cx={54} cy={54} r={20} fill={palette.white} {...STROKE} />
          <Path d="M69,69 L84,84" {...STROKE} fill="none" />
          <Circle cx={54} cy={54} r={6} fill={palette.coral} fillOpacity={0.8} />
        </>
      )}
      {kind === 'cloud' && (
        <>
          <Blob fill={colors.surfaceInset} />
          <Path
            d="M40,72 C31,72 26,65 26,58.5 C26,52 31,46.5 38,46 C40,37 48,31 57,31 C67,31 75,38 77,47 C85,47.5 91,53.5 91,61 C91,68 85,72 78,72 Z"
            fill={palette.white}
            {...STROKE}
          />
          <Circle cx={48} cy={86} r={3} fill={palette.blue500} />
          <Circle cx={62} cy={92} r={3} fill={palette.blue500} />
          <Circle cx={76} cy={86} r={3} fill={palette.blue500} />
        </>
      )}
    </Svg>
  );
}

export function EmptyState({ spot, title, body, action }: EmptyStateProps) {
  return (
    <View style={styles.wrap}>
      <SpotIllustration kind={spot} />
      <AppText variant="title" center style={styles.title}>
        {title}
      </AppText>
      {body != null && (
        <AppText variant="body" muted center style={styles.body}>
          {body}
        </AppText>
      )}
      {action != null && <View style={styles.action}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  title: {
    marginTop: spacing.sm,
  },
  body: {
    lineHeight: 27,
  },
  action: {
    marginTop: spacing.md,
    alignSelf: 'stretch',
    gap: spacing.xs,
  },
});
