import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import addToDate from 'date-fns/add'
import { createMemoryHistory } from 'history'
import React from 'react'
import { Router } from 'react-router-dom'

import { ExperimentBare, Platform, Status } from 'src/lib/schemas'
import { changeFieldByRole, render } from 'src/test-helpers/test-utils'

import ExperimentsTableAgGrid from './ExperimentsTableAgGrid'
import { defaultSortParams, getParamsStringFromObj, UrlParams } from './ExperimentsTableAgGrid.utils'

it('should render an empty table', () => {
  const { container } = render(<ExperimentsTableAgGrid experiments={[]} />)

  expect(container).toMatchSnapshot()
})

it('should render a table with experiments', async () => {
  const experiments: ExperimentBare[] = [
    {
      experimentId: 1,
      name: 'First',
      endDatetime: addToDate(new Date(), { days: 14 }),
      ownerLogin: 'Owner',
      platform: Platform.Wpcom,
      startDatetime: new Date(),
      status: Status.Staging,
    },
  ]
  const { container } = render(<ExperimentsTableAgGrid experiments={experiments} />)

  expect(container).toMatchSnapshot()
})

it('should allow searching, filtering, sorting, and resetting by changing url params', async () => {
  const history = createMemoryHistory()
  const experiments: ExperimentBare[] = [
    {
      experimentId: 1,
      name: 'First',
      endDatetime: addToDate(new Date(), { days: 14 }),
      ownerLogin: 'Owner',
      platform: Platform.Wpcom,
      startDatetime: new Date(),
      status: Status.Staging,
    },
  ]
  const { container } = render(
    <Router history={history}>
      <ExperimentsTableAgGrid experiments={experiments} />
    </Router>,
  )

  await screen.findByText(/First/)

  // Wait for default sorting options
  let expectedParamsObj: UrlParams = defaultSortParams
  await waitFor(() => {
    expect(history.length).toBe(2)
  })
  expect(history.location.search).toBe(`?${getParamsStringFromObj(expectedParamsObj)}`)

  // Test search bar
  const searchString = 'explat_test'
  expectedParamsObj = {
    ...expectedParamsObj,
    search: searchString,
  }
  await changeFieldByRole('textbox', /Search/, searchString)
  expect(history.length).toBe(3)
  expect(history.location.search).toBe(`?${getParamsStringFromObj(expectedParamsObj)}`)

  // Test sorting
  expectedParamsObj = {
    nameS: 'asc',
    nameSi: '0',
    search: searchString,
  }
  const nameColumn = screen.getByText(/Name/)
  await userEvent.click(nameColumn)
  await waitFor(() => {
    container.querySelectorAll('.ag-header-cell-label').forEach((value, _key, _parent) => {
      const headerText = value.querySelector('.ag-header-cell-text')?.innerHTML
      if (headerText === 'Name') {
        expect(value.querySelector('.ag-icon-asc')).toBeInTheDocument()
      }
    })
  })
  expect(history.length).toBe(4)
  expect(history.location.search).toBe(`?${getParamsStringFromObj(expectedParamsObj)}`)

  // Test text filters
  const filterText = 'experiment'
  expectedParamsObj = {
    nameS: 'asc',
    nameSi: '0',
    nameF: filterText,
    nameT: 'contains',
    search: searchString,
  }
  const cellLabels = container.querySelectorAll('.ag-cell-label-container')
  let filterMenu: Element | null = null
  cellLabels.forEach((value, _key, _parent) => {
    const headerText = value.querySelector('.ag-header-cell-text')?.innerHTML
    if (headerText === 'Name') {
      filterMenu = value.querySelector('.ag-icon-menu') as Element
    }
  })
  expect(filterMenu).not.toBeNull()
  await userEvent.click((filterMenu as unknown) as Element)
  const inputField = container.querySelector('input[aria-label="Filter Value"]') as HTMLElement
  await userEvent.type(inputField, filterText)
  await waitFor(() => {
    container.querySelectorAll('.ag-header-cell-label').forEach((value, _key, _parent) => {
      const headerText = value.querySelector('.ag-header-cell-text')?.innerHTML
      if (headerText === 'Name') {
        expect(value.querySelector('.ag-icon-filter')).toBeInTheDocument()
      }
    })
  })
  await waitFor(() => {
    expect(history.length).toBe(5)
  })
  expect(history.location.search).toBe(`?${getParamsStringFromObj(expectedParamsObj)}`)

  // Test compound text filters
  const filterText2 = 'test'
  expectedParamsObj = {
    nameS: 'asc',
    nameSi: '0',
    nameOp: 'AND',
    nameC1f: filterText,
    nameC1t: 'contains',
    nameC2f: filterText2,
    nameC2t: 'contains',
    search: searchString,
  }
  cellLabels.forEach((value, _key, _parent) => {
    const headerText = value.querySelector('.ag-header-cell-text')?.innerHTML
    if (headerText === 'Name') {
      filterMenu = value.querySelector('.ag-icon-menu') as HTMLElement
    }
  })
  await userEvent.click((filterMenu as unknown) as Element)
  const inputFields = container.querySelectorAll('input[aria-label="Filter Value"]')
  await userEvent.type(inputFields[1], filterText2)
  await waitFor(() => {
    expect(history.length).toBe(6)
  })
  expect(history.location.search).toBe(`?${getParamsStringFromObj(expectedParamsObj)}`)

  // Test date filters
  const filterDate = '2020-01-01'
  expectedParamsObj = {
    nameS: 'asc',
    nameSi: '0',
    nameOp: 'AND',
    nameC1f: filterText,
    nameC1t: 'contains',
    nameC2f: filterText2,
    nameC2t: 'contains',
    startDatetimeDf: `${filterDate} 00:00:00`,
    startDatetimeT: 'equals',
    search: searchString,
  }
  cellLabels.forEach((value, _key, _parent) => {
    const headerText = value.querySelector('.ag-header-cell-text')?.innerHTML
    if (headerText === 'Start') {
      filterMenu = value.querySelector('.ag-icon-menu') as HTMLElement
    }
  })
  await userEvent.click((filterMenu as unknown) as Element)
  const dateInputField = container.querySelector('input[placeholder="yyyy-mm-dd"]') as HTMLElement
  await userEvent.type(dateInputField, filterDate)
  await waitFor(() => {
    container.querySelectorAll('.ag-header-cell-label').forEach((value, _key, _parent) => {
      const headerText = value.querySelector('.ag-header-cell-text')?.innerHTML
      if (headerText === 'Start') {
        expect(value.querySelector('.ag-icon-filter')).toBeInTheDocument()
      }
    })
  })
  await waitFor(() => {
    expect(history.length).toBe(7)
  })
  expect(history.location.search).toBe(`?${getParamsStringFromObj(expectedParamsObj)}`)

  // Test compound date filters
  const filterDate2 = '2020-06-01'
  expectedParamsObj = {
    nameS: 'asc',
    nameSi: '0',
    nameOp: 'AND',
    nameC1f: filterText,
    nameC1t: 'contains',
    nameC2f: filterText2,
    nameC2t: 'contains',
    startDatetimeOp: 'AND',
    startDatetimeC1df: `${filterDate} 00:00:00`,
    startDatetimeC1t: 'equals',
    startDatetimeC2df: `${filterDate2} 00:00:00`,
    startDatetimeC2t: 'equals',
    search: searchString,
  }
  cellLabels.forEach((value, _key, _parent) => {
    const headerText = value.querySelector('.ag-header-cell-text')?.innerHTML
    if (headerText === 'Start') {
      filterMenu = value.querySelector('.ag-icon-menu') as HTMLElement
    }
  })
  await userEvent.click((filterMenu as unknown) as Element)
  const dateInputFields = container.querySelectorAll('input[placeholder="yyyy-mm-dd"]')
  await userEvent.type(dateInputFields[2], filterDate2)
  await waitFor(() => {
    container.querySelectorAll('.ag-header-cell-label').forEach((value, _key, _parent) => {
      const headerText = value.querySelector('.ag-header-cell-text')?.innerHTML
      if (headerText === 'Start') {
        expect(value.querySelector('.ag-icon-filter')).toBeInTheDocument()
      }
    })
  })
  await waitFor(() => {
    expect(history.length).toBe(8)
  })
  expect(history.location.search).toBe(`?${getParamsStringFromObj(expectedParamsObj)}`)

  // Test reset
  expectedParamsObj = defaultSortParams
  const resetButton = screen.getByRole('button', { name: /Reset/ })
  await userEvent.click(resetButton)
  await screen.findByText(/wpcom/)
  expect(history.length).toBe(9)
  expect(history.location.search).toBe(`?${getParamsStringFromObj(expectedParamsObj)}`)
})

it('getting rid of all sorting and filtering should result in special url params', async () => {
  const history = createMemoryHistory()
  const experiments: ExperimentBare[] = [
    {
      experimentId: 1,
      name: 'First',
      endDatetime: addToDate(new Date(), { days: 14 }),
      ownerLogin: 'Owner',
      platform: Platform.Wpcom,
      startDatetime: new Date(),
      status: Status.Staging,
    },
  ]
  render(
    <Router history={history}>
      <ExperimentsTableAgGrid experiments={experiments} />
    </Router>,
  )

  await screen.findByText(/First/)

  // Wait for default sorting options
  let expectedParamsObj = defaultSortParams as UrlParams
  await waitFor(() => {
    expect(history.length).toBe(2)
  })
  expect(history.location.search).toBe(`?${getParamsStringFromObj(expectedParamsObj)}`)

  // Test sorting
  expectedParamsObj = {
    null: 'true',
  }
  const nameColumn = screen.getByText(/Name/)
  await userEvent.click(nameColumn)
  await waitFor(() => {
    expect(history.length).toBe(3)
  })
  await userEvent.click(nameColumn)
  await waitFor(() => {
    expect(history.length).toBe(4)
  })
  await userEvent.click(nameColumn)
  await waitFor(() => {
    expect(history.length).toBe(5)
  })
  expect(history.location.search).toBe(`?${getParamsStringFromObj(expectedParamsObj)}`)
})
