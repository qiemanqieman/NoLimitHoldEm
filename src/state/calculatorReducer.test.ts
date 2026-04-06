import { describe, expect, it } from 'vitest'

import { calculatorReducer, initialCalculatorState } from './calculatorReducer'
import type { CalculatorState } from './calculatorReducer'

describe('calculatorReducer', () => {
  it('阻止重复牌面写入不同位置', () => {
    const withFirstCard = calculatorReducer(initialCalculatorState, {
      type: 'update-card',
      payload: {
        area: 'heroCards',
        index: 0,
        rank: 'A',
        suit: '♠',
      },
    })

    const duplicated = calculatorReducer(withFirstCard, {
      type: 'update-card',
      payload: {
        area: 'boardCards',
        index: 0,
        rank: 'A',
        suit: '♠',
      },
    })

    expect(duplicated.boardCards[0]).toEqual({ rank: null, suit: null })
    expect(duplicated.notice?.severity).toBe('error')
  })

  it('切换阶段时会清理未到达街道的公共牌', () => {
    const riverState: CalculatorState = {
      ...initialCalculatorState,
      stage: 'river',
      boardCards: [
        { rank: '2', suit: '♠' },
        { rank: '3', suit: '♠' },
        { rank: '4', suit: '♠' },
        { rank: '5', suit: '♠' },
        { rank: '6', suit: '♠' },
      ],
    }

    const flopState = calculatorReducer(riverState, {
      type: 'set-stage',
      payload: 'flop',
    })

    expect(flopState.boardCards[0]).toEqual({ rank: '2', suit: '♠' })
    expect(flopState.boardCards[3]).toEqual({ rank: null, suit: null })
    expect(flopState.boardCards[4]).toEqual({ rank: null, suit: null })
  })

  it('玩家人数超界时自动夹紧', () => {
    const nextState = calculatorReducer(initialCalculatorState, {
      type: 'set-player-count',
      payload: 20,
    })

    expect(nextState.playerCount).toBe(10)
    expect(nextState.notice?.severity).toBe('warning')
  })
})
