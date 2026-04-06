import {
  Box,
  Button,
  Chip,
  Divider,
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
        p: { xs: 1.5, md: 2.5 },
        borderRadius: 4,
        border: '1px solid',
        borderColor: 'divider',
        minHeight: { xs: 0, lg: 540 },
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1.5}>
          <Box>
            <Typography variant="subtitle2" color="primary.main">
              胜率结果
            </Typography>
            <Typography variant="h2">胜率仪表盘</Typography>
            <Typography variant="body2" color="text.secondary">
              实时展示胜率、平局率与模拟统计
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="secondary"
            onClick={onRecalculate}
            disabled={loading}
            aria-label="重新计算胜率"
            sx={{ whiteSpace: 'nowrap' }}
          >
            重新计算
          </Button>
        </Stack>

        {loading ? (
          <Stack spacing={2}>
            <Skeleton variant="rounded" width="100%" height={132} />
            <LinearProgress variant="determinate" value={displayProgress} />
            <Typography variant="body2" color="text.secondary">
              正在并行模拟中：{displayProgress}%
            </Typography>
          </Stack>
        ) : result ? (
          <Stack spacing={2}>
            <Box
              sx={{
                p: { xs: 1.5, md: 2 },
                borderRadius: 3,
                background:
                  'linear-gradient(135deg, rgba(23, 78, 201, 0.24), rgba(23, 178, 104, 0.16))',
                border: '1px solid rgba(64, 127, 255, 0.26)',
              }}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="flex-start"
                spacing={1.5}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    当前胜率
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: { xs: '2rem', md: '2.4rem' },
                      fontWeight: 900,
                      lineHeight: 1.05,
                    }}
                  >
                    {formatPercent(result.winRate)}
                  </Typography>
                </Box>
                <Stack
                  direction="row"
                  flexWrap="wrap"
                  useFlexGap
                  gap={0.75}
                  justifyContent="flex-end"
                >
                  <Chip
                    size="small"
                    label={`平局 ${formatPercent(result.tieRate)}`}
                    color="primary"
                  />
                  <Chip
                    size="small"
                    label={result.performanceLimited ? '性能受限' : '并行计算'}
                    color={result.performanceLimited ? 'warning' : 'success'}
                  />
                </Stack>
              </Stack>

              <Box sx={{ mt: 1.5 }}>
                <LinearProgress
                  variant="determinate"
                  value={result.winRate * 100}
                  sx={{
                    height: 10,
                    borderRadius: 999,
                    backgroundColor: 'rgba(255,255,255,0.08)',
                  }}
                />
              </Box>
            </Box>

            <Stack
              direction="row"
              flexWrap="wrap"
              useFlexGap
              gap={1}
              sx={{
                '& > *': {
                  flex: '1 1 160px',
                },
              }}
            >
              <Paper
                elevation={0}
                sx={{ p: 1.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}
              >
                <Typography variant="caption" color="text.secondary">
                  95% 置信区间
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.5 }}>
                  {formatPercent(result.confidenceInterval[0])} -{' '}
                  {formatPercent(result.confidenceInterval[1])}
                </Typography>
              </Paper>
              <Paper
                elevation={0}
                sx={{ p: 1.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}
              >
                <Typography variant="caption" color="text.secondary">
                  标准误差
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.5 }}>
                  {formatPercent(result.standardError)}
                </Typography>
              </Paper>
              <Paper
                elevation={0}
                sx={{ p: 1.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}
              >
                <Typography variant="caption" color="text.secondary">
                  模拟速度
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.5 }}>
                  {Math.round(result.handsPerSecond).toLocaleString()} 局/秒
                </Typography>
              </Paper>
              <Paper
                elevation={0}
                sx={{ p: 1.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}
              >
                <Typography variant="caption" color="text.secondary">
                  总耗时
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.5 }}>
                  {result.durationMs.toFixed(0)} ms
                </Typography>
              </Paper>
            </Stack>

            <Divider />

            <Typography variant="body2" color="text.secondary">
              总样本 {result.iterations.toLocaleString()}，
              {result.lossRate > 0 ? '败率' : '败率接近零'} {formatPercent(result.lossRate)}，
              {result.performanceLimited
                ? '当前已回退到主线程单线程计算。'
                : `当前使用 ${result.workerCount} 个工作线程。`}
            </Typography>
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
