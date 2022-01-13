// istanbul ignore file; demo
import 'ag-grid-community/dist/styles/ag-grid.css'
import 'ag-grid-community/dist/styles/ag-theme-alpine.css'

import { useTheme } from '@material-ui/core'
import { GetQuickFilterTextParams } from 'ag-grid-community'
import debugFactory from 'debug'
import React from 'react'

import { Metric } from 'src/lib/schemas'

import AgGridWithDetails, { Data } from '../general/AgGridWithDetails'
import { MetricDetailRenderer, MetricEditButtonRenderer, MetricNameRenderer } from './MetricsTableRenderers'

const debug = debugFactory('abacus:components/MetricsTableAgGrid.tsx')

export type MetricDetail = Metric | Data

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

  const paramsGetQuickFilterText = (params: GetQuickFilterTextParams) => {
    return JSON.stringify(params.value, null, 4)
  }

  const defaultColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    cellStyle: {
      fontFamily: theme.custom.fonts.monospace,
    },
    wrapText: true,
    autoHeight: true,
  }
  const columnDefs = [
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
    {
      // hidden field to allow searching
      headerName: 'EventParams',
      field: 'eventParams',
      hide: true,
      // suppressToolPanel: true,
      getQuickFilterText: paramsGetQuickFilterText,
    },
    {
      // hidden field to allow searching
      headerName: 'RevenueParams',
      field: 'revenueParams',
      hide: true,
      // suppressToolPanel: true,
      getQuickFilterText: paramsGetQuickFilterText,
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
            cellRendererFramework: ({ data }: { data: Metric }) => (
              <MetricEditButtonRenderer data={data} onEditMetric={onEditMetric} />
            ),
            width: 100,
            minWidth: 54,
          },
        ]
      : []),
  ]

  const getDataId = (data: MetricDetail) => {
    return data.name as string
  }

  return (
    <AgGridWithDetails
      title={'Metrics'}
      data={metrics}
      defaultColDef={defaultColDef}
      columnDefs={columnDefs}
      getDataId={getDataId}
      detailRowRenderer={MetricDetailRenderer}
      actionColumnIdSuffix={'-actions-'}
      defaultSearchColumnId={'name'}
    />
  )
}

export default MetricsTableAgGrid
