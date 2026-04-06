import { describe, expect, it } from 'vitest'

import { encodeCard } from './cards'
import {
  serializeSimulationRequest,
  simulateMonteCarlo,
  summarizeSimulation,
} from './monteCarloCore'

describe('monteCarloCore', () => {
  it('序列化请求时忽略公共牌顺序差异', () => {
    const left = serializeSimulationRequest({
      heroCards: [encodeCard('A', '♠'), encodeCard('K', '♠')],
      boardCards: [encodeCard('2', '♣'), encodeCard('3', '♦'), encodeCard('4', '♥')],
      playerCount: 5,
      iterations: 1000,
    })

    const right = serializeSimulationRequest({
      heroCards: [encodeCard('K', '♠'), encodeCard('A', '♠')],
      boardCards: [encodeCard('4', '♥'), encodeCard('2', '♣'), encodeCard('3', '♦')],
      playerCount: 5,
      iterations: 1000,
    })

    expect(left).toBe(right)
  })

  it('检测重复牌面输入', () => {
    expect(() =>
      simulateMonteCarlo({
        heroCards: [encodeCard('A', '♠'), encodeCard('A', '♠')],
        boardCards: [],
        playerCount: 2,
        iterations: 100,
      }),
    ).toThrow('存在重复牌面')
  })

  it('在固定种子下完成模拟并输出完整统计', () => {
    const partial = simulateMonteCarlo({
      heroCards: [encodeCard('A', '♠'), encodeCard('A', '♥')],
      boardCards: [
        encodeCard('2', '♣'),
        encodeCard('7', '♦'),
        encodeCard('9', '♥'),
        encodeCard('J', '♠'),
        encodeCard('3', '♣'),
      ],
      playerCount: 3,
      iterations: 20,
      seed: 12345,
    })

    expect(partial.iterations).toBe(20)
    expect(partial.wins + partial.ties + partial.losses).toBe(20)
  })

  it('生成带统计指标的汇总结果', () => {
    const summary = summarizeSimulation(
      {
        iterations: 1000,
        wins: 400,
        ties: 100,
        losses: 500,
      },
      100,
      2,
      false,
    )

    expect(summary.winRate).toBeCloseTo(0.4)
    expect(summary.tieRate).toBeCloseTo(0.1)
    expect(summary.standardError).toBeLessThan(0.02)
    expect(summary.handsPerSecond).toBeGreaterThan(9000)
  })
})
