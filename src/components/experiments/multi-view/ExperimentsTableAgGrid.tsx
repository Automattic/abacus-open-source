// istanbul ignore file; demo
import 'ag-grid-community/dist/styles/ag-grid.css'
import 'ag-grid-community/dist/styles/ag-theme-alpine.css'

import { Button, createStyles, fade, InputBase, Link, makeStyles, Theme, Typography, useTheme } from '@material-ui/core'
import { Search as SearchIcon } from '@material-ui/icons'
import { ColumnApi, GridApi, GridReadyEvent } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import clsx from 'clsx'
import _ from 'lodash'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Link as RouterLink, useHistory, useLocation } from 'react-router-dom'

import DatetimeText from 'src/components/general/DatetimeText'
import { ExperimentBare, Status } from 'src/lib/schemas'
import { createIdSlug } from 'src/utils/general'

import ExperimentStatus from '../ExperimentStatus'
import { getParamsObjFromSearchString, getParamsStringFromObj, UrlParams } from './ExperimentsTableAgGrid.utils'

const statusOrder = {
  [Status.Completed]: 0,
  [Status.Running]: 1,
  [Status.Staging]: 2,
  [Status.Disabled]: 3,
}
const statusComparator = (statusA: Status, statusB: Status) => {
  return statusOrder[statusA] - statusOrder[statusB]
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      '& .ag-header-cell-label .ag-header-icon.ag-sort-order': {
        display: 'none',
      },
    },
    toolbar: {
      margin: theme.spacing(3, 0, 2),
      display: 'flex',
      justifyContent: 'space-between',
    },
    controls: {
      display: 'flex',
    },
    gridContainer: {
      display: 'flex',
      flex: 1,
    },
    search: {
      position: 'relative',
      borderRadius: theme.shape.borderRadius,
      backgroundColor: fade(theme.palette.common.white, 0.9),
      marginRight: theme.spacing(2),
      marginLeft: 0,
      width: '100%',
      [theme.breakpoints.up('sm')]: {
        marginLeft: theme.spacing(3),
        width: 'auto',
      },
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

/**
 * Renders a table of "bare" experiment information.
 */
const ExperimentsTable = ({ experiments }: { experiments: ExperimentBare[] }): JSX.Element => {
  const theme = useTheme()
  const classes = useStyles()
  const history = useHistory()
  const location = useLocation()

  const [urlSearchParams, setUrlSearchParams] = useState<UrlParams>(getParamsObjFromSearchString(location.search))
  const gridApiRef = useRef<GridApi | null>(null)
  const gridColumnApiRef = useRef<ColumnApi | null>(null)

  const updateParamsIfNotEqual = useCallback(
    (newParams: UrlParams) => {
      if (_.isEqual(newParams, urlSearchParams)) {
        return
      }

      setUrlSearchParams(newParams)
    },
    [urlSearchParams],
  )

  const setSearch = useCallback((params: UrlParams) => {
    // istanbul ignore next; trivial and shouldn't occur
    if (!gridApiRef.current || !gridColumnApiRef.current) {
      return
    }

    gridApiRef.current.setQuickFilter(params.search || '')
  }, [])

  const updateHistory = useCallback(
    (params: UrlParams) => {
      if (_.isEqual(params, getParamsObjFromSearchString(location.search))) {
        return
      }

      if (_.isEmpty(params)) {
        history.push({
          pathname: '/experiments',
        })
      } else {
        history.push({
          pathname: '/experiments',
          search: `?${getParamsStringFromObj(params)}`,
        })
      }
    },
    [history, location],
  )

  const setDefaultSortAndFilter = () => {
    // istanbul ignore next; trivial and shouldn't occur
    if (!gridApiRef.current || !gridColumnApiRef.current) {
      return
    }

    gridApiRef.current.setFilterModel(null)
    gridColumnApiRef.current.applyColumnState({
      state: [
        {
          colId: 'status',
          sort: 'asc',
          sortIndex: 0,
        },
        {
          colId: 'startDatetime',
          sort: 'desc',
          sortIndex: 1,
        },
      ],
      defaultState: { sort: null },
    })
  }

  const onReset = useCallback(() => {
    setDefaultSortAndFilter()
    updateHistory({})
  }, [updateHistory])

  const onGridReady = (event: GridReadyEvent) => {
    gridApiRef.current = event.api
    gridColumnApiRef.current = gridColumnApiRef.current = event.columnApi

    event.api.sizeColumnsToFit()
  }

  const onGridResize = () => {
    if (!gridApiRef.current) {
      return
    }

    gridApiRef.current.sizeColumnsToFit()
  }

  const onSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (urlSearchParams.search === event.target.value) {
      return
    }

    let newParams = {}
    if (event.target.value === '') {
      newParams = {}
    } else {
      newParams = {
        search: event.target.value,
      }
    }
    updateHistory(newParams)
  }

  const onFirstDataRendered = () => {
    // istanbul ignore next; trivial and shouldn't occur
    if (!gridApiRef.current || !gridColumnApiRef.current) {
      return
    }

    if (Object.keys(urlSearchParams).length === 0) {
      setSearch({})
    } else {
      setSearch(getParamsObjFromSearchString(location.search))
    }
    setDefaultSortAndFilter()
    gridColumnApiRef.current.autoSizeAllColumns()
  }

  useEffect(() => {
    // istanbul ignore next; trivial and shouldn't occur
    if (!gridApiRef.current) {
      return
    }

    setSearch(urlSearchParams)
  }, [urlSearchParams, setSearch])

  useEffect(() => {
    if (location.search === '') {
      updateParamsIfNotEqual({})
    } else {
      const newParams = getParamsObjFromSearchString(location.search)
      updateParamsIfNotEqual(newParams)
    }
  }, [location, updateParamsIfNotEqual])

  return (
    <div className={clsx('ag-theme-alpine', classes.root)}>
      <div className={classes.toolbar}>
        <Typography variant='h2'>Experiments</Typography>
        <div className={classes.controls}>
          <div className={classes.search}>
            <div className={classes.searchIcon}>
              <SearchIcon />
            </div>
            <InputBase
              placeholder='Search…'
              classes={{
                root: classes.inputRoot,
                input: classes.inputInput,
              }}
              inputProps={{ 'aria-label': 'Search' }}
              value={urlSearchParams.search || ''}
              onChange={onSearchChange}
            />
          </div>
          <Button onClick={onReset}> Reset </Button>
        </div>
      </div>
      <div className={clsx('ag-theme-alpine', classes.gridContainer)}>
        <AgGridReact
          columnDefs={[
            {
              headerName: 'Name',
              field: 'name',
              cellStyle: {
                fontFamily: theme.custom.fonts.monospace,
                fontWeight: 600,
              },
              cellRendererFramework: ({ value: name, data }: { value: Status; data: ExperimentBare }) => (
                <Link component={RouterLink} to={`/experiments/${createIdSlug(data.experimentId, data.name)}`}>
                  {name}
                </Link>
              ),
              sortable: true,
              filter: true,
              resizable: true,
              flex: 0,
            },
            {
              headerName: 'Status',
              field: 'status',
              cellRendererFramework: ({ value: status }: { value: Status }) => <ExperimentStatus status={status} />,
              comparator: statusComparator,
              sortable: true,
              filter: true,
              resizable: true,
            },
            {
              headerName: 'Platform',
              field: 'platform',
              cellStyle: {
                fontFamily: theme.custom.fonts.monospace,
              },
              sortable: true,
              filter: true,
              resizable: true,
            },
            {
              headerName: 'Owner',
              field: 'ownerLogin',
              cellStyle: {
                fontFamily: theme.custom.fonts.monospace,
              },
              sortable: true,
              filter: true,
              resizable: true,
            },
            {
              headerName: 'Start',
              field: 'startDatetime',
              cellRendererFramework: ({ value: startDatetime }: { value: Date }) => {
                return <DatetimeText datetime={startDatetime} excludeTime />
              },
              sortable: true,
              filter: 'agDateColumnFilter',
              resizable: true,
            },
            {
              headerName: 'End',
              field: 'endDatetime',
              cellRendererFramework: ({ value: endDatetime }: { value: Date }) => {
                return <DatetimeText datetime={endDatetime} excludeTime />
              },
              sortable: true,
              filter: 'agDateColumnFilter',
              resizable: true,
            },
          ]}
          rowData={experiments}
          containerStyle={{ flex: 1, height: 'auto' }}
          onFirstDataRendered={onFirstDataRendered}
          onGridReady={onGridReady}
          onGridSizeChanged={onGridResize}
        />
      </div>
    </div>
  )
}

export default ExperimentsTable
