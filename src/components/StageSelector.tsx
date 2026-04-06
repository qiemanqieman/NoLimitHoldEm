import { Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'

import { STAGES, STAGE_LABELS } from '../lib/cards'
import type { Stage } from '../lib/cards'

interface StageSelectorProps {
  value: Stage
  onChange: (stage: Stage) => void
}

export function StageSelector({ value, onChange }: StageSelectorProps) {
  return (
    <Stack spacing={1}>
      <Typography variant="subtitle2" color="text.secondary">
        公共牌阶段
      </Typography>
      <ToggleButtonGroup
        color="primary"
        exclusive
        value={value}
        onChange={(_, nextValue: Stage | null) => {
          if (nextValue) {
            onChange(nextValue)
          }
        }}
        aria-label="公共牌阶段选择"
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          width: '100%',
          gap: 0.75,
          '& .MuiToggleButton-root': {
            borderRadius: 2,
            border: '1px solid rgba(255,255,255,0.08)',
            px: { xs: 0.75, md: 1.5 },
            py: 0.8,
            fontSize: { xs: 12, md: 13 },
            fontWeight: 700,
          },
        }}
      >
        {STAGES.map((stage) => (
          <ToggleButton key={stage} value={stage} aria-label={`切换到 ${STAGE_LABELS[stage]}`}>
            {STAGE_LABELS[stage]}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Stack>
  )
}
