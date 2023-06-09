// istanbul ignore file; demo
import 'ag-grid-community/dist/styles/ag-grid.css'
import 'ag-grid-community/dist/styles/ag-theme-alpine.css'

import { Button, createStyles, fade, InputBase, Link, makeStyles, Theme, Typography, useTheme } from '@material-ui/core'
import { Search as SearchIcon } from '@material-ui/icons'
import { Skeleton } from '@material-ui/lab'
import { ColumnApi, GridApi, GridReadyEvent } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import clsx from 'clsx'
import React, { useEffect, useRef, useState } from 'react'
import { Link as RouterLink, useHistory, useLocation } from 'react-router-dom'

import DatetimeText from 'src/components/general/DatetimeText'
import MetricValue from 'src/components/general/MetricValue'
import { UnitType } from 'src/lib/explat/metrics'
import { Analysis, ExperimentBare, ExperimentSummary, Status } from 'src/lib/explat/schemas'
import { createIdSlug } from 'src/utils/general'

import ExperimentStatus from '../ExperimentStatus'

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
    cellSkeleton: {
      marginRight: theme.spacing(1),
      marginLeft: 'auto',
    },
  }),
)

/**
 * Renders a table of "bare" experiment information.
 */
const ExperimentsTable = ({
  experiments,
  isLoadingAnalyses,
}: {
  experiments: ExperimentSummary[]
  isLoadingAnalyses?: boolean
}): JSX.Element => {
  const theme = useTheme()
  const classes = useStyles()

  const gridApiRef = useRef<GridApi | null>(null)
  const gridColumnApiRef = useRef<ColumnApi | null>(null)

  const onGridReady = (event: GridReadyEvent) => {
    gridApiRef.current = event.api
    gridColumnApiRef.current = gridColumnApiRef.current = event.columnApi

    searchQuery && setSearchState(searchQuery)
  }

  const onGridResize = () => {
    if (!gridApiRef.current) {
      return
    }

    gridApiRef.current.sizeColumnsToFit()
  }

  const history = useHistory()
  const { pathname, search } = useLocation()
  const searchQuery = Object.fromEntries(new URLSearchParams(search).entries())?.search

  const [searchState, setSearchState] = useState<string>('')
  const onSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchState(event.target.value)
    event.target.value ? history.replace(`${pathname}?search=${event.target.value}`) : history.replace(pathname)
  }

  useEffect(() => {
    // istanbul ignore next; trivial and shouldn't occur
    if (!gridApiRef.current) {
      return
    }
    gridApiRef.current?.setQuickFilter(searchState)
  }, [searchState])

  const onNewDataRender = () => {
    // istanbul ignore next; trivial and shouldn't occur
    if (!gridApiRef.current || !gridColumnApiRef.current) {
      return
    }

    gridColumnApiRef.current.resetColumnState()
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

  const onReset = () => {
    setSearchState('')
    history.push(pathname)
    onNewDataRender()
  }

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
              value={searchState}
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
              cellRendererFramework: ({ data }: { data: ExperimentSummary }) => (
                <Link component={RouterLink} to={`/experiments/${createIdSlug(data.experimentId, data.name)}`}>
                  {data.name}
                </Link>
              ),
              sortable: true,
              filter: true,
              resizable: true,
              width: 430,
            },
            {
              headerName: 'Status',
              field: 'status',
              cellRendererFramework: ({ value: status }: { value: Status }) => <ExperimentStatus status={status} />,
              comparator: statusComparator,
              sortable: true,
              filter: true,
              resizable: true,
              width: 125,
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
              width: 125,
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
              width: 150,
            },
            {
              headerName: 'Start',
              field: 'startDatetime',
              cellRendererFramework: ({ value: startDatetime }: { value: ExperimentBare['startDatetime'] }) => {
                return startDatetime && <DatetimeText datetime={startDatetime} excludeTime />
              },
              sortable: true,
              filter: 'agDateColumnFilter',
              resizable: true,
              width: 125,
            },
            {
              headerName: 'End',
              field: 'endDatetime',
              cellRendererFramework: ({ value: endDatetime }: { value: ExperimentBare['endDatetime'] }) => {
                return endDatetime && <DatetimeText datetime={endDatetime} excludeTime />
              },
              sortable: true,
              filter: 'agDateColumnFilter',
              resizable: true,
              width: 125,
            },
            {
              field: 'description',
              hide: true,
            },
            {
              headerName: 'Participants',
              valueGetter: (params: { data: { analyses: Analysis[] } }) =>
                params.data.analyses[0]?.participantStats.total || 0,
              cellRendererFramework: ({ value: participants }: { value: number }) => {
                return isLoadingAnalyses ? (
                  <Skeleton className={classes.cellSkeleton} variant='text' width={50} role='placeholder' />
                ) : (
                  <MetricValue value={participants} unit={{ unitType: UnitType.Count }} displayUnit={false} />
                )
              },
              sortable: true,
              filter: 'agNumberColumnFilter',
              resizable: true,
              type: 'rightAligned',
              width: 150,
            },
          ]}
          rowData={experiments}
          containerStyle={{ flex: 1, height: 'auto' }}
          onFirstDataRendered={onNewDataRender}
          onGridReady={onGridReady}
          onGridSizeChanged={onGridResize}
          overlayNoRowsTemplate='Loading experiments...'
        />
      </div>
    </div>
  )
}

export default ExperimentsTable
