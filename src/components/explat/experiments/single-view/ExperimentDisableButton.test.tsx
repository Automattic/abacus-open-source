/* eslint-disable @typescript-eslint/require-await */
import { fireEvent, screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react'
import MockDate from 'mockdate'
import React from 'react'

import ExperimentsApi from 'src/api/explat/ExperimentsApi'
import Fixtures from 'src/test-helpers/fixtures'
import { render } from 'src/test-helpers/test-utils'

import ExperimentDisableButton from './ExperimentDisableButton'

MockDate.set('2020-07-21')

jest.mock('src/api/explat/ExperimentsApi')
const mockedExperimentsApi = ExperimentsApi as jest.Mocked<typeof ExperimentsApi>

test('renders as expected', () => {
  const experimentReloadRef: React.MutableRefObject<() => void> = { current: jest.fn() }
  const experiment = Fixtures.createExperimentFull()
  const { container } = render(<ExperimentDisableButton {...{ experiment, experimentReloadRef }} />)

  expect(container).toMatchSnapshot()
})

test('disables an experiment', async () => {
  const experimentReloadRef: React.MutableRefObject<() => void> = { current: jest.fn() }
  const experiment = Fixtures.createExperimentFull()
  const { container } = render(<ExperimentDisableButton {...{ experiment, experimentReloadRef }} />)

  mockedExperimentsApi.changeStatus.mockReset()
  mockedExperimentsApi.changeStatus.mockImplementationOnce(async () => undefined)

  const firstDisableButton = screen.getByRole('button', { name: /Disable/ })

  // First Opening - We cancel
  fireEvent.click(firstDisableButton)

  await waitFor(() => screen.getByRole('button', { name: /Cancel/ }))

  expect(container).toMatchSnapshot()

  const cancelButton = screen.getByRole('button', { name: /Cancel/ })
  fireEvent.click(cancelButton)
  await waitForElementToBeRemoved(cancelButton)

  expect(mockedExperimentsApi.changeStatus).toHaveBeenCalledTimes(0)
  expect(experimentReloadRef.current).toHaveBeenCalledTimes(0)

  // Second Opening - We disable
  fireEvent.click(firstDisableButton)

  await waitFor(() => screen.getByRole('button', { name: /Cancel/ }))
  const cancelButton2nd = screen.getByRole('button', { name: /Cancel/ })

  const allDisableButtons = screen.getAllByRole('button', { name: /Disable/ })
  allDisableButtons.forEach((button) => fireEvent.click(button))

  await waitForElementToBeRemoved(cancelButton2nd)

  expect(mockedExperimentsApi.changeStatus).toHaveBeenCalledTimes(1)
  expect(experimentReloadRef.current).toHaveBeenCalledTimes(1)
  expect(mockedExperimentsApi.changeStatus).toMatchInlineSnapshot(`
    [MockFunction] {
      "calls": Array [
        Array [
          1,
          "disabled",
        ],
      ],
      "results": Array [
        Object {
          "type": "return",
          "value": Promise {},
        },
      ],
    }
  `)
})
