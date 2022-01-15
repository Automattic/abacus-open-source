import { act, fireEvent, getByText, render, screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react'
import { GridOptions } from 'ag-grid-community'
import React, { ElementRef, useRef } from 'react'

import AgGridWithDetails from './AgGridWithDetails'

const DetailRenderer = ({ data }: { data: Record<string, unknown> }) => {
  return <div>Detail data {JSON.stringify(data)} has been rendered.</div>
}

const getRowNodeId = (data: Record<string, unknown>) => {
  return data.test as string
}

// Query helpers
const RowLocator = {
  rows: 'div.ag-row[role="row"]',
  cell: 'div.ag-react-container ',
  detail: 'div.ag-full-width-row',
}

const DetailButtonLocator = {
  label: 'Toggle Button',
}

const getCellByColumnId = (container: Element, colId: string) => {
  return container.querySelector(`div.ag-cell[col-id='${colId}']`)
}

const renderGrid = async (additionalProps?: GridOptions) => {
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
      getRowNodeId={getRowNodeId}
      {...additionalProps}
    />,
  )

  await waitFor(() => {
    checkIfGridLoaded(container)
  })
  const row = container.querySelector(RowLocator.cell) as Element

  return { container, row }
}

const checkIfGridLoaded = (container: Element) => {
  const containerElmt = container.querySelector('.ag-center-cols-container') as HTMLDivElement
  expect(containerElmt).not.toBeNull()
  const row = container.querySelector(RowLocator.cell) as Element
  expect(row).not.toBeNull()
  return row
}

const waitForDetailRowToRender = async (container: Element) => {
  return waitFor(() => {
    const detailContainer = container.querySelector('div.ag-full-width-container') as HTMLElement
    getByText(detailContainer, /has been rendered./)
  })
}

const clickElement = async (element: Element) => {
  return act(async () => {
    fireEvent.click(element)
  })
}

const mockClientHeight = (element: Element, height: number) => {
  jest.spyOn(element, 'clientHeight', 'get').mockImplementationOnce(() => height)
}

beforeEach(() => {
  jest.useRealTimers()
  jest.restoreAllMocks()
})

test('renders correctly with various optional props', async () => {
  const defaultColDef = {
    width: 100,
  }

  const { container } = await renderGrid({
    defaultColDef,
    suppressColumnVirtualisation: true,
    minColWidth: 100,
  })

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
  const { container, row } = await renderGrid({ suppressColumnVirtualisation: true, minColWidth: 100 })

  await clickElement(row)

  jest.useFakeTimers()
  jest.advanceTimersByTime(1000)
  jest.runOnlyPendingTimers()

  await waitForDetailRowToRender(container)

  // Mock detail row's client height
  const detailRow = container.querySelector(RowLocator.detail) as HTMLElement
  mockClientHeight(detailRow.firstElementChild as HTMLDivElement, 300)

  expect(detailRow.style).toHaveProperty('height', '1px')

  jest.advanceTimersByTime(1000)

  await waitFor(() => {
    expect(detailRow.style).toHaveProperty('height', '300px')
  })

  // Sanity check to see if detail toggle button has rotated
  const detailButton = await screen.findByLabelText(DetailButtonLocator.label)
  expect(detailButton.className).toContain('rotated')

  // Open one more time to see if height caching works
  jest.useRealTimers()
  await clickElement(row)
  await clickElement(row)

  await waitFor(() => {
    expect(detailRow.style).toHaveProperty('height', '300px')
  })
})

test('closes detail row after opening when clicked', async () => {
  const { container, row } = await renderGrid({ suppressColumnVirtualisation: true, minColWidth: 100 })

  await clickElement(row)
  await waitForDetailRowToRender(container)

  await clickElement(row)
  await waitForElementToBeRemoved(() => container.querySelector(RowLocator.detail))
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
        <button onClick={mockCallback}>Click this button! {JSON.stringify(data)}</button>
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

  await waitFor(() => {
    checkIfGridLoaded(container)
  })

  const button = getByText(container, /Click this button!/)
  await clickElement(button)

  await waitFor(() => {
    expect(mockCallback.mock.calls.length).toBe(1)
  })

  const actionCol = getCellByColumnId(container, ACTION_COLUMN_NAME) as Element
  await clickElement(actionCol.firstElementChild as Element)

  const detailRow = container.querySelector(RowLocator.detail)
  await waitFor(() => expect(detailRow).not.toBeInTheDocument())
})

test('ignores clicks on full width rows', async () => {
  const { container, row } = await renderGrid({ suppressColumnVirtualisation: true, minColWidth: 100 })

  await clickElement(row)
  await waitForDetailRowToRender(container)

  jest.useFakeTimers()
  jest.runOnlyPendingTimers()

  const detailRow = container.querySelector(RowLocator.detail) as Element
  await clickElement(detailRow)

  jest.advanceTimersByTime(1000)
  jest.runOnlyPendingTimers()

  const rows = container.querySelectorAll(RowLocator.rows)
  expect(rows.length).toBe(4)
})
