import { fireEvent, getByText, render, screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react'
import React from 'react'

import AgGridWithDetails from './AgGridWithDetails'
import { Data } from './AgGridWithDetails.utils'

const DetailRenderer = ({ data }: { data: Data }) => {
  return <div>Detail data {JSON.stringify(data)} has been rendered.</div>
}

const waitForSeconds = (seconds: number) => {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000))
}

const getDataId = (data: Data) => {
  return data.test as string
}

beforeEach(() => {
  jest.useRealTimers()
  jest.restoreAllMocks()
})

test('renders detail row when clicked', async () => {
  const columnDefs = [
    {
      headerName: 'Test',
      field: 'test',
      width: 100,
      minWidth: 100,
      cellRendererFramework: ({ data }: { data: Data }) => <div>Click Me! {JSON.stringify(data)}</div>,
    },
  ]

  const { container } = render(
    <AgGridWithDetails
      data={[{ test: 'test1' }]}
      columnDefs={columnDefs}
      detailRowRenderer={DetailRenderer}
      otherAgGridProps={{ suppressColumnVirtualisation: true, minColWidth: 100 }}
      getDataId={getDataId}
    />,
  )

  const containerElmt = container.querySelector('.ag-center-cols-container') as HTMLDivElement
  expect(containerElmt).not.toBeNull()
  await waitFor(() => getByText(containerElmt, /Click Me!/), { container })

  const row = getByText(containerElmt, /Click Me!/)
  fireEvent.click(row)

  jest.useFakeTimers()
  jest.advanceTimersByTime(1000)
  jest.runOnlyPendingTimers()

  await waitFor(() => {
    const detailContainer = container.querySelector('div.ag-full-width-container') as HTMLElement
    getByText(detailContainer, /has been rendered./)
  })

  // Mock client height
  const detailContainerElmt = container.querySelector('div.ag-full-width-container') as HTMLElement
  const detailRow = detailContainerElmt.querySelector('div.ag-full-width-row') as HTMLElement
  const elementChild = detailRow.firstElementChild as HTMLDivElement
  jest.spyOn(elementChild, 'clientHeight', 'get').mockImplementationOnce(() => 300)

  expect(detailRow.style).toHaveProperty('height', '1px')

  jest.advanceTimersByTime(1000)

  await waitFor(() => {
    const detailRow = document.querySelector('div.ag-full-width-row') as HTMLElement
    expect(detailRow.style).toHaveProperty('height', '300px')
  })
})

test('closes detail row after opening when clicked', async () => {
  const columnDefs = [
    {
      headerName: 'Test',
      field: 'test',
      width: 100,
      minWidth: 100,
      cellRendererFramework: ({ data }: { data: Data }) => <div>Click Me! {JSON.stringify(data)}</div>,
    },
  ]

  const { container } = render(
    <AgGridWithDetails
      data={[{ test: 'test1' }]}
      columnDefs={columnDefs}
      detailRowRenderer={DetailRenderer}
      otherAgGridProps={{ suppressColumnVirtualisation: true, minColWidth: 100 }}
      getDataId={getDataId}
    />,
  )

  const containerElmt = container.querySelector('.ag-center-cols-container') as HTMLDivElement
  expect(containerElmt).not.toBeNull()
  await waitFor(() => getByText(containerElmt, /Click Me!/), { container })

  const row = getByText(containerElmt, /Click Me!/)
  fireEvent.click(row)

  await waitFor(() => {
    const detailContainer = container.querySelector('div.ag-full-width-container') as HTMLElement
    getByText(detailContainer, /has been rendered./)
  })

  fireEvent.click(row)
  await waitForElementToBeRemoved(() => container.querySelector('div.ag-full-width-row'))
})

test('ignores clicks on action columns but allows other actions in cell', async () => {
  const ACTION_COLUMN_SUFFIX = '-actions'
  const ACTION_COLUMN_NAME = `column-${ACTION_COLUMN_SUFFIX}`
  const mockCallback = jest.fn()
  const columnDefs = [
    {
      headerName: 'Actions',
      field: ACTION_COLUMN_NAME,
      width: 100,
      minWidth: 100,
      cellRendererFramework: ({ data }: { data: Data }) => (
        <button onClick={mockCallback}>Click Me! {JSON.stringify(data)}</button>
      ),
    },
  ]

  const { container } = render(
    <AgGridWithDetails
      data={[{ test: 'test2' }]}
      columnDefs={columnDefs}
      detailRowRenderer={DetailRenderer}
      actionColumnIdSuffix={ACTION_COLUMN_SUFFIX}
      otherAgGridProps={{ suppressColumnVirtualisation: true, minColWidth: 100 }}
      getDataId={getDataId}
    />,
  )

  const containerElmt = container.querySelector('.ag-center-cols-container') as HTMLDivElement
  expect(containerElmt).not.toBeNull()
  await waitFor(() => getByText(containerElmt, /Click Me!/), { container })

  const button = getByText(containerElmt, /Click Me!/)
  fireEvent.click(button)

  await waitFor(
    () => {
      expect(mockCallback.mock.calls.length).toBe(1)
    },
    { timeout: 10000 },
  )

  const actionCol = container.querySelector(`div.ag-cell[col-id='${ACTION_COLUMN_NAME}']`) as HTMLElement

  await waitFor(() => {
    fireEvent.click(actionCol.firstElementChild as HTMLElement)
  })

  await waitForSeconds(0.5)

  const detailRow = screen.queryByText(/has been rendered./)
  expect(detailRow).not.toBeInTheDocument()
})

test('ignores clicks on full width rows', async () => {
  const columnDefs = [
    {
      headerName: 'Testing',
      field: 'testing',
      width: 100,
      minWidth: 100,
      cellRendererFramework: ({ data }: { data: Data }) => <div>Click Me! {JSON.stringify(data)}</div>,
    },
  ]

  const { container } = render(
    <AgGridWithDetails
      data={[{ test: 'test3' }]}
      columnDefs={columnDefs}
      detailRowRenderer={DetailRenderer}
      otherAgGridProps={{ suppressColumnVirtualisation: true, minColWidth: 100 }}
      getDataId={getDataId}
    />,
  )

  const containerElmt = container.querySelector('.ag-center-cols-container') as HTMLDivElement
  expect(containerElmt).not.toBeNull()
  await waitFor(() => getByText(containerElmt, /Click Me!/), { container })

  const row = getByText(containerElmt, /Click Me!/)
  fireEvent.click(row)

  const detailContainerElmt = container.querySelector('div.ag-full-width-container') as HTMLElement
  await waitFor(() => getByText(detailContainerElmt, /has been rendered./))

  jest.useFakeTimers()
  jest.runOnlyPendingTimers()

  const detailRow = detailContainerElmt.querySelector('div.ag-full-width-row') as HTMLElement
  fireEvent.click(detailRow)

  jest.advanceTimersByTime(1000)
  jest.runOnlyPendingTimers()

  const rows = container.querySelectorAll('div.ag-row')
  expect(rows.length).toBe(4)
})
