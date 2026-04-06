import {
  Box,
  Button,
  CircularProgress,
  LinearProgress,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'

import type { SimulationSummary } from '../lib/monteCarloCore'

interface ResultsDashboardProps {
  result: SimulationSummary | null
  progress: number
  loading: boolean
  onRecalculate: () => void
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`
}

export function ResultsDashboard({
  result,
  progress,
  loading,
  onRecalculate,
}: ResultsDashboardProps) {
  const displayProgress = Math.round(progress * 100)

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: 5,
        border: '1px solid',
        borderColor: 'divider',
        minHeight: 380,
      }}
    >
      <Stack spacing={2.5}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
          <Box>
            <Typography variant="h2">结果仪表盘</Typography>
            <Typography variant="body2" color="text.secondary">
              蒙特卡洛模拟输出胜率、平局率与置信区间
            </Typography>
          </Box>
          <Button
            variant="outlined"
            color="secondary"
            onClick={onRecalculate}
            disabled={loading}
            aria-label="重新计算胜率"
          >
            重新计算
          </Button>
        </Stack>

        {loading ? (
          <Stack spacing={2}>
            <Skeleton variant="rounded" width="100%" height={220} />
            <LinearProgress variant="determinate" value={displayProgress} />
            <Typography variant="body2" color="text.secondary">
              正在并行模拟中：{displayProgress}%
            </Typography>
          </Stack>
        ) : result ? (
          <Stack spacing={3}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={3}
              alignItems={{ xs: 'flex-start', md: 'center' }}
            >
              <Box sx={{ position: 'relative', display: 'inline-flex', alignSelf: 'center' }}>
                <CircularProgress
                  variant="determinate"
                  value={100}
                  size={180}
                  thickness={4}
                  sx={{ color: 'rgba(255,255,255,0.1)', position: 'absolute', inset: 0 }}
                />
                <CircularProgress
                  variant="determinate"
                  value={result.winRate * 100}
                  size={180}
                  thickness={4}
                  color="primary"
                />
                <Box
                  sx={{
                    inset: 0,
                    position: 'absolute',
                    display: 'grid',
                    placeItems: 'center',
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="overline" color="text.secondary">
                    胜率
                  </Typography>
                  <Typography variant="h3">{formatPercent(result.winRate)}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    平局 {formatPercent(result.tieRate)}
                  </Typography>
                </Box>
              </Box>

              <Stack spacing={1.5} flex={1}>
                <Typography variant="body1">
                  95% 置信区间：{formatPercent(result.confidenceInterval[0])} -{' '}
                  {formatPercent(result.confidenceInterval[1])}
                </Typography>
                <Typography variant="body1">
                  标准误差：{formatPercent(result.standardError)}
                </Typography>
                <Typography variant="body1">
                  速度：{Math.round(result.handsPerSecond).toLocaleString()} 局/秒
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  总样本 {result.iterations.toLocaleString()}，耗时{' '}
                  {result.durationMs.toFixed(0)} ms，
                  {result.performanceLimited
                    ? '当前已回退到主线程单线程计算，性能受限。'
                    : `并行工作线程 ${result.workerCount} 个。`}
                </Typography>
              </Stack>
            </Stack>
          </Stack>
        ) : (
          <Stack spacing={1.5} justifyContent="center" sx={{ minHeight: 240 }}>
            <Typography variant="h4">等待首次计算</Typography>
            <Typography variant="body2" color="text.secondary">
              选择手牌、街道和玩家人数后，点击“开始计算”查看胜率与置信区间。
            </Typography>
          </Stack>
        )}
      </Stack>
    </Paper>
  )
}
