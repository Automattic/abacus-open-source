import { IconButton, makeStyles } from '@material-ui/core'
import { ChevronRightRounded as ChevronRightRoundedIcon } from '@material-ui/icons'
import clsx from 'clsx'
import React, { useEffect, useState } from 'react'

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

const RowToggleButton = ({
  toggled,
  className,
  icon = <ChevronRightRoundedIcon />,
  onClick,
}: {
  toggled: boolean
  className?: string
  icon?: JSX.Element
  onClick?: () => void
}): JSX.Element => {
  const classes = useStyles()
  const [cls, setCls] = useState<string>(toggled ? classes.rotated : classes.notRotated)
  const [isToggled, setIsToggled] = useState<boolean>(toggled)

  useEffect(() => {
    setCls(isToggled ? classes.rotated : classes.notRotated)
  }, [isToggled, classes.rotated, classes.notRotated])

  useEffect(() => {
    setIsToggled(toggled)
  }, [toggled])

  const handleClick = () => {
    setIsToggled(!isToggled)
    if (onClick) {
      onClick()
    }
  }

  return (
    <IconButton className={clsx(classes.root, cls, className)} aria-label={'Toggle Row'} onClick={handleClick}>
      {icon}
    </IconButton>
  )
}

export default RowToggleButton
