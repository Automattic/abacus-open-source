import { Button, Link, Paper, Step, StepButton, StepLabel, Stepper, Typography } from '@material-ui/core'
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles'
import { Formik, setNestedObjectValues } from 'formik'
import _ from 'lodash'
import React, { useEffect, useRef, useState } from 'react'
import { Prompt } from 'react-router-dom'
import * as yup from 'yup'

import GeneralErrorAlert from 'src/components/general/GeneralErrorAlert'
import { ExperimentFormData } from 'src/lib/form-data'
import { AutocompleteItem, experimentFullNewSchema, Metric, Segment } from 'src/lib/schemas'
import { DataSourceResult } from 'src/utils/data-loading'

import LoadingButtonContainer from '../../general/LoadingButtonContainer'
import Audience from './Audience'
import BasicInfo from './BasicInfo'
import Beginning from './Beginning'
import Metrics from './Metrics'

export interface ExperimentFormCompletionBag {
  userCompletionDataSource: DataSourceResult<AutocompleteItem[]>
  eventCompletionDataSource: DataSourceResult<AutocompleteItem[]>
  exclusionGroupCompletionDataSource: DataSourceResult<AutocompleteItem[]>
}

enum StageId {
  Beginning,
  BasicInfo,
  Audience,
  Metrics,
  Submit,
}

interface Stage {
  id: StageId
  title: string
  validatableFields: string[]
}

const stages: Stage[] = [
  {
    id: StageId.Beginning,
    title: 'Start',
    validatableFields: ['experiment.p2Url'],
  },
  {
    id: StageId.BasicInfo,
    title: 'Basic Info',
    validatableFields: [
      'experiment.name',
      'experiment.description',
      'experiment.startDatetime',
      'experiment.endDatetime',
      'experiment.ownerLogin',
    ],
  },
  {
    id: StageId.Audience,
    title: 'Audience',
    validatableFields: [
      'experiment.platform',
      'experiment.existingUsersAllowed',
      'experiment.segments',
      'experiment.variations',
    ],
  },
  {
    id: StageId.Metrics,
    title: 'Metrics',
    validatableFields: ['experiment.metricAssignments', 'experiment.exposureEvents'],
  },
  {
    id: StageId.Submit,
    title: 'Submit',
    validatableFields: [],
  },
]

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
      flexDirection: 'column',
    },
    navigation: {
      flexShrink: 0,
      marginRight: theme.spacing(1),
      marginTop: theme.spacing(2),
      maxWidth: 600,
      [theme.breakpoints.down('xs')]: {
        '& .MuiStepLabel-labelContainer': {
          display: 'none',
        },
      },
    },
    form: {
      flex: 1,
      display: 'flex',
    },
    formPart: {
      flex: '1  0',
      maxWidth: 980,
      padding: theme.spacing(2, 0),
    },
    formPartActions: {
      display: 'flex',
      justifyContent: 'flex-end',
      '& .MuiButton-root': {
        marginLeft: theme.spacing(2),
      },
    },
    paper: {
      padding: theme.spacing(3, 4),
      marginBottom: theme.spacing(2),
    },
  }),
)

const ExperimentForm = ({
  indexedMetrics,
  indexedSegments,
  initialExperiment,
  onSubmit,
  completionBag,
  formSubmissionError,
}: {
  indexedMetrics: Record<number, Metric>
  indexedSegments: Record<number, Segment>
  initialExperiment: ExperimentFormData
  completionBag: ExperimentFormCompletionBag
  onSubmit: (formData: unknown) => Promise<void>
  formSubmissionError?: Error
}): JSX.Element => {
  const classes = useStyles()

  const rootRef = useRef<HTMLDivElement>(null)

  const [currentStageId, setActiveStageId] = useState<StageId>(StageId.Beginning)
  const currentStageIndex = stages.findIndex((stage) => stage.id === currentStageId)

  const [completeStages, setCompleteStages] = useState<StageId[]>([])
  const [errorStages, setErrorStages] = useState<StageId[]>([])

  useEffect(() => {
    rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'start' })
  }, [currentStageId])

  // Preventing accidental non-react-router navigate-aways:
  const preventSubmissionRef = useRef<boolean>(false)
  useEffect(() => {
    // istanbul ignore next; trivial
    // Sure we can test that these lines run but what is really important is how they
    // behave in browsers, which IMO is too complicated to write tests for in this case.
    const eventListener = (event: BeforeUnloadEvent) => {
      if (preventSubmissionRef.current) {
        event.preventDefault()
        // Chrome requires returnValue to be set
        event.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', eventListener)
    return () => {
      window.removeEventListener('beforeunload', eventListener)
    }
  }, [])

  return (
    <Formik
      initialValues={{ experiment: initialExperiment }}
      onSubmit={onSubmit}
      validationSchema={yup.object({ experiment: experimentFullNewSchema })}
    >
      {(formikProps) => {
        const getStageErrors = async (stage: Stage) => {
          return _.pick(await formikProps.validateForm(), stage.validatableFields)
        }

        const isStageValid = async (stage: Stage): Promise<boolean> => {
          const errors = await formikProps.validateForm()
          return !stage.validatableFields.some((field) => _.get(errors, field))
        }

        const updateStageState = async (stage: Stage) => {
          if (stage.id === StageId.Submit) {
            return
          }

          if (await isStageValid(stage)) {
            setErrorStages((prevValue) => _.difference(prevValue, [stage.id]))
            setCompleteStages((prevValue) => _.union(prevValue, [stage.id]))
          } else {
            setErrorStages((prevValue) => _.union(prevValue, [stage.id]))
            setCompleteStages((prevValue) => _.difference(prevValue, [stage.id]))
          }
        }

        const changeStage = (stageId: StageId) => {
          setActiveStageId(stageId)
          void updateStageState(stages[currentStageIndex])

          if (errorStages.includes(stageId)) {
            void getStageErrors(stages[stageId]).then((stageErrors) =>
              formikProps.setTouched(setNestedObjectValues(stageErrors, true)),
            )
          }
          if (stageId === StageId.Submit) {
            stages.map(updateStageState)
          }
        }

        const prevStage = () => {
          const prevStage = stages[currentStageIndex - 1]
          prevStage && changeStage(prevStage.id)
        }
        const nextStage = () => {
          const nextStage = stages[currentStageIndex + 1]
          nextStage && changeStage(nextStage.id)
        }

        preventSubmissionRef.current = formikProps.dirty && !formikProps.isSubmitting

        return (
          <div className={classes.root}>
            {/* This is required for React Router navigate-away prevention */}
            <Prompt
              when={preventSubmissionRef.current}
              message='You have unsaved data, are you sure you want to leave?'
            />
            <Paper className={classes.navigation}>
              <Stepper nonLinear activeStep={currentStageId} orientation='horizontal'>
                {stages.map((stage) => (
                  <Step key={stage.id} completed={stage.id !== currentStageId && completeStages.includes(stage.id)}>
                    <StepButton onClick={() => changeStage(stage.id)}>
                      <StepLabel error={stage.id !== currentStageId && errorStages.includes(stage.id)}>
                        {stage.title}
                      </StepLabel>
                    </StepButton>
                  </Step>
                ))}
              </Stepper>
            </Paper>
            <div ref={rootRef}>
              {/* Explanation: This should be fine as we aren't hiding behaviour that can't be accessed otherwise. */}
              {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
              <form className={classes.form} onSubmit={formikProps.handleSubmit} noValidate>
                {/* Prevent implicit submission of the form on enter. */}
                {/* See https://stackoverflow.com/a/51507806 */}
                <button type='submit' disabled style={{ display: 'none' }} aria-hidden='true'></button>
                {currentStageId === StageId.Beginning && (
                  <div className={classes.formPart}>
                    <Paper className={classes.paper}>
                      <Beginning />
                    </Paper>
                    <div className={classes.formPartActions}>
                      <Button onClick={nextStage} variant='contained' color='primary'>
                        Begin
                      </Button>
                    </div>
                  </div>
                )}
                {currentStageId === StageId.BasicInfo && (
                  <div className={classes.formPart}>
                    <Paper className={classes.paper}>
                      <BasicInfo completionBag={completionBag} />
                    </Paper>
                    <div className={classes.formPartActions}>
                      <Button onClick={prevStage}>Previous</Button>
                      <Button onClick={nextStage} variant='contained' color='primary'>
                        Next
                      </Button>
                    </div>
                  </div>
                )}
                {currentStageId === StageId.Audience && (
                  <div className={classes.formPart}>
                    <Paper className={classes.paper}>
                      <Audience {...{ formikProps, indexedSegments, completionBag }} />
                    </Paper>
                    <div className={classes.formPartActions}>
                      <Button onClick={prevStage}>Previous</Button>
                      <Button onClick={nextStage} variant='contained' color='primary'>
                        Next
                      </Button>
                    </div>
                  </div>
                )}
                {currentStageId === StageId.Metrics && (
                  <div className={classes.formPart}>
                    <Paper className={classes.paper}>
                      <Metrics {...{ indexedMetrics, completionBag, formikProps }} />
                    </Paper>
                    <div className={classes.formPartActions}>
                      <Button onClick={prevStage}>Previous</Button>
                      <Button onClick={nextStage} variant='contained' color='primary'>
                        Next
                      </Button>
                    </div>
                  </div>
                )}
                {currentStageId === StageId.Submit && (
                  <div className={classes.formPart}>
                    <Paper className={classes.paper}>
                      <Typography variant='h4' gutterBottom>
                        Confirm and Submit Your Experiment
                      </Typography>
                      <Typography variant='body2' gutterBottom>
                        Now is a good time to review the{' '}
                        <Link
                          underline='always'
                          href='https://fieldguide.automattic.com/the-experimentation-platform/experiment-checklist/'
                          target='_blank'
                        >
                          experiment checklist
                        </Link>{' '}
                        in the FG and confirm everything is in place.
                      </Typography>

                      <Typography variant='body2' gutterBottom>
                        Once you submit your experiment, it will be in staging and can be edited up until the start date
                        or manually launched.
                      </Typography>
                      <Typography variant='body2' gutterBottom>
                        <strong> When you are ready, click the Submit button below.</strong>
                      </Typography>
                    </Paper>
                    <GeneralErrorAlert error={formSubmissionError} />
                    <div className={classes.formPartActions}>
                      <Button onClick={prevStage}>Previous</Button>
                      <LoadingButtonContainer isLoading={formikProps.isSubmitting}>
                        <Button
                          type='submit'
                          variant='contained'
                          color='secondary'
                          disabled={formikProps.isSubmitting || errorStages.length > 0}
                        >
                          Submit
                        </Button>
                      </LoadingButtonContainer>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        )
      }}
    </Formik>
  )
}

export default ExperimentForm
