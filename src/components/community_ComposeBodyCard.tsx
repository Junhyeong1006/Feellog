/**
 * CommunityComposeBodyCard — 글쓰기/후기쓰기 공용 본문 입력 카드 (Figma 593-4297 / 593-4367).
 * 흰 카드 r20: 멀티라인 본문 입력 + (하단) 카메라 원형 버튼 + 배경색 팔레트 원형(흰/파스텔 5).
 * 사진 선택(expo-image-picker)과 배경 톤 선택은 부모가 상태를 소유한다.
 */
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import type { SamplePost } from '@/data/sampleSocial';
import { POST_BG_TONES } from '@/data/sampleSocial';
import { useFontScale } from '@/providers/FontScaleProvider';
import { colors, fontFamily, MIN_TOUCH_SIZE, radius, spacing, typography } from '@/tokens';
import { AppText } from '@/ui';

export type PostBgTone = SamplePost['bgTone'];

/** 팔레트 순서: 흰(기본) + 파스텔 5톤 — 시안 원형 팔레트 행 */
const TONE_OPTIONS: PostBgTone[] = [null, 'blue', 'yellow', 'pink', 'purple', 'mint'];

const TONE_NAMES: Record<Exclude<PostBgTone, null>, string> = {
  blue: '파랑',
  yellow: '노랑',
  pink: '분홍',
  purple: '보라',
  mint: '민트',
};

export interface ComposeBodyCardProps {
  value: string;
  onChangeText: (t: string) => void;
  bgTone: PostBgTone;
  onChangeBgTone: (tone: PostBgTone) => void;
  imageUri: string | null;
  onChangeImageUri: (uri: string | null) => void;
  placeholder?: string;
  /** 사진 선택 실패 안내(부모 토스트/텍스트) */
  onPickError?: () => void;
}

export function CommunityComposeBodyCard({
  value,
  onChangeText,
  bgTone,
  onChangeBgTone,
  imageUri,
  onChangeImageUri,
  placeholder = 'ㅣ여기를 눌러 새로운 소식을 작성해주세요',
  onPickError,
}: ComposeBodyCardProps) {
  const { scale } = useFontScale();

  const pickPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.9,
        allowsMultipleSelection: false,
      });
      if (!result.canceled && result.assets[0]) onChangeImageUri(result.assets[0].uri);
    } catch {
      onPickError?.();
    }
  };

  return (
    <View style={styles.card}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        multiline
        textAlignVertical="top"
        accessibilityLabel="본문 내용"
        style={[
          styles.input,
          scale !== 1 && {
            fontSize: Math.round(typography.body.fontSize * scale),
            lineHeight: Math.round(typography.body.lineHeight * scale),
          },
        ]}
      />

      {imageUri != null && (
        <View style={styles.photoWrap}>
          <Image source={{ uri: imageUri }} style={styles.photo} contentFit="cover" />
          <Pressable
            onPress={() => onChangeImageUri(null)}
            accessibilityRole="button"
            accessibilityLabel="사진 제거"
            hitSlop={spacing.sm}
            style={styles.photoRemove}
          >
            <Ionicons name="close" size={16} color={colors.onPrimary} />
            <AppText variant="small" weight="bold" color={colors.onPrimary}>
              제거
            </AppText>
          </Pressable>
        </View>
      )}

      <View style={styles.toolRow}>
        <Pressable
          onPress={pickPhoto}
          accessibilityRole="button"
          accessibilityLabel="사진 추가"
          hitSlop={Math.ceil((MIN_TOUCH_SIZE - CIRCLE) / 2)}
          style={({ pressed }) => [styles.circle, styles.cameraCircle, pressed && styles.pressed]}
        >
          <Ionicons name="camera-outline" size={18} color={colors.primary} />
        </Pressable>

        <View style={styles.palette}>
          {TONE_OPTIONS.map((tone) => {
            const selected = tone === bgTone;
            const fill = tone == null ? colors.surface : POST_BG_TONES[tone];
            const name = tone == null ? '흰색' : TONE_NAMES[tone];
            return (
              <Pressable
                key={tone ?? 'white'}
                onPress={() => onChangeBgTone(tone)}
                accessibilityRole="button"
                accessibilityLabel={`배경색 ${name}`}
                accessibilityState={{ selected }}
                hitSlop={Math.ceil((MIN_TOUCH_SIZE - CIRCLE) / 2)}
                style={({ pressed }) => [
                  styles.circle,
                  { backgroundColor: fill },
                  selected && styles.circleSelected,
                  pressed && styles.pressed,
                ]}
              >
                {selected && <Ionicons name="checkmark" size={16} color={colors.primary} />}
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

/** 시안 원형 31px — 터치 48은 hitSlop으로 확보 */
const CIRCLE = 32;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radius.xl,
    padding: spacing.base,
    gap: spacing.md,
  },
  input: {
    minHeight: 140,
    fontFamily: fontFamily.base,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    fontWeight: typography.body.fontWeight,
    color: colors.textPrimary,
    padding: 0,
  },
  photoWrap: {
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: 160,
    backgroundColor: colors.surfaceInset,
  },
  photoRemove: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.scrim,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  toolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  circle: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraCircle: {
    backgroundColor: colors.background,
  },
  circleSelected: {
    borderWidth: 2,
  },
  palette: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  pressed: {
    opacity: 0.7,
  },
});
