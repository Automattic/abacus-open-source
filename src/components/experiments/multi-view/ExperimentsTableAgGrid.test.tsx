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

it('should allow searching, sorting, and resetting by changing url params', async () => {
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
  let expectedParamsObj = defaultSortParams as UrlParams
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
  userEvent.click(nameColumn)
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

  // Test reset
  expectedParamsObj = defaultSortParams
  const resetButton = screen.getByRole('button', { name: /Reset/ })
  await userEvent.click(resetButton)
  await screen.findByText(/wpcom/)
  expect(history.length).toBe(5)
  expect(history.location.search).toBe(`?${getParamsStringFromObj(expectedParamsObj)}`)
})

it('getting rid of all sorting should result in special url params', async () => {
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
  userEvent.click(nameColumn)
  await waitFor(() => {
    expect(history.length).toBe(3)
  })
  userEvent.click(nameColumn)
  await waitFor(() => {
    expect(history.length).toBe(4)
  })
  userEvent.click(nameColumn)
  await waitFor(() => {
    expect(history.length).toBe(5)
  })
  expect(history.location.search).toBe(`?${getParamsStringFromObj(expectedParamsObj)}`)
})
