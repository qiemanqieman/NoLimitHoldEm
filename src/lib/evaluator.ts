const WHEEL_MASK = (1 << 12) | 0b1111
const SCORE_BASE = 15

function packScore(category: number, values: readonly number[]): number {
  let score = category

  for (let index = 0; index < 5; index += 1) {
    score = score * SCORE_BASE + (values[index] ?? 0)
  }

  return score
}

function findStraightHigh(mask: number): number | null {
  for (let high = 12; high >= 4; high -= 1) {
    const straightMask = 0b11111 << (high - 4)

    if ((mask & straightMask) === straightMask) {
      return high
    }
  }

  if ((mask & WHEEL_MASK) === WHEEL_MASK) {
    return 3
  }

  return null
}

function collectUniqueRanksDescending(rankMask: number, limit: number): number[] {
  const ranks: number[] = []

  for (let rank = 12; rank >= 0 && ranks.length < limit; rank -= 1) {
    if ((rankMask & (1 << rank)) !== 0) {
      ranks.push(rank)
    }
  }

  return ranks
}

function collectRanksByCount(
  counts: Uint8Array,
  minimumCount: number,
  excluded: readonly number[] = [],
): number[] {
  const excludedSet = new Set(excluded)
  const ranks: number[] = []

  for (let rank = 12; rank >= 0; rank -= 1) {
    const count = counts[rank] ?? 0

    if (count >= minimumCount && !excludedSet.has(rank)) {
      ranks.push(rank)
    }
  }

  return ranks
}

function getRequiredRank(value: number | undefined, message: string): number {
  if (value === undefined) {
    throw new Error(message)
  }

  return value
}

export function evaluateSevenCards(cards: readonly number[]): number {
  if (cards.length < 5 || cards.length > 7) {
    throw new Error('比牌只支持 5 到 7 张牌')
  }

  const rankCounts = new Uint8Array(13)
  const suitCounts = new Uint8Array(4)
  const suitMasks = new Uint16Array(4)
  let rankMask = 0

  for (const card of cards) {
    if (!Number.isInteger(card) || card < 0 || card > 51) {
      throw new Error('检测到非法牌面')
    }

    const rank = card % 13
    const suit = Math.floor(card / 13)

    rankCounts[rank] = (rankCounts[rank] ?? 0) + 1
    suitCounts[suit] = (suitCounts[suit] ?? 0) + 1
    suitMasks[suit] = (suitMasks[suit] ?? 0) | (1 << rank)
    rankMask |= 1 << rank
  }

  let flushSuit = -1

  for (let suit = 0; suit < 4; suit += 1) {
    if ((suitCounts[suit] ?? 0) >= 5) {
      flushSuit = suit
      break
    }
  }

  if (flushSuit >= 0) {
    const straightFlushHigh = findStraightHigh(suitMasks[flushSuit] ?? 0)

    if (straightFlushHigh !== null) {
      return packScore(8, [straightFlushHigh])
    }
  }

  const fours = collectRanksByCount(rankCounts, 4)
  if (fours.length > 0) {
    const fourRank = getRequiredRank(fours[0], '四条牌型缺失')
    const kicker = getRequiredRank(
      collectRanksByCount(rankCounts, 1, [fourRank])[0],
      '四条踢脚牌缺失',
    )
    return packScore(7, [fourRank, kicker])
  }

  const trips = collectRanksByCount(rankCounts, 3)
  const pairs = collectRanksByCount(rankCounts, 2)

  if (trips.length > 0) {
    const topTrip = getRequiredRank(trips[0], '三条牌型缺失')
    const fullHousePair =
      trips.length > 1
        ? getRequiredRank(trips[1], '葫芦副牌型缺失')
        : (pairs.find((rank) => rank !== topTrip) ?? null)

    if (fullHousePair !== null) {
      return packScore(6, [topTrip, fullHousePair])
    }
  }

  if (flushSuit >= 0) {
    const flushRanks = collectUniqueRanksDescending(suitMasks[flushSuit] ?? 0, 5)
    return packScore(5, flushRanks)
  }

  const straightHigh = findStraightHigh(rankMask)
  if (straightHigh !== null) {
    return packScore(4, [straightHigh])
  }

  if (trips.length > 0) {
    const topTrip = getRequiredRank(trips[0], '三条牌型缺失')
    const kickers = collectRanksByCount(rankCounts, 1, [topTrip]).slice(0, 2)
    return packScore(3, [topTrip, ...kickers])
  }

  if (pairs.length >= 2) {
    const topPair = getRequiredRank(pairs[0], '两对主对子缺失')
    const secondPair = getRequiredRank(pairs[1], '两对副对子缺失')
    const kicker = getRequiredRank(
      collectRanksByCount(rankCounts, 1, [topPair, secondPair])[0],
      '两对踢脚牌缺失',
    )
    return packScore(2, [topPair, secondPair, kicker])
  }

  if (pairs.length === 1) {
    const pairRank = getRequiredRank(pairs[0], '一对牌型缺失')
    const kickers = collectRanksByCount(rankCounts, 1, [pairRank]).slice(0, 3)
    return packScore(1, [pairRank, ...kickers])
  }

  return packScore(0, collectRanksByCount(rankCounts, 1).slice(0, 5))
}
