import { act, fireEvent, getByRole, screen, waitFor } from '@testing-library/react'
import { StatusCodes } from 'http-status-codes'
import _ from 'lodash'
import noop from 'lodash/noop'
import MockDate from 'mockdate'
import React from 'react'

import * as AutocompleteApi from 'src/api/AutocompleteApi'
import { experimentToFormData } from 'src/lib/form-data'
import * as Normalizers from 'src/lib/normalizers'
import { experimentFullNewSchema, Status } from 'src/lib/schemas'
import Fixtures from 'src/test-helpers/fixtures'
import { changeFieldByRole, render, validationErrorDisplayer } from 'src/test-helpers/test-utils'
import { formatIsoDate } from 'src/utils/time'

import ExperimentForm, { ExperimentFormCompletionBag } from './ExperimentForm'

jest.mock('src/api/AutocompleteApi')
const mockedAutocompleteApi = AutocompleteApi as jest.Mocked<typeof AutocompleteApi>
mockedAutocompleteApi.getPropNameCompletions.mockImplementationOnce(async () => null)
mockedAutocompleteApi.getPropNameCompletions.mockImplementationOnce(async () => [
  { name: 'prop key name', value: 'prop_key_value' },
])

// As jest doesn't include scrollIntoView
window.HTMLElement.prototype.scrollIntoView = noop

// Needed for testing the MuiCombobox
document.createRange = () => ({
  setStart: () => undefined,
  setEnd: () => undefined,
  // @ts-ignore
  commonAncestorContainer: {
    nodeName: 'BODY',
    ownerDocument: document,
  },
})

// TODO: Make this more accessible
function isSectionError(sectionButton: HTMLElement) {
  return !!sectionButton.querySelector('.Mui-error')
}

function isSectionComplete(sectionButton: HTMLElement) {
  return !!sectionButton.querySelector('.MuiStepIcon-completed')
}

const exclusionGroupCompletions = Fixtures.createTagBares(5).map((tag) => ({
  name: tag.name,
  value: tag.tagId,
}))
const completionBag: ExperimentFormCompletionBag = {
  userCompletionDataSource: {
    isLoading: false,
    error: null,
    data: [
      {
        name: 'testing (owner-nickname)',
        value: 'owner-nickname',
      },
    ],
    reloadRef: { current: () => undefined },
  },
  eventCompletionDataSource: {
    isLoading: false,
    error: null,
    data: [
      {
        name: 'event_name',
        value: 'event_name',
      },
    ],
    reloadRef: { current: () => undefined },
  },
  exclusionGroupCompletionDataSource: {
    data: exclusionGroupCompletions,
    error: null,
    isLoading: false,
    reloadRef: { current: () => undefined },
  },
}

test('renders as expected', () => {
  MockDate.set('2020-08-13')

  const onSubmit = async () => undefined

  const { container } = render(
    <ExperimentForm
      indexedMetrics={Normalizers.indexMetrics(Fixtures.createMetrics(20))}
      indexedSegments={Normalizers.indexSegments(Fixtures.createSegments(20))}
      initialExperiment={experimentToFormData({})}
      onSubmit={onSubmit}
      completionBag={completionBag}
    />,
  )
  expect(container).toMatchSnapshot()
})

test('sections should be browsable by the next and prev buttons', async () => {
  MockDate.set('2020-08-13')

  const onSubmit = async () => undefined

  render(
    <ExperimentForm
      indexedMetrics={Normalizers.indexMetrics(Fixtures.createMetrics(20))}
      indexedSegments={Normalizers.indexSegments(Fixtures.createSegments(20))}
      initialExperiment={experimentToFormData({})}
      onSubmit={onSubmit}
      completionBag={completionBag}
    />,
  )

  screen.getByText(/Design and Document Your Experiment/)
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /Begin/ }))
  })
  screen.getAllByText(/Basic Info/)
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /Previous/ }))
  })
  screen.getByText(/Design and Document Your Experiment/)
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /Begin/ }))
  })
  screen.getAllByText(/Basic Info/)
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /Next/ }))
  })
  screen.getByText(/Define Your Audience/)
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /Next/ }))
  })
  screen.getByText(/Assign Metrics/)
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /Next/ }))
  })
  screen.getByText(/Confirm and Submit Your Experiment/)
})

test('sections should be browsable by the section buttons and show validation errors without crashing', async () => {
  MockDate.set('2020-08-13')

  const onSubmit = async () => undefined

  const { container } = render(
    <ExperimentForm
      indexedMetrics={Normalizers.indexMetrics(Fixtures.createMetrics(20))}
      indexedSegments={Normalizers.indexSegments(Fixtures.createSegments(20))}
      initialExperiment={experimentToFormData({})}
      onSubmit={onSubmit}
      completionBag={completionBag}
    />,
  )

  const basicInfoSectionButton = screen.getByRole('button', { name: /Basic Info/ })
  const audienceSectionButton = screen.getByRole('button', { name: /Audience/ })
  const metricsSectionButton = screen.getByRole('button', { name: /Metrics/ })
  const submitSectionButton = screen.getByRole('button', { name: /Submit/ })

  // The order of these is such that it triggers all validation error paths

  screen.getByText(/Design and Document Your Experiment/)
  expect(container).toMatchSnapshot()

  await act(async () => {
    fireEvent.click(submitSectionButton)
  })

  screen.getByText(/Confirm and Submit Your Experiment/)
  expect(container).toMatchSnapshot()

  await act(async () => {
    fireEvent.click(metricsSectionButton)
  })

  // We add a metricAssignment first so it can show validation errors
  screen.getByText(/Assign Metrics/)
  expect(container).toMatchSnapshot()
  const metricSearchField = screen.getByRole('combobox', { name: /Select a metric/ })
  const metricSearchFieldMoreButton = getByRole(metricSearchField, 'button', { name: 'Open' })
  const metricAddButton = screen.getByRole('button', { name: 'Add metric' })

  fireEvent.click(metricSearchFieldMoreButton)
  const metricOption = await screen.findByRole('option', { name: /metric_10/ })
  await act(async () => {
    fireEvent.click(metricOption)
  })
  await act(async () => {
    fireEvent.click(metricAddButton)
  })

  await act(async () => {
    fireEvent.click(basicInfoSectionButton)
  })

  screen.getAllByText(/Basic Info/)
  expect(container).toMatchSnapshot()

  await act(async () => {
    fireEvent.click(metricsSectionButton)
  })

  screen.getByText(/Assign Metrics/)
  expect(container).toMatchSnapshot()

  await act(async () => {
    fireEvent.click(audienceSectionButton)
  })

  screen.getByText(/Define Your Audience/)
  expect(container).toMatchSnapshot()
})

test('section should be validated after change', async () => {
  MockDate.set('2020-08-13')

  const onSubmit = async () => undefined

  render(
    <ExperimentForm
      indexedMetrics={Normalizers.indexMetrics(Fixtures.createMetrics(20))}
      indexedSegments={Normalizers.indexSegments(Fixtures.createSegments(20))}
      initialExperiment={experimentToFormData({})}
      onSubmit={onSubmit}
      completionBag={completionBag}
    />,
  )

  const startSectionButton = screen.getByRole('button', { name: /Start/ })
  const basicInfoSectionButton = screen.getByRole('button', { name: /Basic Info/ })
  const audienceSectionButton = screen.getByRole('button', { name: /Audience/ })
  const metricsSectionButton = screen.getByRole('button', { name: /Metrics/ })
  const submitSectionButton = screen.getByRole('button', { name: /Submit/ })

  expect(isSectionError(startSectionButton)).toBe(false)
  expect(isSectionError(basicInfoSectionButton)).toBe(false)
  expect(isSectionError(audienceSectionButton)).toBe(false)
  expect(isSectionError(metricsSectionButton)).toBe(false)
  expect(isSectionError(submitSectionButton)).toBe(false)

  expect(isSectionComplete(startSectionButton)).toBe(false)
  expect(isSectionComplete(basicInfoSectionButton)).toBe(false)
  expect(isSectionComplete(audienceSectionButton)).toBe(false)
  expect(isSectionComplete(metricsSectionButton)).toBe(false)
  expect(isSectionComplete(submitSectionButton)).toBe(false)

  await act(async () => {
    fireEvent.click(basicInfoSectionButton)
  })

  screen.getByRole('textbox', { name: /Experiment name/ })

  expect(isSectionError(startSectionButton)).toBe(true)
  expect(isSectionError(basicInfoSectionButton)).toBe(false)
  expect(isSectionError(audienceSectionButton)).toBe(false)
  expect(isSectionError(metricsSectionButton)).toBe(false)
  expect(isSectionError(submitSectionButton)).toBe(false)

  expect(isSectionComplete(startSectionButton)).toBe(false)
  expect(isSectionComplete(basicInfoSectionButton)).toBe(false)
  expect(isSectionComplete(audienceSectionButton)).toBe(false)
  expect(isSectionComplete(metricsSectionButton)).toBe(false)
  expect(isSectionComplete(submitSectionButton)).toBe(false)

  await act(async () => {
    fireEvent.click(startSectionButton)
  })

  const postUrlInput = screen.getByRole('textbox', { name: /Your Post's URL/ })

  await act(async () => {
    fireEvent.change(postUrlInput, { target: { value: 'http://example.com/' } })
  })

  await act(async () => {
    fireEvent.click(basicInfoSectionButton)
  })

  expect(isSectionError(startSectionButton)).toBe(false)
  expect(isSectionError(basicInfoSectionButton)).toBe(false)
  expect(isSectionError(audienceSectionButton)).toBe(false)
  expect(isSectionError(metricsSectionButton)).toBe(false)
  expect(isSectionError(submitSectionButton)).toBe(false)

  expect(isSectionComplete(startSectionButton)).toBe(true)
  expect(isSectionComplete(basicInfoSectionButton)).toBe(false)
  expect(isSectionComplete(audienceSectionButton)).toBe(false)
  expect(isSectionComplete(metricsSectionButton)).toBe(false)
  expect(isSectionComplete(submitSectionButton)).toBe(false)
})

test('skipping to submit should check all sections', async () => {
  MockDate.set('2020-08-13')

  const onSubmit = async () => undefined

  const { container } = render(
    <ExperimentForm
      indexedMetrics={Normalizers.indexMetrics(Fixtures.createMetrics(20))}
      indexedSegments={Normalizers.indexSegments(Fixtures.createSegments(20))}
      initialExperiment={experimentToFormData({})}
      onSubmit={onSubmit}
      completionBag={completionBag}
    />,
  )

  const startSectionButton = screen.getByRole('button', { name: /Start/ })
  const basicInfoSectionButton = screen.getByRole('button', { name: /Basic Info/ })
  const audienceSectionButton = screen.getByRole('button', { name: /Audience/ })
  const metricsSectionButton = screen.getByRole('button', { name: /Metrics/ })
  const submitSectionButton = screen.getByRole('button', { name: /Submit/ })

  await act(async () => {
    fireEvent.click(submitSectionButton)
  })

  expect(container).toMatchSnapshot()

  expect(isSectionError(startSectionButton)).toBe(true)
  expect(isSectionError(basicInfoSectionButton)).toBe(true)
  expect(isSectionError(audienceSectionButton)).toBe(true)
  expect(isSectionError(metricsSectionButton)).toBe(true)
  expect(isSectionError(submitSectionButton)).toBe(false)

  expect(isSectionComplete(startSectionButton)).toBe(false)
  expect(isSectionComplete(basicInfoSectionButton)).toBe(false)
  expect(isSectionComplete(audienceSectionButton)).toBe(false)
  expect(isSectionComplete(metricsSectionButton)).toBe(false)
  expect(isSectionComplete(submitSectionButton)).toBe(false)
})

test('form submits with valid fields', async () => {
  MockDate.set('2020-08-13')

  let submittedData: unknown = null
  const onSubmit = async (formData: unknown): Promise<undefined> => {
    // We need to add a timeout here so the loading indicator renders
    await new Promise((resolve) => setTimeout(resolve, StatusCodes.OK))
    submittedData = formData
    return
  }

  render(
    <ExperimentForm
      indexedMetrics={Normalizers.indexMetrics(Fixtures.createMetrics(20))}
      indexedSegments={Normalizers.indexSegments(Fixtures.createSegments(20))}
      initialExperiment={experimentToFormData({})}
      onSubmit={onSubmit}
      completionBag={completionBag}
    />,
  )

  // ### Start
  screen.getByText(/Design and Document Your Experiment/)
  await changeFieldByRole('textbox', /Your Post's URL/, 'http://example.com/')
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /Begin/ }))
  })

  // ### Basic Info
  screen.getAllByText(/Basic Info/)
  await changeFieldByRole('textbox', /Experiment name/, 'test_experiment_name')
  await changeFieldByRole('textbox', /Experiment description/, 'experiment description')
  // We need to make some dates relative to today since mocking the schema to work with MockDate is a pain!
  const now = new Date()
  now.setDate(now.getDate() + 1)
  const nextWeek = new Date()
  nextWeek.setDate(now.getDate() + 7)
  await act(async () => {
    fireEvent.change(screen.getByLabelText(/Start date/), { target: { value: formatIsoDate(now) } })
  })
  await act(async () => {
    fireEvent.change(screen.getByLabelText(/End date/), { target: { value: formatIsoDate(nextWeek) } })
  })
  // search for the user
  await act(async () => {
    await changeFieldByRole('textbox', /Owner/, 'testing')
  })
  // click the selected user
  await act(async () => {
    fireEvent.click(screen.getByText('testing (owner-nickname)'))
  })
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /Next/ }))
  })

  // ### Audience
  screen.getByText(/Define Your Audience/)

  const platformField = screen.getByRole('button', { name: /Select a Platform/ })
  await act(async () => {
    fireEvent.focus(platformField)
  })
  await act(async () => {
    fireEvent.keyDown(platformField, { key: 'Enter' })
  })
  const platformOption = await screen.findByRole('option', { name: /wpcom/ })
  await act(async () => {
    fireEvent.click(platformOption)
  })

  const targetingField = screen.getByRole('textbox', { name: /Targeting/ })
  fireEvent.change(targetingField, { target: { value: 'segment_3' } })
  const targetingOption = await screen.findByRole('option', { name: /Locale: segment_3/ })
  await act(async () => {
    fireEvent.click(targetingOption)
  })
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /Next/ }))
  })

  // ### Metrics
  screen.getByText(/Assign Metrics/)
  const metricSearchField = screen.getByRole('combobox', { name: /Select a metric/ })
  const metricSearchFieldMoreButton = getByRole(metricSearchField, 'button', { name: 'Open' })
  const metricAddButton = screen.getByRole('button', { name: 'Add metric' })

  fireEvent.click(metricSearchFieldMoreButton)
  const metricOption = await screen.findByRole('option', { name: /metric_10/ })
  await act(async () => {
    fireEvent.click(metricOption)
  })
  await act(async () => {
    fireEvent.click(metricAddButton)
  })

  const attributionWindowField = await screen.findByLabelText(/Attribution Window/)
  await act(async () => {
    fireEvent.focus(attributionWindowField)
  })
  await act(async () => {
    fireEvent.keyDown(attributionWindowField, { key: 'Enter' })
  })
  const attributionWindowFieldOption = await screen.findByRole('option', { name: /24 hours/ })
  await act(async () => {
    fireEvent.click(attributionWindowFieldOption)
  })

  await changeFieldByRole('spinbutton', /Minimum Difference/, '0.01')

  // #### Exposure Events
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /Add exposure event/ }))
  })
  await act(async () => {
    fireEvent.click(await screen.findByRole('button', { name: /Add Property/ }))
  })
  await act(async () => {
    fireEvent.click(await screen.findByRole('button', { name: /Remove exposure event property/ }))
  })
  await act(async () => {
    fireEvent.click(await screen.findByRole('button', { name: /Remove exposure event/ }))
  })
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /Add exposure event/ }))
  })
  await act(async () => {
    fireEvent.click(await screen.findByRole('button', { name: /Add Property/ }))
  })
  // search for the event
  await act(async () => {
    await changeFieldByRole('textbox', /Event Name/, 'event_name')
  })
  // click the selected event
  await act(async () => {
    fireEvent.click(screen.getByText('event_name'))
  })
  // enter the prop value
  await act(async () => {
    await changeFieldByRole('textbox', /Key/, 'prop_key_value')
  })
  await changeFieldByRole('textbox', /Property Value/, 'value')

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /Next/ }))
  })

  // ### Submit
  screen.getByText(/Confirm and Submit Your Experiment/)
  await act(async () => {
    screen.getAllByRole('button', { name: /Submit/ })
    const submit = screen
      .getAllByRole('button', { name: /Submit/ })
      .find((submit) => submit.getAttribute('type') === 'submit')
    if (!submit) {
      throw new Error(`Can't find submit button.`)
    }
    fireEvent.click(submit)
  })

  await waitFor(() => expect(submittedData).not.toBeNull())

  expect(submittedData).toEqual({
    experiment: {
      p2Url: 'http://example.com/',
      name: 'test_experiment_name',
      description: 'experiment description',
      startDatetime: formatIsoDate(now),
      endDatetime: formatIsoDate(nextWeek),
      exclusionGroupTagIds: [],
      ownerLogin: 'owner-nickname',
      platform: 'wpcom',
      existingUsersAllowed: 'true',
      exposureEvents: [
        {
          event: 'event_name',
          props: [
            {
              key: 'prop_key_value',
              value: 'value',
            },
          ],
        },
      ],
      segmentAssignments: [
        {
          isExcluded: false,
          segmentId: 3,
        },
      ],
      variations: [
        {
          allocatedPercentage: '50',
          isDefault: true,
          name: 'control',
        },
        {
          allocatedPercentage: '50',
          isDefault: false,
          name: 'treatment',
        },
      ],
      metricAssignments: [
        {
          attributionWindowSeconds: '86400',
          changeExpected: true,
          isPrimary: true,
          metricId: 10,
          minDifference: 0.01,
        },
      ],
    },
  })
})

test('form submits an edited experiment without any changes', async () => {
  MockDate.set('2020-08-13')

  const experiment = Fixtures.createExperimentFull({
    status: Status.Staging,
    conclusionUrl: undefined,
    deployedVariationId: undefined,
    endReason: undefined,
  })

  let submittedData: unknown = null
  const onSubmit = async (formData: unknown): Promise<undefined> => {
    // We need to add a timeout here so the loading indicator renders
    await new Promise((resolve) => setTimeout(resolve, StatusCodes.OK))
    submittedData = formData
    return
  }

  render(
    <ExperimentForm
      indexedMetrics={Normalizers.indexMetrics(Fixtures.createMetrics(20))}
      indexedSegments={Normalizers.indexSegments(Fixtures.createSegments(20))}
      initialExperiment={experimentToFormData(experiment)}
      onSubmit={onSubmit}
      completionBag={completionBag}
    />,
  )

  // ### Move through the form stages
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /Begin/ }))
  })
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /Next/ }))
  })
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /Next/ }))
  })
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /Next/ }))
  })

  // ### Submit
  screen.getByText(/Confirm and Submit Your Experiment/)

  const submit = screen
    .getAllByRole('button', { name: /Submit/ })
    .find((submit) => submit.getAttribute('type') === 'submit')
  if (!submit) {
    throw new Error(`Can't find submit button.`)
  }
  fireEvent.click(submit)

  await waitFor(() => expect(submittedData).not.toBeNull())

  const validatedExperiment = await validationErrorDisplayer(
    experimentFullNewSchema.validate((submittedData as { experiment: unknown }).experiment),
  )

  // We need to remove Ids, status, conclusion data, reformat exposure events to make it like new
  const newShapedExperiment = _.omit(
    _.clone(experiment),
    'experimentId',
    'status',
    'assignmentCacheStatus',
    'conclusionUrl',
    'deployedVariationId',
    'endReason',
  )
  // @ts-ignore
  newShapedExperiment.metricAssignments.forEach((metricAssignment) => delete metricAssignment.metricAssignmentId)
  // @ts-ignore
  newShapedExperiment.segmentAssignments.forEach((segmentAssignment) => delete segmentAssignment.segmentAssignmentId)
  // @ts-ignore
  newShapedExperiment.variations.forEach((variation) => delete variation.variationId)
  newShapedExperiment.exposureEvents?.forEach((exposureEvent) => {
    exposureEvent.props = _.toPairs(exposureEvent.props || {}).map(([key, value]) => ({ key, value }))
  })

  expect(validatedExperiment).toEqual(newShapedExperiment)
})
