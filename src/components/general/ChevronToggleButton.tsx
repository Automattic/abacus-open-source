import { IconButton, makeStyles } from '@material-ui/core'
import { ChevronRightRounded as ChevronRightRoundedIcon } from '@material-ui/icons'
import clsx from 'clsx'
import React from 'react'

const useStyles = makeStyles({
  root: {
    transition: 'all 200ms ease 0s',
  },
  rotated: {
    transform: 'rotate(90deg)',
  },
  notRotated: {
    transform: 'none',
  },
})

const ChevronToggleButton = ({
  isOpen,
  className,
  onClick,
}: {
  isOpen: boolean
  className?: string
  onClick: () => void
}): JSX.Element => {
  const classes = useStyles()
  const toggleClass = isOpen ? classes.rotated : classes.notRotated

  return (
    <IconButton
      size='small'
      className={clsx(classes.root, toggleClass, className)}
      aria-label={'Toggle Button'}
      onClick={onClick}
    >
      <ChevronRightRoundedIcon />
    </IconButton>
  )
}

export default ChevronToggleButton
