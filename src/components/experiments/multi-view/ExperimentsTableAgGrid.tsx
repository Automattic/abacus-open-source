// istanbul ignore file; demo
import 'ag-grid-community/dist/styles/ag-grid.css'
import 'ag-grid-community/dist/styles/ag-theme-alpine.css'

import { Button, createStyles, fade, InputBase, Link, makeStyles, Theme, Typography, useTheme } from '@material-ui/core'
import { Search as SearchIcon } from '@material-ui/icons'
import {
  DateFilterModel,
  FilterChangedEvent,
  FirstDataRenderedEvent,
  GridApi,
  GridReadyEvent,
  GridSizeChangedEvent,
  NumberFilterModel,
  SortChangedEvent,
  SortModelItem,
  TextFilterModel,
} from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import clsx from 'clsx'
import _ from 'lodash'
import { useSnackbar } from 'notistack'
import React, { useRef, useState } from 'react'
import { Link as RouterLink, useHistory, useLocation } from 'react-router-dom'

import DatetimeText from 'src/components/general/DatetimeText'
import MetricValue from 'src/components/general/MetricValue'
import { Analysis, ExperimentSummary, MetricParameterType, Status } from 'src/lib/schemas'
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
  }),
)

const defaultSortState = [
  {
    colId: 'status',
    sort: 'asc',
  },
  {
    colId: 'startDatetime',
    sort: 'desc',
  },
]

/**
 * Renders a table of "bare" experiment information.
 */
const ExperimentsTable = ({ experiments }: { experiments: ExperimentSummary[] }): JSX.Element => {
  const theme = useTheme()
  const classes = useStyles()
  const { enqueueSnackbar } = useSnackbar()

  const history = useHistory()
  const { pathname, search } = useLocation()
  const queryParams = new URLSearchParams(search)
  const {
    search: searchFromUrl = '',
    sort: sortFromUrl,
    ...filtersFromUrl
  } = Object.fromEntries(new URLSearchParams(search).entries())

  // The gridApiRef is needed to imperatively handle search and reset that are external from the grid
  const gridApiRef = useRef<GridApi | null>(null)
  const onGridReady = (event: GridReadyEvent) => {
    const { api } = event
    gridApiRef.current = api
  }

  const [searchState, setSearchState] = useState<string>(searchFromUrl)
  const onSearchChange = (searchQuery: string) => {
    setSearchState(searchQuery)
    searchQuery ? queryParams.set('search', searchQuery) : queryParams.delete('search')
    history.replace(`${pathname}?${queryParams.toString()}`)

    // istanbul ignore next; trivial and shouldn't occur
    if (!gridApiRef.current) {
      return
    }
    gridApiRef.current.setQuickFilter(searchQuery)
  }

  const onFilterChange = (event: FilterChangedEvent) => {
    const filterState = event.api.getFilterModel()
    Object.keys(filtersFromUrl).forEach(
      (filter) => !Object.keys(filterState).includes(filter) && queryParams.delete(filter),
    )
    Object.keys(filterState).forEach((key) => key && queryParams.set(key, JSON.stringify(filterState[key])))
    history.replace(`${pathname}?${queryParams.toString()}`)
  }

  const onSortChange = (event: SortChangedEvent) => {
    const sortState = event.api.getSortModel()
    if (!sortState.length || _.isEqual(sortState, defaultSortState)) {
      queryParams.delete('sort')
    } else {
      queryParams.set('sort', JSON.stringify(sortState))
    }
    history.replace(`${pathname}?${queryParams.toString()}`)
  }

  const onGridResize = (event: GridSizeChangedEvent) => {
    event.api.sizeColumnsToFit()
  }

  const parseQueryParam = (key: string, value: string) => {
    try {
      return JSON.parse(value) as unknown
    } catch {
      enqueueSnackbar(`query param '${key}=${value}' is not valid`, {
        variant: 'warning',
      })
    }
  }

  const onFirstDataRender = (event: FirstDataRenderedEvent) => {
    const { api, columnApi } = event
    columnApi.autoSizeAllColumns()
    columnApi.resetColumnState()

    api.setQuickFilter(searchFromUrl)

    const filterStateFromUrl = Object.keys(filtersFromUrl).reduce(
      (filters, key) => ({
        ...filters,
        [key]: parseQueryParam(key, filtersFromUrl[key]) as TextFilterModel | DateFilterModel | NumberFilterModel,
      }),
      {},
    )
    api.setFilterModel(filterStateFromUrl)

    const sortStateFromUrl = sortFromUrl?.length && (parseQueryParam('sort', sortFromUrl) as SortModelItem[])
    api.setSortModel(sortStateFromUrl || defaultSortState)

    api.sizeColumnsToFit()
  }

  const onReset = () => {
    onSearchChange('')

    // istanbul ignore next; trivial and shouldn't occur
    if (!gridApiRef.current) {
      return
    }
    gridApiRef.current.setFilterModel({})
    gridApiRef.current.setSortModel(defaultSortState)
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
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => onSearchChange(event.target.value)}
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
              cellRendererFramework: ({ value: name, data }: { value: Status; data: ExperimentSummary }) => (
                <Link component={RouterLink} to={`/experiments/${createIdSlug(data.experimentId, data.name)}`}>
                  {name}
                </Link>
              ),
              sortable: true,
              filter: true,
              resizable: true,
              width: 520,
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
            {
              field: 'description',
              hide: true,
            },
            {
              headerName: 'Participants',
              field: 'participants',
              valueGetter: (params: { data: { analyses: Analysis[] } }) =>
                params.data.analyses[0]?.participantStats.total || 0,
              cellRendererFramework: ({ value: participants }: { value: number }) => {
                return <MetricValue value={participants} metricParameterType={MetricParameterType.Count} />
              },
              sortable: true,
              filter: 'agNumberColumnFilter',
              resizable: true,
              type: 'rightAligned',
            },
          ]}
          rowData={experiments}
          containerStyle={{ flex: 1, height: 'auto' }}
          onGridReady={onGridReady}
          onGridSizeChanged={onGridResize}
          onFirstDataRendered={onFirstDataRender}
          onFilterChanged={onFilterChange}
          onSortChanged={onSortChange}
        />
      </div>
    </div>
  )
}

export default ExperimentsTable
