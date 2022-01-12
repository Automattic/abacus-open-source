import { Typography } from '@material-ui/core'
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles'
import clsx from 'clsx'
import React from 'react'

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      color: theme.palette.grey.A700,
    },
  }),
)

const GridTitle = ({ title, className }: { title: string; className?: string }): JSX.Element => {
  const classes = useStyles()

  return (
    <Typography variant='h2' className={clsx(classes.root, className)}>
      {title}
    </Typography>
  )
}

export default GridTitle
