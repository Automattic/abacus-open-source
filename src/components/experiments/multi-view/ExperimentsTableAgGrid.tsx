import 'ag-grid-community/dist/styles/ag-grid.css'
import 'ag-grid-community/dist/styles/ag-theme-alpine.css'

import { Button, createStyles, fade, InputBase, Link, makeStyles, Theme, Typography, useTheme } from '@material-ui/core'
import { Search as SearchIcon } from '@material-ui/icons'
import {
  ColumnApi,
  ColumnState,
  FilterChangedEvent,
  GridApi,
  GridReadyEvent,
  SortChangedEvent,
} from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import clsx from 'clsx'
import _ from 'lodash'
import React, { useEffect, useRef } from 'react'
import { Link as RouterLink } from 'react-router-dom'

import DatetimeText from 'src/components/general/DatetimeText'
import { ExperimentBare, Status } from 'src/lib/schemas'
import { ColumnFilter, GridActions, GridState } from 'src/utils/ag-grid'
import { createIdSlug } from 'src/utils/general'

import ExperimentStatus from '../ExperimentStatus'

const statusOrder = {
  [Status.Completed]: 0,
  [Status.Running]: 1,
  [Status.Staging]: 2,
  [Status.Disabled]: 3,
}

// istanbul ignore next; jest doesn't recognize this is covered
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
const ExperimentsTable = ({
  experiments,
  gridState,
  actions,
}: {
  experiments: ExperimentBare[]
  gridState: GridState
  actions: GridActions
}): JSX.Element => {
  const theme = useTheme()
  const classes = useStyles()

  const gridApiRef = useRef<GridApi | null>(null)
  const gridColumnApiRef = useRef<ColumnApi | null>(null)

  const onGridReady = (event: GridReadyEvent) => {
    gridApiRef.current = event.api
    gridColumnApiRef.current = gridColumnApiRef.current = event.columnApi

    event.api.sizeColumnsToFit()
  }

  // istanbul ignore next; difficult to test through unit testing, better to test visually
  const onGridResize = () => {
    if (!gridApiRef.current) {
      return
    }

    gridApiRef.current.sizeColumnsToFit()
  }

  const onReset = () => {
    // istanbul ignore next; trivial and shouldn't occur
    if (!gridApiRef.current || !gridColumnApiRef.current) {
      return
    }

    actions.resetGridState()
    gridApiRef.current.sizeColumnsToFit()
  }

  const onFirstDataRendered = () => {
    // istanbul ignore next; trivial and shouldn't occur
    if (!gridApiRef.current || !gridColumnApiRef.current) {
      return
    }

    // TODO: only update grid states if they're different from prev values?
    gridApiRef.current.setQuickFilter(gridState.searchText)
    gridColumnApiRef.current.applyColumnState({
      state: gridState.columnState,
      defaultState: { sort: null },
    })
    gridApiRef.current.setFilterModel(gridState.filterModel)
  }

  useEffect(() => {
    if (!gridApiRef.current || !gridColumnApiRef.current) {
      return
    }

    // TODO: only update grid states if they're different from prev values?
    gridApiRef.current.setQuickFilter(gridState.searchText)
    gridColumnApiRef.current.applyColumnState({
      state: gridState.columnState,
      defaultState: { sort: null },
    })
    gridApiRef.current.setFilterModel(gridState.filterModel)
  }, [gridState])

  const onSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = event.target.value
    // istanbul ignore else; trivial
    if (gridState.searchText !== searchValue) {
      actions.updateGridSearchText(searchValue)
    }
  }

  const onSortChanged = (event: SortChangedEvent) => {
    const columnsWithSortState = event.columnApi.getColumnState().filter((value: ColumnState) => value.sort !== null)
    // istanbul ignore else; trivial
    if (!_.isEqual(gridState.columnState, columnsWithSortState)) {
      actions.updateGridSortState(columnsWithSortState)
    }
  }

  const onFilterChanged = (event: FilterChangedEvent) => {
    const filterModel = event.api.getFilterModel() as ColumnFilter
    // istanbul ignore else; trivial
    if (!_.isEqual(gridState.filterModel, filterModel)) {
      actions.updateGridFilterModel(filterModel)
    }
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
              value={gridState.searchText}
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
              flex: 1,
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
              flex: 1,
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
              flex: 1,
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
              flex: 1,
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
              flex: 1,
            },
          ]}
          rowData={experiments}
          containerStyle={{ flex: 1, height: 'auto' }}
          onFirstDataRendered={onFirstDataRendered}
          onGridReady={onGridReady}
          onGridSizeChanged={onGridResize}
          onSortChanged={onSortChanged}
          onFilterChanged={onFilterChanged}
        />
      </div>
    </div>
  )
}

export default ExperimentsTable
