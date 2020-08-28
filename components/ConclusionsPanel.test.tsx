import { fireEvent, screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react'
import * as notistack from 'notistack'
import React from 'react'

import Fixtures from '@/test-helpers/fixtures'
import { render } from '@/test-helpers/test-utils'

import ConclusionsPanel from './ConclusionsPanel'

jest.mock('notistack')
const mockedNotistack = notistack as jest.Mocked<typeof notistack>
mockedNotistack.useSnackbar.mockImplementation(() => ({
  enqueueSnackbar: jest.fn(),
  closeSnackbar: jest.fn(),
}))

test('renders as expected with complete conclusion data', () => {
  const experiment = Fixtures.createExperimentFull({
    conclusionUrl: 'https://betterexperiments.wordpress.com/experiment_1/conclusion',
    deployedVariationId: 2,
    endReason: 'Ran its course.',
  })
  const { container } = render(<ConclusionsPanel experiment={experiment} />)

  expect(container).toMatchInlineSnapshot(`
    <div>
      <div
        class="MuiPaper-root MuiPaper-elevation1 MuiPaper-rounded"
      >
        <div
          class="MuiToolbar-root MuiToolbar-regular MuiToolbar-gutters"
        >
          <h3
            class="MuiTypography-root makeStyles-title-1 MuiTypography-h3 MuiTypography-colorTextPrimary"
          >
            Conclusions
          </h3>
          <button
            class="MuiButtonBase-root MuiButton-root MuiButton-outlined"
            tabindex="0"
            type="button"
          >
            <span
              class="MuiButton-label"
            >
              <svg
                aria-hidden="true"
                class="MuiSvgIcon-root"
                focusable="false"
                viewBox="0 0 24 24"
              >
                <path
                  d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
                />
              </svg>
              Edit
            </span>
            <span
              class="MuiTouchRipple-root"
            />
          </button>
        </div>
        <table
          class="MuiTable-root"
        >
          <tbody
            class="MuiTableBody-root"
          >
            <tr
              class="MuiTableRow-root"
            >
              <th
                class="MuiTableCell-root MuiTableCell-head"
                role="cell"
                scope="row"
              >
                Reason the experiment ended
              </th>
              <td
                class="MuiTableCell-root MuiTableCell-body"
              >
                Ran its course.
              </td>
            </tr>
            <tr
              class="MuiTableRow-root"
            >
              <th
                class="MuiTableCell-root MuiTableCell-head"
                role="cell"
                scope="row"
              >
                Conclusion URL
              </th>
              <td
                class="MuiTableCell-root MuiTableCell-body"
              >
                <a
                  href="https://betterexperiments.wordpress.com/experiment_1/conclusion"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  https://betterexperiments.wordpress.com/experiment_1/conclusion
                </a>
              </td>
            </tr>
            <tr
              class="MuiTableRow-root"
            >
              <th
                class="MuiTableCell-root MuiTableCell-head"
                role="cell"
                scope="row"
              >
                Deployed variation
              </th>
              <td
                class="MuiTableCell-root MuiTableCell-body"
              >
                test
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `)
})

test('renders as expected without deployed variation', () => {
  const experiment = Fixtures.createExperimentFull({
    conclusionUrl: 'https://betterexperiments.wordpress.com/experiment_1/conclusion',
    deployedVariationId: null,
    endReason: 'Ran its course.',
  })
  const { container } = render(<ConclusionsPanel experiment={experiment} />)

  expect(container).toMatchInlineSnapshot(`
    <div>
      <div
        class="MuiPaper-root MuiPaper-elevation1 MuiPaper-rounded"
      >
        <div
          class="MuiToolbar-root MuiToolbar-regular MuiToolbar-gutters"
        >
          <h3
            class="MuiTypography-root makeStyles-title-3 MuiTypography-h3 MuiTypography-colorTextPrimary"
          >
            Conclusions
          </h3>
          <button
            class="MuiButtonBase-root MuiButton-root MuiButton-outlined"
            tabindex="0"
            type="button"
          >
            <span
              class="MuiButton-label"
            >
              <svg
                aria-hidden="true"
                class="MuiSvgIcon-root"
                focusable="false"
                viewBox="0 0 24 24"
              >
                <path
                  d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
                />
              </svg>
              Edit
            </span>
            <span
              class="MuiTouchRipple-root"
            />
          </button>
        </div>
        <table
          class="MuiTable-root"
        >
          <tbody
            class="MuiTableBody-root"
          >
            <tr
              class="MuiTableRow-root"
            >
              <th
                class="MuiTableCell-root MuiTableCell-head"
                role="cell"
                scope="row"
              >
                Reason the experiment ended
              </th>
              <td
                class="MuiTableCell-root MuiTableCell-body"
              >
                Ran its course.
              </td>
            </tr>
            <tr
              class="MuiTableRow-root"
            >
              <th
                class="MuiTableCell-root MuiTableCell-head"
                role="cell"
                scope="row"
              >
                Conclusion URL
              </th>
              <td
                class="MuiTableCell-root MuiTableCell-body"
              >
                <a
                  href="https://betterexperiments.wordpress.com/experiment_1/conclusion"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  https://betterexperiments.wordpress.com/experiment_1/conclusion
                </a>
              </td>
            </tr>
            <tr
              class="MuiTableRow-root"
            >
              <th
                class="MuiTableCell-root MuiTableCell-head"
                role="cell"
                scope="row"
              >
                Deployed variation
              </th>
              <td
                class="MuiTableCell-root MuiTableCell-body"
              />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `)
})

const queryEditDialog = () => screen.queryByRole('heading', { name: /Edit Experiment: Conclusions/ })

test('opens and saves edit dialog', async () => {
  const experiment = Fixtures.createExperimentFull()
  const { container: _container } = render(<ConclusionsPanel experiment={experiment} />)

  const editButton = screen.getByRole('button', { name: /Edit/ })
  fireEvent.click(editButton)

  await waitFor(queryEditDialog)

  const saveButton = screen.getByRole('button', { name: /Save/ })
  fireEvent.click(saveButton)

  await waitForElementToBeRemoved(queryEditDialog)
})

test('opens and cancels edit dialog', async () => {
  const experiment = Fixtures.createExperimentFull()
  const { container: _container } = render(<ConclusionsPanel experiment={experiment} />)

  const editButton = screen.getByRole('button', { name: /Edit/ })
  fireEvent.click(editButton)

  await waitFor(queryEditDialog)

  const cancelButton = screen.getByRole('button', { name: /Cancel/ })
  fireEvent.click(cancelButton)

  await waitForElementToBeRemoved(queryEditDialog)
})
