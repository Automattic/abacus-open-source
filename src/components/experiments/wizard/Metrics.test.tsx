import { act, fireEvent, getByRole, screen } from '@testing-library/react'
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
    parameterType: MetricParameterType.Revenue,
  },
  2: {
    metricId: 2,
    name: 'registration_start',
    description: 'string',
    parameterType: MetricParameterType.Conversion,
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
  expect(container).toMatchSnapshot()

  const metricSearchField = screen.getByRole('combobox', { name: /Select a metric/ })
  const metricSearchFieldMoreButton = getByRole(metricSearchField, 'button', { name: 'Open' })
  const metricAddButton = screen.getByRole('button', { name: 'Add metric' })

  fireEvent.click(metricAddButton)

  expect(container).toMatchSnapshot()

  fireEvent.click(metricSearchFieldMoreButton)
  fireEvent.click(await screen.findByRole('option', { name: /registration_start/ }))
  fireEvent.click(metricAddButton)

  // Use the min-diff calculator
  screen.getByRole('button', { name: /Minimum Difference Calculator/ }).click()
  await changeFieldByRole('spinbutton', /Users \/ month/, '500000')
  await changeFieldByRole('spinbutton', /Baseline conversion rate/, '50')
  await changeFieldByRole('spinbutton', /Extra conversions \/ month/, '5000')
  screen.getByRole('checkbox', { name: /I understand that a conversion/ }).click()
  screen.getByRole('button', { name: /Apply min diff/ }).click()

  expect(container).toMatchSnapshot()

  const changeExpectedSwitch = screen.getByLabelText(/Change Expected/)

  // eslint-disable-next-line @typescript-eslint/require-await
  await act(async () => {
    fireEvent.click(changeExpectedSwitch)
  })

  await changeFieldByRole('spinbutton', /Minimum Difference/, '0.01')

  const moreMenu = screen.getByRole('button', { name: /more/ })
  fireEvent.click(moreMenu)

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

  fireEvent.click(metricSearchFieldMoreButton)
  fireEvent.click(await screen.findByRole('option', { name: /registration_start/ }))
  // eslint-disable-next-line @typescript-eslint/require-await
  await act(async () => {
    fireEvent.click(metricAddButton)
  })

  expect(container).toMatchSnapshot()
})
