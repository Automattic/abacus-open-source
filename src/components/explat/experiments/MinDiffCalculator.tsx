import {
  Button,
  Checkbox,
  InputAdornment,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@material-ui/core'
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles'
import _ from 'lodash'
import React, { useState } from 'react'

import DebugOutput from 'src/components/general/DebugOutput'
import PrivateLink from 'src/components/general/PrivateLink'
import { ExperimentFormData } from 'src/lib/explat/form-data'
import { getUnitInfo, UnitType } from 'src/lib/explat/metrics'
import { Metric } from 'src/lib/explat/schemas'
import { isDebugMode } from 'src/utils/general'
import {
  coerceNonFiniteToZero,
  defaultStatisticalPower,
  defaultStatisticalSignificance,
  samplesRequiredPerVariationForConversion,
} from 'src/utils/math'

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {},
    stepper: {
      padding: 0,
      background: 'none',
    },
    sideBySide: {
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
      gridColumnGap: theme.spacing(2),
    },
    results: {
      background: theme.palette.grey[100],
      padding: theme.spacing(2),
    },
    adornment: {},
    liability: {
      display: 'flex',
    },
    liabilityCheckbox: {
      alignSelf: 'start',
    },
  }),
)

const MinDiffCalculator = ({
  samplesPerMonth,
  setSamplesPerMonth,
  setMinPracticalDiff,
  experiment,
  metric,
}: {
  samplesPerMonth: number
  setSamplesPerMonth: (n: number) => void
  setMinPracticalDiff: (n: number) => void
  experiment: ExperimentFormData
  metric: Metric
}): JSX.Element => {
  const classes = useStyles()
  const isConversion = getUnitInfo(metric).unitType === UnitType.Ratio
  // istanbul ignore next; shouldn't occur
  if (![UnitType.Ratio, UnitType.Usd].includes(getUnitInfo(metric).unitType)) {
    throw new Error('Unsupported unitType for MinDiffCalculator')
  }

  const onChangeSamplesPerMonth = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSamplesPerMonth(event.target.value as number)
  }

  // Conversion metrics calc
  const [metricBaselineConversionRatePercentage, setMetricBaselineConversionRatePercentage] = useState('0')
  const onChangeMetricBaselineConversionRatePercentage = (event: React.ChangeEvent<{ value: unknown }>) => {
    setMetricBaselineConversionRatePercentage(event.target.value as string)
  }
  const metricBaselineConversionRate = parseFloat(metricBaselineConversionRatePercentage) / 100
  const metricBaselineConversionsPerMonth = metricBaselineConversionRate * samplesPerMonth

  const [metricConversionsPerMonthMinPracticalDiff, setMetricConversionsPerMonthMinPracticalDiff] = useState(0)
  const onChangeMetricConversionsPerMonthMinPracticalDiff = (event: React.ChangeEvent<{ value: unknown }>) => {
    setMetricConversionsPerMonthMinPracticalDiff(event.target.value as number)
  }

  // Cash sales metrics calc
  const [metricBaselineRevenue, setmetricBaselineRevenue] = useState(0)
  const onChangeMetricBaselineRevenue = (event: React.ChangeEvent<{ value: unknown }>) => {
    setmetricBaselineRevenue(event.target.value as number)
  }
  const metricBaselineRevenuePerUser = metricBaselineRevenue / samplesPerMonth

  const [metricRevenuePerMonthMinPracticalDiff, setMetricRevenuePerMonthMinPracticalDiff] = useState(0)
  const onChangeMetricRevenuePerMonthMinPracticalDiff = (event: React.ChangeEvent<{ value: unknown }>) => {
    setMetricRevenuePerMonthMinPracticalDiff(event.target.value as number)
  }

  const metricMinimumPracticalDifference = _.round(
    isConversion
      ? (metricConversionsPerMonthMinPracticalDiff / samplesPerMonth) * 100
      : metricRevenuePerMonthMinPracticalDiff / samplesPerMonth,
    2,
  )

  const metricMinimumPracticalDifferenceLift = isConversion
    ? metricMinimumPracticalDifference / metricBaselineConversionRate
    : (metricRevenuePerMonthMinPracticalDiff / metricBaselineRevenue) * 100

  const metricVariance = metricBaselineConversionRate * (1 - metricBaselineConversionRate)
  const samplesRequiredPerVariation = samplesRequiredPerVariationForConversion(
    metricVariance,
    metricMinimumPracticalDifference / 100,
    defaultStatisticalSignificance,
    defaultStatisticalPower,
  )

  const [liabilityChecked, setLiabilityChecked] = useState(false)
  const onLiabilityCheckboxChange = () => setLiabilityChecked(!liabilityChecked)

  const minVariationPercentage = experiment.variations
    .map((v) => parseInt(v.allocatedPercentage, 10))
    .reduce((a, b) => Math.min(a, b))
  const minExperimentDuration = Math.ceil(
    samplesRequiredPerVariation / ((samplesPerMonth * minVariationPercentage) / 100 / 30),
  )

  const onApplyMinDiff = () => {
    isConversion
      ? setMinPracticalDiff(_.round(metricMinimumPracticalDifference / 100, 4))
      : setMinPracticalDiff(metricMinimumPracticalDifference)
  }

  // For unique form field ids
  const calculatorUniqueId = _.uniqueId()

  const debugMode = isDebugMode()

  return (
    <div className={classes.root}>
      <Typography variant='h5' gutterBottom>
        Calculator: Minimum practical difference
      </Typography>
      <br />
      <div className={classes.sideBySide}>
        <Stepper orientation='vertical' nonLinear className={classes.stepper}>
          <Step active>
            <StepLabel>How many users are entering the flow per month? (total)</StepLabel>
            <StepContent>
              <TextField
                value={samplesPerMonth}
                onChange={onChangeSamplesPerMonth}
                id={`samples-per-month-${calculatorUniqueId}`}
                label='Users / month'
                placeholder='15000'
                variant='outlined'
                fullWidth
                required
                type='number'
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </StepContent>
          </Step>
          {isConversion ? (
            <Step active key={'conversion-2'}>
              <StepLabel>What is the baseline conversion rate?</StepLabel>
              <StepContent>
                <TextField
                  id={`baseline-conversion-rate-${calculatorUniqueId}`}
                  value={metricBaselineConversionRatePercentage}
                  onChange={onChangeMetricBaselineConversionRatePercentage}
                  label='Baseline conversion rate'
                  placeholder='27.5'
                  helperText={`= ${Math.round(
                    coerceNonFiniteToZero(metricBaselineConversionsPerMonth),
                  )} conversions per month`}
                  variant='outlined'
                  fullWidth
                  required
                  type='number'
                  inputProps={{
                    min: 0,
                    max: 100,
                  }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position='end' className={classes.adornment}>
                        %
                      </InputAdornment>
                    ),
                  }}
                />
              </StepContent>
            </Step>
          ) : (
            <Step active key='cash-sales-2'>
              <StepLabel>
                What is the baseline monthly{' '}
                <PrivateLink
                  underline='always'
                  href='https://wp.me/bxNRc#what-is-the-difference-between-cash-sales-and-revenue-metrics'
                  target='_blank'
                >
                  cash sales
                </PrivateLink>{' '}
                volume?
              </StepLabel>
              <StepContent>
                <TextField
                  id={`baseline-revenue-${calculatorUniqueId}`}
                  value={metricBaselineRevenue}
                  onChange={onChangeMetricBaselineRevenue}
                  label='Baseline cash sales / month'
                  placeholder='9800'
                  helperText={`= ${_.round(coerceNonFiniteToZero(metricBaselineRevenuePerUser), 4)} USD ACPU`}
                  variant='outlined'
                  fullWidth
                  required
                  type='number'
                  inputProps={{
                    min: 0,
                    max: 100,
                  }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position='end' className={classes.adornment}>
                        USD
                      </InputAdornment>
                    ),
                  }}
                />
              </StepContent>
            </Step>
          )}
          {isConversion ? (
            <Step active key={'conversion-3'}>
              <StepLabel>How many extra conversions makes a practical difference?</StepLabel>
              <StepContent>
                <TextField
                  id={`extra-conversions-per-month-${calculatorUniqueId}`}
                  value={metricConversionsPerMonthMinPracticalDiff}
                  onChange={onChangeMetricConversionsPerMonthMinPracticalDiff}
                  label='Extra conversions / month'
                  placeholder='100'
                  variant='outlined'
                  fullWidth
                  required
                  type='number'
                  helperText={`= ${_.round(coerceNonFiniteToZero(metricMinimumPracticalDifferenceLift), 2)}% lift`}
                  inputProps={{
                    min: 0,
                  }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </StepContent>
            </Step>
          ) : (
            <Step active key={'cash-sales-3'}>
              <StepLabel>How much extra monthly cash sales makes a practical difference?</StepLabel>
              <StepContent>
                <TextField
                  id={`extra-cash-sales-${calculatorUniqueId}`}
                  value={metricRevenuePerMonthMinPracticalDiff}
                  onChange={onChangeMetricRevenuePerMonthMinPracticalDiff}
                  label='Extra cash sales / month'
                  placeholder='1500'
                  variant='outlined'
                  fullWidth
                  required
                  type='number'
                  helperText={`= ${_.round(coerceNonFiniteToZero(metricMinimumPracticalDifferenceLift), 2)}% lift`}
                  inputProps={{
                    min: 0,
                  }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position='end' className={classes.adornment}>
                        USD
                      </InputAdornment>
                    ),
                  }}
                />
              </StepContent>
            </Step>
          )}
          {
            /* istanbul ignore next; debug mode */
            debugMode && (
              <Step active>
                <StepLabel>Do not revise step 3 based on estimated experiment duration.</StepLabel>
              </Step>
            )
          }
        </Stepper>
        <div className={classes.results}>
          <Typography variant='h5' gutterBottom>
            Calculated Results
          </Typography>

          <br />

          <Typography variant='body1' gutterBottom>
            <strong> Minimum practical difference: </strong>
          </Typography>
          <strong>
            <pre>
              {coerceNonFiniteToZero(metricMinimumPracticalDifference)} {isConversion ? 'pp' : 'USD ACPU'}
            </pre>
          </strong>
          <br />
          {
            /* istanbul ignore next; debug mode */
            debugMode && (
              <>
                <Typography variant='body1' gutterBottom>
                  {' '}
                  Estimated total required participants per variation:{' '}
                </Typography>
                <pre>{samplesRequiredPerVariation} participants</pre>

                <Typography variant='body1' gutterBottom>
                  {' '}
                  Estimated experiment duration:{' '}
                </Typography>
                <pre>{minExperimentDuration} days</pre>

                <br />
              </>
            )
          }

          <div className={classes.liability}>
            <Checkbox
              className={classes.liabilityCheckbox}
              checked={liabilityChecked}
              onChange={onLiabilityCheckboxChange}
              id='liability-checkbox'
            />
            <Typography variant='caption' gutterBottom component='label' htmlFor='liability-checkbox'>
              {isConversion ? (
                <>
                  I understand that a conversion rate between{' '}
                  {coerceNonFiniteToZero(metricBaselineConversionRate * 100 - metricMinimumPracticalDifference).toFixed(
                    2,
                  )}
                  % and{' '}
                  {coerceNonFiniteToZero(metricBaselineConversionRate * 100 + metricMinimumPracticalDifference).toFixed(
                    2,
                  )}
                  % will be regarded as having no change.
                </>
              ) : (
                <>
                  I understand that ACPU (Average cash per user) between{' '}
                  {coerceNonFiniteToZero(metricBaselineRevenuePerUser - metricMinimumPracticalDifference).toFixed(2)}{' '}
                  USD and{' '}
                  {coerceNonFiniteToZero(metricBaselineRevenuePerUser + metricMinimumPracticalDifference).toFixed(2)}{' '}
                  USD will be regarded as having no change.
                </>
              )}
            </Typography>
          </div>

          <br />

          <Button
            onClick={onApplyMinDiff}
            variant='contained'
            disabled={!liabilityChecked || !metricMinimumPracticalDifference}
          >
            Apply min diff
          </Button>
        </div>
      </div>
      {
        /* istanbul ignore next; debug mode */
        debugMode && (
          <DebugOutput
            content={{
              samplesPerMonth,
              metricBaselineConversionsPerMonth,
              metricConversionsPerMonthMinPracticalDiff,
              metricBaselineConversionRatePercentage,
              metricMinimumPracticalDifference,
              samplesRequiredPerVariation,
            }}
          />
        )
      }
    </div>
  )
}

export default MinDiffCalculator
