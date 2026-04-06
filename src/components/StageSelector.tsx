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
      <Typography variant="subtitle2">公共牌阶段</Typography>
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
