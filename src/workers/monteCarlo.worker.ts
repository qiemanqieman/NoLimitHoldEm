import { expose } from 'comlink'

import { simulateMonteCarlo } from '../lib/monteCarloCore'
import type {
  ProgressReporter,
  SimulationPartialResult,
  SimulationRequest,
} from '../lib/monteCarloCore'

export interface MonteCarloWorkerApi {
  simulate: (
    request: SimulationRequest,
    onProgress?: ProgressReporter,
  ) => Promise<SimulationPartialResult> | SimulationPartialResult
}

const api: MonteCarloWorkerApi = {
  simulate(request, onProgress) {
    return simulateMonteCarlo(request, onProgress)
  },
}

expose(api)
