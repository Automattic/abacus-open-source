import { act, fireEvent, getByRole, screen, waitFor } from '@testing-library/react'
import { StatusCodes } from 'http-status-codes'
import _ from 'lodash'
import noop from 'lodash/noop'
import MockDate from 'mockdate'
import React from 'react'

import * as AutocompleteApi from 'src/api/explat/AutocompleteApi'
import { experimentToFormData } from 'src/lib/explat/form-data'
import * as Normalizers from 'src/lib/explat/normalizers'
import { experimentFullNewSchema, MetricParameterType, Status } from 'src/lib/explat/schemas'
import Fixtures from 'src/test-helpers/fixtures'
import {
  changeFieldByRole,
  interactWithMinDiffCalculator,
  render,
  validationErrorDisplayer,
} from 'src/test-helpers/test-utils'

import ExperimentForm, { ExperimentFormCompletionBag } from './ExperimentForm'

jest.mock('src/api/explat/AutocompleteApi')
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

  screen.getByText(/Start designing your experiment/)
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /Next/ }))
  })
  screen.getByText(/Define Your Audience/)
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /Previous/ }))
  })
  screen.getByText(/Start designing your experiment/)
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

  const startSectionButton = screen.getByRole('button', { name: /Start/ })
  const audienceSectionButton = screen.getByRole('button', { name: /Audience/ })
  const metricsSectionButton = screen.getByRole('button', { name: /Metrics/ })
  const submitSectionButton = screen.getByRole('button', { name: /Submit/ })

  // The order of these is such that it triggers all validation error paths

  screen.getByText(/Start designing your experiment/)
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
    fireEvent.click(startSectionButton)
  })

  screen.getAllByText(/Start/)
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

  // Activating the variations level validation error:
  const allocatedPercentage = screen.getAllByRole('spinbutton', { name: /Allocated percentage/i })
  await act(async () => {
    fireEvent.change(allocatedPercentage[0], { target: { value: '99' } })
  })
  fireEvent.blur(allocatedPercentage[0])
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
  const audienceSectionButton = screen.getByRole('button', { name: /Audience/ })
  const metricsSectionButton = screen.getByRole('button', { name: /Metrics/ })
  const submitSectionButton = screen.getByRole('button', { name: /Submit/ })

  expect(isSectionError(startSectionButton)).toBe(false)
  expect(isSectionError(audienceSectionButton)).toBe(false)
  expect(isSectionError(metricsSectionButton)).toBe(false)
  expect(isSectionError(submitSectionButton)).toBe(false)

  expect(isSectionComplete(startSectionButton)).toBe(false)
  expect(isSectionComplete(audienceSectionButton)).toBe(false)
  expect(isSectionComplete(metricsSectionButton)).toBe(false)
  expect(isSectionComplete(submitSectionButton)).toBe(false)

  screen.getByRole('textbox', { name: /Experiment name/ })

  await act(async () => {
    fireEvent.click(audienceSectionButton)
  })

  expect(isSectionError(startSectionButton)).toBe(true)
  expect(isSectionComplete(startSectionButton)).toBe(false)
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
  const audienceSectionButton = screen.getByRole('button', { name: /Audience/ })
  const metricsSectionButton = screen.getByRole('button', { name: /Metrics/ })
  const submitSectionButton = screen.getByRole('button', { name: /Submit/ })

  await act(async () => {
    fireEvent.click(submitSectionButton)
  })

  expect(container).toMatchSnapshot()

  expect(isSectionError(startSectionButton)).toBe(true)
  expect(isSectionError(audienceSectionButton)).toBe(true)
  expect(isSectionError(metricsSectionButton)).toBe(true)
  expect(isSectionError(submitSectionButton)).toBe(false)

  expect(isSectionComplete(startSectionButton)).toBe(false)
  expect(isSectionComplete(audienceSectionButton)).toBe(false)
  expect(isSectionComplete(metricsSectionButton)).toBe(false)
  expect(isSectionComplete(submitSectionButton)).toBe(false)
})

test('form submits with valid fields', async () => {
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
  screen.getByText(/Start designing your experiment/)
  await changeFieldByRole('textbox', /Your a8cexperiments P2 post URL/, 'http://example.com/')
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /Start/ }))
  })

  // ### Basic Info
  screen.getAllByText(/Start/)
  await changeFieldByRole('textbox', /Experiment name/, 'test_experiment_name')
  await changeFieldByRole('textbox', /Experiment description/, 'experiment description')
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

  const addVariationButton = screen.getByRole('button', { name: /Add variation/i })
  fireEvent.click(addVariationButton)

  const variationNames = screen.getAllByRole('textbox', { name: /Variation name/i })
  fireEvent.change(variationNames[1], { target: { value: 'treatment_2' } })

  const allocatedPercentages = screen.getAllByRole('spinbutton', { name: /Allocated percentage/i })
  await act(async () => {
    fireEvent.change(allocatedPercentages[0], { target: { value: '33' } })
    fireEvent.change(allocatedPercentages[1], { target: { value: '33' } })
    fireEvent.change(allocatedPercentages[2], { target: { value: '33' } })
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

  const attributionWindowField = await screen.findByLabelText('Attribution Window')
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

  // Use the min-diff calculator
  screen.getByRole('button', { name: /Minimum Difference Calculator/ }).click()
  screen.getByRole('button', { name: /Minimum Difference Calculator/ }).click()
  screen.getByRole('button', { name: /Minimum Difference Calculator/ }).click()
  await interactWithMinDiffCalculator(MetricParameterType.Revenue)

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
      startDatetime: '',
      endDatetime: '',
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
          allocatedPercentage: 33,
          isDefault: true,
          name: 'control',
        },
        {
          allocatedPercentage: 33,
          isDefault: false,
          name: 'treatment',
        },
        {
          allocatedPercentage: 33,
          isDefault: false,
          name: 'treatment_2',
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
    fireEvent.click(screen.getByRole('button', { name: /Start/ }))
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
    // @ts-ignore
    exposureEvent.props = _.toPairs(exposureEvent.props || {}).map(([key, value]) => ({ key, value }))
  })

  expect(validatedExperiment).toEqual(newShapedExperiment)
})
