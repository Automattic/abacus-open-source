import {
  CellClickedEvent,
  ColumnApi,
  FirstDataRenderedEvent,
  GetRowNodeIdFunc,
  GridApi,
  GridReadyEvent,
  RowNode,
} from 'ag-grid-community'
import { AgGridColumnProps, AgGridReact, AgGridReactProps } from 'ag-grid-react'
import React, { forwardRef, ForwardRefRenderFunction, useImperativeHandle, useRef, useState } from 'react'

import {
  DETAIL_TOGGLE_BUTTON_COLUMN_NAME,
  DetailButtonRenderer,
  detailIdFromDataId,
  getRowDataWithDetails,
  getRowHeight,
  isFullWidth,
  onCellClicked,
} from './AgGridWithDetails.utils'

interface AgGridWithDetailsProps {
  rowData: Record<string, unknown>[]
  defaultColDef?: AgGridColumnProps
  columnDefs: AgGridColumnProps[]
  onFirstDataRendered?: (event?: FirstDataRenderedEvent) => void
  gridOptions?: AgGridReactProps
  defaultSortColumnId?: string
  actionColumnIdSuffix?: string
  detailRowRenderer: ({ data }: { data: Record<string, unknown> }) => JSX.Element
  getRowNodeId: GetRowNodeIdFunc
}

type AgGridWithDetailsHandle = {
  getGridApi: () => GridApi | null
  getGridColumnApi: () => ColumnApi | null
}

/**
 * Renders an AgGrid that can display a master/detail component for each row.
 * Forwarding a ref here so that outside components can access the Grid APIs
 */
const AgGridWithDetails: ForwardRefRenderFunction<AgGridWithDetailsHandle, AgGridWithDetailsProps> = (props, ref) => {
  const {
    rowData,
    defaultColDef,
    columnDefs,
    onFirstDataRendered,
    gridOptions,
    actionColumnIdSuffix,
    detailRowRenderer,
    getRowNodeId,
  } = props

  const gridApiRef = useRef<GridApi | null>(null)
  const gridColumnApiRef = useRef<ColumnApi | null>(null)
  const maxRowHeightMap = useRef<Record<string, number>>({})
  const [detailRowToggleMap, setDetailRowToggleMap] = useState<Record<string, boolean>>({})

  // Helper function to forward deps to helper util functions
  const getDependencies = () => {
    return {
      gridApiRef: gridApiRef.current,
      maxRowHeightMap: maxRowHeightMap.current,
      detailRowToggleMap: detailRowToggleMap,
      setDetailRowToggleMap: setDetailRowToggleMap,
      rowData: rowData,
      getRowNodeId: getRowNodeId,
      actionColumnIdSuffix: actionColumnIdSuffix,
    }
  }

  // istanbul ignore next; jest can't quite figure out that these 2 lines are covered
  const getGridApi = () => gridApiRef.current
  // istanbul ignore next
  const getGridColumnApi = () => gridColumnApiRef.current

  useImperativeHandle(ref, () => ({
    getGridApi: getGridApi,
    getGridColumnApi: getGridColumnApi,
  }))

  const onGridReady = (event: GridReadyEvent) => {
    gridApiRef.current = event.api
    gridColumnApiRef.current = event.columnApi
  }

  // istanbul ignore next; difficult to test through unit testing, better to test visually
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
      display: 'flex',
      alignItems: 'center',
      color: 'rgba(0, 0, 0, 0.5)',
      paddingLeft: 0,
      paddingRight: 0,
    },
    cellRenderer: 'detailButtonRenderer',
    width: 54,
    minWidth: 54,
  }

  const gridProps = {
    ...(defaultColDef
      ? {
          defaultColDef: defaultColDef,
        }
      : {}),
    ...gridOptions,
  }

  const rowDataWithDetails = getRowDataWithDetails(rowData, detailRowToggleMap, getRowNodeId)

  return (
    <AgGridReact
      containerStyle={{ flex: 1, height: 'auto' }}
      frameworkComponents={{ detailButtonRenderer: DetailButtonRenderer }}
      rowData={rowDataWithDetails}
      columnDefs={[detailButtonColumnDef, ...columnDefs]}
      fullWidthCellRendererFramework={detailRowRenderer}
      getRowNodeId={(data: Record<string, unknown>) => {
        return isFullWidth(data) ? detailIdFromDataId(getRowNodeId(data)) : getRowNodeId(data)
      }}
      getRowHeight={(params: { node: { data: Record<string, unknown> } }) => {
        return getRowHeight(params.node.data, getDependencies())
      }}
      isFullWidthCell={(rowNode: RowNode) => isFullWidth(rowNode.data)}
      onCellClicked={(event: CellClickedEvent) => {
        onCellClicked(event, getDependencies())
      }}
      onFirstDataRendered={onFirstDataRendered}
      onGridReady={onGridReady}
      onGridSizeChanged={onGridSizeChanged}
      immutableData={true}
      {...gridProps}
    />
  )
}

export default forwardRef(AgGridWithDetails)
