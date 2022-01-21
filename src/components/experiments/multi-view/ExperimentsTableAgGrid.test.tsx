import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import addToDate from 'date-fns/add'
import React from 'react'

import { ExperimentBare, Platform, Status } from 'src/lib/schemas'
import { render } from 'src/test-helpers/test-utils'
import { OnGridStateChangeFunction, ResetGridStateFunction } from 'src/utils/ag-grid'

import ExperimentsTableAgGrid from './ExperimentsTableAgGrid'

// Query helpers
const RowLocator = {
  rows: 'div.ag-row[role="row"]',
  cell: 'div.ag-react-container ',
}

const makeActions = () => {
  return {
    onGridStateChange: jest.fn() as jest.MockedFunction<OnGridStateChangeFunction>,
    resetGridState: jest.fn() as jest.MockedFunction<ResetGridStateFunction>,
  }
}

const checkIfGridLoaded = (container: Element) => {
  const containerElmt = container.querySelector('.ag-center-cols-container') as HTMLDivElement
  expect(containerElmt).not.toBeNull()
  const row = container.querySelector(RowLocator.cell) as Element
  expect(row).not.toBeNull()
  return row
}

const getGridSortIcon = (container: Element, headerName: string, sortDirection: 'asc' | 'desc') => {
  let icon: Element | null = null
  container.querySelectorAll('.ag-header-cell-label').forEach((value, _key, _parent) => {
    const headerText = value.querySelector('.ag-header-cell-text')?.innerHTML
    if (headerText === headerName) {
      icon = value.querySelector(`.ag-icon-${sortDirection}`)
      return
    }
  })

  return icon
}

const getFilterMenuIcon = (container: Element, headerName: string) => {
  let icon: Element | null = null
  container.querySelectorAll('.ag-cell-label-container').forEach((value, _key, _parent) => {
    const headerText = value.querySelector('.ag-header-cell-text')?.innerHTML
    if (headerText === headerName) {
      icon = value.querySelector('.ag-icon-menu')
    }
  })

  return icon
}

const getFilterIcon = (container: Element, headerName: string) => {
  let icon: Element | null = null
  container.querySelectorAll('.ag-header-cell-label').forEach((value, _key, _parent) => {
    const headerText = value.querySelector('.ag-header-cell-text')?.innerHTML
    if (headerText === headerName) {
      icon = value.querySelector('.ag-icon-filter')
    }
  })

  return icon
}

const testDate = new Date('2022-02-02T00:00:00Z')

const defaultGridState = {
  searchText: '',
  columnState: [],
  filterModel: {},
}

it('should render an empty table', async () => {
  const { container } = render(
    <ExperimentsTableAgGrid experiments={[]} gridState={defaultGridState} actions={makeActions()} />,
  )

  expect(container).toMatchSnapshot()
})

it('should render a table with experiments', async () => {
  const experiments: ExperimentBare[] = [
    {
      experimentId: 1,
      name: 'First',
      endDatetime: addToDate(testDate, { days: 14 }),
      ownerLogin: 'Owner',
      platform: Platform.Wpcom,
      startDatetime: testDate,
      status: Status.Staging,
    },
  ]
  const { container } = render(
    <ExperimentsTableAgGrid experiments={experiments} gridState={defaultGridState} actions={makeActions()} />,
  )

  await waitFor(() => {
    checkIfGridLoaded(container)
  })

  await waitFor(() => expect(container.querySelectorAll(RowLocator.rows).length).toBe(3), { timeout: 10000 })
})

it('should render a table with experiments and rerender when given a new gridState', async () => {
  const actions = makeActions()
  const experiments: ExperimentBare[] = [
    {
      experimentId: 1,
      name: 'First',
      endDatetime: addToDate(testDate, { days: 14 }),
      ownerLogin: 'Owner',
      platform: Platform.Wpcom,
      startDatetime: testDate,
      status: Status.Staging,
    },
  ]
  const { container, rerender } = render(
    <ExperimentsTableAgGrid experiments={experiments} gridState={defaultGridState} actions={actions} />,
  )

  await waitFor(() => {
    checkIfGridLoaded(container)
  })

  const newGridState = {
    ...defaultGridState,
    searchText: 'Explat_Test',
  }
  rerender(<ExperimentsTableAgGrid experiments={experiments} gridState={newGridState} actions={actions} />)

  // Wait for table to load
  const searchInput = (await screen.findByRole('textbox', { name: /Search/ })) as HTMLInputElement
  await waitFor(() => expect(searchInput.value).toBe('Explat_Test'))
  await waitFor(() => expect(container.querySelectorAll(RowLocator.rows).length).toBe(0), { timeout: 10000 })
})

it('grid actions should trigger functions', async () => {
  const user = userEvent.setup()
  const actions = makeActions()

  const experiments: ExperimentBare[] = [
    {
      experimentId: 1,
      name: 'First',
      endDatetime: addToDate(testDate, { days: 14 }),
      ownerLogin: 'Owner',
      platform: Platform.Wpcom,
      startDatetime: testDate,
      status: Status.Staging,
    },
  ]
  const { container } = render(
    <ExperimentsTableAgGrid experiments={experiments} gridState={defaultGridState} actions={actions} />,
  )

  await waitFor(() => checkIfGridLoaded(container))

  // Test search change
  const searchString = 'explat_test'
  const searchInput = await screen.findByRole('textbox', { name: /Search/ })
  await user.click(searchInput)
  await user.type(searchInput, searchString)
  await waitFor(() => expect(actions.onGridStateChange.mock.calls.length).toBe(searchString.length))
  Array.from(searchString).forEach((char, index) => {
    expect(actions.onGridStateChange.mock.calls[index][0]).toMatchObject({ searchText: char })
  })

  // Test sort change
  const statusColumn = screen.getByText(/Status/)
  await userEvent.click(statusColumn)
  await waitFor(() => expect(getGridSortIcon(container, 'Status', 'asc')).toBeInTheDocument())
  await waitFor(() => expect(actions.onGridStateChange.mock.calls.length).toBe(searchString.length + 1))

  // Test filter change
  const filterText = 'experiment'
  const filterMenu = getFilterMenuIcon(container, 'Name')
  expect(filterMenu).not.toBeNull()

  await userEvent.click((filterMenu as unknown) as Element)
  const inputField = container.querySelector('input[aria-label="Filter Value"]') as HTMLElement
  await userEvent.click(inputField)
  await userEvent.type(inputField, filterText)
  await waitFor(() => expect(getFilterIcon(container, 'Name')).toBeInTheDocument())
  await waitFor(() => expect(actions.onGridStateChange.mock.calls.length).toBe(searchString.length + 2), {
    timeout: 10000,
  })

  // Test reset button
  const resetButton = screen.getByRole('button', { name: /Reset/ })
  await userEvent.click(resetButton)
  await waitFor(() => expect(actions.resetGridState.mock.calls.length).toBe(1))
})
