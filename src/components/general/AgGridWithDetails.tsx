import {
  CellClickedEvent,
  ColumnApi,
  ColumnResizedEvent,
  GetRowNodeIdFunc,
  GridApi,
  GridReadyEvent,
  ICellRendererParams,
  RowNode,
} from 'ag-grid-community'
import { AgGridColumnProps, AgGridReact, AgGridReactProps } from 'ag-grid-react'
import React, { forwardRef, ForwardRefRenderFunction, useImperativeHandle, useRef, useState } from 'react'

import ChevronToggleButton from './ChevronToggleButton'

interface AgGridWithDetailsProps extends AgGridReactProps {
  rowData: ExternalRow[]
  columnDefs: AgGridColumnProps[]
  actionColumnIdSuffix?: string
  detailRowRenderer: ({ data }: { data: ExternalRow }) => JSX.Element
  getRowNodeId: GetRowNodeIdFunc
}

type AgGridWithDetailsHandle = {
  getGridApi: () => GridApi | null
  getGridColumnApi: () => ColumnApi | null
}

const DetailButtonRenderer = ({ data }: { data: InternalRow }): JSX.Element => {
  const toggled = !!data[IS_OPEN_SYM]
  return <ChevronToggleButton isOpen={toggled} />
}

const DETAIL_TOGGLE_BUTTON_COLUMN_NAME = '__detail-button-col__'
const DETAIL_ID_SUFFIX = '-detail'
const detailIdFromDataId = (dataId: string): string => {
  return `${dataId}${DETAIL_ID_SUFFIX}`
}

const IS_DETAIL_SYM = Symbol('AgGridWithDetails-isDetail')
const IS_OPEN_SYM = Symbol('AgGridWithDetails-isOpen')
type ExternalRow = Record<string, unknown>
type InternalRow = ExternalRow & {
  [IS_DETAIL_SYM]: boolean
  [IS_OPEN_SYM]: boolean
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
  width: 34,
  minWidth: 34,
}

/**
 * Renders an AgGrid that can display a master/detail component for each row.
 * Forwarding a ref here so that outside components can access the Grid APIs
 */
const AgGridWithDetails: ForwardRefRenderFunction<AgGridWithDetailsHandle, AgGridWithDetailsProps> = (
  { detailRowRenderer, getRowNodeId, actionColumnIdSuffix, ...props }: AgGridWithDetailsProps,
  ref,
) => {
  const { rowData, columnDefs, ...gridOptions } = props

  const gridApiRef = useRef<GridApi | null>(null)
  const gridColumnApiRef = useRef<ColumnApi | null>(null)
  const maxRowHeightMapRef = useRef<Record<string, number>>({})

  // The grid and column API instances are being forwarded through an imperative handle so that parent components can
  // access and manipulate the grid as necessary based on outside state, such as searching, sorting, or filtering.
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

  // Maps regular rowId -> whether or not its detail row is open
  const [detailRowToggleMap, setDetailRowToggleMap] = useState<Record<string, boolean>>({})

  const isDetailRowOpen = (rowId: string) => {
    return !!detailRowToggleMap[rowId]
  }

  const toggleDetailRowState = (rowId: string) => {
    setDetailRowToggleMap({
      ...detailRowToggleMap,
      [rowId]: !isDetailRowOpen(rowId),
    })
  }

  const toggleDetailRowOpen = (rowId: string) => {
    // istanbul ignore next; shouldn't occur
    if (!gridApiRef.current) {
      throw new Error('GridApi is null.')
    }

    const rowNode = gridApiRef.current.getRowNode(rowId)
    // istanbul ignore next; shouldn't occur
    if (!rowNode) {
      throw new Error(`Could not find row node with row id: ${rowId}`)
    }

    // Toggle open the detail row
    const toggledValue = !isDetailRowOpen(rowId)
    toggleDetailRowState(rowId)

    if (toggledValue) {
      setHeightOfFullWidthRow(1 + (rowNode.rowIndex as number), rowId)
    }

    // Toggle/rotate the detail button
    // Retrieve the cell renderer instance of the detail button
    const params = { columns: [DETAIL_TOGGLE_BUTTON_COLUMN_NAME], rowNodes: [rowNode] }
    const cellRendererInstances = gridApiRef.current.getCellRendererInstances(params)

    // istanbul ignore next; shouldn't occur
    if (cellRendererInstances.length === 0) {
      throw new Error(`Could not find detail toggle button cellRendererInstance with row id: ${rowId}`)
    }

    const cellRendererInstance = cellRendererInstances[0]

    // Note: there appears to be a bug with using gridApiRef.refreshCells() in that it doesn't update the row data params for the cell renderer.
    // Thus, must manually refresh the button renderer with explicit params
    cellRendererInstance.refresh({
      data: { ...rowNode.data, [IS_OPEN_SYM]: toggledValue } as keyof ICellRendererParams,
    } as ICellRendererParams)
  }

  // Dynamically adjust the height of a detail row to fit.
  // Currently, setting autoHeight to true fails if using a fullWidthRow renderer.
  // Adapted solution from https://github.com/ag-grid/ag-grid/issues/3160#issuecomment-562024900
  const setHeightOfFullWidthRow = (rowIndex: number, rowId: string) => {
    // Add a timeout to wait for the grid rows to render
    setTimeout(() => {
      // istanbul ignore next; shouldn't occur
      if (!gridApiRef.current) {
        throw new Error('Grid API is null.')
      }

      const fullWidthRows = [...document.getElementsByClassName('ag-full-width-row')]

      const found = fullWidthRows.find((row: Element) => {
        const rowChild = row.firstElementChild
        // istanbul ignore next; trivial and shouldn't occur
        if (!rowChild) {
          return false
        }

        const key = 'row-index'
        // istanbul ignore next; trivial and shouldn't occur
        if (!(key in row.attributes)) {
          return false
        }

        const thisRowIndexAttr = row.attributes[key as keyof typeof row.attributes] as Attr
        const thisRowIndex = parseInt(thisRowIndexAttr.value)
        return thisRowIndex === rowIndex
      })

      // istanbul ignore next; row just might not be loaded yet
      if (!found || !found.firstElementChild) {
        return
      }

      const rowChild = found.firstElementChild
      const rowHeight = rowChild.clientHeight
      // istanbul ignore else; difficult to get jest to recognize this branch
      if (maxRowHeightMapRef.current[detailIdFromDataId(rowId)] !== rowHeight) {
        maxRowHeightMapRef.current[detailIdFromDataId(rowId)] = rowHeight
        gridApiRef.current.resetRowHeights()
        gridApiRef.current.redrawRows()
      }
    }, 100)
  }

  const isDetailRow = (data: InternalRow): boolean => !!data[IS_DETAIL_SYM]

  const getDetailRowHeight = (rowId: string) => {
    const result = maxRowHeightMapRef.current[rowId]
    if (typeof result === 'undefined') {
      // a barely visible height as it renders so we can load the true height
      return 1
    } else {
      return result
    }
  }

  // istanbul ignore next; difficult to test through unit testing, better to test visually
  const onGridSizeChanged = () => {
    if (!gridApiRef.current) {
      throw new Error('GridApi is null.')
    }

    gridApiRef.current.sizeColumnsToFit()
  }

  // istanbul ignore next; difficult to test through unit testing, better to test visually
  const onColumnResized = (event: ColumnResizedEvent) => {
    if (!gridApiRef.current || !event.finished) {
      return
    }

    gridApiRef.current.resetRowHeights()
    gridApiRef.current.redrawRows()
  }

  const onCellClicked = (event: CellClickedEvent) => {
    // Ignore clicks on cells with 'actions'
    if (actionColumnIdSuffix && event.column.getColId().endsWith(actionColumnIdSuffix)) {
      return
    }

    // Toggle the detail row
    const rowId = event.node.id as string
    toggleDetailRowOpen(rowId)
  }

  const rowDataWithDetails = rowData.reduce<ExternalRow[]>((prevValue, currentValue) => {
    if (isDetailRowOpen(getRowNodeId(currentValue))) {
      prevValue.push({ ...currentValue, [IS_OPEN_SYM]: true })
      prevValue.push({ ...currentValue, [IS_DETAIL_SYM]: true })
    } else {
      prevValue.push(currentValue)
    }

    return prevValue
  }, [])

  return (
    <AgGridReact
      containerStyle={{ flex: 1, height: 'auto' }}
      frameworkComponents={{ detailButtonRenderer: DetailButtonRenderer }}
      rowData={rowDataWithDetails}
      columnDefs={[detailButtonColumnDef, ...columnDefs]}
      fullWidthCellRendererFramework={detailRowRenderer}
      getRowNodeId={(data: InternalRow) => {
        return isDetailRow(data) ? detailIdFromDataId(getRowNodeId(data)) : getRowNodeId(data)
      }}
      getRowHeight={(params: { node: { data: InternalRow; id: string } }) => {
        if (isDetailRow(params.node.data)) {
          return getDetailRowHeight(params.node.id)
        }
      }}
      isFullWidthCell={(rowNode: RowNode) => isDetailRow(rowNode.data)}
      onCellClicked={onCellClicked}
      onGridReady={onGridReady}
      onGridSizeChanged={onGridSizeChanged}
      onColumnResized={onColumnResized}
      immutableData={true}
      {...gridOptions}
    />
  )
}

export default forwardRef(AgGridWithDetails)
