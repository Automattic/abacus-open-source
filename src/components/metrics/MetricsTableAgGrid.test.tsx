import {
  fireEvent,
  getAllByText,
  getByText,
  getDefaultNormalizer,
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from '@testing-library/react'
import React from 'react'

import Fixtures from 'src/test-helpers/fixtures'
import { render } from 'src/test-helpers/test-utils'

import MetricsTableAgGrid from './MetricsTableAgGrid'

test('with no metrics, renders an empty table', () => {
  const { container, getByText } = render(<MetricsTableAgGrid metrics={[]} />)

  expect(getByText('Name')).toBeInTheDocument()
  expect(getByText('Description')).toBeInTheDocument()
  expect(getByText('Parameter Type')).toBeInTheDocument()

  const containerElmt = container.querySelector('.ag-center-cols-container') as HTMLDivElement
  expect(containerElmt).not.toBeNull()
  expect(containerElmt).toHaveTextContent('')
})

test('with some metrics, renders a table', async () => {
  const { container } = render(<MetricsTableAgGrid metrics={Fixtures.createMetrics(2)} />)

  const containerElmt = container.querySelector('.ag-center-cols-container') as HTMLDivElement
  expect(containerElmt).not.toBeNull()
  await waitFor(() => getByText(containerElmt, /metric_1/), { container })
  expect(
    getByText(containerElmt, 'metric_1', { selector: '.ag-row > .ag-cell > .ag-react-container > div' }),
  ).toBeInTheDocument()
  expect(getByText(containerElmt, 'This is metric 1', { selector: '.ag-row > .ag-cell' })).toBeInTheDocument()
  expect(getByText(containerElmt, 'revenue', { selector: '.ag-row > .ag-cell' })).toBeInTheDocument()
  expect(getByText(containerElmt, 'conversion', { selector: '.ag-row > .ag-cell' })).toBeInTheDocument()
})

test('with some metrics, loads and opens metric details', async () => {
  const { container } = render(<MetricsTableAgGrid metrics={Fixtures.createMetrics(6)} />)
  const containerElmt = container.querySelector('.ag-center-cols-container') as HTMLDivElement
  expect(containerElmt).not.toBeNull()
  await waitFor(() => getByText(containerElmt, /metric_1/), { container })

  for (let i = 1; i < 7; i++) {
    const metric = Fixtures.createMetric(i)

    // Open metric details
    const metricElmt = containerElmt.querySelector(`div.ag-row[row-id='metric_${i}'] .ag-cell`) as HTMLElement
    fireEvent.click(metricElmt)
    const detailContainerElmt = container.querySelector('div.ag-full-width-container') as HTMLDivElement

    await waitFor(() => getByText(detailContainerElmt, /Higher is Better/))
    metric.higherIsBetter ? getByText(detailContainerElmt, /Yes/) : getByText(detailContainerElmt, /No/)
    getByText(detailContainerElmt, /Parameters/)

    getAllByText(
      detailContainerElmt,
      JSON.stringify(metric.parameterType === 'conversion' ? metric.eventParams : metric.revenueParams, null, 4),
      {
        normalizer: getDefaultNormalizer({ trim: true, collapseWhitespace: false }),
      },
    )

    // Close metric details
    fireEvent.click(metricElmt)
    await waitForElementToBeRemoved(
      detailContainerElmt.querySelector(`div.ag-full-width-row[row-id='metric_${i}-detail']`),
    )
  }
})

test('with some metrics and onEditMetric can click on the edit button', async () => {
  const onEditMetric = jest.fn()
  const { container } = render(<MetricsTableAgGrid metrics={Fixtures.createMetrics(2)} onEditMetric={onEditMetric} />)

  const containerElmt = container.querySelector('.ag-center-cols-container') as HTMLDivElement
  await waitFor(() => getByText(containerElmt, /metric_1/), { container })

  const edits = screen.getAllByRole('button', { name: 'Edit Metric' })

  fireEvent.click(edits[0])

  expect(onEditMetric.mock.calls.length).toBe(1)
})
