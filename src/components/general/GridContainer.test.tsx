import { getByText, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AgGridColumnProps } from 'ag-grid-react'
import React from 'react'

import GridContainer from './GridContainer'

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

test('should render an empty grid', () => {
  const columnDefs: AgGridColumnProps[] = []

  const { container } = render(
    <GridContainer
      rowData={[]}
      columnDefs={columnDefs}
      detailRowRenderer={DetailRenderer}
      getRowNodeId={getRowNodeId}
    />,
  )

  const containerElmt = container.querySelector('.ag-center-cols-container') as HTMLDivElement
  expect(containerElmt).not.toBeNull()

  expect(container).toMatchSnapshot()
})

test('renders a grid properly', async () => {
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
    <GridContainer
      title='Test Grid'
      search
      defaultColDef={defaultColDef}
      rowData={[{ test: 'test1' }]}
      columnDefs={columnDefs}
      defaultSortColumnId='test'
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

test('should render a grid with data, allow searching and resetting', async () => {
  const user = userEvent.setup()

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
    <GridContainer
      title='Test Grid'
      search
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

  const searchInput = screen.getByRole('textbox', { name: /Search/ })
  await user.click(searchInput)
  await user.type(searchInput, 'explat_test')
  expect(container).toMatchSnapshot()

  const resetButton = screen.getByRole('button', { name: /Reset/ })
  await user.click(resetButton)
  expect(container).toMatchSnapshot()
})

test('test clicking reset button with no columns', async () => {
  const user = userEvent.setup()

  const columnDefs: AgGridColumnProps[] = []

  const { container } = render(
    <GridContainer
      search
      rowData={[{ test: 'test1' }]}
      columnDefs={columnDefs}
      detailRowRenderer={DetailRenderer}
      gridOptions={{ suppressColumnVirtualisation: true, minColWidth: 100 }}
      getRowNodeId={getRowNodeId}
    />,
  )

  const containerElmt = container.querySelector('.ag-center-cols-container') as HTMLDivElement
  expect(containerElmt).not.toBeNull()

  const resetButton = screen.getByRole('button', { name: /Reset/ })
  await user.click(resetButton)
  expect(container).toMatchSnapshot()
})
