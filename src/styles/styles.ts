import { createStyles, makeStyles, Theme } from '@material-ui/core'

export const useDangerStyles = makeStyles((theme: Theme) =>
  createStyles({
    dangerButtonOutlined: {
      borderColor: theme.palette.error.dark,
      color: theme.palette.error.dark,
    },
    dangerButtonContained: {
      background: theme.palette.error.dark,
      color: theme.palette.error.contrastText,
      '&:hover': {
        background: theme.palette.error.light,
      },
    },
    dangerBackdrop: {
      backgroundColor: 'rgb(195 61 61 / 62%)',
    },
  }),
)

export const useDecorationStyles = makeStyles((theme: Theme) =>
  createStyles({
    tooltipped: {
      borderBottomWidth: 1,
      borderBottomStyle: 'dashed',
      borderBottomColor: theme.palette.grey[500],
    },
  }),
)
