import { act, fireEvent, getByText, render, screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react'
import React, { ElementRef, useRef } from 'react'

import AgGridWithDetails from './AgGridWithDetails'

const DetailRenderer = ({ data }: { data: Record<string, unknown> }) => {
  return <div>Detail data {JSON.stringify(data)} has been rendered.</div>
}

const getRowNodeId = (data: Record<string, unknown>) => {
  return data.test as string
}

beforeEach(() => {
  jest.useRealTimers()
  jest.restoreAllMocks()
})

test('renders correctly with various optional props', async () => {
  const defaultColDef = {
    width: 100,
  }

  const columnDefs = [
    {
      headerName: 'Test',
      field: 'test',
      width: 100,
      minWidth: 100,
      cellRendererFramework: ({ data }: { data: Record<string, unknown> }) => (
        <div>Click Me! {JSON.stringify(data)}</div>
      ),
    },
  ]

  const { container } = render(
    <AgGridWithDetails
      defaultColDef={defaultColDef}
      rowData={[{ test: 'test1' }]}
      columnDefs={columnDefs}
      detailRowRenderer={DetailRenderer}
      gridOptions={{ suppressColumnVirtualisation: true, minColWidth: 100 }}
      getRowNodeId={getRowNodeId}
    />,
  )

  const containerElmt = container.querySelector('.ag-center-cols-container') as HTMLDivElement
  expect(containerElmt).not.toBeNull()
  await waitFor(() => getByText(containerElmt, /Click Me!/), { container })

  expect(container).toMatchSnapshot()
})

test('forwardRef and useImperativeHandle functionality works', async () => {
  const columnDefs = [
    {
      headerName: 'Test',
      field: 'test',
      width: 100,
      minWidth: 100,
      cellRendererFramework: ({ data }: { data: Record<string, unknown> }) => (
        <div>Click Me! {JSON.stringify(data)}</div>
      ),
    },
  ]

  const GridWrapper = () => {
    type AgGridWithDetailsHandle = ElementRef<typeof AgGridWithDetails>
    const agGridRef = useRef<AgGridWithDetailsHandle>(null)

    const onRender = () => {
      expect(agGridRef.current?.getGridApi()).not.toBeNull()
      expect(agGridRef.current?.getGridColumnApi()).not.toBeNull()
    }

    return (
      <AgGridWithDetails
        rowData={[{ test: 'test1' }]}
        columnDefs={columnDefs}
        detailRowRenderer={DetailRenderer}
        gridOptions={{ suppressColumnVirtualisation: true, minColWidth: 100 }}
        getRowNodeId={getRowNodeId}
        onFirstDataRendered={onRender}
        ref={agGridRef}
      />
    )
  }

  const { container } = render(<GridWrapper />)

  const containerElmt = container.querySelector('.ag-center-cols-container') as HTMLDivElement
  expect(containerElmt).not.toBeNull()
})

test('renders detail row when clicked', async () => {
  const columnDefs = [
    {
      headerName: 'Test',
      field: 'test',
      width: 100,
      minWidth: 100,
      cellRendererFramework: ({ data }: { data: Record<string, unknown> }) => (
        <div>Click Me! {JSON.stringify(data)}</div>
      ),
    },
  ]

  const { container } = render(
    <AgGridWithDetails
      rowData={[{ test: 'test1' }]}
      columnDefs={columnDefs}
      detailRowRenderer={DetailRenderer}
      gridOptions={{ suppressColumnVirtualisation: true, minColWidth: 100 }}
      getRowNodeId={getRowNodeId}
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

  // Sanity check to see if toggle button has rotated
  const toggleButton = await screen.findByLabelText('Toggle Button')
  expect(toggleButton.className).toContain('rotated')

  // Open one more time to see if height caching works
  jest.useRealTimers()
  await act(async () => {
    fireEvent.click(row)
  })
  await act(async () => {
    fireEvent.click(row)
  })
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
      cellRendererFramework: ({ data }: { data: Record<string, unknown> }) => (
        <div>Click Me! {JSON.stringify(data)}</div>
      ),
    },
  ]

  const { container } = render(
    <AgGridWithDetails
      rowData={[{ test: 'test1' }]}
      columnDefs={columnDefs}
      detailRowRenderer={DetailRenderer}
      gridOptions={{ suppressColumnVirtualisation: true, minColWidth: 100 }}
      getRowNodeId={getRowNodeId}
    />,
  )

  const containerElmt = container.querySelector('.ag-center-cols-container') as HTMLDivElement
  expect(containerElmt).not.toBeNull()
  await waitFor(() => getByText(containerElmt, /Click Me!/), { container })

  const row = getByText(containerElmt, /Click Me!/)
  await act(async () => {
    fireEvent.click(row)
  })

  await waitFor(() => {
    const detailContainer = container.querySelector('div.ag-full-width-container') as HTMLElement
    getByText(detailContainer, /has been rendered./)
  })

  await act(async () => {
    fireEvent.click(row)
  })
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
      cellRendererFramework: ({ data }: { data: Record<string, unknown> }) => (
        <button onClick={mockCallback}>Click Me! {JSON.stringify(data)}</button>
      ),
    },
  ]

  const { container } = render(
    <AgGridWithDetails
      rowData={[{ test: 'test2' }]}
      columnDefs={columnDefs}
      detailRowRenderer={DetailRenderer}
      actionColumnIdSuffix={ACTION_COLUMN_SUFFIX}
      gridOptions={{ suppressColumnVirtualisation: true, minColWidth: 100 }}
      getRowNodeId={getRowNodeId}
    />,
  )

  const containerElmt = container.querySelector('.ag-center-cols-container') as HTMLDivElement
  expect(containerElmt).not.toBeNull()
  await waitFor(() => getByText(containerElmt, /Click Me!/), { container })

  const button = getByText(containerElmt, /Click Me!/)
  await act(async () => {
    fireEvent.click(button)
  })

  await waitFor(() => {
    expect(mockCallback.mock.calls.length).toBe(1)
  })

  const actionCol = container.querySelector(`div.ag-cell[col-id='${ACTION_COLUMN_NAME}']`) as HTMLElement

  await waitFor(() => {
    fireEvent.click(actionCol.firstElementChild as HTMLElement)
  })

  const detailRow = screen.queryByText(/has been rendered./)
  await waitFor(() => expect(detailRow).not.toBeInTheDocument())
})

test('ignores clicks on full width rows', async () => {
  const columnDefs = [
    {
      headerName: 'Testing',
      field: 'testing',
      width: 100,
      minWidth: 100,
      cellRendererFramework: ({ data }: { data: Record<string, unknown> }) => (
        <div>Click Me! {JSON.stringify(data)}</div>
      ),
    },
  ]

  const { container } = render(
    <AgGridWithDetails
      rowData={[{ test: 'test3' }]}
      columnDefs={columnDefs}
      detailRowRenderer={DetailRenderer}
      gridOptions={{ suppressColumnVirtualisation: true, minColWidth: 100 }}
      getRowNodeId={getRowNodeId}
    />,
  )

  const containerElmt = container.querySelector('.ag-center-cols-container') as HTMLDivElement
  expect(containerElmt).not.toBeNull()
  await waitFor(() => getByText(containerElmt, /Click Me!/), { container })

  const row = getByText(containerElmt, /Click Me!/)
  await act(async () => {
    fireEvent.click(row)
  })

  const detailContainerElmt = container.querySelector('div.ag-full-width-container') as HTMLElement
  await waitFor(() => getByText(detailContainerElmt, /has been rendered./))

  jest.useFakeTimers()
  jest.runOnlyPendingTimers()

  const detailRow = detailContainerElmt.querySelector('div.ag-full-width-row') as HTMLElement
  await act(async () => {
    fireEvent.click(detailRow)
  })

  jest.advanceTimersByTime(1000)
  jest.runOnlyPendingTimers()

  const rows = container.querySelectorAll('div.ag-row')
  expect(rows.length).toBe(4)
})
