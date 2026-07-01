/**
 * 여가 성향 테스트 12문항 (기획 스크린샷 "12문항 구성" 반영).
 * 답변 5단계: -2(왼쪽 훨씬) / -1(왼쪽 조금) / 0(비슷) / +1(오른쪽 조금) / +2(오른쪽 훨씬).
 *
 * 부호(positive 방향): rhythm+=활동적, relation+=교류, experience+=새로움,
 * participation+=만들기, reward+=실용·성취. 각 문항 left 키워드가 positive 축 쪽이라 dir=-1.
 * 문항/이미지는 가안 — 이 배열만 교체하면 된다.
 */
import type { Question } from './types';

export const QUESTIONS: Question[] = [
  {
    id: 1, axis: 'experience', dir: -1, trendDir: -1,
    prompt: '새로운 여가를 시작한다면 어느 쪽이 더 끌리시나요?',
    left:  { title: '새롭고 화제가 되는 체험', desc: '처음 해보는 활동도 흥미롭다면 도전해보고 싶어요' },
    right: { title: '익숙하고 편안한 활동',   desc: '낯설기보다 편안하고 부담 없는 활동이 좋아요' },
    leftAxisLabel: '새로움', rightAxisLabel: '익숙함',
    leftImageKey: 'q1_left', rightImageKey: 'q1_right',
  },
  {
    id: 2, axis: 'rhythm', dir: -1,
    prompt: '주말 여가는 보통 어떻게 보내고 싶으세요?',
    left:  { title: '가볍게 움직이는 활동', desc: '몸을 움직이며 활기차게 보내는 편이 좋아요' },
    right: { title: '차분히 앉아 집중하는 활동', desc: '한자리에서 차분히 몰입하는 편이 좋아요' },
    leftAxisLabel: '활동적', rightAxisLabel: '차분함',
    leftImageKey: 'q2_left', rightImageKey: 'q2_right',
  },
  {
    id: 3, axis: 'relation', dir: -1,
    prompt: '활동할 때 어떤 방식이 더 편하세요?',
    left:  { title: '사람들과 함께 즐기기', desc: '여럿이 어울리며 함께하는 게 즐거워요' },
    right: { title: '혼자 또는 소수로 집중하기', desc: '혼자거나 소수일 때 더 편하게 집중돼요' },
    leftAxisLabel: '교류', rightAxisLabel: '독립',
    leftImageKey: 'q3_left', rightImageKey: 'q3_right',
  },
  {
    id: 4, axis: 'participation', dir: -1,
    prompt: '여가 활동에서 더 끌리는 방식은?',
    left:  { title: '직접 만들고 해보기', desc: '내 손으로 만들고 결과물을 남기는 게 좋아요' },
    right: { title: '보고 듣고 감상하기', desc: '좋은 것을 감상하며 음미하는 게 좋아요' },
    leftAxisLabel: '만들기', rightAxisLabel: '감상',
    leftImageKey: 'q4_left', rightImageKey: 'q4_right',
  },
  {
    id: 5, axis: 'reward', dir: -1, recoveryDir: 1,
    prompt: '활동 후 어떤 만족이 더 중요하세요?',
    left:  { title: '배운 것이 남고 도움이 되는 것', desc: '실용적으로 쓸모가 남으면 뿌듯해요' },
    right: { title: '몸과 마음이 편안해지는 것',   desc: '편안하게 재충전되면 만족스러워요' },
    leftAxisLabel: '실용·성취', rightAxisLabel: '정서·회복',
    leftImageKey: 'q5_left', rightImageKey: 'q5_right',
  },
  {
    id: 6, axis: 'experience', dir: -1, trendDir: -1,
    prompt: '공간 분위기는 어느 쪽이 더 끌리세요?',
    left:  { title: '감각적이고 새로운 공간', desc: '트렌디하고 감각적인 분위기가 설레요' },
    right: { title: '편안하고 정감 있는 공간', desc: '아늑하고 정감 있는 분위기가 좋아요' },
    leftAxisLabel: '새로움', rightAxisLabel: '익숙함',
    leftImageKey: 'q6_left', rightImageKey: 'q6_right',
  },
  {
    id: 7, axis: 'rhythm', dir: -1,
    prompt: '시간을 보내는 장소는 어느 쪽을 선호하세요?',
    left:  { title: '밖으로 나가 장소를 바꾸기', desc: '여기저기 다니며 환기하는 게 좋아요' },
    right: { title: '실내에서 조용히 집중하기', desc: '익숙한 실내에서 조용히 있는 게 좋아요' },
    leftAxisLabel: '활동적', rightAxisLabel: '차분함',
    leftImageKey: 'q7_left', rightImageKey: 'q7_right',
  },
  {
    id: 8, axis: 'relation', dir: -1,
    prompt: '모임 활동에서 더 중요한 것은?',
    left:  { title: '대화하며 교류하는 시간', desc: '사람들과 이야기 나누는 시간이 좋아요' },
    right: { title: '활동에 몰입하는 시간',   desc: '활동 자체에 집중하는 시간이 좋아요' },
    leftAxisLabel: '교류', rightAxisLabel: '몰입',
    leftImageKey: 'q8_left', rightImageKey: 'q8_right',
  },
  {
    id: 9, axis: 'reward', dir: -1, recoveryDir: 1,
    prompt: '활동 후 더 만족스러운 것은?',
    left:  { title: '결과물이 남는 것',        desc: '눈에 보이는 결과물이 남으면 뿌듯해요' },
    right: { title: '좋은 경험과 감정이 남는 것', desc: '따뜻한 경험과 감정이 남으면 좋아요' },
    leftAxisLabel: '성취', rightAxisLabel: '정서',
    leftImageKey: 'q9_left', rightImageKey: 'q9_right',
  },
  {
    id: 10, axis: 'reward', dir: -1,
    prompt: '하나를 선택해야 한다면?',
    left:  { title: '일상에 활용할 수 있는 활동', desc: '생활에 바로 써먹을 수 있으면 좋아요' },
    right: { title: '취향과 즐거움을 채우는 활동', desc: '그냥 내 취향과 즐거움을 채우면 좋아요' },
    leftAxisLabel: '실용', rightAxisLabel: '취향',
    leftImageKey: 'q10_left', rightImageKey: 'q10_right',
  },
  {
    id: 11, trendDir: -1, recoveryDir: 1, // 보조 성향 전용(핵심 축 없음)
    prompt: '지금의 나에게 더 필요한 시간은?',
    left:  { title: '새롭고 감각적인 체험', desc: '새로운 자극으로 기분 전환하고 싶어요' },
    right: { title: '편안하고 회복되는 시간', desc: '푹 쉬며 몸과 마음을 회복하고 싶어요' },
    leftAxisLabel: '트렌드 발견', rightAxisLabel: '회복 충전',
    leftImageKey: 'q11_left', rightImageKey: 'q11_right',
  },
  {
    id: 12, axis: 'participation', dir: -1,
    prompt: '자유 시간이 생기면 먼저 떠오르는 것은?',
    left:  { title: '나만의 것을 만들어보기',       desc: '무언가 직접 만들어보고 싶어요' },
    right: { title: '전시·공연·음악 등 문화 즐기기', desc: '전시나 공연을 보러 가고 싶어요' },
    leftAxisLabel: '만들기', rightAxisLabel: '문화 감상',
    leftImageKey: 'q12_left', rightImageKey: 'q12_right',
  },
];

/** 5단계 선택지 라벨(왼쪽→오른쪽) */
export const ANSWER_OPTIONS: { value: -2 | -1 | 0 | 1 | 2; label: string }[] = [
  { value: -2, label: '왼쪽이 훨씬 좋다' },
  { value: -1, label: '왼쪽이 조금 더 좋다' },
  { value: 0, label: '비슷하다' },
  { value: 1, label: '오른쪽이 조금 더 좋다' },
  { value: 2, label: '오른쪽이 훨씬 좋다' },
];
