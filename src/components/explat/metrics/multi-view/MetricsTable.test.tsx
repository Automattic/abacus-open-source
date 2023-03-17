import { fireEvent, getAllByText, getByText, getDefaultNormalizer, screen, waitFor } from '@testing-library/react'
import React from 'react'

import MetricsApi from 'src/api/explat/MetricsApi'
import Fixtures from 'src/test-helpers/fixtures'
import { changeFieldByRole, render } from 'src/test-helpers/test-utils'
import { toggleDebugMode } from 'src/utils/general'

import MetricsTable from './MetricsTable'

jest.mock('src/api/explat/MetricsApi')
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
  expect(getByText(tBodyElmt, 'Cash Sales', { selector: 'tr > td' })).toBeInTheDocument()
  expect(getByText(tBodyElmt, 'Conversion', { selector: 'tr > td' })).toBeInTheDocument()
})

test('with some metrics, in debugMode renders a table with Tags column', () => {
  toggleDebugMode()
  const { container } = render(<MetricsTable metrics={Fixtures.createMetrics(2)} />)

  const tBodyElmt = container.querySelector('tbody') as HTMLTableSectionElement
  expect(getAllByText(tBodyElmt, 'tag_1', { selector: 'tr > td' })[0]).toBeInTheDocument()
  toggleDebugMode()
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

test('with some metrics, allow searching by metric name and metric params', async () => {
  const mockMetricName = 'mock_abacus_metric_name'
  const mockEventName = 'mock_tracks_event_name'
  const metrics = [
    Fixtures.createMetric(1, {
      name: mockMetricName,
      eventParams: [{ event: mockEventName }],
    }),
    Fixtures.createMetric(1),
  ]

  render(<MetricsTable metrics={metrics} />)

  // start with all the results
  expect(screen.queryAllByText(`1-2 of 2`)[0]).toBeInTheDocument()

  // search by metric name
  await changeFieldByRole('textbox', /Search/, mockMetricName)
  await waitFor(() => expect(screen.queryByText(/metric_1/)).toBeNull())
  expect(screen.queryByText(mockMetricName)).toBeInTheDocument()

  // no results
  await changeFieldByRole('textbox', /Search/, 'some other name')
  await waitFor(() => expect(screen.queryByText(mockMetricName)).toBeNull())
  expect(screen.queryAllByText('1-0 of 0')[0]).toBeInTheDocument()

  // search by metric params
  await changeFieldByRole('textbox', /Search/, mockEventName)
  await waitFor(() => expect(screen.queryByText(mockMetricName)).toBeInTheDocument())
  expect(screen.queryAllByText('1-1 of 1')[0]).toBeInTheDocument()
})
