import _ from 'lodash'
import * as yup from 'yup'

import {
  Metric,
  MetricNew,
  MetricNewOutbound,
  metricNewOutboundSchema,
  metricNewSchema,
  metricSchema,
} from 'src/lib/explat/schemas'

import { fetchApi } from './utils'

/**
 * Transforms a metric into an outbound form.
 */

function outboundTransformMetric(metricNew: MetricNew): MetricNewOutbound {
  const metricDataForRequest = {
    ...metricNew,
    tags: metricNew.tags.map((tagId) => ({ tagId })),
  }
  return metricNewOutboundSchema.cast(metricDataForRequest)
}

/**
 * Attempts to create a new metric.
 *
 * Note: Be sure to handle any errors that may be thrown.
 */
async function create(newMetric: MetricNew): Promise<Metric> {
  const validatedNewMetric = await metricNewSchema.validate(newMetric, { abortEarly: false })
  const outboundNewMetric = outboundTransformMetric(validatedNewMetric)
  return await metricSchema.validate(await fetchApi('POST', '/metrics', outboundNewMetric))
}

/**
 * Attempts to put a new metric.
 *
 * Note: Be sure to handle any errors that may be thrown.
 */
async function put(metricId: number, newMetric: MetricNew): Promise<Metric> {
  // istanbul ignore next; Shouldn't happen
  if (!_.isNumber(metricId)) {
    throw new Error('Invalid metricId.')
  }
  const validatedNewMetric = await metricNewSchema.validate(newMetric, { abortEarly: false })
  const outboundNewMetric = outboundTransformMetric(validatedNewMetric)
  return await metricSchema.validate(await fetchApi('PUT', `/metrics/${metricId}`, outboundNewMetric))
}

/**
 * Finds all the available metrics.
 *
 * Note: Be sure to handle any errors that may be thrown.
 *
 * @throws UnauthorizedError
 */
async function findAll(options: { includeDebug: boolean } = { includeDebug: false }): Promise<Metric[]> {
  // istanbul ignore next; debug only
  const { metrics } = await yup
    .object({ metrics: yup.array(metricSchema).defined() })
    .defined()
    .validate(await fetchApi('GET', options.includeDebug ? '/metrics?debug=true' : '/metrics'), {
      abortEarly: false,
    })
  return metrics
}

/**
 * Find the metric by ID.
 *
 * Note: Be sure to handle any errors that may be thrown.
 *
 * @throws UnauthorizedError
 */
async function findById(metricId: number): Promise<Metric> {
  return await metricSchema.validate(await fetchApi('GET', `/metrics/${metricId}`), { abortEarly: false })
}

const MetricsApi = {
  create,
  put,
  findAll,
  findById,
}

export default MetricsApi
