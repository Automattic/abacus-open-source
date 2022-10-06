/* eslint-disable @typescript-eslint/require-await */
import { act, fireEvent, screen } from '@testing-library/react'
import { Formik, FormikProps } from 'formik'
import MockDate from 'mockdate'
import React from 'react'

import { MetricFormData, metricToFormData } from 'src/lib/form-data'
import Fixtures from 'src/test-helpers/fixtures'
import { render } from 'src/test-helpers/test-utils'

import MetricFormFields from './MetricFormFields'

MockDate.set('2020-07-21')

test('renders as expected for conversion metric', async () => {
  const metric = Fixtures.createMetric(1)
  const { container } = render(
    <Formik
      initialValues={{
        metric: metricToFormData(metric),
      }}
      onSubmit={
        /* istanbul ignore next; This is unused */
        () => undefined
      }
    >
      {(formikProps: FormikProps<{ metric: MetricFormData }>) => <MetricFormFields formikProps={formikProps} />}
    </Formik>,
  )

  expect(container).toMatchSnapshot()

  await act(async () => {
    fireEvent.click(screen.getByRole('radio', { name: 'Cash Sales' }))
  })
})

test('renders as expected for the Cash Sales metric', async () => {
  const metric = Fixtures.createMetric(2)
  const { container } = render(
    <Formik
      initialValues={{
        metric: metricToFormData(metric),
      }}
      onSubmit={
        /* istanbul ignore next; This is unused */
        () => undefined
      }
    >
      {(formikProps: FormikProps<{ metric: MetricFormData }>) => <MetricFormFields formikProps={formikProps} />}
    </Formik>,
  )

  expect(container).toMatchSnapshot()

  await act(async () => {
    fireEvent.click(screen.getByRole('radio', { name: 'Conversion' }))
  })
})

test('renders as expected for new metric', () => {
  const { container } = render(
    <Formik
      initialValues={{
        metric: metricToFormData({}),
      }}
      onSubmit={
        /* istanbul ignore next; This is unused */
        () => undefined
      }
    >
      {(formikProps: FormikProps<{ metric: MetricFormData }>) => <MetricFormFields formikProps={formikProps} />}
    </Formik>,
  )

  expect(container).toMatchSnapshot()
})
