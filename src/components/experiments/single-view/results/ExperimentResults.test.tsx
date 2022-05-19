import { fireEvent, getAllByText, getByText, screen, waitFor } from '@testing-library/react'
import React from 'react'
import Plot from 'react-plotly.js'

import ExperimentResults from 'src/components/experiments/single-view/results/ExperimentResults'
import { AnalysisStrategy, MetricParameterType } from 'src/lib/schemas'
import Fixtures from 'src/test-helpers/fixtures'
import { render } from 'src/test-helpers/test-utils'
import { toggleDebugMode } from 'src/utils/general'

// Unfortunately Plotly doesn't produce graphs with deterministic IDs so we have to mock it
jest.mock('react-plotly.js')
const mockedPlot = Plot as jest.MockedClass<typeof Plot>
beforeEach(() => {
  mockedPlot.mockClear()
})

const experiment = Fixtures.createExperimentFull()
const metrics = Fixtures.createMetrics()
const analyses = Fixtures.createAnalyses()

test('renders an appropriate message with no analyses', async () => {
  const { container } = render(<ExperimentResults analyses={[]} experiment={experiment} metrics={metrics} />)
  expect(container).toMatchSnapshot()
  await expect(container.textContent).toMatch('No results are available at the moment')
})

test('renders an appropriate message for analyses missing analysis data due to an ETL bug', async () => {
  const { container } = render(
    <ExperimentResults
      analyses={[
        Fixtures.createAnalysis({
          analysisStrategy: AnalysisStrategy.PpNaive,
          metricEstimates: null,
        }),
      ]}
      experiment={experiment}
      metrics={metrics}
    />,
  )
  expect(container).toMatchSnapshot()
  await expect(container.textContent).toMatch('Not analyzed yet')
})

test('renders correctly for 1 analysis datapoint, not statistically significant', async () => {
  const metricEstimates = {
    variations: {
      '1': Fixtures.createDistributionStats({
        top_95: 1,
        bottom_95: 0.5,
        mean: 1,
      }),
      '2': Fixtures.createDistributionStats({
        top_95: 1,
        bottom_95: 0.5,
        mean: 1,
      }),
    },
    diffs: {
      '2_1': Fixtures.createDistributionStats({
        top_95: 1,
        bottom_95: -1,
        mean: 0,
      }),
      '1_2': Fixtures.createDistributionStats({
        top_95: 0,
        bottom_95: 0,
        mean: 0,
      }),
    },
    ratios: {
      '2_1': Fixtures.createDistributionStats({
        top_95: 1,
        bottom_95: 0.5,
        mean: 0,
      }),
      '1_2': Fixtures.createDistributionStats({
        top_95: 0,
        bottom_95: 0,
        mean: 0,
      }),
    },
  }
  const { container } = render(
    <ExperimentResults
      analyses={[
        Fixtures.createAnalysis({ analysisStrategy: AnalysisStrategy.PpNaive, metricEstimates }),
        Fixtures.createAnalysis({ analysisStrategy: AnalysisStrategy.IttPure, metricEstimates }),
        Fixtures.createAnalysis({ analysisStrategy: AnalysisStrategy.MittNoCrossovers, metricEstimates }),
        Fixtures.createAnalysis({ analysisStrategy: AnalysisStrategy.MittNoSpammers, metricEstimates }),
        Fixtures.createAnalysis({
          analysisStrategy: AnalysisStrategy.MittNoSpammersNoCrossovers,
          metricEstimates,
        }),
      ]}
      experiment={experiment}
      metrics={metrics}
    />,
  )

  // Check the table snapshot before expanding any metric.
  expect(container.querySelector('.analysis-latest-results')).toMatchSnapshot()

  // Clicking on metric_1 or metric_2 should have no effect on anything, but metric_3 should render the details.
  fireEvent.click(getByText(container, /metric_1/))
  fireEvent.click(getAllByText(container, /metric_2/)[0])
  fireEvent.click(getByText(container, /metric_3/))
  await waitFor(() => getByText(container, /Last analyzed/), { container })
  expect(container.querySelector('.analysis-latest-results .analysis-detail-panel')).toMatchSnapshot()

  expect(mockedPlot).toMatchSnapshot()
})

test('A/B/n: renders correctly for 1 analysis datapoint, not statistically significant', async () => {
  const experiment = Fixtures.createExperimentFull({
    variations: [
      Fixtures.createVariation({
        variationId: 1,
        name: 'control',
        isDefault: true,
        allocatedPercentage: 40,
      }),
      Fixtures.createVariation({
        variationId: 2,
        name: 'treatment1',
        isDefault: false,
        allocatedPercentage: 40,
      }),
      Fixtures.createVariation({
        variationId: 3,
        name: 'treatment2',
        isDefault: false,
        allocatedPercentage: 20,
      }),
    ],
  })
  const metricEstimates = {
    variations: {
      '1': Fixtures.createDistributionStats({
        top_95: 1,
        bottom_95: 0.5,
        mean: 1,
      }),
      '2': Fixtures.createDistributionStats({
        top_95: 1,
        bottom_95: 0.5,
        mean: 1,
      }),
      '3': Fixtures.createDistributionStats({
        top_95: 1,
        bottom_95: 0.5,
        mean: 1,
      }),
    },
    diffs: {
      '2_1': Fixtures.createDistributionStats({
        top_95: 1,
        bottom_95: -1,
        mean: 0,
      }),
      '1_2': Fixtures.createDistributionStats({
        top_95: 0,
        bottom_95: 0,
        mean: 0,
      }),
      '3_1': Fixtures.createDistributionStats({
        top_95: 1,
        bottom_95: -1,
        mean: 0,
      }),
      '1_3': Fixtures.createDistributionStats({
        top_95: 0,
        bottom_95: 0,
        mean: 0,
      }),
      '3_2': Fixtures.createDistributionStats({
        top_95: 1,
        bottom_95: -1,
        mean: 0,
      }),
      '2_3': Fixtures.createDistributionStats({
        top_95: 0,
        bottom_95: 0,
        mean: 0,
      }),
    },
    ratios: {
      '2_1': Fixtures.createDistributionStats({
        top_95: 1,
        bottom_95: 0.5,
        mean: 0,
      }),
      '1_2': Fixtures.createDistributionStats({
        top_95: 0,
        bottom_95: 0,
        mean: 0,
      }),
      '3_1': Fixtures.createDistributionStats({
        top_95: 1,
        bottom_95: 0.5,
        mean: 0,
      }),
      '1_3': Fixtures.createDistributionStats({
        top_95: 0,
        bottom_95: 0,
        mean: 0,
      }),
      '3_2': Fixtures.createDistributionStats({
        top_95: 1,
        bottom_95: 0.5,
        mean: 0,
      }),
      '2_3': Fixtures.createDistributionStats({
        top_95: 0,
        bottom_95: 0,
        mean: 0,
      }),
    },
  }
  const { container } = render(
    <ExperimentResults
      analyses={[
        Fixtures.createAnalysis({ analysisStrategy: AnalysisStrategy.PpNaive, metricEstimates }),
        Fixtures.createAnalysis({ analysisStrategy: AnalysisStrategy.IttPure, metricEstimates }),
        Fixtures.createAnalysis({ analysisStrategy: AnalysisStrategy.MittNoCrossovers, metricEstimates }),
        Fixtures.createAnalysis({ analysisStrategy: AnalysisStrategy.MittNoSpammers, metricEstimates }),
        Fixtures.createAnalysis({
          analysisStrategy: AnalysisStrategy.MittNoSpammersNoCrossovers,
          metricEstimates,
        }),
      ]}
      experiment={experiment}
      metrics={metrics}
    />,
  )

  // Check the table snapshot before expanding any metric.
  expect(container.querySelector('.analysis-latest-results')).toMatchSnapshot()

  // Clicking on metric_1 or metric_2 should have no effect on anything, but metric_3 should render the details.
  fireEvent.click(getByText(container, /metric_1/))
  fireEvent.click(getAllByText(container, /metric_2/)[0])
  fireEvent.click(getByText(container, /metric_3/))
  await waitFor(() => getByText(container, /Last analyzed/), { container })
  expect(container.querySelector('.analysis-latest-results .analysis-detail-panel')).toMatchSnapshot()

  expect(mockedPlot).toMatchSnapshot()
})
test('renders correctly for 1 analysis datapoint, statistically significant', async () => {
  const metricEstimates = {
    variations: {
      '1': Fixtures.createDistributionStats({
        top_95: 2,
        bottom_95: 1,
        mean: 1,
      }),
      '2': Fixtures.createDistributionStats({
        top_95: 1,
        bottom_95: 0.5,
        mean: 1,
      }),
    },
    diffs: {
      '2_1': Fixtures.createDistributionStats({
        top_95: 1,
        bottom_95: 0.5,
        mean: 0,
      }),
      '1_2': Fixtures.createDistributionStats({
        top_95: 0,
        bottom_95: 0,
        mean: 0,
      }),
    },
    ratios: {
      '2_1': Fixtures.createDistributionStats({
        top_95: 1,
        bottom_95: 0.5,
        mean: 0,
      }),
      '1_2': Fixtures.createDistributionStats({
        top_95: 0,
        bottom_95: 0,
        mean: 0,
      }),
    },
  }
  const { container } = render(
    <ExperimentResults
      analyses={[
        Fixtures.createAnalysis({ analysisStrategy: AnalysisStrategy.PpNaive, metricEstimates }),
        Fixtures.createAnalysis({ analysisStrategy: AnalysisStrategy.IttPure, metricEstimates }),
        Fixtures.createAnalysis({ analysisStrategy: AnalysisStrategy.MittNoCrossovers, metricEstimates }),
        Fixtures.createAnalysis({ analysisStrategy: AnalysisStrategy.MittNoSpammers, metricEstimates }),
        Fixtures.createAnalysis({
          analysisStrategy: AnalysisStrategy.MittNoSpammersNoCrossovers,
          metricEstimates,
        }),
      ]}
      experiment={experiment}
      metrics={metrics}
    />,
  )

  // Check the table snapshot before expanding any metric.
  expect(container.querySelector('.analysis-latest-results')).toMatchSnapshot()

  // Clicking on metric_1 or metric_2 should have no effect on anything, but metric_3 should render the details.
  fireEvent.click(getByText(container, /metric_1/))
  fireEvent.click(getAllByText(container, /metric_2/)[0])
  fireEvent.click(getByText(container, /metric_3/))
  await waitFor(() => getByText(container, /Last analyzed/), { container })
  expect(container.querySelector('.analysis-latest-results .analysis-detail-panel')).toMatchSnapshot()

  expect(mockedPlot).toMatchSnapshot()
})

test('renders correctly for conflicting analysis data', async () => {
  toggleDebugMode()

  const metricEstimates1 = {
    variations: {
      '1': Fixtures.createDistributionStats({
        top_95: 2,
        bottom_95: 1,
        mean: 1,
      }),
      '2': Fixtures.createDistributionStats({
        top_95: 1,
        bottom_95: 0.5,
        mean: 1,
      }),
    },
    diffs: {
      '2_1': Fixtures.createDistributionStats({
        top_95: 1,
        bottom_95: 0.5,
        mean: 0,
      }),
      '1_2': Fixtures.createDistributionStats({
        top_95: 0,
        bottom_95: 0,
        mean: 0,
      }),
    },
    ratios: {
      '2_1': Fixtures.createDistributionStats({
        top_95: 1,
        bottom_95: 0.5,
        mean: 0,
      }),
      '1_2': Fixtures.createDistributionStats({
        top_95: 0,
        bottom_95: 0,
        mean: 0,
      }),
    },
  }
  const metricEstimates2 = {
    variations: {
      '1': Fixtures.createDistributionStats({
        top_95: 2,
        bottom_95: 1,
        mean: 1,
      }),
      '2': Fixtures.createDistributionStats({
        top_95: 1,
        bottom_95: 0.5,
        mean: 1,
      }),
    },
    diffs: {
      '2_1': Fixtures.createDistributionStats({
        top_95: -1,
        bottom_95: -2,
        mean: -1.4,
      }),
      '1_2': Fixtures.createDistributionStats({
        top_95: 0,
        bottom_95: 0,
        mean: 0,
      }),
    },
    ratios: {
      '2_1': Fixtures.createDistributionStats({
        top_95: 1,
        bottom_95: 0.5,
        mean: 0,
      }),
      '1_2': Fixtures.createDistributionStats({
        top_95: 0,
        bottom_95: 0,
        mean: 0,
      }),
    },
  }

  const { container } = render(
    <ExperimentResults
      analyses={[
        Fixtures.createAnalysis({
          analysisStrategy: AnalysisStrategy.PpNaive,
          metricEstimates: metricEstimates1,
        }),
        Fixtures.createAnalysis({
          analysisStrategy: AnalysisStrategy.IttPure,
          metricEstimates: metricEstimates2,
        }),
        Fixtures.createAnalysis({
          analysisStrategy: AnalysisStrategy.MittNoCrossovers,
          metricEstimates: metricEstimates2,
        }),
        Fixtures.createAnalysis({
          analysisStrategy: AnalysisStrategy.MittNoSpammers,
          metricEstimates: metricEstimates2,
        }),
        Fixtures.createAnalysis({
          analysisStrategy: AnalysisStrategy.MittNoSpammersNoCrossovers,
          metricEstimates: metricEstimates2,
        }),
      ]}
      experiment={experiment}
      metrics={metrics}
    />,
  )

  // Check the table snapshot before expanding any metric.
  expect(container.querySelector('.analysis-latest-results')).toMatchSnapshot()

  // Clicking on metric_1 or metric_2 should have no effect on anything, but metric_3 should render the details.
  fireEvent.click(getByText(container, /metric_1/))
  fireEvent.click(getAllByText(container, /metric_2/)[0])
  fireEvent.click(getByText(container, /metric_3/))
  await waitFor(() => getByText(container, /Last analyzed/), { container })
  expect(container.querySelector('.analysis-latest-results .analysis-detail-panel')).toMatchSnapshot()

  expect(mockedPlot).toMatchSnapshot()

  toggleDebugMode()
})

test('renders the condensed table with some analyses in non-debug mode for a Conversion Metric', async () => {
  const { container } = render(<ExperimentResults analyses={analyses} experiment={experiment} metrics={metrics} />)

  // In non-debug mode, we shouldn't have a <pre> element with the JSON.
  expect(container.querySelector('.debug-json')).toBeNull()

  // Check the table snapshot before expanding any metric.
  expect(container.querySelector('.analysis-latest-results')).toMatchSnapshot()

  // Clicking on metric_1 or metric_2 should have no effect on anything, but metric_3 should render the details.
  fireEvent.click(getByText(container, /metric_1/))
  fireEvent.click(getAllByText(container, /metric_2/)[0])
  fireEvent.click(getByText(container, /metric_3/))
  await waitFor(() => getAllByText(container, /Last analyzed/), { container })
  expect(container.querySelector('.analysis-latest-results .analysis-detail-panel')).toMatchSnapshot()
  fireEvent.click(screen.getAllByRole('button', { name: /"Observed" data/ })[0])

  expect(mockedPlot).toMatchSnapshot()
})

test('renders the condensed table with some analyses in non-debug mode for a Revenue Metric', async () => {
  const metrics = Fixtures.createMetrics().map((metric) => ({
    ...metric,
    parameterType: MetricParameterType.Revenue,
  }))

  const { container } = render(<ExperimentResults analyses={analyses} experiment={experiment} metrics={metrics} />)

  // In non-debug mode, we shouldn't have a <pre> element with the JSON.
  expect(container.querySelector('.debug-json')).toBeNull()

  // Check the table snapshot before expanding any metric.
  expect(container.querySelector('.analysis-latest-results')).toMatchSnapshot()

  // Clicking on metric_1 or metric_2 should have no effect on anything, but metric_3 should render the details.
  fireEvent.click(getByText(container, /metric_1/))
  fireEvent.click(getAllByText(container, /metric_2/)[0])
  fireEvent.click(getByText(container, /metric_3/))
  await waitFor(() => getAllByText(container, /Last analyzed/), { container })
  expect(container.querySelector('.analysis-latest-results .analysis-detail-panel')).toMatchSnapshot()
  fireEvent.click(screen.getAllByRole('button', { name: /"Observed" data/ })[0])

  expect(mockedPlot).toMatchSnapshot()
})

test('allows you to change analysis strategy', async () => {
  const { container } = render(
    <ExperimentResults
      analyses={[
        Fixtures.createAnalysis({ analysisStrategy: AnalysisStrategy.IttPure }),
        Fixtures.createAnalysis({ analysisStrategy: AnalysisStrategy.MittNoCrossovers }),
        Fixtures.createAnalysis({ analysisStrategy: AnalysisStrategy.MittNoSpammers }),
        Fixtures.createAnalysis({ analysisStrategy: AnalysisStrategy.MittNoSpammersNoCrossovers }),
      ]}
      experiment={{ ...experiment, exposureEvents: undefined }}
      metrics={metrics}
    />,
  )

  fireEvent.click(screen.getByRole('button', { name: /Choose an Analysis Strategy/ }))
  const analysisStrategy = screen.getByRole('button', { name: /Analysis Strategy:/ })
  fireEvent.focus(analysisStrategy)
  fireEvent.keyDown(analysisStrategy, { key: 'Enter' })
  const analysisStrategyOption = await screen.findByRole('option', { name: /All participants/ })
  fireEvent.click(analysisStrategyOption)

  expect(container).toMatchSnapshot()
})
