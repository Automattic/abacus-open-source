import { match, P } from 'ts-pattern'

import {
  Metric,
  MetricParameterType,
  metricParameterTypeToParameterField,
  PipeModels,
  PipeValueFields,
} from './schemas'

/**
 * Return a stringified version of the metric params object
 */
export const stringifyMetricParams = (metric: Metric): string =>
  JSON.stringify(metric[metricParameterTypeToParameterField[metric.parameterType]], null, 4)

export enum UnitType {
  Ratio = 'ratio',
  RatioPoints = 'ratio_points',
  Count = 'count',
  Usd = 'usd',
}

export const metricParameterTypeName: Record<MetricParameterType, string> = {
  [MetricParameterType.Revenue]: 'Cash Sales',
  [MetricParameterType.Conversion]: 'Conversion',
  [MetricParameterType.Pipe]: 'Pipe Model',
} as const

export interface UnitInfo {
  unitType: UnitType
}

export enum UnitDerivationType {
  AbsoluteDifference = 'AbsoluteDifference',
  RelativeDifference = 'RelativeDifference',
  ImpactScaled = 'ImpactScaled',
}

export function getUnitInfo(metric: Metric, derivations: UnitDerivationType[] = []): UnitInfo {
  // So the real way to handle units is to have better data on the units, e.g.
  // instead of using Conversion we use users-converted / users-sample, this
  // ends up being very complicated and not something made for Javascript.
  // We are now using the second best thing, taking a metric, and what we want
  // to do to it, and then determine a UnitType from that.
  //
  // For implementation simplicity we are using pattern matching so we don't
  // have a massive multi-level case statements:

  const conversionMetricUnion = P.union(
    { parameterType: MetricParameterType.Conversion },
    {
      parameterType: MetricParameterType.Pipe,
      pipeParams: { model: PipeModels.ChurnUntimed, valueField: PipeValueFields.Prediction },
    },
  )

  return match({ metric, derivations })
    .with(
      {
        metric: conversionMetricUnion,
        derivations: [],
      },
      () => ({ unitType: UnitType.Ratio }),
    )
    .with(
      {
        metric: conversionMetricUnion,
        derivations: [UnitDerivationType.AbsoluteDifference],
      },
      () => ({ unitType: UnitType.RatioPoints }),
    )
    .with(
      {
        metric: conversionMetricUnion,
        derivations: [UnitDerivationType.ImpactScaled],
      },
      {
        metric: conversionMetricUnion,
        derivations: [UnitDerivationType.AbsoluteDifference, UnitDerivationType.ImpactScaled],
      },
      () => ({ unitType: UnitType.Count }),
    )
    .with(
      {
        metric: { parameterType: MetricParameterType.Revenue },
        derivations: [],
      },
      () => ({ unitType: UnitType.Usd }),
    )
    .with(
      {
        metric: { parameterType: MetricParameterType.Revenue },
        derivations: [UnitDerivationType.AbsoluteDifference],
      },
      () => ({ unitType: UnitType.Usd }),
    )
    .with(
      {
        metric: { parameterType: MetricParameterType.Revenue },
        derivations: [UnitDerivationType.ImpactScaled],
      },
      {
        metric: { parameterType: MetricParameterType.Revenue },
        derivations: [UnitDerivationType.AbsoluteDifference, UnitDerivationType.ImpactScaled],
      },
      () => ({ unitType: UnitType.Usd }),
    )
    .with(
      {
        derivations: [UnitDerivationType.RelativeDifference],
      },
      () => ({ unitType: UnitType.Ratio }),
    )
    .otherwise(() => {
      throw new Error('Could not find matching unit-type for metric and derivations.')
    })
}
