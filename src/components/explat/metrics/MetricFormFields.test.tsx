/* eslint-disable @typescript-eslint/require-await */
import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { Formik, FormikProps } from 'formik'
import MockDate from 'mockdate'
import React from 'react'

import TagsApi from 'src/api/explat/TagsApi'
import { MetricFormData, metricToFormData } from 'src/lib/explat/form-data'
import { DIVISION_KPI_TAG_NAMESPACES } from 'src/lib/explat/tags'
import Fixtures from 'src/test-helpers/fixtures'
import { changeFieldByRole, render } from 'src/test-helpers/test-utils'

import MetricFormFields from './MetricFormFields'

MockDate.set('2020-07-21')

jest.mock('src/api/explat/TagsApi')
const mockedTagsApi = TagsApi as jest.Mocked<typeof TagsApi>

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

test('renders tag assignments as expected', async () => {
  const metric = Fixtures.createMetric(2)
  const tags = Fixtures.createTagBares(5).map((tag) => ({
    ...tag,
    namespace: DIVISION_KPI_TAG_NAMESPACES[0],
  }))
  mockedTagsApi.findAll.mockImplementationOnce(async () => tags)

  render(
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

  await act(async () => {
    screen.getByRole('button', { name: /Open tags list/ }).click()
  })
  await waitFor(() => expect(screen.getByText(/tag_5/)).toBeInTheDocument())

  await act(async () => {
    await changeFieldByRole('textbox', /Tags/, 'tag_123')
    await waitFor(() => expect(screen.getByText(/No tags found/)).toBeInTheDocument())
  })
})
