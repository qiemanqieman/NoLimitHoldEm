import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        'src/components/CardSlotPicker.tsx',
        'src/components/ResultsDashboard.tsx',
        'src/components/StageSelector.tsx',
        'src/lib/cards.ts',
        'src/lib/evaluator.ts',
        'src/lib/monteCarloCore.ts',
        'src/state/calculatorReducer.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        branches: 65,
      },
    },
  },
})
