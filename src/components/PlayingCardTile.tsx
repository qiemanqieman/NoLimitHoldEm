import { Box, Stack, Typography } from '@mui/material'

import type { CardDraft, Suit } from '../lib/cards'

interface PlayingCardTileProps {
  label: string
  draft: CardDraft
  active?: boolean
  disabled?: boolean
  onClick?: () => void
}

function getSuitPalette(suit: Suit | null): {
  background: string
  border: string
  accent: string
  text: string
} {
  switch (suit) {
    case '♥':
      return {
        background: 'linear-gradient(180deg, rgba(178, 26, 26, 0.96), rgba(112, 16, 16, 0.92))',
        border: 'rgba(255, 101, 101, 0.58)',
        accent: '#ffb3b3',
        text: '#fff4f4',
      }
    case '♦':
      return {
        background: 'linear-gradient(180deg, rgba(38, 78, 210, 0.96), rgba(28, 54, 148, 0.92))',
        border: 'rgba(106, 150, 255, 0.56)',
        accent: '#bfd2ff',
        text: '#f6f8ff',
      }
    case '♣':
      return {
        background: 'linear-gradient(180deg, rgba(11, 143, 49, 0.96), rgba(7, 95, 33, 0.92))',
        border: 'rgba(108, 231, 142, 0.54)',
        accent: '#c4ffd0',
        text: '#f4fff5',
      }
    case '♠':
      return {
        background: 'linear-gradient(180deg, rgba(76, 76, 88, 0.96), rgba(46, 46, 58, 0.94))',
        border: 'rgba(168, 168, 184, 0.42)',
        accent: '#d5d7de',
        text: '#f5f7fa',
      }
    default:
      return {
        background: 'linear-gradient(180deg, rgba(28, 40, 61, 0.96), rgba(17, 26, 44, 0.94))',
        border: 'rgba(86, 110, 156, 0.32)',
        accent: '#7f95be',
        text: '#d7e1f5',
      }
  }
}

export function PlayingCardTile({
  label,
  draft,
  active = false,
  disabled = false,
  onClick,
}: PlayingCardTileProps) {
  const palette = getSuitPalette(draft.suit)
  const selected = Boolean(draft.rank && draft.suit)

  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`${label} ${selected ? `${draft.suit}${draft.rank}` : '未选择'}`}
      sx={{
        position: 'relative',
        width: { xs: 62, sm: 76 },
        height: { xs: 88, sm: 104 },
        p: 0,
        borderRadius: 3,
        border: '1px solid',
        borderColor: active ? 'secondary.main' : palette.border,
        background: palette.background,
        boxShadow: active ? '0 0 0 2px rgba(255, 152, 0, 0.22)' : 'none',
        opacity: disabled ? 0.42 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease',
        '&:active': {
          transform: disabled ? 'none' : 'scale(0.98)',
        },
      }}
    >
      <Stack
        justifyContent="space-between"
        sx={{
          width: '100%',
          height: '100%',
          px: 1,
          py: 0.9,
          textAlign: 'left',
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: selected ? palette.accent : 'text.secondary',
            fontSize: 10,
            fontWeight: 700,
            lineHeight: 1.1,
          }}
        >
          {label}
        </Typography>

        {selected ? (
          <>
            <Typography
              sx={{
                color: palette.text,
                fontSize: { xs: 28, sm: 34 },
                fontWeight: 900,
                lineHeight: 1,
              }}
            >
              {draft.rank}
            </Typography>
            <Typography
              sx={{
                color: palette.text,
                fontSize: { xs: 20, sm: 24 },
                fontWeight: 800,
                lineHeight: 1,
                textAlign: 'right',
              }}
            >
              {draft.suit}
            </Typography>
          </>
        ) : (
          <Stack justifyContent="center" alignItems="center" flex={1} spacing={0.75}>
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: 1.5,
                border: '2px dashed rgba(125, 144, 179, 0.34)',
              }}
            />
            <Typography
              sx={{
                color: 'text.secondary',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.04em',
              }}
            >
              选择
            </Typography>
          </Stack>
        )}
      </Stack>
    </Box>
  )
}
