import { useMemo, useState } from 'react'
import type { MouseEvent } from 'react'
import BackspaceRoundedIcon from '@mui/icons-material/BackspaceRounded'
import {
  Box,
  Button,
  Chip,
  IconButton,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material'

import {
  RANKS,
  SUITS,
  formatCardAriaLabel,
  formatCardLabel,
  getSuitColor,
  isCardUsed,
} from '../lib/cards'
import type { CardDraft, Rank, Suit } from '../lib/cards'

interface CardSlotPickerProps {
  label: string
  draft: CardDraft
  disabled?: boolean
  usedCodes: ReadonlySet<number>
  onRankChange: (rank: Rank | null) => void
  onSuitChange: (suit: Suit | null) => void
  onClear: () => void
}

type MenuTarget = 'rank' | 'suit' | null

export function CardSlotPicker({
  label,
  draft,
  disabled = false,
  usedCodes,
  onRankChange,
  onSuitChange,
  onClear,
}: CardSlotPickerProps) {
  const [menuTarget, setMenuTarget] = useState<MenuTarget>(null)
  const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null)

  const selectionText = useMemo(() => formatCardLabel(draft), [draft])
  const ariaLabel = useMemo(() => formatCardAriaLabel(draft), [draft])

  const openMenu = (target: Exclude<MenuTarget, null>) => (event: MouseEvent<HTMLElement>) => {
    setMenuTarget(target)
    setAnchorElement(event.currentTarget)
  }

  const closeMenu = () => {
    setMenuTarget(null)
    setAnchorElement(null)
  }

  const handleRankSelect = (rank: Rank | null) => {
    onRankChange(rank)
    closeMenu()
  }

  const handleSuitSelect = (suit: Suit | null) => {
    onSuitChange(suit)
    closeMenu()
  }

  return (
    <Stack
      spacing={1.25}
      sx={{
        p: { xs: 1.25, sm: 1.5 },
        borderRadius: 3,
        border: '1px solid',
        borderColor: disabled ? 'divider' : 'primary.main',
        opacity: disabled ? 0.48 : 1,
        minHeight: { xs: 140, sm: 160 },
        justifyContent: 'space-between',
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
        <Typography variant="subtitle2" component="h3">
          {label}
        </Typography>
        <Chip
          size="small"
          label={selectionText}
          aria-label={`${label} 当前选择 ${ariaLabel}`}
          sx={{
            color: getSuitColor(draft.suit),
            fontWeight: 700,
          }}
        />
      </Stack>

      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={openMenu('rank')}
          disabled={disabled}
          fullWidth
          aria-label={`${label} 点数选择`}
          sx={{
            flex: '1 1 132px',
            px: { xs: 1.25, sm: 1.5 },
            justifyContent: 'space-between',
            fontSize: { xs: 13, sm: 14 },
          }}
        >
          <Box
            component="span"
            sx={{
              display: 'flex',
              width: '100%',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
            }}
          >
            <Box component="span">点数</Box>
            <Box component="span" sx={{ fontWeight: 800 }}>
              {draft.rank ?? '—'}
            </Box>
          </Box>
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          onClick={openMenu('suit')}
          disabled={disabled}
          fullWidth
          aria-label={`${label} 花色选择`}
          sx={{
            flex: '1 1 132px',
            px: { xs: 1.25, sm: 1.5 },
            justifyContent: 'space-between',
            fontSize: { xs: 13, sm: 14 },
          }}
        >
          <Box
            component="span"
            sx={{
              display: 'flex',
              width: '100%',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
            }}
          >
            <Box component="span">花色</Box>
            <Box component="span" sx={{ fontWeight: 800 }}>
              {draft.suit ?? '—'}
            </Box>
          </Box>
        </Button>
      </Stack>

      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
        <Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: { xs: 'none', sm: 'block' } }}
          >
            双按钮输入，自动阻止重复牌面
          </Typography>
        </Box>
        <IconButton
          aria-label={`清空 ${label}`}
          disabled={disabled || (!draft.rank && !draft.suit)}
          onClick={onClear}
          color="inherit"
        >
          <BackspaceRoundedIcon />
        </IconButton>
      </Stack>

      <Menu anchorEl={anchorElement} open={menuTarget === 'rank'} onClose={closeMenu}>
        <MenuItem onClick={() => handleRankSelect(null)}>清空点数</MenuItem>
        {RANKS.map((rank) => {
          const disabledItem = isCardUsed(rank, draft.suit, usedCodes)
          return (
            <MenuItem
              key={rank}
              selected={rank === draft.rank}
              disabled={disabledItem}
              onClick={() => handleRankSelect(rank)}
              aria-label={`${label} 选择点数 ${rank}`}
            >
              <ListItemText primary={rank} secondary={disabledItem ? '已被占用' : '可选'} />
            </MenuItem>
          )
        })}
      </Menu>

      <Menu anchorEl={anchorElement} open={menuTarget === 'suit'} onClose={closeMenu}>
        <MenuItem onClick={() => handleSuitSelect(null)}>清空花色</MenuItem>
        {SUITS.map((suit) => {
          const disabledItem = isCardUsed(draft.rank, suit, usedCodes)
          return (
            <MenuItem
              key={suit}
              selected={suit === draft.suit}
              disabled={disabledItem}
              onClick={() => handleSuitSelect(suit)}
              aria-label={`${label} 选择花色 ${suit}`}
            >
              <ListItemText
                primary={suit}
                secondary={disabledItem ? '已被占用' : '可选'}
                primaryTypographyProps={{ color: getSuitColor(suit) }}
              />
            </MenuItem>
          )
        })}
      </Menu>
    </Stack>
  )
}
