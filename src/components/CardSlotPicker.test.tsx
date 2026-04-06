import { ThemeProvider } from '@mui/material'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { encodeCard } from '../lib/cards'
import { appTheme } from '../theme'
import { CardSlotPicker } from './CardSlotPicker'

describe('CardSlotPicker', () => {
  it('当同一张牌已被占用时禁用对应选项', async () => {
    const user = userEvent.setup()

    render(
      <ThemeProvider theme={appTheme}>
        <CardSlotPicker
          label="测试手牌"
          draft={{ rank: 'A', suit: null }}
          usedCodes={new Set([encodeCard('A', '♠')])}
          onRankChange={vi.fn()}
          onSuitChange={vi.fn()}
          onClear={vi.fn()}
        />
      </ThemeProvider>,
    )

    await user.click(screen.getByRole('button', { name: '测试手牌 花色选择' }))

    const disabledOption = await screen.findByRole('menuitem', { name: '测试手牌 选择花色 ♠' })
    expect(disabledOption).toHaveAttribute('aria-disabled', 'true')
  })
})
