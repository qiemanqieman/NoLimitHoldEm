import { describe, expect, it } from 'vitest'

import {
  buildDeck,
  codeToDraft,
  decodeCard,
  draftToCode,
  encodeCard,
  formatCardAriaLabel,
  formatCardLabel,
  getCompletedCardCodes,
  getSuitColor,
  isCardUsed,
} from './cards'

describe('cards helpers', () => {
  it('可以在编码与解码之间往返', () => {
    const code = encodeCard('A', '♠')
    const decoded = decodeCard(code)

    expect(decoded.rank).toBe('A')
    expect(decoded.suit).toBe('♠')
    expect(codeToDraft(code)).toEqual({ rank: 'A', suit: '♠' })
    expect(draftToCode({ rank: 'A', suit: '♠' })).toBe(code)
  })

  it('格式化文案适配屏幕阅读器', () => {
    expect(formatCardLabel({ rank: 'K', suit: '♥' })).toBe('♥K')
    expect(formatCardAriaLabel({ rank: 'K', suit: '♥' })).toBe('红桃K')
    expect(getSuitColor('♥')).toBe('error.main')
  })

  it('根据排除列表生成牌堆', () => {
    const excluded = [encodeCard('A', '♠'), encodeCard('K', '♣')]
    const deck = buildDeck(excluded)

    expect(deck).toHaveLength(50)
    expect(deck).not.toContain(excluded[0])
    expect(deck).not.toContain(excluded[1])
  })

  it('识别已占用牌面并收集已完成牌', () => {
    const usedCodes = new Set([encodeCard('Q', '♦')])

    expect(isCardUsed('Q', '♦', usedCodes)).toBe(true)
    expect(
      getCompletedCardCodes([
        { rank: 'Q', suit: '♦' },
        { rank: 'A', suit: null },
      ]),
    ).toEqual([encodeCard('Q', '♦')])
  })

  it('对非法编码抛错', () => {
    expect(() => decodeCard(99)).toThrow('牌面超出范围')
  })
})
