import { Button, InputBase } from '@material-ui/core'
import { createStyles, fade, makeStyles, Theme } from '@material-ui/core/styles'
import { Search as SearchIcon } from '@material-ui/icons'
import clsx from 'clsx'
import React from 'react'

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
    },
    rootFullWidth: {
      display: 'flex',
      flex: 1,
    },
    search: {
      display: 'flex',
      flex: 1,
      position: 'relative',
      borderRadius: theme.shape.borderRadius,
      backgroundColor: fade(theme.palette.common.white, 0.9),
      marginRight: theme.spacing(2),
      marginLeft: 0,
      width: '100%',
    },
    searchBorder: {
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor: theme.palette.divider,
    },
    searchIcon: {
      padding: theme.spacing(0, 2),
      height: '100%',
      position: 'absolute',
      pointerEvents: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    inputRootFullWidth: {
      color: 'inherit',
      display: 'flex',
      flex: 1,
    },
    inputInputFullWidth: {
      display: 'flex',
      flex: 1,
      padding: theme.spacing(1, 1, 1, 0),
      // vertical padding + font size from searchIcon
      paddingLeft: `calc(1em + ${theme.spacing(4)}px)`,
      transition: theme.transitions.create('width'),
      width: '100%',
    },
    inputRoot: {
      color: 'inherit',
    },
    inputInput: {
      padding: theme.spacing(1, 1, 1, 0),
      // vertical padding + font size from searchIcon
      paddingLeft: `calc(1em + ${theme.spacing(4)}px)`,
      transition: theme.transitions.create('width'),
      width: '100%',
      [theme.breakpoints.up('md')]: {
        width: '20ch',
      },
    },
  }),
)

const GridControls = ({
  searchValue,
  onSearchChange,
  onReset,
  fullWidth,
  className,
}: {
  searchValue: string
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onReset: () => void
  fullWidth: boolean
  className?: string
}): JSX.Element => {
  const classes = useStyles()

  return (
    <div className={clsx(fullWidth ? classes.rootFullWidth : classes.root, className)}>
      <div className={clsx(classes.search, fullWidth && classes.searchBorder)}>
        <div className={classes.searchIcon}>
          <SearchIcon />
        </div>
        <InputBase
          placeholder='Search…'
          classes={{
            root: fullWidth ? classes.inputRootFullWidth : classes.inputRoot,
            input: fullWidth ? classes.inputInputFullWidth : classes.inputInput,
          }}
          inputProps={{ 'aria-label': 'Search' }}
          value={searchValue}
          onChange={onSearchChange}
        />
      </div>
      <Button onClick={onReset}> Reset </Button>
    </div>
  )
}

export default GridControls
