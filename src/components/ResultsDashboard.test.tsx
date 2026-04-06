import { ThemeProvider } from '@mui/material'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { appTheme } from '../theme'
import { ResultsDashboard } from './ResultsDashboard'

describe('ResultsDashboard', () => {
  it('展示模拟结果关键信息', () => {
    render(
      <ThemeProvider theme={appTheme}>
        <ResultsDashboard
          progress={1}
          loading={false}
          onRecalculate={vi.fn()}
          result={{
            iterations: 100000,
            wins: 52000,
            ties: 3000,
            losses: 45000,
            winRate: 0.52,
            tieRate: 0.03,
            lossRate: 0.45,
            standardError: 0.0015,
            confidenceInterval: [0.517, 0.523],
            durationMs: 850,
            handsPerSecond: 117647,
            performanceLimited: false,
            workerCount: 4,
            fromCache: false,
          }}
        />
      </ThemeProvider>,
    )

    expect(screen.getByText('52.00%')).toBeInTheDocument()
    expect(screen.getByText(/95% 置信区间/)).toBeInTheDocument()
    expect(screen.getByText(/117,647 局\/秒/)).toBeInTheDocument()
  })
})
