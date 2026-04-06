import * as Comlink from 'comlink'

import {
  serializeSimulationRequest,
  simulateMonteCarlo,
  summarizeSimulation,
} from './monteCarloCore'
import type {
  ProgressReporter,
  SimulationPartialResult,
  SimulationRequest,
  SimulationSummary,
} from './monteCarloCore'
import type { MonteCarloWorkerApi } from '../workers/monteCarlo.worker'

const simulationCache = new Map<string, SimulationSummary>()
const MAX_WORKERS = 4

function getWorkerCount(iterations: number): number {
  if (typeof Worker === 'undefined' || typeof navigator === 'undefined') {
    return 1
  }

  const hardwareThreads = navigator.hardwareConcurrency ?? 2
  const desired =
    iterations >= 160_000 ? Math.min(4, hardwareThreads) : Math.min(2, hardwareThreads)
  return Math.max(1, Math.min(MAX_WORKERS, desired))
}

function splitIterations(totalIterations: number, workerCount: number): number[] {
  const base = Math.floor(totalIterations / workerCount)
  const remainder = totalIterations % workerCount

  return Array.from({ length: workerCount }, (_, index) => base + (index < remainder ? 1 : 0))
}

function aggregatePartialResults(
  results: readonly SimulationPartialResult[],
): SimulationPartialResult {
  return results.reduce<SimulationPartialResult>(
    (total, result) => ({
      iterations: total.iterations + result.iterations,
      wins: total.wins + result.wins,
      ties: total.ties + result.ties,
      losses: total.losses + result.losses,
    }),
    {
      iterations: 0,
      wins: 0,
      ties: 0,
      losses: 0,
    },
  )
}

function buildWorkerRequest(
  request: SimulationRequest,
  iterations: number,
  workerIndex: number,
): SimulationRequest {
  if (request.seed === undefined) {
    return {
      ...request,
      iterations,
    }
  }

  return {
    ...request,
    iterations,
    seed: request.seed + workerIndex + 1,
  }
}

export function getCachedSimulation(request: SimulationRequest): SimulationSummary | null {
  const cacheKey = serializeSimulationRequest(request)
  const cached = simulationCache.get(cacheKey)

  if (!cached) {
    return null
  }

  return {
    ...cached,
    fromCache: true,
  }
}

export async function runSimulation(
  request: SimulationRequest,
  onProgress?: ProgressReporter,
): Promise<SimulationSummary> {
  const cached = getCachedSimulation(request)
  if (cached) {
    onProgress?.(request.iterations, request.iterations)
    return cached
  }

  const cacheKey = serializeSimulationRequest(request)
  const startedAt = performance.now()
  const workerCount = getWorkerCount(request.iterations)

  if (workerCount === 1) {
    const partial = simulateMonteCarlo(request, onProgress)
    const summary = summarizeSimulation(partial, performance.now() - startedAt, 1, false)
    simulationCache.set(cacheKey, summary)
    return summary
  }

  const workers = Array.from({ length: workerCount }, () => {
    const worker = new Worker(new URL('../workers/monteCarlo.worker.ts', import.meta.url), {
      type: 'module',
    })
    return {
      worker,
      api: Comlink.wrap<MonteCarloWorkerApi>(worker),
    }
  })

  try {
    const progressByWorker = new Array<number>(workerCount).fill(0)
    const tasks = splitIterations(request.iterations, workerCount).map((iterations, index) => {
      const workerHandle = workers[index]

      if (!workerHandle) {
        throw new Error('工作线程初始化失败')
      }

      const progressCallback = onProgress
        ? Comlink.proxy((completed: number, total: number) => {
            const ratio = total === 0 ? 0 : completed / total
            progressByWorker[index] = Math.round(ratio * iterations)
            const overall = progressByWorker.reduce((sum, value) => sum + value, 0)
            onProgress(overall, request.iterations)
          })
        : undefined

      return workerHandle.api.simulate(
        buildWorkerRequest(request, iterations, index),
        progressCallback,
      )
    })

    const partials = await Promise.all(tasks)
    const summary = summarizeSimulation(
      aggregatePartialResults(partials),
      performance.now() - startedAt,
      workerCount,
      false,
    )

    simulationCache.set(cacheKey, summary)
    onProgress?.(request.iterations, request.iterations)
    return summary
  } catch (error) {
    console.error(error)
    const partial = simulateMonteCarlo(request, onProgress)
    const summary = summarizeSimulation(partial, performance.now() - startedAt, 1, true)
    simulationCache.set(cacheKey, summary)
    return summary
  } finally {
    workers.forEach(({ worker }) => worker.terminate())
  }
}
