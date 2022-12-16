import {
  Button,
  createStyles,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  makeStyles,
  Tooltip,
  Typography,
} from '@material-ui/core'
import { useSnackbar } from 'notistack'
import React, { useState } from 'react'

import ExperimentsApi from 'src/api/explat/ExperimentsApi'
import { serverErrorMessage } from 'src/api/HttpResponseError'
import PrivateLink from 'src/components/general/PrivateLink'
import { ExperimentFull, Status } from 'src/lib/explat/schemas'
import { useDangerStyles } from 'src/styles/styles'

import LoadingButtonContainer from '../../../general/LoadingButtonContainer'

const useStyles = makeStyles(() =>
  createStyles({
    dangerImage: {
      textAlign: 'center',
    },
  }),
)

const ExperimentRunButton = ({
  experiment,
  experimentReloadRef,
}: {
  experiment: ExperimentFull | null
  experimentReloadRef: React.MutableRefObject<() => void>
}): JSX.Element => {
  const classes = useStyles()
  const dangerClasses = useDangerStyles()
  const { enqueueSnackbar } = useSnackbar()

  const canRunExperiment = experiment && experiment.status === Status.Staging
  const [isAskingToConfirmRunExperiment, setIsAskingToConfirmRunExperiment] = useState<boolean>(false)
  const onAskToConfirmRunExperiment = () => setIsAskingToConfirmRunExperiment(true)
  const onCancelRunExperiment = () => setIsAskingToConfirmRunExperiment(false)
  const [isSubmittingRunExperiment, setIsSubmittingRunExperiment] = useState<boolean>(false)
  const onConfirmRunExperiment = async () => {
    try {
      // istanbul ignore next; Shouldn't occur
      if (!experiment) {
        throw Error('Missing experiment, this should not happen')
      }

      setIsSubmittingRunExperiment(true)
      await ExperimentsApi.changeStatus(experiment.experimentId, Status.Running)
      enqueueSnackbar('Experiment Running!', { variant: 'success' })
      experimentReloadRef.current()
      setIsAskingToConfirmRunExperiment(false)
    } catch (e) /* istanbul ignore next; Shouldn't occur */ {
      console.log(e)
      enqueueSnackbar(`Oops! Something went wrong while trying to run your experiment. ${serverErrorMessage(e)}`, {
        variant: 'error',
      })
    } finally {
      setIsSubmittingRunExperiment(false)
    }
  }

  return (
    <>
      <Tooltip title={canRunExperiment ? '' : `This experiment is ${experiment?.status ?? 'undefined status'}.`}>
        <span>
          <Button
            variant='outlined'
            classes={{ outlined: dangerClasses.dangerButtonOutlined }}
            disabled={!canRunExperiment}
            onClick={onAskToConfirmRunExperiment}
          >
            Launch
          </Button>
        </span>
      </Tooltip>
      <Dialog
        open={isAskingToConfirmRunExperiment}
        aria-labelledby='confirm-run-experiment-dialog-title'
        BackdropProps={{ className: dangerClasses.dangerBackdrop }}
      >
        <DialogTitle>
          <Typography variant='h5' component='div'>
            Are you sure you want to <strong>launch</strong> this experiment?
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant='body2' gutterBottom>
            Launching will <strong>release experiment code to our users.</strong> This may take up to ten minutes to
            propagate to all servers due to{' '}
            <PrivateLink
              href='https://wp.me/PCYsg-Fq9#logged-out-homepage-assignments-use-file-system-cache'
              rel='noopener noreferrer'
              target='_blank'
            >
              the file system assignment cache
            </PrivateLink>
            .
          </Typography>
          <Typography variant='body2' gutterBottom>
            Launching also changes the experiment&apos;s status to running, which is <strong>irreversible</strong>.
          </Typography>
          <div className={classes.dangerImage}>
            <img src='/img/danger.gif' alt='DANGER!' />
          </div>
        </DialogContent>
        <DialogActions>
          <Button variant='contained' color='primary' onClick={onCancelRunExperiment}>
            Cancel
          </Button>
          <LoadingButtonContainer isLoading={isSubmittingRunExperiment}>
            <Button
              variant='contained'
              classes={{ contained: dangerClasses.dangerButtonContained }}
              disabled={isSubmittingRunExperiment}
              onClick={onConfirmRunExperiment}
            >
              Launch
            </Button>
          </LoadingButtonContainer>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default ExperimentRunButton
