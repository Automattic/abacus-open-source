import React from 'react'

import ExperimentResults from 'src/components/experiments/single-view/results/ExperimentResults'
import Fixtures from 'src/test-helpers/fixtures'

export default { title: 'Experiment results' }

const analyses = Fixtures.createAnalyses()
const experiment = Fixtures.createExperimentFull()
const metrics = Fixtures.createMetrics()

export const noAnalyses = (): JSX.Element => (
  <ExperimentResults analyses={[]} experiment={experiment} metrics={metrics} />
)
export const someAnalyses = (): JSX.Element => (
  <ExperimentResults analyses={analyses} experiment={experiment} metrics={metrics} />
)
export const someAnalysesDebugMode = (): JSX.Element => (
  <ExperimentResults analyses={analyses} experiment={experiment} metrics={metrics} debugMode={true} />
)
