import 'ag-grid-community/dist/styles/ag-grid.css'
import 'ag-grid-community/dist/styles/ag-theme-alpine.css'

import { Button, createStyles, fade, InputBase, makeStyles, Theme, Typography } from '@material-ui/core'
import { Search as SearchIcon } from '@material-ui/icons'
import { CellClickedEvent, ColumnApi, GetRowNodeIdFunc, GridApi, GridReadyEvent, RowNode } from 'ag-grid-community'
import { AgGridColumnProps, AgGridReact, AgGridReactProps } from 'ag-grid-react'
import clsx from 'clsx'
import React, { useEffect, useRef, useState } from 'react'

import {
  DETAIL_TOGGLE_BUTTON_COLUMN_NAME,
  detailIdFromDataId,
  DetailToggleButtonRenderer,
  getRowHeight,
  isFullWidth,
  onCellClicked,
} from './AgGridWithDetails.utils'

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      '& .ag-header-cell-label .ag-header-icon.ag-sort-order': {
        display: 'none',
      },
      '& .ag-cell': {
        display: 'flex',
        lineHeight: '25px',
        paddingTop: '15px',
        paddingBottom: '15px',
        alignItems: 'center',
      },
      '& .ag-cell-wrap-text': {
        wordBreak: 'normal',
      },
      '& .ag-react-container': {
        overflow: 'hidden',
      },
    },
    title: {
      color: theme.palette.grey.A700,
    },
    toolbar: {
      margin: theme.spacing(3, 0, 2),
      display: 'flex',
      justifyContent: 'space-between',
    },
    controls: {
      display: 'flex',
      flex: 1,
    },
    controlsWithTitle: {
      display: 'flex',
    },
    gridContainer: {
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
      display: 'flex',
      flex: 1,
    },
    inputInput: {
      display: 'flex',
      flex: 1,
      padding: theme.spacing(1, 1, 1, 0),
      // vertical padding + font size from searchIcon
      paddingLeft: `calc(1em + ${theme.spacing(4)}px)`,
      transition: theme.transitions.create('width'),
      width: '100%',
    },
    inputRootWithTitle: {
      color: 'inherit',
    },
    inputInputWithTitle: {
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
 * Renders an AgGrid that can display a master/detail component for each row.
 */
const AgGridWithDetails = ({
  title,
  search,
  data,
  defaultColDef,
  columnDefs,
  otherAgGridProps,
  defaultSortColumnId,
  actionColumnIdSuffix,
  detailRowRenderer,
  getRowNodeId,
}: {
  title?: string
  search?: boolean
  data: Record<string, unknown>[]
  defaultColDef?: AgGridColumnProps
  columnDefs: AgGridColumnProps[]
  otherAgGridProps?: AgGridReactProps
  defaultSortColumnId?: string
  actionColumnIdSuffix?: string
  detailRowRenderer: ({ data }: { data: Record<string, unknown> }) => JSX.Element
  getRowNodeId: GetRowNodeIdFunc
}): JSX.Element => {
  const classes = useStyles()

  const gridApiRef = useRef<GridApi | null>(null)
  const gridColumnApiRef = useRef<ColumnApi | null>(null)
  const maxRowHeightMap = useRef<Map<string, number>>(new Map())
  const detailRowToggleMap = useRef<Map<string, boolean>>(new Map())
  const [rowData, setRowData] = useState<Record<string, unknown>[]>(data)
  const [searchState, setSearchState] = useState<string>('')

  // Helper function to forward deps to helper util functions
  const getDependencies = () => {
    return {
      gridApiRef: gridApiRef.current,
      maxRowHeightMap: maxRowHeightMap.current,
      detailRowToggleMap: detailRowToggleMap.current,
      rowData: rowData,
      setRowData: setRowData,
      getRowNodeId: getRowNodeId,
      actionColumnIdSuffix: actionColumnIdSuffix,
    }
  }

  useEffect(() => {
    if (!gridApiRef.current) {
      return
    }

    gridApiRef.current.setRowData(rowData)
  }, [rowData])

  useEffect(() => {
    setRowData(data)
  }, [data])

  useEffect(() => {
    // istanbul ignore next; trivial and shouldn't occur
    if (!gridApiRef.current) {
      return
    }

    gridApiRef.current?.setQuickFilter(searchState)
  }, [searchState])

  const onSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchState(event.target.value)
  }

  const onReset = () => {
    // istanbul ignore next; trivial and shouldn't occur
    if (!gridApiRef.current || !gridColumnApiRef.current) {
      return
    }

    let sortColumn = defaultSortColumnId
    if (columnDefs) {
      sortColumn = sortColumn || columnDefs[0].field
    }

    setSearchState('')
    gridColumnApiRef.current.resetColumnState()
    gridApiRef.current.setFilterModel(null)
    gridColumnApiRef.current.applyColumnState({
      state: [
        {
          colId: sortColumn,
          sort: 'asc',
          sortIndex: 0,
        },
      ],
      defaultState: { sort: null },
    })
    gridApiRef.current.sizeColumnsToFit()
  }

  const onGridReady = (event: GridReadyEvent) => {
    gridApiRef.current = event.api
    gridColumnApiRef.current = event.columnApi
    event.api.setRowData(rowData)
  }

  const onGridSizeChanged = () => {
    if (!gridApiRef.current) {
      return
    }

    gridApiRef.current.sizeColumnsToFit()
  }

  const detailButtonColumnDef = {
    headerName: '',
    field: DETAIL_TOGGLE_BUTTON_COLUMN_NAME,
    sortable: false,
    filter: false,
    resizable: false,
    cellStyle: {
      color: 'rgba(0, 0, 0, 0.5)',
      paddingLeft: 0,
      paddingRight: 0,
    },
    cellRendererFramework: ({ data }: { data: Record<string, unknown> }) => (
      <DetailToggleButtonRenderer
        data={data}
        getRowNodeId={getRowNodeId}
        detailRowToggleMap={detailRowToggleMap.current}
      />
    ),
    width: 54,
    minWidth: 54,
  }

  const gridProps = {
    ...(defaultColDef
      ? {
          defaultColDef: defaultColDef,
        }
      : {}),
    columnDefs: [detailButtonColumnDef, ...columnDefs],
    containerStyle: { flex: 1, height: 'auto' },
    onFirstDataRendered: onReset,
    onGridReady: onGridReady,
    onGridSizeChanged: onGridSizeChanged,
    immutableData: true,
    ...(detailRowRenderer
      ? {
          fullWidthCellRendererFramework: detailRowRenderer,
          getRowNodeId: (data: Record<string, unknown>) => {
            return isFullWidth(data) ? detailIdFromDataId(getRowNodeId(data)) : getRowNodeId(data)
          },
          getRowHeight: (params: { node: { data: Record<string, unknown> } }) => {
            return getRowHeight(params.node.data, getDependencies())
          },
          isFullWidthCell: (rowNode: RowNode) => isFullWidth(rowNode.data),
          onCellClicked: (event: CellClickedEvent) => {
            onCellClicked(event, getDependencies())
          },
        }
      : {}),
    ...otherAgGridProps,
  }

  return (
    <div className={clsx('ag-theme-alpine', classes.root)}>
      <div className={classes.toolbar}>
        {title && (
          <Typography variant='h2' className={classes.title}>
            {title}
          </Typography>
        )}
        {search && (
          <div className={title ? classes.controlsWithTitle : classes.controls}>
            <div className={classes.search}>
              <div className={classes.searchIcon}>
                <SearchIcon />
              </div>
              <InputBase
                placeholder='Search…'
                classes={{
                  root: title ? classes.inputRootWithTitle : classes.inputRoot,
                  input: title ? classes.inputInputWithTitle : classes.inputInput,
                }}
                inputProps={{ 'aria-label': 'Search' }}
                value={searchState}
                onChange={onSearchChange}
              />
            </div>
            <Button onClick={onReset}> Reset </Button>
          </div>
        )}
      </div>

      <div className={clsx('ag-theme-alpine', classes.gridContainer)}>
        <AgGridReact {...gridProps} />
      </div>
    </div>
  )
}

export default AgGridWithDetails
