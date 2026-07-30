/**
 * 소통 탭 내부 스택 — 피드(index) · 글쓰기 · 후기쓰기 · 게시글 상세.
 * (26.07 온보딩작업 시안: 글쓰기/후기쓰기 화면에도 하단 탭바가 유지된다 → 탭 그룹 안 스택으로 구성)
 */
import { Stack } from 'expo-router';

export default function CommunityStackLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
