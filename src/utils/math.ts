import chiSquaredTest from 'chi-squared-test'
import _ from 'lodash'
import { abs, erf } from 'mathjs'

/**
 * Assuming a distribution of X ~ Binomial(totalTrials, probabilityOfSuccess), returns the probability of the number of successful trials being equal to successfulTrials or more extreme than successfullTrials.
 *
 * @param successfulTrials number of successful trials
 * @param totalTrials number of total trials
 * @param probabilityOfSuccess probability of success
 */
export function binomialProbValue({
  successfulTrials,
  totalTrials,
  probabilityOfSuccess,
}: {
  successfulTrials: number
  totalTrials: number
  probabilityOfSuccess: number
}): number {
  if (totalTrials === 0 && successfulTrials === 0) {
    return 1
  }
  if (totalTrials < successfulTrials) {
    throw new Error('Successful Trials must be less than or equal to total trials')
  }
  if (probabilityOfSuccess < 0 || 1 < probabilityOfSuccess) {
    throw new Error('Invalid probabilityOfSuccess, expected [0,1].')
  }
  const mean = totalTrials * probabilityOfSuccess
  const variance = totalTrials * probabilityOfSuccess * (1 - probabilityOfSuccess)
  // By the CLT, B ~ Binomial(n, p) is approximated well enough by X ~ N(mean, variance) for n > 30
  // See also: https://en.wikipedia.org/wiki/Central_limit_theorem
  //           https://en.wikipedia.org/wiki/Binomial_distribution#Normal_approximation
  // (We don't care about the accuracy for n <= 30 so we let them be.)
  // From symmetry of the normal distribution, P(not -x < X < x) = P(X > x or X < -x) = 2 * P(X > x)
  // From https://en.wikipedia.org/wiki/Normal_distribution#Cumulative_distribution_function:
  // 2 * P(X > x) = 2 - 2 * CDF(x)
  //              = 2 - 2 * 0.5 * ( 1 + erf( (x - mean) / sqrt(2 * variance) ) )
  //              = 1 - erf( (x - mean) / sqrt(2 * variance) )
  const y = (successfulTrials - mean) / Math.sqrt(2 * variance)
  return 1 - erf(abs(y))
}

/**
 * A slightly modified chiSquaredTest, see `chiSquaredTest` for more info:
 *  - With all 0 observations and expectations, returns 1 (certainty).
 */
export function chiSquaredTestProbValue(
  observations: number[],
  expectations: number[],
  degreesOfFreedomReduction: number,
): number {
  if (observations.every((x) => x === 0) && expectations.every((x) => x === 0)) {
    return 1
  }

  return chiSquaredTest(observations, expectations, degreesOfFreedomReduction).probability
}

/**
 * Default statistical significance to use
 */
export const defaultStatisticalSignificance = 0.95

/**
 * Default statistical power to use for sample size estimation.
 */
export const defaultStatisticalPower = 0.8

/**
 * FIXME: Does not work currently.
 * Estimate the sample size required per variation for conversions
 */
export function samplesRequiredPerVariationForConversion(
  /**
   * Variance of the value.
   */
  variance: number,
  /**
   * Minimum to detect of the value.
   */
  delta: number,
  _statisticalSignificance: number,
  _statisticalPower: number,
): number {
  // const zScore = standardNormInv((1 - statisticalSignificance) / 2) + standardNormInv(1 - statisticalPower)
  // FIXME: Dummy zScore until we have norm-inv working
  const zScore = 2.5
  return Math.ceil(Math.pow(zScore / delta, 2) * variance)
}

/**
 * Return 0 if a number is Infinity, -Infinity or NaN, otherwise return the number
 */
export function coerceNonFiniteToZero(x: number): number {
  return isFinite(x) ? x : 0
}
