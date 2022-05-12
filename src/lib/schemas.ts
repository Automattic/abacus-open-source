/* eslint-disable @typescript-eslint/no-empty-interface,no-template-curly-in-string */

// Schema documentation lives at:
// https://app.swaggerhub.com/apis/yanir/experiments/0.1.0

import * as dateFns from 'date-fns'
import _ from 'lodash'
import * as yup from 'yup'
import { ObjectSchema } from 'yup'

/**
 * Setup Yup UI Validation messages
 *
 * I have taken the defaults (see below) and removed the '${path}' references.
 * Should not be run with tests as we want that extra information.
 *
 * An unfortunate downside to this is that we get less information on run-time errors.
 * If we do want better run-time errors we simply need to wrap the schema in an object
 * before we validate: yup.object({ x: schemaT  }).validate({ x })
 * Then the validation error will have an inner property with both path's and errors.
 *
 * The defaults:
 * https://github.com/jquense/yup/blob/master/src/locale.js
 */
const yupLocale = {
  mixed: {
    default: 'This field is invalid',
    required: 'This field is a required field',
    oneOf: 'This field must be one of the following values: ${values}',
    notOneOf: 'This field must not be one of the following values: ${values}',
    defined: 'This field is required',
  },
  string: {
    length: 'This field must be exactly ${length} characters',
    min: 'This field must be at least ${min} characters',
    max: 'This field must be at most ${max} characters',
    matches: 'This field must match the following: "${regex}"',
    email: 'This field must be a valid email',
    url: 'This field must be a valid URL',
    uuid: 'This field must be a valid UUID',
    trim: 'This field must be a trimmed string',
    lowercase: 'This field must be a lowercase string',
    uppercase: 'This field must be a upper case string',
  },
  number: {
    min: 'This field must be greater than or equal to ${min}',
    max: 'This field must be less than or equal to ${max}',
    lessThan: 'This field must be less than ${less}',
    moreThan: 'This field must be greater than ${more}',
    notEqual: 'This field must be not equal to ${notEqual}',
    positive: 'This field must be a positive number',
    negative: 'This field must be a negative number',
    integer: 'This field must be an integer',
  },
  date: {
    min: 'This field must be later than ${min}',
    max: 'This field must be at earlier than ${max}',
  },
  boolean: {},
  object: {
    noUnknown: 'This field has unspecified keys: ${unknown}',
  },
  array: {
    min: 'This field must have at least ${min} items',
    max: 'This field must have less than or equal to ${max} items',
  },
}
yup.setLocale(yupLocale as yup.LocaleObject)

export const idSchema = yup.number().integer().positive()
export const nameSchema = yup
  .string()
  .max(128)
  .matches(/^[a-z][a-z0-9_]*[a-z0-9]$/, 'This field must use a basic snake_case.')
const dateSchema = yup
  .date()
  // As yup's default transform sets a local timezone and we want it to be in UTC:
  .transform(function (_value, originalValue) {
    return new Date(originalValue)
  })

/**
 * A new number schema:
 * - Accepts NaN.
 * - Transforms 'nan', 'inf', '-inf' to their corresponding values.
 *   The strings come from python string representations for the corresponding values.
 *   This is necessary as JSON doesn't allow these special values forcing us to serialize them.
 *
 * Unfortunately I couldn't extend yup's number schema to allow NaN.
 * See https://github.com/jquense/yup/issues/1330
 */
export const extendedNumberSchema = yup
  .mixed<number | undefined>()
  .transform((value: unknown, originalValue: unknown) => {
    if (originalValue === 'nan' || (typeof originalValue === 'number' && isNaN(originalValue))) {
      return NaN
    }
    if (originalValue === 'inf') {
      return Infinity
    }
    if (originalValue === '-inf') {
      return -Infinity
    }
    if (originalValue === '' || originalValue === true || originalValue === false || originalValue === null) {
      return null
    }
    const maybeNumber = Number(originalValue)
    // NaN at this point means a parsing/data issue.
    if (isNaN(maybeNumber)) {
      return null
    }
    return maybeNumber
  })
  // eslint-disable-next-line no-template-curly-in-string
  .test('is-number', '${path} is not a number', (value: unknown) => value === undefined || typeof value === 'number')

export const eventSchema = yup
  .object({
    event: yup.string().defined(),
    props: yup.mixed().notRequired(),
  })
  .defined()
  .camelCase()
export interface Event extends yup.InferType<typeof eventSchema> {}

export const eventNewSchema = yup
  .object({
    event: yup.string().defined(),
    props: yup.array(yup.object({ key: yup.string().defined(), value: yup.string().defined() }).defined()).defined(),
  })
  .defined()
  .camelCase()
export interface EventNew extends yup.InferType<typeof eventNewSchema> {}

export enum TransactionTypes {
  NewPurchase = 'new purchase',
  Recurring = 'recurring',
  Cancellation = 'cancellation',
  StopRecurring = 'stop recurring',
  UpdateCard = 'update card',
  Refund = 'refund',
  StartTrial = 'start trial',
  StartRecurring = 'start recurring',
  TransferOut = 'transfer out',
  TransferIn = 'transfer in',
  Reactivation = 'reactivation',
}

export const metricRevenueParamsSchema = yup
  .object({
    refundDays: yup.number().integer().positive().defined(),
    productSlugs: yup.array(yup.string().defined()).defined(),
    transactionTypes: yup.array(yup.string().oneOf(Object.values(TransactionTypes)).defined()).defined(),
  })
  .defined()
  .camelCase()
export interface MetricRevenueParams extends yup.InferType<typeof metricRevenueParamsSchema> {}

export enum MetricParameterType {
  Conversion = 'conversion',
  Revenue = 'revenue',
  // Used in UI only:
  Count = 'count',
}

export const metricSchema = yup
  .object({
    metricId: idSchema.defined(),
    name: nameSchema.defined(),
    description: yup.string().defined(),
    parameterType: yup.string().oneOf(Object.values(MetricParameterType)).defined(),
    higherIsBetter: yup.boolean().defined(),
    eventParams: yup.mixed().when('parameterType', {
      is: MetricParameterType.Conversion,
      then: yup.array(eventSchema).defined(),
      otherwise: yup.mixed().oneOf([null]),
    }),
    revenueParams: yup.mixed().when('parameterType', {
      is: MetricParameterType.Revenue,
      then: metricRevenueParamsSchema.defined(),
      otherwise: yup.mixed().oneOf([null]),
    }),
  })
  .defined()
  .camelCase()
  .test('event-params-required', 'Event Params is required and must be valid JSON.', (metric) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return !(metric.parameterType === MetricParameterType.Conversion && !metric.eventParams)
  })
  .test('revenue-params-required', 'Revenue Params is required and must be valid JSON.', (metric) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return !(metric.parameterType === MetricParameterType.Revenue && !metric.revenueParams)
  })
  .test('exactly-one-params', 'Exactly one of eventParams or revenueParams must be defined.', (metric) => {
    // (Logical XOR)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return !!metric.eventParams !== !!metric.revenueParams
  })
export interface Metric extends yup.InferType<typeof metricSchema> {}
export const metricNewSchema = metricSchema.shape({
  metricId: idSchema.nullable(),
})
export interface MetricNew extends yup.InferType<typeof metricNewSchema> {}
export const metricNewOutboundSchema = metricNewSchema.snakeCase().transform(
  // istanbul ignore next; Tested by integration
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  (currentValue) => ({
    ...currentValue,
    revenueParams: undefined,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    revenue_params: currentValue.revenue_params
      ? // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        metricRevenueParamsSchema.snakeCase().cast(currentValue.revenue_params)
      : undefined,
  }),
)

export enum AttributionWindowSeconds {
  OneHour = 3600,
  SixHours = 21600,
  TwelveHours = 43200,
  TwentyFourHours = 86400,
  SeventyTwoHours = 259200,
  OneWeek = 604800,
  TwoWeeks = 1209600,
  ThreeWeeks = 1814400,
  FourWeeks = 2419200,
}

export const metricAssignmentNewSchema = yup
  .object({
    attributionWindowSeconds: yup
      .number()
      .integer()
      .positive()
      .oneOf(Object.values(AttributionWindowSeconds) as number[])
      .defined() as yup.Schema<AttributionWindowSeconds>,
    changeExpected: yup.bool().defined(),
    isPrimary: yup.bool().defined(),
    metricId: idSchema.defined(),
    minDifference: yup.number().defined().positive(),
  })
  .defined()
  .camelCase()
export interface MetricAssignmentNew extends yup.InferType<typeof metricAssignmentNewSchema> {}
export const metricAssignmentNewOutboundSchema = metricAssignmentNewSchema.snakeCase()

export const metricAssignmentSchema = metricAssignmentNewSchema
  .shape({
    metricAssignmentId: idSchema.defined(),
  })
  .defined()
  .camelCase()
export interface MetricAssignment extends yup.InferType<typeof metricAssignmentSchema> {}

export enum TagNamespace {
  ExclusionGroup = 'exclusion_group',
}

export const tagBareSchema = yup
  .object({
    tagId: idSchema.defined(),
    namespace: nameSchema.defined(),
    name: nameSchema.defined(),
    description: yup.string().defined(),
  })
  .defined()
  .camelCase()
export interface TagBare extends yup.InferType<typeof tagBareSchema> {}
// For consistency and openness:
export const tagFullSchema = tagBareSchema
export interface TagFull extends yup.InferType<typeof tagFullSchema> {}
export const tagFullNewSchema = tagFullSchema.shape({
  tagId: idSchema.nullable(),
})
export interface TagFullNew extends yup.InferType<typeof tagFullNewSchema> {}
export const tagFullNewOutboundSchema = tagFullNewSchema.snakeCase()

export enum SegmentType {
  Country = 'country',
  Locale = 'locale',
}

export const segmentSchema = yup
  .object({
    segmentId: idSchema.defined(),
    name: yup.string().defined(),
    type: yup.string().oneOf(Object.values(SegmentType)).defined(),
  })
  .defined()
  .camelCase()
export interface Segment extends yup.InferType<typeof segmentSchema> {}

export const segmentAssignmentNewSchema = yup
  .object({
    segmentId: idSchema.defined(),
    isExcluded: yup.bool().defined(),
  })
  .defined()
  .camelCase()
export interface SegmentAssignmentNew extends yup.InferType<typeof segmentAssignmentNewSchema> {}
export const segmentAssignmentNewOutboundSchema = segmentAssignmentNewSchema.snakeCase()

export const segmentAssignmentSchema = segmentAssignmentNewSchema
  .shape({
    segmentAssignmentId: idSchema.defined(),
  })
  .defined()
  .camelCase()
export interface SegmentAssignment extends yup.InferType<typeof segmentAssignmentSchema> {}

export const variationNewSchema = yup
  .object({
    name: nameSchema.defined(),
    isDefault: yup.bool().defined(),
    allocatedPercentage: yup.number().integer().min(1).max(99).defined(),
  })
  .defined()
  .camelCase()
export interface VariationNew extends yup.InferType<typeof variationNewSchema> {}
export const variationNewOutboundSchema = variationNewSchema.snakeCase()

export const variationSchema = variationNewSchema
  .shape({
    variationId: idSchema.defined(),
  })
  .defined()
  .camelCase()
export interface Variation extends yup.InferType<typeof variationSchema> {}

export enum Platform {
  Akismet = 'akismet',
  Calypso = 'calypso',
  DayOne = 'dayone',
  Email = 'email',
  Jetpack = 'jetpack',
  Lohp = 'lohp',
  Pipe = 'pipe',
  Wccom = 'wccom',
  WooCommerce = 'woocommerce',
  Wpandroid = 'wpandroid',
  Wpcom = 'wpcom',
  Wpios = 'wpios',
}

export enum Status {
  Staging = 'staging',
  Running = 'running',
  Completed = 'completed',
  Disabled = 'disabled',
}

export enum AssignmentCacheStatus {
  Fresh = 'fresh',
  Missing = 'missing',
  Stale = 'stale',
}

export const MAX_DISTANCE_BETWEEN_NOW_AND_START_DATE_IN_MONTHS = 12
export const MAX_DISTANCE_BETWEEN_START_AND_END_DATE_IN_MONTHS = 12
export const experimentBareSchema = yup
  .object({
    experimentId: idSchema.defined(),
    name: nameSchema.defined(),
    startDatetime: dateSchema.defined(),
    endDatetime: dateSchema
      .defined()
      .when(
        'startDatetime',
        (startDatetime: Date, schema: yup.DateSchema) =>
          startDatetime &&
          schema
            .min(startDatetime, 'End date must be after start date.')
            .max(
              dateFns.addMonths(startDatetime, MAX_DISTANCE_BETWEEN_START_AND_END_DATE_IN_MONTHS),
              `End date must be within ${MAX_DISTANCE_BETWEEN_START_AND_END_DATE_IN_MONTHS} months of start date.`,
            ),
      ),
    status: yup.string().oneOf(Object.values(Status)).defined(),
    platform: yup.string().oneOf(Object.values(Platform)).defined(),
    ownerLogin: yup.string().defined(),
    description: yup.string().defined(),
  })
  .defined()
  .camelCase()
export interface ExperimentBare extends yup.InferType<typeof experimentBareSchema> {}
export const experimentSummaryResponse = yup
  .object({
    experiments: yup.array(experimentBareSchema).defined(),
  })
  .defined()

export const experimentFullSchema = experimentBareSchema
  .shape({
    existingUsersAllowed: yup.boolean().defined(),
    p2Url: yup.string().url().defined(),
    endReason: yup.string().nullable(),
    conclusionUrl: yup.string().url().nullable(),
    deployedVariationId: idSchema.nullable().notRequired(),
    exposureEvents: yup.array<Event>(eventSchema).nullable(),
    metricAssignments: yup.array(metricAssignmentSchema).defined().min(1),
    segmentAssignments: yup.array(segmentAssignmentSchema).defined(),
    variations: yup.array<Variation>(variationSchema).defined().min(2),
    exclusionGroupTagIds: yup.array(idSchema.defined()),
    assignmentCacheStatus: yup.string().oneOf(Object.values(AssignmentCacheStatus)).defined(),
  })
  .defined()
  .camelCase()
export interface ExperimentFull extends yup.InferType<typeof experimentFullSchema> {}

const now = new Date()
// The following definition is a bit hacky, but it effectively undefines a field from the parent schema.
const yupUndefined = yup.mixed().oneOf([]).notRequired()
export const experimentFullNewSchema = experimentFullSchema.shape({
  experimentId: idSchema.nullable(),
  status: yupUndefined,
  assignmentCacheStatus: yupUndefined,
  startDatetime: dateSchema
    .defined()
    .test(
      'future-start-date',
      'Start date (UTC) must be in the future.',
      // We need to refer to new Date() instead of using dateFns.isFuture so MockDate works with this in the tests.
      (date) => dateFns.isBefore(new Date(), date),
    )
    .test(
      'bounded-start-date',
      `Start date must be within ${MAX_DISTANCE_BETWEEN_NOW_AND_START_DATE_IN_MONTHS} months from now.`,
      // We need to refer to new Date() instead of using dateFns.isFuture so MockDate works with this in the tests.
      (date) => dateFns.isBefore(date, dateFns.addMonths(now, MAX_DISTANCE_BETWEEN_NOW_AND_START_DATE_IN_MONTHS)),
    ),
  exposureEvents: yup.array(eventNewSchema).notRequired(),
  metricAssignments: yup
    .array(metricAssignmentNewSchema)
    .defined()
    .min(1, 'At least one metric assignment is required.'),
  segmentAssignments: yup.array(segmentAssignmentNewSchema).defined(),
  variations: yup
    .array<VariationNew>(variationNewSchema)
    .defined()
    .min(2)
    .test(
      'default-variation-exists',
      'A default variation is required.',
      (variations: VariationNew[]) => variations && variations.some((variation) => variation.isDefault),
    )
    .test(
      'max-total',
      'The sum of allocated percentages must be less than or equal to 100.',
      (variations: VariationNew[]) =>
        variations && variations.reduce((acc, variation) => acc + Number(variation.allocatedPercentage), 0) <= 100,
    )
    .test(
      'unique-names',
      'Variation names must be unique.',
      (variations: VariationNew[]) => variations && new Set(variations.map((x) => x.name)).size === variations.length,
    ),
})
export interface ExperimentFullNew extends yup.InferType<typeof experimentFullNewSchema> {}
/**
 * For casting use only.
 */
export const experimentFullNewOutboundSchema = experimentFullNewSchema
  .shape({
    // Seems to work here but not below?
    variations: yup.array<VariationNew>(variationNewOutboundSchema).defined(),
  })
  .snakeCase()
  .transform(
    // istanbul ignore next; Tested by integration
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    (currentValue) => ({
      ...currentValue,
      // The P2 field gets incorrectly snake_cased so we fix it here
      p_2_url: undefined,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
      p2_url: currentValue.p_2_url,
      // These two only seem to work down here rather then above?
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      metric_assignments: yup.array(metricAssignmentNewOutboundSchema).defined().cast(currentValue.metric_assignments),
      segment_assignments: yup
        .array(segmentAssignmentNewOutboundSchema)
        .defined()
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        .cast(currentValue.segment_assignments),
      // Converting EventNew to Event
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      exposure_events: currentValue.exposure_events.map(
        (event: EventNew): Event => ({
          event: event.event,
          props:
            event.props && event.props.length > 0
              ? _.fromPairs(event.props.map(({ key, value }) => [key, value]))
              : undefined,
        }),
      ),
    }),
  )

export enum RecommendationReason {
  CiInRope = 'ci_in_rope',
  CiGreaterThanRope = 'ci_greater_than_rope',
  CiLessThanRope = 'ci_less_than_rope',
  CiRopePartlyOverlap = 'ci_rope_partly_overlap',
  RopeInCi = 'rope_in_ci',
}

export enum RecommendationWarning {
  ShortPeriod = 'short_period',
  LongPeriod = 'long_period',
  WideCi = 'wide_ci',
}

export const recommendationSchema = yup
  .object({
    endExperiment: yup.boolean().defined(),
    chosenVariationId: yup.number().nullable().defined(),
    reason: yup.string().oneOf(Object.values(RecommendationReason)).defined(),
    warnings: yup.array(yup.string().oneOf(Object.values(RecommendationWarning)).defined()).defined(),
  })
  .defined()
  .camelCase()
export interface Recommendation extends yup.InferType<typeof recommendationSchema> {}

export const metricEstimatePreviousSchema = yup
  .object({
    /**
     * @deprecated Misleading, use the CIs below.
     */
    estimate: extendedNumberSchema.defined(),
    // These are for 95% CI, and should become deprecated when top_95 and bottom_95 are used
    top: extendedNumberSchema.defined(),
    bottom: extendedNumberSchema.defined(),
    // For future use:
    top_99: extendedNumberSchema,
    bottom_99: extendedNumberSchema,
    top_95: extendedNumberSchema,
    bottom_95: extendedNumberSchema,
    top_50: extendedNumberSchema,
    bottom_50: extendedNumberSchema,
  })
  .defined()
  .camelCase()
export interface MetricEstimatePrevious extends yup.InferType<typeof metricEstimatePreviousSchema> {}

// It is a bit complicated to type this properly and we won't need it for long anyway so we take this shortcut:
export type MetricEstimatesPrevious = Record<string | 'diff' | 'ratio', MetricEstimatePrevious>

export const distributionStatsSchema = yup
  .object({
    mean: extendedNumberSchema.defined(),
    top_99: extendedNumberSchema.defined().nullable(),
    bottom_99: extendedNumberSchema.defined().nullable(),
    top_95: extendedNumberSchema.defined(),
    bottom_95: extendedNumberSchema.defined(),
    top_50: extendedNumberSchema.defined().nullable(),
    bottom_50: extendedNumberSchema.defined().nullable(),
  })
  .defined()
  .camelCase()
export interface DistributionStats extends yup.InferType<typeof distributionStatsSchema> {}

export const metricEstimatesNextSchema = yup
  .object({
    variations: yup.object().defined() as yup.Schema<Record<string, DistributionStats>>,
    diffs: yup.object().defined() as yup.Schema<Record<string, DistributionStats>>,
    ratios: yup.object().defined() as yup.Schema<Record<string, DistributionStats>>,
  })
  .defined()
  .camelCase()
export interface MetricEstimatesNext extends yup.InferType<typeof metricEstimatesNextSchema> {}

export enum AnalysisStrategy {
  IttPure = 'itt_pure',
  MittNoSpammers = 'mitt_no_spammers',
  MittNoCrossovers = 'mitt_no_crossovers',
  MittNoSpammersNoCrossovers = 'mitt_no_spammers_no_crossovers',
  PpNaive = 'pp_naive',
}

function toDistributionStatPrevious(distributionStats: DistributionStats): MetricEstimatePrevious {
  return {
    estimate: distributionStats.mean,
    top: distributionStats.top_95,
    bottom: distributionStats.bottom_95,
  }
}

export function isRawMetricEstimatesNext(maybeMetricEstimatesNext: unknown): boolean {
  return Object.prototype.hasOwnProperty.call(maybeMetricEstimatesNext, 'variations')
}

function isMetricEstimatesNext(
  maybeMetricEstimatesNext: MetricEstimatesPrevious | MetricEstimatesNext,
): maybeMetricEstimatesNext is MetricEstimatesNext {
  return Object.prototype.hasOwnProperty.call(maybeMetricEstimatesNext, 'variations')
}

/**
 * Ensure a MetricsEstimatesPrevious.
 */
export function ensureMetricEstimatesPrevious(
  metricEstimates: MetricEstimatesPrevious | MetricEstimatesNext,
  defaultVariationId: number,
  otherVariationId: number,
): MetricEstimatesPrevious {
  // Check if we have a new metrics estimate object
  if (isMetricEstimatesNext(metricEstimates)) {
    return {
      [`variation_${defaultVariationId}`]: toDistributionStatPrevious(metricEstimates.variations[defaultVariationId]),
      [`variation_${otherVariationId}`]: toDistributionStatPrevious(metricEstimates.variations[otherVariationId]),
      diff: toDistributionStatPrevious(metricEstimates.diffs[`${otherVariationId}_${defaultVariationId}`]),
      ratio: toDistributionStatPrevious(metricEstimates.ratios[`${otherVariationId}_${defaultVariationId}`]),
    }
  }
  return metricEstimates
}

export const analysisPreviousSchema = yup
  .object({
    metricAssignmentId: idSchema.defined(),
    analysisDatetime: dateSchema.defined(),
    analysisStrategy: yup.string().oneOf(Object.values(AnalysisStrategy)).defined(),
    // These can be validated further in yup but it isn't performant to do it simply (using lazy) and although
    // there is a performant way to do so (higher up lazy) it isn't worth it complexity wise.
    participantStats: yup.object().defined() as yup.Schema<Record<string, number>>,
    metricEstimates: yup.object().nullable().defined() as yup.Schema<MetricEstimatesPrevious | null>,
    recommendation: recommendationSchema.nullable().defined(),
  })
  .defined()
  .camelCase()
export interface AnalysisPrevious extends yup.InferType<typeof analysisPreviousSchema> {
  /**
   * @deprecated Recommendations are now performed on the client-side using metricEstimates.
   */
  recommendation: yup.InferType<typeof recommendationSchema> | null
}

export const analysisNextSchema = yup
  .object({
    metricAssignmentId: idSchema.defined(),
    analysisDatetime: dateSchema.defined(),
    analysisStrategy: yup.string().oneOf(Object.values(AnalysisStrategy)).defined(),
    // These can be validated further in yup but it isn't performant to do it simply (using lazy) and although
    // there is a performant way to do so (higher up lazy) it isn't worth it complexity wise.
    participantStats: yup.object().defined() as yup.Schema<Record<string, number>>,
    metricEstimates: metricEstimatesNextSchema.nullable().defined(),
    recommendation: recommendationSchema.nullable().defined(),
  })
  .defined()
  .camelCase()
export interface AnalysisNext extends yup.InferType<typeof analysisNextSchema> {}

export type AnalysisMixed = AnalysisNext | AnalysisPrevious

/**
 * Ensure an AnalysisPrevious. A tool for moving between AnalysisPrevious and AnalysisNext.
 */
export function ensureAnalysisPrevious(analysis: AnalysisMixed, experiment: ExperimentFull): AnalysisPrevious {
  const defaultVariationId = experiment && experiment.variations.find((v) => v.isDefault)?.variationId
  const otherVariationId = experiment && experiment.variations.find((v) => !v.isDefault)?.variationId
  // istanbul ignore next; Shouldn't occur
  if (!defaultVariationId || !otherVariationId) {
    throw new Error('Missing variationIds')
  }
  return {
    ...analysis,
    metricEstimates: analysis.metricEstimates
      ? ensureMetricEstimatesPrevious(analysis.metricEstimates, defaultVariationId, otherVariationId)
      : null,
  }
}

export const analysisResponseSchema = yup
  .object({
    analyses: yup.array(analysisPreviousSchema).defined(),
  })
  .defined()
export interface AnalysisResponse extends yup.InferType<typeof analysisResponseSchema> {}

export const autocompleteItemSchema = yup
  .object({
    name: yup.string().defined(),
    value: yup.mixed<number | string>().defined(),
  })
  .required()
export interface AutocompleteItem extends yup.InferType<typeof autocompleteItemSchema> {}

/**
 * @deprecated We want schemas for data types, not for request shapes. Use inline yup schemas instead.
 */
export const autocompleteSchema = yup
  .object({
    completions: yup.array<AutocompleteItem>(autocompleteItemSchema).defined(),
  })
  .defined()

export const eventPropsSchema = yup
  .object({
    name: yup.string().defined(),
    description: yup.string().defined(),
  })
  .defined()
export interface EventProp extends yup.InferType<typeof eventPropsSchema> {}

export const eventDetailsSchema = yup
  .object({
    name: yup.string().defined(),
    description: yup.string().defined(),
    owner: yup.string().defined(),
    is_registered: yup.boolean().defined(),
    is_validated: yup.boolean().defined(),
    props: yup.array<EventProp>(eventPropsSchema).defined(),
  })
  .defined()
export interface EventDetails extends yup.InferType<typeof eventDetailsSchema> {}

/**
 * The yup equivalant of _.pick, produces a subset of the original schema.
 *
 * @param schema A yup object schema
 * @param props Properties to pick
 * @param value See yup.reach
 * @param context See yup.reach
 */
export function yupPick(
  schema: yup.ObjectSchema,
  props: string[],
  value?: unknown,
  context?: unknown,
  // eslint-disable-next-line @typescript-eslint/ban-types
): ObjectSchema<{} | undefined> {
  return yup.object(_.fromPairs(props.map((prop) => [prop, yup.reach(schema, prop, value, context)])))
}
