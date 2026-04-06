import { useCallback, useMemo, useReducer, useState } from 'react'
import CasinoRoundedIcon from '@mui/icons-material/CasinoRounded'
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Grid,
  Paper,
  Slider,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material'
import { Route, Routes } from 'react-router-dom'

import { CardSlotPicker } from './components/CardSlotPicker'
import { ResultsDashboard } from './components/ResultsDashboard'
import { StageSelector } from './components/StageSelector'
import {
  PLAYER_MAX,
  PLAYER_MIN,
  STAGE_CARD_COUNT,
  draftToCode,
  formatCardLabel,
} from './lib/cards'
import { getCachedSimulation, runSimulation } from './lib/simulationService'
import { calculatorReducer, initialCalculatorState } from './state/calculatorReducer'
import type { CardDraft } from './lib/cards'
import type { SimulationRequest, SimulationSummary } from './lib/monteCarloCore'

const BOARD_LABELS = ['Flop 1', 'Flop 2', 'Flop 3', 'Turn', 'River'] as const
const DEFAULT_ITERATIONS = 150_000

function createUsedCodes(
  heroCards: readonly CardDraft[],
  boardCards: readonly CardDraft[],
  area: 'heroCards' | 'boardCards',
  index: number,
): ReadonlySet<number> {
  const usedCodes = new Set<number>()

  heroCards.forEach((draft, slotIndex) => {
    if (area === 'heroCards' && slotIndex === index) {
      return
    }

    const code = draftToCode(draft)
    if (code !== null) {
      usedCodes.add(code)
    }
  })

  boardCards.forEach((draft, slotIndex) => {
    if (area === 'boardCards' && slotIndex === index) {
      return
    }

    const code = draftToCode(draft)
    if (code !== null) {
      usedCodes.add(code)
    }
  })

  return usedCodes
}

function CalculatorPage() {
  const [state, dispatch] = useReducer(calculatorReducer, initialCalculatorState)
  const [result, setResult] = useState<SimulationSummary | null>(null)
  const [progress, setProgress] = useState(0)
  const [loading, setLoading] = useState(false)

  const activeBoardCount = useMemo(() => STAGE_CARD_COUNT[state.stage], [state.stage])

  const activeBoardCards = useMemo(
    () => state.boardCards.slice(0, activeBoardCount),
    [activeBoardCount, state.boardCards],
  )

  const request = useMemo<SimulationRequest | null>(() => {
    const heroFirst = draftToCode(state.heroCards[0])
    const heroSecond = draftToCode(state.heroCards[1])

    if (heroFirst === null || heroSecond === null) {
      return null
    }

    const boardCodes = activeBoardCards.map(draftToCode)
    if (boardCodes.some((code) => code === null)) {
      return null
    }

    return {
      heroCards: [heroFirst, heroSecond],
      boardCards: boardCodes.filter((code): code is number => code !== null),
      playerCount: state.playerCount,
      iterations: DEFAULT_ITERATIONS,
    }
  }, [activeBoardCards, state.heroCards, state.playerCount])

  const cachedResult = useMemo(() => (request ? getCachedSimulation(request) : null), [request])

  const selectedSummary = useMemo(
    () => [
      ...state.heroCards.map(formatCardLabel),
      ...activeBoardCards.map(formatCardLabel),
      `${state.playerCount} 人桌`,
    ],
    [activeBoardCards, state.heroCards, state.playerCount],
  )

  const handleCalculate = useCallback(async () => {
    if (!request) {
      dispatch({
        type: 'set-notice',
        payload: {
          severity: 'error',
          message: '请先完整选择两张手牌，并补齐当前阶段已开启的公共牌。',
        },
      })
      return
    }

    setLoading(true)
    setProgress(0)

    try {
      const nextResult = await runSimulation(request, (completed, total) => {
        setProgress(total === 0 ? 0 : completed / total)
      })

      setResult(nextResult)

      if (nextResult.performanceLimited) {
        dispatch({
          type: 'set-notice',
          payload: {
            severity: 'warning',
            message: 'Worker 发生异常，已回退到主线程计算，当前性能受限。',
          },
        })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '模拟失败，请稍后重试。'
      dispatch({
        type: 'set-notice',
        payload: {
          severity: 'error',
          message,
        },
      })
    } finally {
      setLoading(false)
    }
  }, [request])

  const updateCard = useCallback(
    (area: 'heroCards' | 'boardCards', index: number, next: Partial<CardDraft>) => {
      const payload: {
        area: 'heroCards' | 'boardCards'
        index: number
        rank?: CardDraft['rank']
        suit?: CardDraft['suit']
      } = {
        area,
        index,
      }

      if ('rank' in next) {
        payload.rank = next.rank ?? null
      }

      if ('suit' in next) {
        payload.suit = next.suit ?? null
      }

      dispatch({
        type: 'update-card',
        payload,
      })
    },
    [],
  )

  const isReadyToCalculate = request !== null

  return (
    <Box sx={{ py: { xs: 3, md: 5 } }}>
      <Container maxWidth="lg">
        <Stack spacing={3}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, md: 4 },
              borderRadius: { xs: 4, md: 6 },
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Stack spacing={2.5}>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={2}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', md: 'center' }}
              >
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <CasinoRoundedIcon color="secondary" />
                    <Typography variant="overline" color="secondary.main">
                      Holdem Odds Lab
                    </Typography>
                  </Stack>
                  <Typography variant="h1">生产级德州扑克胜率计算器</Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 760 }}>
                    React 18 + TypeScript + Vite 构建，支持 Comlink Worker
                    并行蒙特卡洛模拟、即时去重校验、 可访问键盘导航与移动端响应式交互。
                  </Typography>
                </Box>

                <Stack direction="row" flexWrap="wrap" useFlexGap gap={1}>
                  <Chip size="small" label="Worker 并行模拟" color="primary" />
                  <Chip size="small" label="标准误差 ≤ 0.3%" color="secondary" />
                  <Chip size="small" label="2-10 人桌" variant="outlined" />
                </Stack>
              </Stack>

              <Stack direction="row" flexWrap="wrap" useFlexGap gap={1}>
                {selectedSummary.map((item, index) => (
                  <Chip key={`${item}-${index}`} size="small" label={item} variant="outlined" />
                ))}
                {cachedResult ? (
                  <Chip size="small" label="输入命中缓存" color="success" />
                ) : null}
              </Stack>
            </Stack>
          </Paper>

          <Grid container spacing={3}>
            <Grid item xs={12} lg={7}>
              <Stack spacing={3}>
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 2, md: 3 },
                    borderRadius: 5,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Stack spacing={2}>
                    <Typography variant="h2">英雄手牌</Typography>
                    <Grid container spacing={2}>
                      {state.heroCards.map((draft, index) => (
                        <Grid key={`hero-${index}`} item xs={12} sm={6}>
                          <CardSlotPicker
                            label={`手牌 ${index + 1}`}
                            draft={draft}
                            usedCodes={createUsedCodes(
                              state.heroCards,
                              state.boardCards,
                              'heroCards',
                              index,
                            )}
                            onRankChange={(rank) => updateCard('heroCards', index, { rank })}
                            onSuitChange={(suit) => updateCard('heroCards', index, { suit })}
                            onClear={() =>
                              updateCard('heroCards', index, {
                                rank: null,
                                suit: null,
                              })
                            }
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </Stack>
                </Paper>

                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 2, md: 3 },
                    borderRadius: 5,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Stack spacing={2}>
                    <StageSelector
                      value={state.stage}
                      onChange={(stage) => dispatch({ type: 'set-stage', payload: stage })}
                    />

                    <Grid container spacing={2}>
                      {state.boardCards.map((draft, index) => {
                        const disabled = index >= activeBoardCount
                        const boardLabel = BOARD_LABELS[index] ?? `Board ${index + 1}`

                        return (
                          <Grid key={`board-${boardLabel}`} item xs={12} sm={6} md={4}>
                            <CardSlotPicker
                              label={boardLabel}
                              draft={draft}
                              disabled={disabled}
                              usedCodes={createUsedCodes(
                                state.heroCards,
                                state.boardCards,
                                'boardCards',
                                index,
                              )}
                              onRankChange={(rank) => updateCard('boardCards', index, { rank })}
                              onSuitChange={(suit) => updateCard('boardCards', index, { suit })}
                              onClear={() =>
                                updateCard('boardCards', index, {
                                  rank: null,
                                  suit: null,
                                })
                              }
                            />
                          </Grid>
                        )
                      })}
                    </Grid>
                  </Stack>
                </Paper>

                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 2, md: 3 },
                    borderRadius: 5,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Stack spacing={2}>
                    <Stack direction="row" justifyContent="space-between" spacing={2}>
                      <Box>
                        <Typography variant="h2">玩家人数</Typography>
                        <Typography variant="body2" color="text.secondary">
                          滑块输入会自动限制在 {PLAYER_MIN}-{PLAYER_MAX} 人
                        </Typography>
                      </Box>
                      <Chip
                        label={`${state.playerCount} 人`}
                        color="primary"
                        aria-label={`当前玩家人数 ${state.playerCount}`}
                      />
                    </Stack>

                    <Slider
                      value={state.playerCount}
                      min={PLAYER_MIN}
                      max={PLAYER_MAX}
                      step={1}
                      marks
                      valueLabelDisplay="auto"
                      aria-label="玩家人数滑块"
                      onChange={(_, value) =>
                        dispatch({
                          type: 'set-player-count',
                          payload: Array.isArray(value) ? (value[0] ?? PLAYER_MIN) : value,
                        })
                      }
                    />

                    <Button
                      variant="contained"
                      size="large"
                      onClick={() => {
                        void handleCalculate()
                      }}
                      disabled={!isReadyToCalculate || loading}
                      aria-label="开始计算胜率"
                    >
                      {loading ? '计算中…' : '开始计算'}
                    </Button>
                  </Stack>
                </Paper>
              </Stack>
            </Grid>

            <Grid item xs={12} lg={5}>
              <ResultsDashboard
                result={result}
                progress={progress}
                loading={loading}
                onRecalculate={() => {
                  void handleCalculate()
                }}
              />
            </Grid>
          </Grid>
        </Stack>
      </Container>

      {state.notice ? (
        <Snackbar
          open
          autoHideDuration={3200}
          onClose={() => dispatch({ type: 'set-notice', payload: null })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            severity={state.notice.severity}
            variant="filled"
            sx={{ width: '100%' }}
            onClose={() => dispatch({ type: 'set-notice', payload: null })}
          >
            {state.notice.message}
          </Alert>
        </Snackbar>
      ) : null}
    </Box>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<CalculatorPage />} />
      <Route path="*" element={<CalculatorPage />} />
    </Routes>
  )
}

export default App
