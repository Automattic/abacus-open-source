import { fireEvent, getByText, getDefaultNormalizer, screen, waitFor } from '@testing-library/react'
import React from 'react'

import MetricsApi from 'src/api/MetricsApi'
import Fixtures from 'src/test-helpers/fixtures'
import { render } from 'src/test-helpers/test-utils'

import MetricsTable from './MetricsTable'

jest.mock('src/api/MetricsApi')
const mockedMetricsApi = MetricsApi as unknown as jest.Mocked<typeof MetricsApi>

test('with no metrics, renders an empty table', () => {
  const { container, getByText } = render(<MetricsTable metrics={[]} />)

  expect(getByText('Name')).toBeInTheDocument()
  expect(getByText('Description')).toBeInTheDocument()
  expect(getByText('Parameter Type')).toBeInTheDocument()

  const tBodyElmt = container.querySelector('tbody') as HTMLTableSectionElement
  expect(tBodyElmt).not.toBeNull()
  expect(tBodyElmt).toHaveTextContent('')
})

test('with some metrics, renders a table', () => {
  const { container } = render(<MetricsTable metrics={Fixtures.createMetrics(2)} />)

  const tBodyElmt = container.querySelector('tbody') as HTMLTableSectionElement
  expect(tBodyElmt).not.toBeNull()
  expect(getByText(tBodyElmt, 'metric_1', { selector: 'tr > td' })).toBeInTheDocument()
  expect(getByText(tBodyElmt, 'This is metric 1', { selector: 'tr > td' })).toBeInTheDocument()
  expect(getByText(tBodyElmt, 'revenue', { selector: 'tr > td' })).toBeInTheDocument()
  expect(getByText(tBodyElmt, 'conversion', { selector: 'tr > td' })).toBeInTheDocument()
})

test('with some metrics, loads and opens metric details', async () => {
  const { container } = render(<MetricsTable metrics={Fixtures.createMetrics(2)} />)
  const tBodyElmt = container.querySelector('tbody') as HTMLTableSectionElement
  expect(tBodyElmt).not.toBeNull()

  for (let i = 1; i < 7; i++) {
    const metric = Fixtures.createMetric(i)
    mockedMetricsApi.findById.mockResolvedValueOnce(metric)

    // Open metric details
    fireEvent.click(getByText(container, /metric_1/))

    await waitFor(() => getByText(container, /Higher is Better/), { container })
    metric.higherIsBetter ? getByText(container, /Yes/) : getByText(container, /No/)
    getByText(container, /Parameters/)
    getByText(
      container,
      JSON.stringify(metric.parameterType === 'conversion' ? metric.eventParams : metric.revenueParams, null, 4),
      { normalizer: getDefaultNormalizer({ trim: true, collapseWhitespace: false }) },
    )

    // Close metric details
    fireEvent.click(getByText(container, /metric_1/))
  }
})

test('with some metrics and canEditMetrics can click on the edit button', () => {
  const onEditMetric = jest.fn()
  render(<MetricsTable metrics={Fixtures.createMetrics(2)} onEditMetric={onEditMetric} />)

  const edits = screen.getAllByRole('button', { name: 'Edit Metric' })

  fireEvent.click(edits[0])

  expect(onEditMetric.mock.calls.length).toBe(1)
})
