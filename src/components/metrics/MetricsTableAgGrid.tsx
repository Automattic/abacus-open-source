// istanbul ignore file; demo
import 'ag-grid-community/dist/styles/ag-grid.css'
import 'ag-grid-community/dist/styles/ag-theme-alpine.css'

import { Button, createStyles, fade, InputBase, makeStyles, Theme, Typography, useTheme } from '@material-ui/core'
import { Search as SearchIcon } from '@material-ui/icons'
import { CellClickedEvent, ColumnApi, GridApi, GridOptions, GridReadyEvent, RowNode } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import clsx from 'clsx'
import debugFactory from 'debug'
import React, { useEffect, useRef, useState } from 'react'

import { Metric, MetricDetail } from 'src/lib/schemas'

import {
  MetricDetailRenderer,
  MetricDetailToggleButtonRenderer,
  MetricEditButtonRenderer,
  MetricNameRenderer,
} from './MetricsTableRenderers'

const debug = debugFactory('abacus:components/MetricsTableAgGrid.tsx')

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
 * Renders a table of metrics information.
 */
const MetricsTableAgGrid = ({
  metrics,
  onEditMetric,
}: {
  metrics: Metric[]
  onEditMetric?: (metricId: number) => void
}): JSX.Element => {
  debug('MetricsTableAgGrid#render')

  const theme = useTheme()
  const classes = useStyles()

  const gridApiRef = useRef<GridApi | null>(null)
  const gridColumnApiRef = useRef<ColumnApi | null>(null)
  const maxRowHeightMap = useRef<Map<string, number>>(new Map())
  const detailRowToggleMap = useRef<Map<string, boolean>>(new Map())
  const [rowData, setRowData] = useState<MetricDetail[]>(metrics)
  const [searchState, setSearchState] = useState<string>('')

  useEffect(() => {
    if (!gridApiRef.current) {
      return
    }

    gridApiRef.current.setRowData(rowData)
  }, [rowData])

  useEffect(() => {
    setRowData(metrics)
  }, [metrics])

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

    setSearchState('')
    gridColumnApiRef.current.resetColumnState()
    gridApiRef.current.setFilterModel(null)
    gridColumnApiRef.current.applyColumnState({
      state: [
        {
          colId: 'name',
          sort: 'asc',
          sortIndex: 0,
        },
      ],
      defaultState: { sort: null },
    })
    gridApiRef.current.sizeColumnsToFit()
  }

  // Dynamically adjust the height of a detail row to fit.
  // Currently, setting autoHeight to true fails if using a fullWidthRow renderer.
  // Adapted solution from https://github.com/ag-grid/ag-grid/issues/3160#issuecomment-562024900
  const setHeightOfFullWidthRow = (rowIndex: number, data: MetricDetail) => {
    // Add a timeout to ensure the grid rows are rendered
    setTimeout(() => {
      const fullWidthRows = [...document.getElementsByClassName('ag-full-width-row')]

      const found = fullWidthRows.find((row: Element) => {
        const rowChild = row.firstElementChild
        if (rowChild !== null) {
          const key = 'row-index'
          if (key in row.attributes) {
            const thisRowIndexAttr = row.attributes[key as keyof typeof row.attributes] as Attr
            const thisRowIndex = parseInt(thisRowIndexAttr.value)
            return thisRowIndex === rowIndex
          }
        }
        return false
      })

      if (!found) {
        return
      }

      const rowChild = found.firstElementChild
      if (rowChild !== null) {
        const rowHeight = rowChild.clientHeight
        maxRowHeightMap.current.set(data.name, rowHeight)
      }

      if (!gridApiRef.current) {
        return
      }

      gridApiRef.current.resetRowHeights()
    }, 100)
  }

  const isFullWidth = (data: MetricDetail) => {
    return data.isDetail === true
  }

  const addDetailRow = (data: MetricDetail) => {
    const newMetrics = [...rowData]
    const index = newMetrics.findIndex((element) => element.name === data.name)
    newMetrics.splice(index + 1, 0, { ...data, isDetail: true })
    setRowData(newMetrics)
  }

  const removeDetailRow = (data: MetricDetail) => {
    const newMetrics = [...rowData]
    const index = newMetrics.findIndex((element) => element.name === data.name && element.isDetail === true)
    newMetrics.splice(index, 1)
    setRowData(newMetrics)
  }

  // Styles for animating and rotating the toggle detail icon button
  const toggleDetailButtonStyles = {
    hidden: 'transition: all 200ms ease 0s; transform: none;',
    visible: 'transition: all 200ms ease 0s; transform: rotate(90deg);',
  }

  // Animates the toggle detail button
  const animateToggleDetailButton = (name: string) => {
    const button = document.querySelector(`#${name}`)
    if (button !== null) {
      const key = 'style'
      if (key in button.attributes) {
        const styleAttr = button.attributes[key as keyof typeof button.attributes] as Attr
        const style = styleAttr.value
        if (style === toggleDetailButtonStyles.hidden) {
          button.setAttribute(key, toggleDetailButtonStyles.visible)
        } else {
          button.setAttribute(key, toggleDetailButtonStyles.hidden)
        }
      }
    }
  }

  // Toggles the display of the metric detail rows
  const toggleDetailRow = (data: MetricDetail) => {
    if (isFullWidth(data)) {
      return
    }

    const detailRowExists = detailRowToggleMap.current.get(data.name)
    if (detailRowExists) {
      removeDetailRow(data)
    } else {
      addDetailRow(data)
    }

    animateToggleDetailButton(data.name)
    detailRowToggleMap.current.set(data.name, !detailRowExists)
  }

  const gridOptions = {
    defaultColDef: {
      sortable: true,
      filter: true,
      resizable: true,
      cellStyle: {
        fontFamily: theme.custom.fonts.monospace,
      },
      wrapText: true,
      autoHeight: true,
    },
    columnDefs: [
      {
        headerName: '',
        sortable: false,
        filter: false,
        resizable: false,
        cellStyle: {
          color: 'rgba(0, 0, 0, 0.5)',
          paddingLeft: 0,
          paddingRight: 0,
        },
        cellRendererFramework: ({ data }: { data: MetricDetail }) => (
          <MetricDetailToggleButtonRenderer data={data} detailRowToggleMap={detailRowToggleMap.current} />
        ),
        width: 54,
        minWidth: 54,
      },
      {
        headerName: 'Name',
        field: 'name',
        cellStyle: {
          fontFamily: theme.custom.fonts.monospace,
          fontWeight: theme.custom.fontWeights.monospaceBold,
        },
        cellRendererFramework: ({ value: name }: { value: string }) => <MetricNameRenderer name={name} />,
        width: 430,
      },
      {
        headerName: 'Description',
        field: 'description',
        width: 590,
      },
      {
        headerName: 'Parameter Type',
        field: 'parameterType',
        width: 200,
      },
      // trick for conditionally including this element
      ...(onEditMetric
        ? [
            {
              headerName: 'Actions',
              field: '-actions-',
              sortable: false,
              filter: false,
              resizable: false,
              cellStyle: {
                display: 'flex',
                justifyContent: 'center',
                color: 'rgba(0, 0, 0, 0.5)',
                paddingLeft: 0,
                paddingRight: 0,
              },
              cellRendererFramework: ({ data }: { data: MetricDetail }) => (
                <MetricEditButtonRenderer data={data} onEditMetric={onEditMetric} />
              ),
              width: 100,
              minWidth: 54,
            },
          ]
        : []),
    ],
  }

  return (
    <div className={clsx('ag-theme-alpine', classes.root)}>
      <div className={classes.toolbar}>
        <Typography variant='h2' className={classes.title}>
          Metrics
        </Typography>
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
          gridOptions={gridOptions as GridOptions}
          containerStyle={{ flex: 1, height: 'auto' }}
          fullWidthCellRendererFramework={MetricDetailRenderer}
          getRowNodeId={(data: MetricDetail) => (isFullWidth(data) ? `${data.name}-detail` : data.name)}
          getRowHeight={(params: { node: { data: MetricDetail } }) => {
            if (isFullWidth(params.node.data)) {
              const result = maxRowHeightMap.current.get(params.node.data.name) as number
              if (typeof result === undefined) {
                // a default height
                return 250
              } else {
                return result
              }
            }
          }}
          onFirstDataRendered={onReset}
          onGridReady={(event: GridReadyEvent) => {
            gridApiRef.current = event.api
            gridColumnApiRef.current = event.columnApi
            event.api.setRowData(rowData)
          }}
          onGridSizeChanged={() => {
            if (!gridApiRef.current) {
              return
            }

            gridApiRef.current.sizeColumnsToFit()
          }}
          onCellClicked={(event: CellClickedEvent) => {
            // Ignore clicks on cell with edit button
            if (event.column.getColId() === '-actions-') {
              return
            }

            if (!isFullWidth(event.data)) {
              toggleDetailRow(event.data)
              setHeightOfFullWidthRow(1 + (event.rowIndex as number), event.data)
            }
          }}
          isFullWidthCell={(rowNode: RowNode) => isFullWidth(rowNode.data)}
          immutableData={true}
        />
      </div>
    </div>
  )
}

export default MetricsTableAgGrid
