import {
  act,
  fireEvent,
  getByText,
  getDefaultNormalizer,
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from '@testing-library/react'
import { Formik } from 'formik'
import React from 'react'

import { experimentToFormData } from 'src/lib/form-data'
import { Metric, MetricParameterType } from 'src/lib/schemas'
import { changeFieldByRole, render } from 'src/test-helpers/test-utils'

import { ExperimentFormCompletionBag } from './ExperimentForm'
import Metrics from './Metrics'

const indexedMetrics: Record<number, Metric> = {
  1: {
    metricId: 1,
    name: 'asdf_7d_refund',
    description: 'string',
    higherIsBetter: true,
    parameterType: MetricParameterType.Revenue,
    revenueParams: {
      refundDays: 7,
      productSlugs: ['wp-bundles'],
      transactionTypes: ['new purchase'],
    },
  },
  2: {
    metricId: 2,
    name: 'registration_start',
    description: 'string',
    higherIsBetter: true,
    parameterType: MetricParameterType.Conversion,
    eventParams: [
      {
        event: 'wpcom_registration_start',
        props: {
          has_blocks: true,
        },
      },
    ],
  },
}
const completionBag: ExperimentFormCompletionBag = {
  eventCompletionDataSource: {
    isLoading: false,
    data: [
      {
        name: 'event_name',
        value: 'event_name',
      },
    ],
    error: null,
    reloadRef: { current: () => undefined },
  },
  userCompletionDataSource: {
    isLoading: false,
    data: [],
    error: null,
    reloadRef: { current: () => undefined },
  },
  exclusionGroupCompletionDataSource: {
    data: [],
    error: null,
    isLoading: false,
    reloadRef: { current: () => undefined },
  },
}

test('renders as expected', () => {
  const { container } = render(
    <Formik
      initialValues={{ experiment: experimentToFormData({}) }}
      onSubmit={
        /* istanbul ignore next; This is unused */
        () => undefined
      }
    >
      {(formikProps) => <Metrics {...{ indexedMetrics, completionBag, formikProps }} />}
    </Formik>,
  )
  expect(container).toMatchSnapshot()
})

test('allows adding, editing and removing a Metric Assignment', async () => {
  const { container } = render(
    <Formik
      initialValues={{ experiment: experimentToFormData({}) }}
      onSubmit={
        /* istanbul ignore next; This is unused */
        () => undefined
      }
    >
      {(formikProps) => <Metrics {...{ indexedMetrics, completionBag, formikProps }} />}
    </Formik>,
  )

  const containerElmt = container.querySelector('.ag-center-cols-container') as HTMLDivElement
  await waitFor(() => expect(containerElmt).not.toBeNull())

  expect(container).toMatchSnapshot()

  let metricAssignButtons: HTMLElement[] = []
  await waitFor(() => {
    metricAssignButtons = screen.getAllByRole('button', { name: /Assign metric/i })
    expect(metricAssignButtons.length).toBe(2)
  })

  // eslint-disable-next-line @typescript-eslint/require-await
  await act(async () => {
    fireEvent.click(metricAssignButtons[0])
  })

  expect(container).toMatchSnapshot()

  const changeExpectedSwitch = screen.getByLabelText(/Change Expected/)

  // eslint-disable-next-line @typescript-eslint/require-await
  await act(async () => {
    fireEvent.click(changeExpectedSwitch)
  })

  await changeFieldByRole('spinbutton', /Minimum Difference/, '0.01')

  const moreMenu = screen.getByRole('button', { name: /more/ })

  fireEvent.click(moreMenu)
  await screen.findByRole('menuitem', { name: /Set as Primary/ })

  expect(container).toMatchSnapshot()

  const setAsPrimary = screen.getByRole('menuitem', { name: /Set as Primary/ })
  // eslint-disable-next-line @typescript-eslint/require-await
  await act(async () => {
    fireEvent.click(setAsPrimary)
  })

  expect(container).toMatchSnapshot()

  fireEvent.click(moreMenu)
  const remove = screen.getByRole('menuitem', { name: /Remove/ })
  // eslint-disable-next-line @typescript-eslint/require-await
  await act(async () => {
    fireEvent.click(remove)
  })

  expect(container).toMatchSnapshot()

  // eslint-disable-next-line @typescript-eslint/require-await
  await act(async () => {
    fireEvent.click(metricAssignButtons[1])
  })

  expect(container).toMatchSnapshot()
})

test('renders metric details in the metrics table', async () => {
  const { container } = render(
    <Formik
      initialValues={{ experiment: experimentToFormData({}) }}
      onSubmit={
        /* istanbul ignore next; This is unused */
        () => undefined
      }
    >
      {(formikProps) => <Metrics {...{ indexedMetrics, completionBag, formikProps }} />}
    </Formik>,
  )

  const containerElmt = container.querySelector('.ag-center-cols-container') as HTMLDivElement
  expect(containerElmt).not.toBeNull()
  await waitFor(() => getByText(containerElmt, /registration_start/), { container })

  // Open metric details
  for (let i = 1; i <= Object.keys(indexedMetrics).length; i++) {
    const metric = indexedMetrics[i]
    const metricElmt = containerElmt.querySelector(`div.ag-row[row-id='${metric.name}'] .ag-cell`) as HTMLElement
    fireEvent.click(metricElmt)
    const detailContainerElmt = container.querySelector('div.ag-full-width-container') as HTMLDivElement

    await waitFor(() => getByText(detailContainerElmt, /Higher is Better:/))
    getByText(detailContainerElmt, metric.name)
    metric.parameterType === 'conversion'
      ? getByText(detailContainerElmt, /conversion/)
      : getByText(detailContainerElmt, /revenue/)
    metric.higherIsBetter ? getByText(detailContainerElmt, /Yes/) : getByText(detailContainerElmt, /No/)
    getByText(detailContainerElmt, /Parameters/)

    getByText(
      detailContainerElmt,
      JSON.stringify(metric.parameterType === 'conversion' ? metric.eventParams : metric.revenueParams, null, 4),
      {
        normalizer: getDefaultNormalizer({ trim: true, collapseWhitespace: false }),
      },
    )

    // Close metric details
    fireEvent.click(metricElmt)
    await waitForElementToBeRemoved(
      detailContainerElmt.querySelector(`div.ag-full-width-row[row-id='${metric.name}-detail']`),
    )
  }
})
