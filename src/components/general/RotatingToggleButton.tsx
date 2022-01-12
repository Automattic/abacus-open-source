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

const RotatingToggleButton = ({
  isOpen,
  className,
  icon = <ChevronRightRoundedIcon />,
  onClick,
}: {
  isOpen: boolean
  className?: string
  icon?: JSX.Element
  onClick?: () => void
}): JSX.Element => {
  const classes = useStyles()
  const toggleClass = isOpen ? classes.rotated : classes.notRotated

  const handleClick = () => {
    // istanbul ignore else; trivial
    if (onClick) {
      onClick()
    }
  }

  return (
    <IconButton
      className={clsx(classes.root, toggleClass, className)}
      aria-label={'Toggle Button'}
      onClick={handleClick}
    >
      {icon}
    </IconButton>
  )
}

export default RotatingToggleButton
