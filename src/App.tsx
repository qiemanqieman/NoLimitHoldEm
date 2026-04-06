import { useCallback, useMemo, useReducer, useState } from 'react'
import CasinoRoundedIcon from '@mui/icons-material/CasinoRounded'
import FlashOnRoundedIcon from '@mui/icons-material/FlashOnRounded'
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded'
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded'
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

import { CardMatrixSelector } from './components/CardMatrixSelector'
import { PlayingCardTile } from './components/PlayingCardTile'
import { ResultsDashboard } from './components/ResultsDashboard'
import { StageSelector } from './components/StageSelector'
import {
  PLAYER_MAX,
  PLAYER_MIN,
  STAGE_CARD_COUNT,
  decodeCard,
  draftToCode,
  formatCardLabel,
} from './lib/cards'
import { getCachedSimulation, runSimulation } from './lib/simulationService'
import { calculatorReducer, initialCalculatorState } from './state/calculatorReducer'
import type { CardDraft } from './lib/cards'
import type { SimulationRequest, SimulationSummary } from './lib/monteCarloCore'

const BOARD_LABELS = ['Flop 1', 'Flop 2', 'Flop 3', 'Turn', 'River'] as const
const DEFAULT_ITERATIONS = 150_000

interface ActiveTarget {
  area: 'heroCards' | 'boardCards'
  index: number
}

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

function getTargetLabel(target: ActiveTarget): string {
  if (target.area === 'heroCards') {
    return `玩家 1 - 手牌 ${target.index + 1}`
  }

  return `公共牌 - ${BOARD_LABELS[target.index] ?? `牌位 ${target.index + 1}`}`
}

function CalculatorPage() {
  const [state, dispatch] = useReducer(calculatorReducer, initialCalculatorState)
  const [result, setResult] = useState<SimulationSummary | null>(null)
  const [progress, setProgress] = useState(0)
  const [loading, setLoading] = useState(false)
  const [activeTarget, setActiveTarget] = useState<ActiveTarget>({
    area: 'heroCards',
    index: 0,
  })

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

  const selectedSummary = useMemo(() => {
    const completedCards = [...state.heroCards, ...activeBoardCards]
      .map(formatCardLabel)
      .filter((label) => label !== '未选择')

    return [...completedCards, `${state.playerCount} 人桌`]
  }, [activeBoardCards, state.heroCards, state.playerCount])

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

  const activeDraft =
    activeTarget.area === 'heroCards'
      ? (state.heroCards[activeTarget.index] ?? { rank: null, suit: null })
      : (state.boardCards[activeTarget.index] ?? { rank: null, suit: null })

  const activeUsedCodes = useMemo(
    () =>
      createUsedCodes(state.heroCards, state.boardCards, activeTarget.area, activeTarget.index),
    [activeTarget.area, activeTarget.index, state.boardCards, state.heroCards],
  )

  const handleSelectCardCode = useCallback(
    (code: number) => {
      const { rank, suit } = decodeCard(code)
      updateCard(activeTarget.area, activeTarget.index, { rank, suit })
    },
    [activeTarget.area, activeTarget.index, updateCard],
  )

  const isReadyToCalculate = request !== null

  return (
    <Box sx={{ py: { xs: 2, md: 4 } }}>
      <Container maxWidth={false} sx={{ maxWidth: 1240 }}>
        <Stack spacing={{ xs: 2, md: 3 }}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 1.75, md: 3 },
              borderRadius: { xs: 4, md: 5 },
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Stack spacing={2}>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={2}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', md: 'center' }}
              >
                <Box sx={{ maxWidth: 760 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <CasinoRoundedIcon color="secondary" />
                    <Typography variant="overline" color="secondary.main">
                      Holdem Odds Lab
                    </Typography>
                  </Stack>
                  <Typography
                    variant="h1"
                    sx={{
                      fontSize: { xs: '2rem', md: '3rem' },
                      lineHeight: { xs: 1.06, md: 1.08 },
                    }}
                  >
                    扑克胜率计算器 · 更贴近专业工具的输入体验
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ mt: 1, maxWidth: 720, fontSize: { xs: 15, md: 17 } }}
                  >
                    参考专业赔率工具重新组织布局。手机端先点选目标牌位，再用四色牌阵一键选牌；桌面端保持清晰分区与即时结果反馈。
                  </Typography>
                </Box>

                <Stack
                  direction="row"
                  flexWrap="wrap"
                  useFlexGap
                  gap={1}
                  justifyContent="flex-end"
                >
                  <Chip size="small" label="Worker 并行模拟" color="primary" />
                  <Chip size="small" label="标准误差 ≤ 0.3%" color="secondary" />
                  <Chip size="small" label="2-10 人桌" variant="outlined" />
                </Stack>
              </Stack>

              {selectedSummary.length > 0 ? (
                <Stack direction="row" flexWrap="wrap" useFlexGap gap={1}>
                  {selectedSummary.map((item, index) => (
                    <Chip
                      key={`${item}-${index}`}
                      size="small"
                      label={item}
                      variant="outlined"
                    />
                  ))}
                  {cachedResult ? (
                    <Chip size="small" label="输入命中缓存" color="success" />
                  ) : null}
                </Stack>
              ) : null}
            </Stack>
          </Paper>

          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <Stack spacing={2}>
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 1.5, md: 2 },
                    borderRadius: 4,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Stack spacing={1.5}>
                    <Stack
                      direction={{ xs: 'column', md: 'row' }}
                      justifyContent="space-between"
                      alignItems={{ xs: 'flex-start', md: 'center' }}
                      spacing={1.25}
                    >
                      <Box>
                        <Typography variant="subtitle2" color="primary.main">
                          公共牌
                        </Typography>
                        <Typography variant="h2">按街道展示桌面牌</Typography>
                      </Box>
                      <Chip
                        size="small"
                        label={`当前阶段 ${state.stage.toUpperCase()}`}
                        color="secondary"
                      />
                    </Stack>

                    <StageSelector
                      value={state.stage}
                      onChange={(stage) => {
                        dispatch({ type: 'set-stage', payload: stage })
                        setActiveTarget({
                          area: STAGE_CARD_COUNT[stage] === 0 ? 'heroCards' : 'boardCards',
                          index: 0,
                        })
                      }}
                    />

                    <Stack direction="row" flexWrap="wrap" useFlexGap gap={1}>
                      {state.boardCards.map((draft, index) => (
                        <PlayingCardTile
                          key={`board-${BOARD_LABELS[index]}`}
                          label={BOARD_LABELS[index] ?? `Board ${index + 1}`}
                          draft={draft}
                          active={
                            activeTarget.area === 'boardCards' && activeTarget.index === index
                          }
                          disabled={index >= activeBoardCount}
                          onClick={() => {
                            if (index < activeBoardCount) {
                              setActiveTarget({
                                area: 'boardCards',
                                index,
                              })
                            }
                          }}
                        />
                      ))}
                    </Stack>
                  </Stack>
                </Paper>

                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 1.5, md: 2 },
                    borderRadius: 4,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Stack spacing={1.5}>
                    <Stack
                      direction={{ xs: 'column', md: 'row' }}
                      justifyContent="space-between"
                      alignItems={{ xs: 'flex-start', md: 'center' }}
                      spacing={1.25}
                    >
                      <Box>
                        <Typography variant="subtitle2" color="primary.main">
                          玩家 1
                        </Typography>
                        <Typography variant="h2">点击手牌后，从下方牌阵直接选择</Typography>
                      </Box>
                      {result ? (
                        <Chip
                          label={`${(result.winRate * 100).toFixed(1)}%`}
                          color="success"
                          sx={{ fontWeight: 800 }}
                        />
                      ) : null}
                    </Stack>

                    <Stack direction="row" flexWrap="wrap" useFlexGap gap={1}>
                      {state.heroCards.map((draft, index) => (
                        <PlayingCardTile
                          key={`hero-${index}`}
                          label={`手牌 ${index + 1}`}
                          draft={draft}
                          active={
                            activeTarget.area === 'heroCards' && activeTarget.index === index
                          }
                          onClick={() =>
                            setActiveTarget({
                              area: 'heroCards',
                              index,
                            })
                          }
                        />
                      ))}
                    </Stack>

                    <Stack
                      direction={{ xs: 'column', md: 'row' }}
                      spacing={1.5}
                      alignItems={{ xs: 'stretch', md: 'center' }}
                    >
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" justifyContent="space-between" spacing={2}>
                          <Typography variant="body2" color="text.secondary">
                            玩家人数
                          </Typography>
                          <Chip
                            size="small"
                            label={`${state.playerCount} 人桌`}
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
                      </Box>

                      <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                        <Button
                          variant="outlined"
                          color="secondary"
                          startIcon={<RestartAltRoundedIcon />}
                          onClick={() => {
                            updateCard('heroCards', 0, { rank: null, suit: null })
                            updateCard('heroCards', 1, { rank: null, suit: null })
                            dispatch({ type: 'reset-board' })
                            setResult(null)
                            setActiveTarget({ area: 'heroCards', index: 0 })
                          }}
                          aria-label="重置牌面"
                        >
                          重置
                        </Button>
                        <Button
                          variant="contained"
                          size="large"
                          startIcon={<FlashOnRoundedIcon />}
                          onClick={() => {
                            void handleCalculate()
                          }}
                          disabled={!isReadyToCalculate || loading}
                          aria-label="开始计算胜率"
                        >
                          {loading ? '计算中…' : '开始计算'}
                        </Button>
                      </Stack>
                    </Stack>
                  </Stack>
                </Paper>

                <CardMatrixSelector
                  activeTargetLabel={getTargetLabel(activeTarget)}
                  activeDraft={activeDraft}
                  usedCodes={activeUsedCodes}
                  onSelectCard={handleSelectCardCode}
                  onClear={() =>
                    updateCard(activeTarget.area, activeTarget.index, {
                      rank: null,
                      suit: null,
                    })
                  }
                />

                <Paper
                  elevation={0}
                  sx={{
                    display: { xs: 'none', lg: 'block' },
                    p: 2,
                    borderRadius: 4,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Stack spacing={1.25}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <GridViewRoundedIcon color="primary" />
                      <Typography variant="h2" sx={{ fontSize: '1.1rem' }}>
                        输入方式说明
                      </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      先点选目标牌位，再从四色牌阵中直接选择点数。已被占用的牌会自动禁用，避免重复输入，更适合手机和桌面端连续操作。
                    </Typography>
                  </Stack>
                </Paper>
              </Stack>
            </Grid>

            <Grid item xs={12} lg={4}>
              <Stack spacing={2}>
                <ResultsDashboard
                  result={result}
                  progress={progress}
                  loading={loading}
                  onRecalculate={() => {
                    void handleCalculate()
                  }}
                />

                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 1.5, md: 2 },
                    borderRadius: 4,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Stack spacing={1}>
                    <Typography variant="subtitle2" color="secondary.main">
                      使用建议
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      建议先补齐公共牌，再设置英雄手牌。若只调整同一场景的玩家人数或重复计算，缓存会直接返回结果。
                    </Typography>
                  </Stack>
                </Paper>
              </Stack>
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
