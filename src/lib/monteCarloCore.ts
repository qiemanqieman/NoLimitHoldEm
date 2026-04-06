import { buildDeck } from './cards'
import { evaluateSevenCards } from './evaluator'

export interface SimulationRequest {
  heroCards: [number, number]
  boardCards: number[]
  playerCount: number
  iterations: number
  seed?: number
}

export interface SimulationPartialResult {
  iterations: number
  wins: number
  ties: number
  losses: number
}

export interface SimulationSummary extends SimulationPartialResult {
  winRate: number
  tieRate: number
  lossRate: number
  standardError: number
  confidenceInterval: [number, number]
  durationMs: number
  handsPerSecond: number
  performanceLimited: boolean
  workerCount: number
  fromCache: boolean
}

export type ProgressReporter = (completed: number, total: number) => void

function createRng(seed?: number): () => number {
  if (seed === undefined) {
    return Math.random
  }

  let state = seed >>> 0

  return () => {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    return ((state >>> 0) % 1_000_000) / 1_000_000
  }
}

function buildSummary(
  partial: SimulationPartialResult,
  durationMs: number,
  workerCount: number,
  performanceLimited: boolean,
  fromCache: boolean,
): SimulationSummary {
  const safeIterations = Math.max(1, partial.iterations)
  const winRate = partial.wins / safeIterations
  const tieRate = partial.ties / safeIterations
  const lossRate = partial.losses / safeIterations
  const standardError = Math.sqrt((winRate * (1 - winRate)) / safeIterations)
  const margin = 1.96 * standardError

  return {
    ...partial,
    winRate,
    tieRate,
    lossRate,
    standardError,
    confidenceInterval: [Math.max(0, winRate - margin), Math.min(1, winRate + margin)],
    durationMs,
    handsPerSecond: partial.iterations / Math.max(durationMs / 1_000, 0.001),
    performanceLimited,
    workerCount,
    fromCache,
  }
}

export function summarizeSimulation(
  partial: SimulationPartialResult,
  durationMs: number,
  workerCount: number,
  performanceLimited: boolean,
  fromCache = false,
): SimulationSummary {
  return buildSummary(partial, durationMs, workerCount, performanceLimited, fromCache)
}

export function serializeSimulationRequest(request: SimulationRequest): string {
  const sortedBoard = [...request.boardCards].sort((left, right) => left - right)
  return JSON.stringify({
    heroCards: [...request.heroCards].sort((left, right) => left - right),
    boardCards: sortedBoard,
    playerCount: request.playerCount,
    iterations: request.iterations,
  })
}

export function simulateMonteCarlo(
  request: SimulationRequest,
  onProgress?: ProgressReporter,
): SimulationPartialResult {
  const { heroCards, boardCards, iterations, playerCount } = request

  if (playerCount < 2 || playerCount > 10) {
    throw new Error('玩家人数超出允许范围')
  }

  if (boardCards.length > 5) {
    throw new Error('公共牌数量不能超过 5 张')
  }

  const knownCards = [...heroCards, ...boardCards]
  const knownSet = new Set(knownCards)

  if (knownSet.size !== knownCards.length) {
    throw new Error('存在重复牌面，无法开始模拟')
  }

  const sourceDeck = buildDeck(knownCards)
  const baseBoard = [...boardCards]
  const heroSeven = new Array<number>(7)
  const opponentHands = new Array<number>((playerCount - 1) * 2)
  const simulationBatch = Math.min(2_000, Math.max(500, Math.floor(iterations / 60)))
  const missingBoardCards = 5 - boardCards.length
  const drawCount = missingBoardCards + opponentHands.length
  const rng = createRng(request.seed)

  heroSeven[0] = heroCards[0]
  heroSeven[1] = heroCards[1]

  let wins = 0
  let ties = 0
  let losses = 0

  for (let completed = 0; completed < iterations; completed += 1) {
    const deck = [...sourceDeck]

    for (let index = 0; index < drawCount; index += 1) {
      const remaining = deck.length - index
      const swapIndex = index + Math.floor(rng() * remaining)
      const next = deck[index]
      const swapValue = deck[swapIndex]

      if (next === undefined || swapValue === undefined) {
        throw new Error('洗牌失败')
      }

      deck[index] = swapValue
      deck[swapIndex] = next
    }

    const board = [...baseBoard]
    for (let index = 0; index < missingBoardCards; index += 1) {
      const card = deck[index]

      if (card === undefined) {
        throw new Error('牌堆抽牌失败')
      }

      board.push(card)
    }

    for (let index = 0; index < board.length; index += 1) {
      heroSeven[index + 2] = board[index] ?? 0
    }

    for (let index = 0; index < opponentHands.length; index += 1) {
      const card = deck[missingBoardCards + index]

      if (card === undefined) {
        throw new Error('对手抽牌失败')
      }

      opponentHands[index] = card
    }

    const heroScore = evaluateSevenCards(heroSeven)
    let bestScore = heroScore
    let isHeroBest = true
    let tieCount = 1

    for (let opponentIndex = 0; opponentIndex < playerCount - 1; opponentIndex += 1) {
      const cardOne = opponentHands[opponentIndex * 2]
      const cardTwo = opponentHands[opponentIndex * 2 + 1]

      if (cardOne === undefined || cardTwo === undefined) {
        throw new Error('对手手牌缺失')
      }

      const opponentScore = evaluateSevenCards([
        cardOne,
        cardTwo,
        board[0] ?? 0,
        board[1] ?? 0,
        board[2] ?? 0,
        board[3] ?? 0,
        board[4] ?? 0,
      ])

      if (opponentScore > bestScore) {
        bestScore = opponentScore
        isHeroBest = false
        tieCount = 1
      } else if (opponentScore === bestScore) {
        tieCount += 1
        if (bestScore === heroScore) {
          isHeroBest = true
        }
      }
    }

    if (isHeroBest && bestScore === heroScore) {
      if (tieCount > 1) {
        ties += 1
      } else {
        wins += 1
      }
    } else {
      losses += 1
    }

    const nextCompleted = completed + 1
    if (onProgress && (nextCompleted % simulationBatch === 0 || nextCompleted === iterations)) {
      onProgress(nextCompleted, iterations)
    }
  }

  return {
    iterations,
    wins,
    ties,
    losses,
  }
}
