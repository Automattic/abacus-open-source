import { CellClickedEvent, GridApi } from 'ag-grid-community'
import React, { useRef } from 'react'

import RowToggleButton from './RowToggleButton'

interface DataDetail {
  isDetail?: boolean
}

export interface Data {
  [key: string]: unknown | DataDetail
}

export type GetDataIdFunc = (data: Data) => string

export const DETAIL_TOGGLE_BUTTON_COLUMN_NAME = '__detail-button-col__'
const DETAIL_ID_SUFFIX = '-detail'

export const isData = (data: unknown): data is Data => {
  return !!data && typeof data === 'object' && Object.keys(data as Record<string, unknown>).length > 0
}

export const isDataArray = (data: unknown[]): data is Data[] => {
  return data.reduce((acc, x) => acc && isData(x), true) as boolean
}

export const detailIdFromDataId = (dataId: string): string => {
  return `${dataId}${DETAIL_ID_SUFFIX}`
}

// Dynamically adjust the height of a detail row to fit.
// Currently, setting autoHeight to true fails if using a fullWidthRow renderer.
// Adapted solution from https://github.com/ag-grid/ag-grid/issues/3160#issuecomment-562024900
export const setHeightOfFullWidthRow = (
  rowIndex: number,
  data: Data,
  maxRowHeightMap: Map<string, number>,
  gridApiRef: GridApi | null,
  getDataId: GetDataIdFunc,
): void => {
  // Add a timeout to ensure the grid rows are rendered
  setTimeout(() => {
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

    // istanbul ignore next; trivial and shouldn't occur
    if (!found || !found.firstElementChild) {
      return
    }

    const rowChild = found.firstElementChild
    const rowHeight = rowChild.clientHeight
    maxRowHeightMap.set(detailIdFromDataId(getDataId(data)), rowHeight)

    gridApiRef?.resetRowHeights()
    //gridApiRef?.redrawRows()
  }, 100)
}

export const isFullWidth = (data: Data): boolean => data.isDetail === true

export const addDetailRow = (data: Data, rowData: Data[], getDataId: GetDataIdFunc): Data[] => {
  const newMetrics = [...rowData]
  const index = newMetrics.findIndex((element) => getDataId(element) === getDataId(data))
  newMetrics.splice(index + 1, 0, { ...data, isDetail: true })
  return newMetrics
}

export const removeDetailRow = (data: Data, rowData: Data[], getDataId: GetDataIdFunc): Data[] => {
  const newMetrics = [...rowData]
  const index = newMetrics.findIndex((element) => getDataId(element) === getDataId(data) && element.isDetail === true)

  // istanbul ignore next; trivial and shouldn't occur
  if (index >= 0) {
    newMetrics.splice(index, 1)
  }
  return newMetrics
}

export const toggleDetailRow = (
  data: Data,
  rowData: Data[],
  detailRowToggleMap: Map<string, boolean>,
  getDataId: GetDataIdFunc,
): Data[] => {
  const detailRowExists = !!detailRowToggleMap.get(getDataId(data))
  let newRows
  if (detailRowExists) {
    newRows = removeDetailRow(data, rowData, getDataId)
  } else {
    newRows = addDetailRow(data, rowData, getDataId)
  }

  detailRowToggleMap.set(getDataId(data), !detailRowExists)
  return newRows
}

export const getRowHeight = (
  data: Data,
  { maxRowHeightMap, getDataId }: { maxRowHeightMap: Map<string, number>; getDataId: GetDataIdFunc },
): number | undefined | null => {
  if (isFullWidth(data)) {
    const result = maxRowHeightMap.get(detailIdFromDataId(getDataId(data))) as number
    if (typeof result === 'undefined') {
      // a barely visible height as it renders so we can load the true height
      return 1
    } else {
      return result
    }
  }
}

export const onCellClicked = (
  event: CellClickedEvent,
  {
    gridApiRef,
    rowData,
    setRowData,
    detailRowToggleMap,
    maxRowHeightMap,
    getDataId,
    actionColumnIdSuffix,
  }: {
    gridApiRef: GridApi | null
    rowData: Data[]
    setRowData: (rowData: Data[]) => void
    detailRowToggleMap: Map<string, boolean>
    maxRowHeightMap: Map<string, number>
    getDataId: GetDataIdFunc
    actionColumnIdSuffix?: string | undefined
  },
): void => {
  // Ignore clicks on cells with 'actions'
  if (actionColumnIdSuffix && event.column.getColId().endsWith(actionColumnIdSuffix)) {
    return
  }

  // istanbul ignore else
  if (!isFullWidth(event.data) && getDataId && gridApiRef) {
    const target = event.event?.target as HTMLElement

    // Retrieve the HTML element of the detail toggle button
    const params = { columns: [DETAIL_TOGGLE_BUTTON_COLUMN_NAME], rowNodes: [event.node] }
    const instances = gridApiRef?.getCellRendererInstances(params)

    // istanbul ignore else
    if (instances.length > 0) {
      const instance = instances[0].getGui()
      const button = instance.firstElementChild

      // Toggle the detail row if the detail button was clicked
      if (target && (target === button || button?.contains(target))) {
        setRowData(toggleDetailRow(event.data, rowData, detailRowToggleMap, getDataId))

        // istanbul ignore else
        if (detailRowToggleMap.get(getDataId(event.data))) {
          setHeightOfFullWidthRow(1 + (event.rowIndex as number), event.data, maxRowHeightMap, gridApiRef, getDataId)
        }
      }
      // Trigger the detail button if anything else in the row was clicked
      else {
        const element = instance.firstElementChild as HTMLElement
        element.click()
      }
    }
  }
}

export const DetailToggleButtonRenderer = ({
  data,
  getDataId,
  detailRowToggleMap,
}: {
  data: Data
  getDataId: GetDataIdFunc
  detailRowToggleMap: Map<string, boolean>
}): JSX.Element => {
  const dataId = useRef<string>('')
  dataId.current = getDataId(data)

  const toggled = !!detailRowToggleMap.get(dataId.current)

  return <RowToggleButton toggled={toggled} />
}
