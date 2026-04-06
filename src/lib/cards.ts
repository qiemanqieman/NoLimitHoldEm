export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'] as const
export const SUITS = ['♠', '♥', '♦', '♣'] as const
export const SUIT_NAMES = ['黑桃', '红桃', '方块', '梅花'] as const
export const STAGES = ['preflop', 'flop', 'turn', 'river'] as const

export type Rank = (typeof RANKS)[number]
export type Suit = (typeof SUITS)[number]
export type Stage = (typeof STAGES)[number]

export interface CardDraft {
  rank: Rank | null
  suit: Suit | null
}

export interface CardDescriptor {
  code: number
  rank: Rank
  suit: Suit
  rankIndex: number
  suitIndex: number
}

export const EMPTY_CARD_DRAFT: CardDraft = {
  rank: null,
  suit: null,
}

export const STAGE_CARD_COUNT: Record<Stage, number> = {
  preflop: 0,
  flop: 3,
  turn: 4,
  river: 5,
}

export const STAGE_LABELS: Record<Stage, string> = {
  preflop: 'Pre-flop',
  flop: 'Flop',
  turn: 'Turn',
  river: 'River',
}

export const PLAYER_MIN = 2
export const PLAYER_MAX = 10

export function encodeCard(rank: Rank, suit: Suit): number {
  const rankIndex = RANKS.indexOf(rank)
  const suitIndex = SUITS.indexOf(suit)

  if (rankIndex < 0 || suitIndex < 0) {
    throw new Error('非法牌面编码')
  }

  return suitIndex * RANKS.length + rankIndex
}

export function decodeCard(code: number): CardDescriptor {
  if (!Number.isInteger(code) || code < 0 || code > 51) {
    throw new Error('牌面超出范围')
  }

  const suitIndex = Math.floor(code / RANKS.length)
  const rankIndex = code % RANKS.length
  const suit = SUITS[suitIndex]
  const rank = RANKS[rankIndex]

  if (!suit || !rank) {
    throw new Error('牌面解码失败')
  }

  return {
    code,
    rank,
    suit,
    rankIndex,
    suitIndex,
  }
}

export function draftToCode(draft: CardDraft): number | null {
  if (!draft.rank || !draft.suit) {
    return null
  }

  return encodeCard(draft.rank, draft.suit)
}

export function codeToDraft(code: number | null): CardDraft {
  if (code === null) {
    return { ...EMPTY_CARD_DRAFT }
  }

  const { rank, suit } = decodeCard(code)
  return { rank, suit }
}

export function formatCardLabel(draft: CardDraft): string {
  if (!draft.rank || !draft.suit) {
    return '未选择'
  }

  return `${draft.suit}${draft.rank}`
}

export function formatCardAriaLabel(draft: CardDraft): string {
  if (!draft.rank || !draft.suit) {
    return '未选择牌面'
  }

  const suitIndex = SUITS.indexOf(draft.suit)
  return `${SUIT_NAMES[suitIndex]}${draft.rank}`
}

export function cloneDraft(draft: CardDraft): CardDraft {
  return {
    rank: draft.rank,
    suit: draft.suit,
  }
}

export function isSameDraft(left: CardDraft, right: CardDraft): boolean {
  return left.rank === right.rank && left.suit === right.suit
}

export function getSuitColor(suit: Suit | null): 'error.main' | 'text.primary' {
  if (suit === '♥' || suit === '♦') {
    return 'error.main'
  }

  return 'text.primary'
}

export function buildDeck(excludedCodes: readonly number[] = []): number[] {
  const excluded = new Set(excludedCodes)
  const deck: number[] = []

  for (let code = 0; code < 52; code += 1) {
    if (!excluded.has(code)) {
      deck.push(code)
    }
  }

  return deck
}

export function getCompletedCardCodes(drafts: readonly CardDraft[]): number[] {
  return drafts.flatMap((draft) => {
    const code = draftToCode(draft)
    return code === null ? [] : [code]
  })
}

export function isCardUsed(
  rank: Rank | null,
  suit: Suit | null,
  usedCodes: ReadonlySet<number>,
): boolean {
  if (!rank || !suit) {
    return false
  }

  return usedCodes.has(encodeCard(rank, suit))
}
