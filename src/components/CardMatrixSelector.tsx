import { Box, Button, Paper, Stack, Typography } from '@mui/material'

import { RANKS, SUITS, draftToCode, encodeCard, isCardUsed } from '../lib/cards'
import type { CardDraft, Suit } from '../lib/cards'

interface CardMatrixSelectorProps {
  activeTargetLabel: string
  activeDraft: CardDraft
  usedCodes: ReadonlySet<number>
  onSelectCard: (code: number) => void
  onClear: () => void
}

function getSuitRowColor(suit: Suit): {
  background: string
  text: string
  selectedBorder: string
} {
  switch (suit) {
    case '♥':
      return {
        background: 'linear-gradient(180deg, rgba(197, 33, 33, 0.96), rgba(126, 20, 20, 0.94))',
        text: '#fff6f6',
        selectedBorder: '#ffc0c0',
      }
    case '♦':
      return {
        background: 'linear-gradient(180deg, rgba(40, 86, 235, 0.96), rgba(31, 61, 171, 0.94))',
        text: '#f4f7ff',
        selectedBorder: '#bfd0ff',
      }
    case '♣':
      return {
        background: 'linear-gradient(180deg, rgba(14, 160, 56, 0.96), rgba(9, 111, 37, 0.94))',
        text: '#f3fff5',
        selectedBorder: '#b7ffca',
      }
    case '♠':
      return {
        background: 'linear-gradient(180deg, rgba(89, 89, 101, 0.96), rgba(52, 52, 64, 0.94))',
        text: '#f7f9ff',
        selectedBorder: '#d5d8e0',
      }
  }
}

export function CardMatrixSelector({
  activeTargetLabel,
  activeDraft,
  usedCodes,
  onSelectCard,
  onClear,
}: CardMatrixSelectorProps) {
  const selectedCode = draftToCode(activeDraft)
  const orderedRanks = [...RANKS].reverse()

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.5, md: 2 },
        borderRadius: 4,
        border: '1px solid',
        borderColor: 'primary.main',
        overflow: 'hidden',
      }}
    >
      <Stack spacing={1.5}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
          spacing={1}
        >
          <Box>
            <Typography variant="subtitle2" color="primary.main">
              选择手牌
            </Typography>
            <Typography variant="h2" sx={{ fontSize: { xs: '1.15rem', md: '1.35rem' } }}>
              {activeTargetLabel}
            </Typography>
          </Box>
          <Button
            variant="text"
            color="secondary"
            onClick={onClear}
            disabled={selectedCode === null}
            aria-label={`清空 ${activeTargetLabel}`}
          >
            清空当前牌
          </Button>
        </Stack>

        <Stack spacing={0.75}>
          {SUITS.map((suit) => {
            const rowColor = getSuitRowColor(suit)

            return (
              <Box
                key={suit}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(13, minmax(0, 1fr))',
                  gap: 0.5,
                }}
              >
                {orderedRanks.map((rank) => {
                  const code = encodeCard(rank, suit)
                  const selected = code === selectedCode
                  const used = !selected && isCardUsed(rank, suit, usedCodes)

                  return (
                    <Button
                      key={`${suit}-${rank}`}
                      onClick={() => onSelectCard(code)}
                      disabled={used}
                      aria-label={`${activeTargetLabel} 选择 ${suit}${rank}`}
                      sx={{
                        minWidth: 0,
                        minHeight: { xs: 36, sm: 40 },
                        px: 0,
                        borderRadius: 1.5,
                        border: '1px solid',
                        borderColor: selected
                          ? rowColor.selectedBorder
                          : used
                            ? 'rgba(103, 116, 146, 0.12)'
                            : 'rgba(255,255,255,0.08)',
                        background: used ? 'rgba(46, 58, 82, 0.46)' : rowColor.background,
                        color: used ? 'rgba(183, 191, 210, 0.46)' : rowColor.text,
                        fontSize: { xs: 17, sm: 18 },
                        fontWeight: 800,
                        lineHeight: 1,
                        boxShadow: selected ? '0 0 0 2px rgba(255,255,255,0.18) inset' : 'none',
                      }}
                    >
                      {rank}
                    </Button>
                  )
                })}
              </Box>
            )
          })}
        </Stack>
      </Stack>
    </Paper>
  )
}
