import {
  Button,
  createStyles,
  DialogActions,
  DialogContent,
  FormControl,
  FormHelperText,
  FormLabel,
  makeStyles,
  MenuItem,
  Theme,
} from '@material-ui/core'
import { ArrowDropDown } from '@material-ui/icons'
import { ToggleButton } from '@material-ui/lab'
import clsx from 'clsx'
import { ErrorMessage, Field, Formik } from 'formik'
import { Select, Switch } from 'formik-material-ui'
import { useSnackbar } from 'notistack'
import React, { useState } from 'react'
import * as yup from 'yup'

import ExperimentsApi from 'src/api/explat/ExperimentsApi'
import { serverErrorMessage } from 'src/api/HttpResponseError'
import MinDiffCalculator from 'src/components/explat/experiments/MinDiffCalculator'
import LoadingButtonContainer from 'src/components/general/LoadingButtonContainer'
import MetricAutocomplete from 'src/components/general/MetricAutocomplete'
import MetricDifferenceField from 'src/components/general/MetricDifferenceField'
import { experimentToFormData } from 'src/lib/explat/form-data'
import { AttributionWindowSecondsToHuman } from 'src/lib/explat/metric-assignments'
import { indexMetrics } from 'src/lib/explat/normalizers'
import { ExperimentFull, Metric, MetricAssignmentNew, metricAssignmentNewSchema } from 'src/lib/explat/schemas'

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    row: {
      minWidth: 400,
      marginTop: theme.spacing(3),
      display: 'flex',
      alignItems: 'center',
      '&:first-of-type': {
        marginTop: theme.spacing(0),
      },
    },
    label: {
      marginBottom: theme.spacing(1),
    },
    minDifferenceCalculatorToggle: {
      alignSelf: 'flex-start',
      marginLeft: theme.spacing(1),
      marginTop: theme.spacing(3),
    },
    minDiffCalculatorCollapsed: {
      display: 'none',
    },
  }),
)

const assignMetricInitialAssignMetric = {
  metricId: '',
  attributionWindowSeconds: '',
  changeExpected: false,
  isPrimary: false,
  minDifference: '',
}

function MetricAssignmentForm({
  experiment,
  metrics,
  onSuccess,
  onCancel,
}: {
  experiment: ExperimentFull
  metrics: Metric[]
  onSuccess: () => void
  onCancel: () => void
}): JSX.Element {
  const classes = useStyles()
  const { enqueueSnackbar } = useSnackbar()

  // TODO: Normalize this higher up
  const indexedMetrics = indexMetrics(metrics)

  const [isActiveMinDiffCalculator, setIsActiveMinDiffCalculator] = useState<boolean>(false)
  const [samplesPerMonth, setSamplesPerMonth] = useState(0)

  const onSubmit = async (formData: { metricAssignment: typeof assignMetricInitialAssignMetric }) => {
    try {
      await ExperimentsApi.assignMetric(experiment, formData.metricAssignment as unknown as MetricAssignmentNew)
      enqueueSnackbar('Metric Assigned Successfully!', { variant: 'success' })
      onSuccess()
    } catch (e) /* istanbul ignore next; Shouldn't happen */ {
      console.error(e)
      enqueueSnackbar(
        `Oops! Something went wrong while trying to assign a metric to your experiment. ${serverErrorMessage(e)}`,
        {
          variant: 'error',
        },
      )
    }
  }

  return (
    <Formik
      initialValues={{ metricAssignment: assignMetricInitialAssignMetric }}
      onSubmit={onSubmit}
      validationSchema={yup.object({ metricAssignment: metricAssignmentNewSchema })}
    >
      {(formikProps) => {
        const metric =
          (formikProps.values.metricAssignment.metricId &&
            indexedMetrics[formikProps.values.metricAssignment.metricId as unknown as number]) ||
          undefined
        const metricAssignmentsError =
          formikProps.touched.metricAssignment?.metricId && formikProps.errors.metricAssignment?.metricId
        const onMetricChange = (_event: unknown, metric: Metric | null) => {
          formikProps.setFieldValue('metricAssignment.metricId', metric?.metricId)
          metric === null && setIsActiveMinDiffCalculator(false)
        }
        const handleMinPracticalDiffUpdate = (newMinDiff: number) => {
          newMinDiff && formikProps.setFieldValue('metricAssignment.minDifference', newMinDiff)
        }
        const handleMinDiffCalculatorToggle = () => {
          setIsActiveMinDiffCalculator(!isActiveMinDiffCalculator)
        }

        return (
          <form onSubmit={formikProps.handleSubmit} noValidate>
            <DialogContent>
              <div className={classes.row}>
                <FormControl component='fieldset' fullWidth>
                  <FormLabel required className={classes.label} htmlFor={`metricAssignment.metricId`}>
                    Metric
                  </FormLabel>
                  <MetricAutocomplete
                    id={`metricAssignment.metricId`}
                    value={indexedMetrics[Number(formikProps.values.metricAssignment.metricId)] ?? null}
                    onChange={onMetricChange}
                    options={Object.values(indexedMetrics)}
                    error={metricAssignmentsError}
                    fullWidth
                  />
                  {formikProps.errors.metricAssignment?.metricId && (
                    <FormHelperText error={true}>
                      <ErrorMessage name={`metricAssignment.metricId`} />
                    </FormHelperText>
                  )}
                </FormControl>
              </div>
              <div className={classes.row}>
                <FormControl component='fieldset' fullWidth>
                  <FormLabel required className={classes.label} id={`metricAssignment.attributionWindowSeconds-label`}>
                    Attribution Window
                  </FormLabel>
                  <Field
                    component={Select}
                    name={`metricAssignment.attributionWindowSeconds`}
                    labelId={`metricAssignment.attributionWindowSeconds-label`}
                    id={`metricAssignment.attributionWindowSeconds`}
                    variant='outlined'
                    error={
                      // istanbul ignore next; trivial, not-critical, pain to test.
                      !!formikProps.errors.metricAssignment?.attributionWindowSeconds &&
                      !!formikProps.touched.metricAssignment?.attributionWindowSeconds
                    }
                    displayEmpty
                  >
                    <MenuItem value=''>-</MenuItem>
                    {Object.entries(AttributionWindowSecondsToHuman).map(
                      ([attributionWindowSeconds, attributionWindowSecondsHuman]) => (
                        <MenuItem value={attributionWindowSeconds} key={attributionWindowSeconds}>
                          {attributionWindowSecondsHuman}
                        </MenuItem>
                      ),
                    )}
                  </Field>
                  {formikProps.errors.metricAssignment?.attributionWindowSeconds && (
                    <FormHelperText error={true}>
                      <ErrorMessage name={`metricAssignment.attributionWindowSeconds`} />
                    </FormHelperText>
                  )}
                </FormControl>
              </div>
              <div className={classes.row}>
                <FormControl component='fieldset' fullWidth>
                  <FormLabel required className={classes.label}>
                    Change Expected
                  </FormLabel>
                  <Field
                    component={Switch}
                    label='Change Expected'
                    name={`metricAssignment.changeExpected`}
                    id={`metricAssignment.changeExpected`}
                    inputProps={{
                      'aria-label': 'Change Expected',
                    }}
                    variant='outlined'
                    type='checkbox'
                  />
                </FormControl>
              </div>
              <div className={classes.row}>
                <FormControl component='fieldset' fullWidth>
                  <FormLabel required className={classes.label} id={`metricAssignment.minDifference-label`}>
                    Minimum Difference
                  </FormLabel>
                  <MetricDifferenceField
                    name={`metricAssignment.minDifference`}
                    id={`metricAssignment.minDifference`}
                    metric={metric}
                  />
                </FormControl>
                <ToggleButton
                  value='check'
                  disabled={!metric}
                  selected={isActiveMinDiffCalculator}
                  onChange={handleMinDiffCalculatorToggle}
                  className={classes.minDifferenceCalculatorToggle}
                  title='Minimum Difference Calculator'
                  size='small'
                >
                  <ArrowDropDown />
                </ToggleButton>
              </div>
              <div className={clsx(classes.row, !isActiveMinDiffCalculator && classes.minDiffCalculatorCollapsed)}>
                {metric && (
                  <MinDiffCalculator
                    setMinPracticalDiff={handleMinPracticalDiffUpdate}
                    {...{
                      samplesPerMonth,
                      setSamplesPerMonth,
                      experiment: experimentToFormData(experiment),
                      metric: metric,
                    }}
                  />
                )}
              </div>
            </DialogContent>
            <DialogActions>
              <Button onClick={onCancel} color='primary'>
                Cancel
              </Button>
              <LoadingButtonContainer isLoading={formikProps.isSubmitting}>
                <Button
                  type='submit'
                  variant='contained'
                  color='secondary'
                  disabled={formikProps.isSubmitting || !formikProps.isValid}
                >
                  Assign
                </Button>
              </LoadingButtonContainer>
            </DialogActions>
          </form>
        )
      }}
    </Formik>
  )
}

export default MetricAssignmentForm
