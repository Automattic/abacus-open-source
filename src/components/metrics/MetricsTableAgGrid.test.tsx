import { act, fireEvent, getAllByText, getByText, getDefaultNormalizer, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
    const metricButton = containerElmt.querySelector(`div.ag-row[row-id='metric_${i}'] button`) as Element
    await act(async () => {
      fireEvent.click(metricButton)
    })
    const detailContainerElmt = container.querySelector('div.ag-full-width-container') as HTMLDivElement

    await waitFor(() => getByText(detailContainerElmt, /Higher is Better/))
    await waitFor(() =>
      metric.higherIsBetter ? getByText(detailContainerElmt, /Yes/) : getByText(detailContainerElmt, /No/),
    )
    await waitFor(() => getByText(detailContainerElmt, /Parameters/))

    getAllByText(
      detailContainerElmt,
      JSON.stringify(metric.parameterType === 'conversion' ? metric.eventParams : metric.revenueParams, null, 4),
      {
        normalizer: getDefaultNormalizer({ trim: true, collapseWhitespace: false }),
      },
    )

    // Close metric details
    await act(async () => {
      fireEvent.click(metricButton)
    })
    await waitFor(
      () => {
        const detailRow = detailContainerElmt.querySelector(`div.ag-full-width-row[row-id='metric_${i}-detail']`)
        expect(detailRow).not.toBeInTheDocument()
      },
      { timeout: 5000 },
    )
  }
})

test('with some metrics and onEditMetric can click on the edit button', async () => {
  const user = userEvent.setup()
  const onEditMetric = jest.fn()
  const { container } = render(<MetricsTableAgGrid metrics={Fixtures.createMetrics(2)} onEditMetric={onEditMetric} />)

  const containerElmt = container.querySelector('.ag-center-cols-container') as HTMLDivElement
  await waitFor(() => getByText(containerElmt, /metric_1/), { container })

  const edits = screen.getAllByRole('button', { name: 'Edit Metric' })

  await user.click(edits[0])

  expect(onEditMetric.mock.calls.length).toBe(1)
})

test('with some metrics can search parameters', async () => {
  const user = userEvent.setup()
  const { container } = render(<MetricsTableAgGrid metrics={Fixtures.createMetrics(2)} />)

  const containerElmt = container.querySelector('.ag-center-cols-container') as HTMLDivElement
  await waitFor(() => getByText(containerElmt, /metric_1/), { container })

  const input = screen.getByRole('textbox', { name: /Search/ }) as HTMLInputElement
  await user.click(input)
  await user.type(input, 'event_name')

  await waitFor(() => {
    const metric = container.querySelector('div[row-id="metric_2"]')
    expect(metric).not.toBeInTheDocument()
  })
})
