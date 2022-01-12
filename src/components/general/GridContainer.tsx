import 'ag-grid-community/dist/styles/ag-grid.css'
import 'ag-grid-community/dist/styles/ag-theme-alpine.css'

import { createStyles, makeStyles, Theme } from '@material-ui/core/styles'
import { GetRowNodeIdFunc } from 'ag-grid-community'
import { AgGridColumnProps, AgGridReactProps } from 'ag-grid-react'
import clsx from 'clsx'
import React, { ElementRef, useEffect, useRef, useState } from 'react'

import AgGridWithDetails from './AgGridWithDetails'
import GridControls from './GridControls'
import GridTitle from './GridTitle'

type AgGridWithDetailsHandle = ElementRef<typeof AgGridWithDetails>

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      '& .ag-header-cell-label .ag-header-icon.ag-sort-order': {
        display: 'none',
      },
      '& .ag-react-container': {
        overflow: 'hidden',
      },
    },
    toolbar: {
      margin: theme.spacing(3, 0, 2),
      display: 'flex',
      justifyContent: 'space-between',
    },
    gridContainer: {
      display: 'flex',
      flex: 1,
    },
  }),
)

const GridContainer = ({
  title,
  search,
  className,
  rowData,
  defaultColDef,
  columnDefs,
  gridOptions,
  defaultSortColumnId,
  actionColumnIdSuffix,
  detailRowRenderer,
  getRowNodeId,
}: {
  title?: string
  search?: boolean
  className?: string
  rowData: Record<string, unknown>[]
  defaultColDef?: AgGridColumnProps
  columnDefs: AgGridColumnProps[]
  gridOptions?: AgGridReactProps
  defaultSortColumnId?: string
  actionColumnIdSuffix?: string
  detailRowRenderer: ({ data }: { data: Record<string, unknown> }) => JSX.Element
  getRowNodeId: GetRowNodeIdFunc
}): JSX.Element => {
  const classes = useStyles()

  const agGridRef = useRef<AgGridWithDetailsHandle>(null)
  const [searchState, setSearchState] = useState<string>('')

  useEffect(() => {
    const gridApi = agGridRef.current?.getGridApi()

    // istanbul ignore next; trivial and shouldn't occur
    if (!gridApi) {
      return
    }

    gridApi.setQuickFilter(searchState)
  }, [searchState])

  const onSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchState(event.target.value)
  }

  const onReset = () => {
    const gridApi = agGridRef.current?.getGridApi()
    const columnApi = agGridRef.current?.getGridColumnApi()

    if (columnDefs.length === 0) {
      return
    }

    // istanbul ignore next; trivial and shouldn't occur
    if (!gridApi || !columnApi) {
      return
    }

    let sortColumn = defaultSortColumnId
    sortColumn = sortColumn || columnDefs[0].field

    setSearchState('')
    columnApi.resetColumnState()
    gridApi.setFilterModel(null)
    columnApi.applyColumnState({
      state: [
        {
          colId: sortColumn,
          sort: 'asc',
          sortIndex: 0,
        },
      ],
      defaultState: { sort: null },
    })
    gridApi.sizeColumnsToFit()
  }

  return (
    <div className={clsx('ag-theme-alpine', classes.root, className)}>
      <div className={classes.toolbar}>
        {title && <GridTitle title={title} />}
        {search && (
          <GridControls
            searchValue={searchState}
            onSearchChange={onSearchChange}
            onReset={onReset}
            fullWidth={title ? false : true}
          />
        )}
      </div>

      <div className={clsx('ag-theme-alpine', classes.gridContainer)}>
        <AgGridWithDetails
          rowData={rowData}
          defaultColDef={defaultColDef}
          columnDefs={columnDefs}
          onFirstDataRendered={onReset}
          gridOptions={gridOptions}
          actionColumnIdSuffix={actionColumnIdSuffix}
          detailRowRenderer={detailRowRenderer}
          getRowNodeId={getRowNodeId}
          ref={agGridRef}
        />
      </div>
    </div>
  )
}

export default GridContainer
