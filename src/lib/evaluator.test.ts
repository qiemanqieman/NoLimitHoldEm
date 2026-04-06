import { describe, expect, it } from 'vitest'

import { encodeCard } from './cards'
import { evaluateSevenCards } from './evaluator'

describe('evaluateSevenCards', () => {
  it('正确识别同花顺强于四条', () => {
    const straightFlush = evaluateSevenCards([
      encodeCard('T', '♠'),
      encodeCard('J', '♠'),
      encodeCard('Q', '♠'),
      encodeCard('K', '♠'),
      encodeCard('A', '♠'),
      encodeCard('2', '♦'),
      encodeCard('3', '♣'),
    ])

    const fourOfKind = evaluateSevenCards([
      encodeCard('A', '♠'),
      encodeCard('A', '♥'),
      encodeCard('A', '♦'),
      encodeCard('A', '♣'),
      encodeCard('K', '♠'),
      encodeCard('Q', '♥'),
      encodeCard('2', '♣'),
    ])

    expect(straightFlush).toBeGreaterThan(fourOfKind)
  })

  it('正确识别葫芦强于同花', () => {
    const fullHouse = evaluateSevenCards([
      encodeCard('K', '♠'),
      encodeCard('K', '♥'),
      encodeCard('K', '♦'),
      encodeCard('Q', '♠'),
      encodeCard('Q', '♥'),
      encodeCard('2', '♣'),
      encodeCard('3', '♣'),
    ])

    const flush = evaluateSevenCards([
      encodeCard('A', '♥'),
      encodeCard('J', '♥'),
      encodeCard('8', '♥'),
      encodeCard('6', '♥'),
      encodeCard('4', '♥'),
      encodeCard('K', '♣'),
      encodeCard('Q', '♠'),
    ])

    expect(fullHouse).toBeGreaterThan(flush)
  })

  it('支持轮子顺子', () => {
    const wheel = evaluateSevenCards([
      encodeCard('A', '♠'),
      encodeCard('2', '♥'),
      encodeCard('3', '♦'),
      encodeCard('4', '♣'),
      encodeCard('5', '♠'),
      encodeCard('K', '♦'),
      encodeCard('Q', '♣'),
    ])

    const pair = evaluateSevenCards([
      encodeCard('A', '♣'),
      encodeCard('A', '♦'),
      encodeCard('3', '♠'),
      encodeCard('4', '♥'),
      encodeCard('8', '♣'),
      encodeCard('9', '♦'),
      encodeCard('J', '♣'),
    ])

    expect(wheel).toBeGreaterThan(pair)
  })
})
