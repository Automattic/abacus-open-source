import {
  Button,
  FormControl,
  FormHelperText,
  IconButton,
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
import { Add, ArrowDropDown, Clear, OpenInNew } from '@material-ui/icons'
import { Alert, AutocompleteRenderInputParams, ToggleButton } from '@material-ui/lab'
import clsx from 'clsx'
import { Field, FieldArray, FormikProps, useField } from 'formik'
import { Select, Switch, TextField } from 'formik-material-ui'
import _ from 'lodash'
import React, { useState } from 'react'

import { getPropNameCompletions } from 'src/api/explat/AutocompleteApi'
import MinDiffCalculator from 'src/components/explat/experiments/MinDiffCalculator'
import MetricDetailsModal from 'src/components/explat/metrics/single-view/MetricDetailsModal'
import Attribute from 'src/components/general/Attribute'
import AbacusAutocomplete, { autocompleteInputProps } from 'src/components/general/Autocomplete'
import CollapsibleAlert from 'src/components/general/CollapsibleAlert'
import MetricAutocomplete from 'src/components/general/MetricAutocomplete'
import MetricDifferenceField from 'src/components/general/MetricDifferenceField'
import MoreMenu from 'src/components/general/MoreMenu'
import PrivateLink from 'src/components/general/PrivateLink'
import { ExperimentFormData } from 'src/lib/explat/form-data'
import { AttributionWindowSecondsToHuman } from 'src/lib/explat/metric-assignments'
import { EventNew, Metric, MetricAssignment } from 'src/lib/explat/schemas'
import { useDecorationStyles } from 'src/styles/styles'
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
      wordBreak: 'break-word',
    },
    metricName: {
      fontFamily: theme.custom.fonts.monospace,
      fontWeight: theme.custom.fontWeights.monospaceBold,
    },
    minDifferenceField: {
      maxWidth: '14rem',
      marginRight: theme.spacing(1),
    },
    minDifferenceFieldWrapper: {
      display: 'flex',
    },
    minDifferenceCalculatorToggle: {
      alignSelf: 'start',
      textTransform: 'none',
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
    thMetricName: {},
    thAttributionWindow: {
      width: '11rem',
    },
    thChangeExpected: {
      width: '8rem',
    },
    thMinDiff: {
      width: '15rem',
    },
    thSettings: {
      width: '5.5rem',
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
    minDiffExpanded: {
      backgroundColor: theme.palette.grey[50],
      border: `1px solid ${theme.palette.grey[300]}`,
      borderBottomColor: theme.palette.grey[50],
    },
    minDiffCalculator: {
      backgroundColor: theme.palette.grey[50],
    },
    minDiffCalculatorCollapsed: {
      display: 'none',
    },
    metricsTable: {
      tableLayout: 'fixed',
      minWidth: 800,
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
  const decorationClasses = useDecorationStyles()

  // Metric Assignments
  const [metricAssignmentsField, _metricAssignmentsFieldMetaProps, metricAssignmentsFieldHelperProps] =
    useField<MetricAssignment[]>('experiment.metricAssignments')
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
  const [exposureEventsField, _exposureEventsFieldMetaProps, _exposureEventsFieldHelperProps] =
    useField<EventNew[]>('experiment.exposureEvents')

  const [samplesPerMonth, setSamplesPerMonth] = useState(0)

  // Minimum practical difference calculator toggle
  const [activeMinDiffCalculatorList, setActiveMinDiffCalculatorList] = useState<boolean[]>(
    Array(metricAssignmentsField.value.length).fill(false),
  )
  const handleMinDiffCalculatorToggle = (indexToSet: number) => {
    setActiveMinDiffCalculatorList((list) => [
      ...list.slice(0, indexToSet),
      !list[indexToSet],
      ...list.slice(indexToSet + 1),
    ])
  }

  // Minimum practical difference value update
  const handleMinPracticalDiffUpdate = (newMinDiff: number, indexToSet: number) => {
    newMinDiff &&
      metricAssignmentsFieldHelperProps.setValue(
        metricAssignmentsField.value.map((metricAssignment, index) => ({
          ...metricAssignment,
          ...(index === indexToSet && { minDifference: newMinDiff / 100 }),
        })),
      )
  }

  const [expandedMetricId, setExpandedMetricId] = useState<number | undefined>()
  const handleMetricDetailsClose = () => setExpandedMetricId(undefined)

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
              setActiveMinDiffCalculatorList([...activeMinDiffCalculatorList, false])
            }
            setSelectedMetric(null)
          }

          return (
            <>
              <TableContainer>
                <Table className={classes.metricsTable}>
                  <TableHead>
                    <TableRow>
                      <TableCell className={classes.thMetricName}>Metric</TableCell>
                      <TableCell className={classes.thAttributionWindow}>Attribution Window</TableCell>
                      <TableCell className={classes.thChangeExpected}>Change Expected?</TableCell>
                      <TableCell className={classes.thMinDiff}>Minimum Practical Difference</TableCell>
                      <TableCell className={classes.thSettings} />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {metricAssignmentsField.value.map((metricAssignment, index) => {
                      const onRemoveMetricAssignment = () => {
                        arrayHelpers.remove(index)
                        setActiveMinDiffCalculatorList(activeMinDiffCalculatorList.filter((_, i) => i !== index))
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
                        <React.Fragment key={index}>
                          <TableRow key={index}>
                            <TableCell className={classes.metricNameCell}>
                              <Tooltip arrow title={indexedMetrics[metricAssignment.metricId].description}>
                                <span className={clsx(classes.metricName, decorationClasses.tooltipped)}>
                                  {indexedMetrics[metricAssignment.metricId].name}
                                </span>
                              </Tooltip>
                              <IconButton
                                aria-label='Open metric details'
                                size='small'
                                onClick={() => setExpandedMetricId(metricAssignment.metricId)}
                              >
                                <OpenInNew />
                              </IconButton>
                              <br />
                              {metricAssignment.isPrimary && (
                                <Attribute name='primary' className={classes.monospaced} />
                              )}
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
                            <TableCell className={clsx(activeMinDiffCalculatorList[index] && classes.minDiffExpanded)}>
                              <span className={classes.minDifferenceFieldWrapper}>
                                <MetricDifferenceField
                                  className={classes.minDifferenceField}
                                  name={`experiment.metricAssignments[${index}].minDifference`}
                                  id={`experiment.metricAssignments[${index}].minDifference`}
                                  metric={indexedMetrics[metricAssignment.metricId]}
                                />
                                <ToggleButton
                                  value='check'
                                  selected={activeMinDiffCalculatorList[index]}
                                  onChange={handleMinDiffCalculatorToggle.bind(null, index)}
                                  className={classes.minDifferenceCalculatorToggle}
                                  title='Minimum Difference Calculator'
                                  size='small'
                                >
                                  <ArrowDropDown />
                                </ToggleButton>
                              </span>
                            </TableCell>
                            <TableCell>
                              <MoreMenu>
                                <MenuItem onClick={onMakePrimary}>Set as Primary</MenuItem>
                                <MenuItem onClick={onRemoveMetricAssignment}>Remove</MenuItem>
                              </MoreMenu>
                            </TableCell>
                          </TableRow>
                          <TableRow
                            className={clsx(
                              classes.minDiffCalculator,
                              !activeMinDiffCalculatorList[index] && classes.minDiffCalculatorCollapsed,
                            )}
                            key={`${index}-metric-calculator`}
                          >
                            <TableCell></TableCell>
                            <TableCell colSpan={4}>
                              <MinDiffCalculator
                                setMinPracticalDiff={(newMinDiff) => handleMinPracticalDiffUpdate(newMinDiff, index)}
                                {...{
                                  samplesPerMonth,
                                  setSamplesPerMonth,
                                  experiment: formikProps.values.experiment,
                                  metric: indexedMetrics[metricAssignment.metricId],
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        </React.Fragment>
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
        <PrivateLink underline='always' href='https://wp.me/PCYsg-FqB/#8-define-primary-metric' target='_blank'>
          How do I choose a Primary Metric?
        </PrivateLink>
      </Alert>

      <CollapsibleAlert
        id='attr-window-panel'
        severity='info'
        className={classes.attributionWindowInfo}
        summary={'What is an Attribution Window?'}
      >
        <PrivateLink
          underline='always'
          href='https://wp.me/PCYsg-FqB/#6-get-comfortable-with-metric-attribution-and-refund-windows'
          target='_blank'
        >
          An Attribution Window
        </PrivateLink>{' '}
        is the window of time after exposure to an experiment that we capture metric events for a participant (exposure
        can be from either assignment or specified exposure events). The refund window is the window of time after a
        purchase event. Cash sales metrics will automatically deduct transactions that have been refunded within the
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
        <PrivateLink
          underline='always'
          href='https://wp.me/PCYsg-FqB/#7-get-comfortable-with-minimum-differences'
          target='_blank'
        >
          Minimum Practical Difference values
        </PrivateLink>{' '}
        are absolute differences from the baseline (not relative). For example, if the baseline conversion rate is 5%, a
        minimum difference of 0.5 pp is equivalent to a 10% relative change.
        <br />
        <div className={classes.minDiffDiagram}>
          <MinDiffDiagram />
        </div>
      </CollapsibleAlert>

      <Alert severity='info' className={classes.requestMetricInfo}>
        <PrivateLink underline='always' href='https://wp.me/PCYsg-Fqe/#how-to-request-a-new-metric' target='_blank'>
          {"Can't find a metric? Request one!"}
        </PrivateLink>
      </Alert>

      <Typography variant='h4' className={classes.exposureEventsTitle}>
        Exposure Events
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
                            {}
                            <br />
                            {}
                            Use them carefully, if you want to preload the experiment and then narrow down the
                            participants, or if you intend the participant to experience something multiple times, and
                            you want the metric attribution window to reset each time they perform an initial action.
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
        <PrivateLink underline='always' href='https://wp.me/PCYsg-FpQ/#attribution-windows' target='_blank'>
          What is an Exposure Event? And when do I need it?
        </PrivateLink>
        <br />
        <span>Only validated events can be used as exposure events.</span>
      </Alert>

      <Alert severity='info' className={classes.multipleExposureEventsInfo}>
        If you have multiple exposure events, then participants will be considered exposed if they trigger{' '}
        <strong>any</strong> of the exposure events.
      </Alert>
      {expandedMetricId && (
        <MetricDetailsModal metric={indexedMetrics[expandedMetricId]} onClose={handleMetricDetailsClose} />
      )}
    </div>
  )
}

export default Metrics
