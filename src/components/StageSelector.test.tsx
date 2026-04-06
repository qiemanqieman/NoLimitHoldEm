import { ThemeProvider } from '@mui/material'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { appTheme } from '../theme'
import { StageSelector } from './StageSelector'

describe('StageSelector', () => {
  it('切换阶段时触发回调', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(
      <ThemeProvider theme={appTheme}>
        <StageSelector value="preflop" onChange={onChange} />
      </ThemeProvider>,
    )

    await user.click(screen.getByRole('button', { name: '切换到 Turn' }))
    expect(onChange).toHaveBeenCalledWith('turn')
  })
})
