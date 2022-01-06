import {
  Button,
  FormControl,
  FormHelperText,
  IconButton,
  Link,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField as MuiTextField,
  Tooltip,
  Typography,
} from '@material-ui/core'
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles'
import { Add, Clear } from '@material-ui/icons'
import { Alert, AutocompleteRenderInputParams } from '@material-ui/lab'
import clsx from 'clsx'
import { Field, FieldArray, FormikProps, useField } from 'formik'
import { Select, Switch, TextField } from 'formik-material-ui'
import _ from 'lodash'
import React, { useState } from 'react'

import { getPropNameCompletions } from 'src/api/AutocompleteApi'
import Attribute from 'src/components/general/Attribute'
import AbacusAutocomplete, { autocompleteInputProps } from 'src/components/general/Autocomplete'
import CollapsibleAlert from 'src/components/general/CollapsibleAlert'
import MetricAutocomplete from 'src/components/general/MetricAutocomplete'
import MetricDifferenceField from 'src/components/general/MetricDifferenceField'
import MoreMenu from 'src/components/general/MoreMenu'
import { ExperimentFormData } from 'src/lib/form-data'
import { AttributionWindowSecondsToHuman } from 'src/lib/metric-assignments'
import { EventNew, Metric, MetricAssignment } from 'src/lib/schemas'
import { useDataSource } from 'src/utils/data-loading'

import { ExperimentFormCompletionBag } from './ExperimentForm'
import { ReactComponent as AttributionWindowDiagram } from './img/attribution_window.svg'
import { ReactComponent as MinDiffDiagram } from './img/min_diffs.svg'
import { ReactComponent as RefundWindowDiagram } from './img/refund_window.svg'

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {},
    addMetricPlaceholder: {
      fontFamily: theme.typography.fontFamily,
    },
    addMetricSelect: {
      flex: 1,
      marginRight: theme.spacing(1),
    },
    attributionWindowSelect: {
      minWidth: '8rem',
    },
    monospaced: {
      fontFamily: theme.custom.fonts.monospace,
    },
    metricNameCell: {
      maxWidth: '24rem',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    metricName: {
      fontFamily: theme.custom.fonts.monospace,
      fontWeight: theme.custom.fontWeights.monospaceBold,
    },
    tooltipped: {
      borderBottomWidth: 1,
      borderBottomStyle: 'dashed',
      borderBottomColor: theme.palette.grey[500],
    },
    minDifferenceField: {
      maxWidth: '14rem',
    },
    changeExpected: {
      textAlign: 'center',
    },
    metricsInfo: {
      marginTop: theme.spacing(4),
    },
    attributionWindowInfo: {
      marginTop: theme.spacing(1),
    },
    attributionWindowDiagram: {
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'space-evenly',
      marginTop: theme.spacing(1),
    },
    minDiffInfo: {
      marginTop: theme.spacing(1),
    },
    minDiffDiagram: {
      textAlign: 'center',
      marginTop: theme.spacing(1),
    },
    requestMetricInfo: {
      marginTop: theme.spacing(1),
    },
    exposureEventsTitle: {
      marginTop: theme.spacing(6),
      marginBottom: theme.spacing(4),
    },
    exposureEventsInfo: {
      marginTop: theme.spacing(4),
    },
    multipleExposureEventsInfo: {
      marginTop: theme.spacing(1),
    },
  }),
)

const useMetricEditorStyles = makeStyles((theme) =>
  createStyles({
    root: {},
    addMetric: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-end',
      margin: theme.spacing(3, 0, 2),
    },
    addMetricAddSymbol: {
      position: 'relative',
      top: -3,
      marginRight: theme.spacing(2),
      color: theme.palette.text.disabled,
    },
  }),
)

const useEventEditorStyles = makeStyles((theme) =>
  createStyles({
    root: {},
    exposureEventsEventNameCell: {
      display: 'flex',
      alignItems: 'center',
    },
    exposureEventsEventName: {
      flexGrow: 1,
    },
    exposureEventsEventRemoveButton: {
      marginLeft: theme.spacing(1),
    },
    exposureEventsEventPropertiesRow: {
      marginTop: theme.spacing(3),
      marginLeft: theme.spacing(3),
    },
    exposureEventsEventPropertiesKey: {
      marginRight: theme.spacing(1),
    },
    exposureEventsEventPropertiesKeyAutoComplete: {
      display: 'inline-flex',
      minWidth: '40%',
    },
  }),
)

const createMetricAssignment = (metric: Metric) => {
  return {
    metricId: metric.metricId,
    attributionWindowSeconds: '',
    isPrimary: false,
    changeExpected: true,
    minDifference: '',
  }
}

const EventEditor = ({
  index,
  completionBag: { eventCompletionDataSource },
  exposureEvent: { event: name, props: propList },
  onRemoveExposureEvent,
}: {
  index: number
  completionBag: ExperimentFormCompletionBag
  exposureEvent: EventNew
  onRemoveExposureEvent: () => void
}) => {
  const classes = useEventEditorStyles()
  const metricClasses = useMetricEditorStyles()
  const { isLoading, data: propCompletions } = useDataSource(async () => name && getPropNameCompletions(name), [name])

  return (
    <TableRow>
      <TableCell>
        <div className={classes.exposureEventsEventNameCell}>
          <Field
            component={AbacusAutocomplete}
            name={`experiment.exposureEvents[${index}].event`}
            className={classes.exposureEventsEventName}
            id={`experiment.exposureEvents[${index}].event`}
            options={eventCompletionDataSource.data}
            loading={eventCompletionDataSource.isLoading}
            renderInput={(params: AutocompleteRenderInputParams) => (
              <MuiTextField
                {...params}
                label='Event Name'
                placeholder='event_name'
                variant='outlined'
                InputLabelProps={{
                  shrink: true,
                }}
                InputProps={{
                  ...autocompleteInputProps(params, eventCompletionDataSource.isLoading),
                  'aria-label': 'Event Name',
                }}
              />
            )}
          />
          <IconButton
            className={classes.exposureEventsEventRemoveButton}
            onClick={onRemoveExposureEvent}
            aria-label='Remove exposure event'
          >
            <Clear />
          </IconButton>
        </div>
        <FieldArray
          name={`experiment.exposureEvents[${index}].props`}
          render={(arrayHelpers) => {
            const onAddExposureEventProperty = () => {
              arrayHelpers.push({
                key: '',
                value: '',
              })
            }

            return (
              <div>
                <div>
                  {propList &&
                    propList.map((_prop: unknown, propIndex: number) => {
                      const onRemoveExposureEventProperty = () => {
                        arrayHelpers.remove(propIndex)
                      }

                      return (
                        <div className={classes.exposureEventsEventPropertiesRow} key={propIndex}>
                          <Field
                            component={AbacusAutocomplete}
                            name={`experiment.exposureEvents[${index}].props[${propIndex}].key`}
                            id={`experiment.exposureEvents[${index}].props[${propIndex}].key`}
                            options={propCompletions || []}
                            loading={isLoading}
                            freeSolo={true}
                            className={classes.exposureEventsEventPropertiesKeyAutoComplete}
                            renderInput={(params: AutocompleteRenderInputParams) => (
                              <MuiTextField
                                {...params}
                                className={classes.exposureEventsEventPropertiesKey}
                                label='Key'
                                placeholder='key'
                                variant='outlined'
                                size='small'
                                InputProps={{
                                  ...autocompleteInputProps(params, isLoading),
                                  'aria-label': 'Property Key',
                                }}
                                InputLabelProps={{
                                  shrink: true,
                                }}
                              />
                            )}
                          />
                          <Field
                            component={TextField}
                            name={`experiment.exposureEvents[${index}].props[${propIndex}].value`}
                            id={`experiment.exposureEvents[${index}].props[${propIndex}].value`}
                            type='text'
                            variant='outlined'
                            placeholder='value'
                            label='Value'
                            size='small'
                            inputProps={{
                              'aria-label': 'Property Value',
                            }}
                            InputLabelProps={{
                              shrink: true,
                            }}
                          />
                          <IconButton
                            className={classes.exposureEventsEventRemoveButton}
                            onClick={onRemoveExposureEventProperty}
                            aria-label='Remove exposure event property'
                          >
                            <Clear />
                          </IconButton>
                        </div>
                      )
                    })}
                </div>
                <div className={metricClasses.addMetric}>
                  <Add className={metricClasses.addMetricAddSymbol} />
                  <Button
                    variant='contained'
                    onClick={onAddExposureEventProperty}
                    disableElevation
                    size='small'
                    aria-label='Add Property'
                  >
                    Add Property
                  </Button>
                </div>
              </div>
            )
          }}
        />
      </TableCell>
    </TableRow>
  )
}

const Metrics = ({
  indexedMetrics,
  completionBag,
  formikProps,
}: {
  indexedMetrics: Record<number, Metric>
  completionBag: ExperimentFormCompletionBag
  formikProps: FormikProps<{ experiment: ExperimentFormData }>
}): JSX.Element => {
  const classes = useStyles()
  const metricEditorClasses = useMetricEditorStyles()

  // Metric Assignments
  const [metricAssignmentsField, _metricAssignmentsFieldMetaProps, metricAssignmentsFieldHelperProps] = useField<
    MetricAssignment[]
  >('experiment.metricAssignments')
  const [selectedMetric, setSelectedMetric] = useState<Metric | null>(null)
  const onChangeSelectedMetricOption = (_event: unknown, value: Metric | null) => setSelectedMetric(value)

  const makeMetricAssignmentPrimary = (indexToSet: number) => {
    metricAssignmentsFieldHelperProps.setValue(
      metricAssignmentsField.value.map((metricAssignment, index) => ({
        ...metricAssignment,
        isPrimary: index === indexToSet,
      })),
    )
  }

  // This picks up the no metric assignments validation error
  const metricAssignmentsError =
    formikProps.touched.experiment?.metricAssignments &&
    _.isString(formikProps.errors.experiment?.metricAssignments) &&
    formikProps.errors.experiment?.metricAssignments

  // ### Exposure Events
  const [exposureEventsField, _exposureEventsFieldMetaProps, _exposureEventsFieldHelperProps] = useField<EventNew[]>(
    'experiment.exposureEvents',
  )

  return (
    <div className={classes.root}>
      <Typography variant='h4' gutterBottom>
        Assign Metrics
      </Typography>

      <FieldArray
        name='experiment.metricAssignments'
        render={(arrayHelpers) => {
          const onAddMetric = () => {
            if (selectedMetric) {
              const metricAssignment = createMetricAssignment(selectedMetric)
              arrayHelpers.push({
                ...metricAssignment,
                isPrimary: metricAssignmentsField.value.length === 0,
              })
            }
            setSelectedMetric(null)
          }

          return (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Metric</TableCell>
                      <TableCell>Attribution Window</TableCell>
                      <TableCell>Change Expected?</TableCell>
                      <TableCell>Minimum Practical Difference</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {metricAssignmentsField.value.map((metricAssignment, index) => {
                      const onRemoveMetricAssignment = () => {
                        arrayHelpers.remove(index)
                      }

                      const onMakePrimary = () => {
                        makeMetricAssignmentPrimary(index)
                      }

                      const attributionWindowError =
                        (_.get(
                          formikProps.touched,
                          `experiment.metricAssignments[${index}].attributionWindowSeconds`,
                        ) as boolean | undefined) &&
                        (_.get(
                          formikProps.errors,
                          `experiment.metricAssignments[${index}].attributionWindowSeconds`,
                        ) as string | undefined)

                      return (
                        <TableRow key={index}>
                          <TableCell className={classes.metricNameCell}>
                            <Tooltip arrow title={indexedMetrics[metricAssignment.metricId].description}>
                              <span className={clsx(classes.metricName, classes.tooltipped)}>
                                {indexedMetrics[metricAssignment.metricId].name}
                              </span>
                            </Tooltip>
                            <br />
                            {metricAssignment.isPrimary && <Attribute name='primary' className={classes.monospaced} />}
                          </TableCell>
                          <TableCell>
                            <Field
                              className={classes.attributionWindowSelect}
                              component={Select}
                              name={`experiment.metricAssignments[${index}].attributionWindowSeconds`}
                              labelId={`experiment.metricAssignments[${index}].attributionWindowSeconds`}
                              size='small'
                              variant='outlined'
                              autoWidth
                              displayEmpty
                              error={!!attributionWindowError}
                              SelectDisplayProps={{
                                'aria-label': 'Attribution Window',
                              }}
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
                            {_.isString(attributionWindowError) && (
                              <FormHelperText error>{attributionWindowError}</FormHelperText>
                            )}
                          </TableCell>
                          <TableCell className={classes.changeExpected}>
                            <Field
                              component={Switch}
                              name={`experiment.metricAssignments[${index}].changeExpected`}
                              id={`experiment.metricAssignments[${index}].changeExpected`}
                              type='checkbox'
                              aria-label='Change Expected'
                              variant='outlined'
                            />
                          </TableCell>
                          <TableCell>
                            <MetricDifferenceField
                              className={classes.minDifferenceField}
                              name={`experiment.metricAssignments[${index}].minDifference`}
                              id={`experiment.metricAssignments[${index}].minDifference`}
                              metricParameterType={indexedMetrics[metricAssignment.metricId].parameterType}
                            />
                          </TableCell>
                          <TableCell>
                            <MoreMenu>
                              <MenuItem onClick={onMakePrimary}>Set as Primary</MenuItem>
                              <MenuItem onClick={onRemoveMetricAssignment}>Remove</MenuItem>
                            </MoreMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {metricAssignmentsField.value.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5}>
                          <Typography variant='body1' align='center'>
                            You don&apos;t have any metric assignments yet.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <div className={metricEditorClasses.addMetric}>
                <Add className={metricEditorClasses.addMetricAddSymbol} />
                <FormControl className={classes.addMetricSelect}>
                  <MetricAutocomplete
                    id='add-metric-select'
                    value={selectedMetric}
                    onChange={onChangeSelectedMetricOption}
                    options={Object.values(indexedMetrics)}
                    error={metricAssignmentsError}
                    fullWidth
                  />
                </FormControl>
                <Button variant='contained' disableElevation size='small' onClick={onAddMetric} aria-label='Add metric'>
                  Assign
                </Button>
              </div>
            </>
          )
        }}
      />

      <Alert severity='info' className={classes.metricsInfo}>
        <Link
          underline='always'
          href="https://github.com/Automattic/experimentation-platform/wiki/Experimenter's-Guide#how-do-i-choose-a-primary-metric"
          target='_blank'
        >
          How do I choose a Primary Metric?
        </Link>
        &nbsp;
        <Link
          underline='always'
          href="https://github.com/Automattic/experimentation-platform/wiki/Experimenter's-Guide#what-does-change-expected-mean-for-a-metric"
          target='_blank'
        >
          What is Change Expected?
        </Link>
      </Alert>

      <CollapsibleAlert
        id='attr-window-panel'
        severity='info'
        className={classes.attributionWindowInfo}
        summary={'What is an Attribution Window?'}
      >
        <Link
          underline='always'
          href="https://github.com/Automattic/experimentation-platform/wiki/Experimenter's-Guide#what-is-an-attribution-window-for-a-metric"
          target='_blank'
        >
          An Attribution Window
        </Link>{' '}
        is the window of time after exposure to an experiment that we capture metric events for a participant (exposure
        can be from either assignment or specified exposure events). The refund window is the window of time after a
        purchase event. Revenue metrics will automatically deduct transactions that have been refunded within the
        metric’s refund window.
        <br />
        <div className={classes.attributionWindowDiagram}>
          <AttributionWindowDiagram />
          <RefundWindowDiagram />
        </div>
      </CollapsibleAlert>

      <CollapsibleAlert
        id='min-diff-panel'
        severity='info'
        className={classes.minDiffInfo}
        summary={'How do I choose a Minimum Difference?'}
      >
        <Link
          underline='always'
          href="https://github.com/Automattic/experimentation-platform/wiki/Experimenter's-Guide#how-do-i-choose-a-minimum-difference-practically-equivalent-value-for-my-metrics"
          target='_blank'
        >
          Minimum Practical Difference values
        </Link>{' '}
        are absolute differences from the baseline (not relative). For example, if the baseline conversion rate is 5%, a
        minimum difference of 0.5 pp is equivalent to a 10% relative change.
        <br />
        <div className={classes.minDiffDiagram}>
          <MinDiffDiagram />
        </div>
      </CollapsibleAlert>

      <Alert severity='info' className={classes.requestMetricInfo}>
        <Link underline='always' href='https://betterexperiments.wordpress.com/?start=metric-request' target='_blank'>
          {"Can't find a metric? Request one!"}
        </Link>
      </Alert>

      <Typography variant='h4' className={classes.exposureEventsTitle}>
        Exposure Events (Optional)
      </Typography>

      <FieldArray
        name='experiment.exposureEvents'
        render={(arrayHelpers) => {
          const onAddExposureEvent = () => {
            arrayHelpers.push({
              event: '',
              props: [],
            })
          }
          return (
            <>
              <TableContainer>
                <Table>
                  <TableBody>
                    {exposureEventsField.value.map((exposureEvent, index) => (
                      <EventEditor
                        key={index}
                        {...{ arrayHelpers, index, classes, completionBag, exposureEvent }}
                        onRemoveExposureEvent={() => arrayHelpers.remove(index)}
                      />
                    ))}
                    {exposureEventsField.value.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={1}>
                          <Typography variant='body1' align='center'>
                            You don&apos;t have any exposure events.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <div className={metricEditorClasses.addMetric}>
                <Add className={metricEditorClasses.addMetricAddSymbol} />
                <Button
                  variant='contained'
                  disableElevation
                  size='small'
                  onClick={onAddExposureEvent}
                  aria-label='Add exposure event'
                >
                  Add Event
                </Button>
              </div>
            </>
          )
        }}
      />

      <Alert severity='info' className={classes.exposureEventsInfo}>
        <Link
          underline='always'
          href="https://github.com/Automattic/experimentation-platform/wiki/Experimenter's-Guide#what-is-an-exposure-event-and-when-do-i-need-it"
          target='_blank'
        >
          What is an Exposure Event? And when do I need it?
        </Link>
        <br />
        <span>Only validated events can be used as exposure events.</span>
      </Alert>

      <Alert severity='info' className={classes.multipleExposureEventsInfo}>
        If you have multiple exposure events, then participants will be considered exposed if they trigger{' '}
        <strong>any</strong> of the exposure events.
      </Alert>
    </div>
  )
}

export default Metrics
