import {
  EMPTY_CARD_DRAFT,
  PLAYER_MAX,
  PLAYER_MIN,
  STAGE_CARD_COUNT,
  cloneDraft,
  draftToCode,
} from '../lib/cards'
import type { CardDraft, Rank, Stage, Suit } from '../lib/cards'

export interface NoticeState {
  severity: 'error' | 'warning' | 'info' | 'success'
  message: string
}

export interface CalculatorState {
  heroCards: [CardDraft, CardDraft]
  boardCards: [CardDraft, CardDraft, CardDraft, CardDraft, CardDraft]
  stage: Stage
  playerCount: number
  notice: NoticeState | null
}

type CardArea = 'heroCards' | 'boardCards'

interface UpdateCardPayload {
  area: CardArea
  index: number
  rank?: Rank | null
  suit?: Suit | null
}

export type CalculatorAction =
  | { type: 'update-card'; payload: UpdateCardPayload }
  | { type: 'set-stage'; payload: Stage }
  | { type: 'set-player-count'; payload: number }
  | { type: 'set-notice'; payload: NoticeState | null }
  | { type: 'reset-board' }

export const initialCalculatorState: CalculatorState = {
  heroCards: [{ ...EMPTY_CARD_DRAFT }, { ...EMPTY_CARD_DRAFT }],
  boardCards: [
    { ...EMPTY_CARD_DRAFT },
    { ...EMPTY_CARD_DRAFT },
    { ...EMPTY_CARD_DRAFT },
    { ...EMPTY_CARD_DRAFT },
    { ...EMPTY_CARD_DRAFT },
  ],
  stage: 'preflop',
  playerCount: PLAYER_MIN,
  notice: null,
}

function createDuplicateNotice(): NoticeState {
  return {
    severity: 'error',
    message: '检测到重复牌面，请重新选择。',
  }
}

function cloneHeroCards(cards: readonly CardDraft[]): [CardDraft, CardDraft] {
  return [cloneDraft(cards[0] ?? EMPTY_CARD_DRAFT), cloneDraft(cards[1] ?? EMPTY_CARD_DRAFT)]
}

function cloneBoardCards(
  cards: readonly CardDraft[],
): [CardDraft, CardDraft, CardDraft, CardDraft, CardDraft] {
  return [
    cloneDraft(cards[0] ?? EMPTY_CARD_DRAFT),
    cloneDraft(cards[1] ?? EMPTY_CARD_DRAFT),
    cloneDraft(cards[2] ?? EMPTY_CARD_DRAFT),
    cloneDraft(cards[3] ?? EMPTY_CARD_DRAFT),
    cloneDraft(cards[4] ?? EMPTY_CARD_DRAFT),
  ]
}

function replaceCard(
  state: CalculatorState,
  area: CardArea,
  index: number,
  nextDraft: CardDraft,
): CalculatorState {
  const isBoard = area === 'boardCards'
  const cards = isBoard ? [...state.boardCards] : [...state.heroCards]

  if (!cards[index]) {
    return {
      ...state,
      notice: {
        severity: 'error',
        message: '牌位索引越界。',
      },
    }
  }

  cards[index] = nextDraft
  const heroCards = isBoard ? cloneHeroCards(state.heroCards) : cloneHeroCards(cards)
  const boardCards = isBoard ? cloneBoardCards(cards) : cloneBoardCards(state.boardCards)

  const used = new Set<number>()

  for (const draft of [...heroCards, ...boardCards]) {
    const code = draftToCode(draft)

    if (code === null) {
      continue
    }

    if (used.has(code)) {
      return {
        ...state,
        notice: createDuplicateNotice(),
      }
    }

    used.add(code)
  }

  return {
    ...state,
    heroCards,
    boardCards,
    notice: null,
  }
}

function clampPlayerCount(playerCount: number): number {
  return Math.min(PLAYER_MAX, Math.max(PLAYER_MIN, playerCount))
}

export function calculatorReducer(
  state: CalculatorState,
  action: CalculatorAction,
): CalculatorState {
  switch (action.type) {
    case 'update-card': {
      const { area, index, rank, suit } = action.payload
      const currentCard = state[area][index]

      if (!currentCard) {
        return {
          ...state,
          notice: {
            severity: 'error',
            message: '牌位索引越界。',
          },
        }
      }

      const nextDraft: CardDraft = {
        rank: rank === undefined ? currentCard.rank : rank,
        suit: suit === undefined ? currentCard.suit : suit,
      }

      return replaceCard(state, area, index, nextDraft)
    }

    case 'set-stage': {
      const activeCount = STAGE_CARD_COUNT[action.payload]
      const boardCards = state.boardCards.map((draft, index) =>
        index < activeCount ? cloneDraft(draft) : { ...EMPTY_CARD_DRAFT },
      ) as [CardDraft, CardDraft, CardDraft, CardDraft, CardDraft]

      return {
        ...state,
        stage: action.payload,
        boardCards,
        notice: null,
      }
    }

    case 'set-player-count': {
      const nextValue = clampPlayerCount(action.payload)
      const notice =
        nextValue !== action.payload
          ? {
              severity: 'warning' as const,
              message: `玩家人数已自动限制在 ${PLAYER_MIN}-${PLAYER_MAX} 人之间。`,
            }
          : null

      return {
        ...state,
        playerCount: nextValue,
        notice,
      }
    }

    case 'set-notice':
      return {
        ...state,
        notice: action.payload,
      }

    case 'reset-board':
      return {
        ...state,
        stage: 'preflop',
        boardCards: [
          { ...EMPTY_CARD_DRAFT },
          { ...EMPTY_CARD_DRAFT },
          { ...EMPTY_CARD_DRAFT },
          { ...EMPTY_CARD_DRAFT },
          { ...EMPTY_CARD_DRAFT },
        ],
        notice: null,
      }

    default:
      return state
  }
}
