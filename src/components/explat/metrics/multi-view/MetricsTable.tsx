import { createStyles, makeStyles, Theme, useTheme } from '@material-ui/core'
import { ChevronRight } from '@material-ui/icons'
import debugFactory from 'debug'
import _ from 'lodash'
import MaterialTable, { MTableToolbar } from 'material-table'
import React, { forwardRef, useEffect, useMemo, useState } from 'react'

import MetricsApi from 'src/api/explat/MetricsApi'
import TagsApi from 'src/api/explat/TagsApi'
import TagAutocomplete from 'src/components/general/TagAutocomplete'
import { metricParameterTypeName, stringifyMetricParams } from 'src/lib/explat/metrics'
import { Metric, MetricParameterType, TagFull } from 'src/lib/explat/schemas'
import { DIVISION_METRIC_TAG_NAMESPACES } from 'src/lib/explat/tags'
import { useDataLoadingError, useDataSource } from 'src/utils/data-loading'
import { createIdSlug, isDebugMode } from 'src/utils/general'
import { defaultTableOptions } from 'src/utils/material-table'

import MetricDetails from './../MetricDetails'

const debug = debugFactory('abacus:components/MetricsTable.tsx')

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    metricsTableHeader: {
      marginTop: theme.spacing(2),
      display: 'flex',
    },
    metricsTableTagsFilter: {
      margin: theme.spacing(2),
      justifyContent: 'flex-end',
      flex: 1,
    },
    metricsTableTagsFilterLabel: {
      lineHeight: `${theme.spacing(4)}px`,
    },
  }),
)

/**
 * Renders details for one metric within the metric table.
 *
 * @param metric An object containing metric information
 */
const MetricDetailPanel = ({ metric: initialMetric }: { metric: Metric }): JSX.Element => {
  useEffect(() => {
    initialMetric &&
      window.history.replaceState({}, '', `/metrics/${createIdSlug(initialMetric.metricId, initialMetric.name)}`)
  }, [initialMetric])

  const {
    isLoading,
    data: metric,
    error,
  } = useDataSource(() => MetricsApi.findById(initialMetric.metricId), [initialMetric.metricId])
  useDataLoadingError(error)

  const isReady = !isLoading && !error
  return <MetricDetails metric={metric || undefined} isLoading={!isReady} isCompact />
}

/**
 * Renders a table of "bare" metric information.
 *
 * @param metrics An array of metrics.
 * @param onEditMetric A Callback. Setting this will show the edit action in the table.
 */
const MetricsTable = ({
  metrics,
  onEditMetric,
}: {
  metrics: Metric[]
  onEditMetric?: (metricId: number) => void
}): JSX.Element => {
  debug('MetricsTable#render')

  const classes = useStyles()

  const [selectedTagOption, setSelectedTagOption] = useState<TagFull | null>(null)
  const onChangeSelectedTagOption = (_event: unknown, value: TagFull | null) => {
    setSelectedTagOption(value)
  }
  const { isLoading: tagIsLoading, data: tags, error: tagsError } = useDataSource(() => TagsApi.findAll(), [])
  useDataLoadingError(tagsError, 'Tags')
  const eligibleTagsForFilter = useMemo(
    () => tags?.filter((tag) => DIVISION_METRIC_TAG_NAMESPACES.includes(tag.namespace)) || [],
    [tags],
  )

  const processedMetrics = useMemo(
    () =>
      metrics
        .filter((metric) => (selectedTagOption ? _.map(metric.tags, 'tagId').includes(selectedTagOption?.tagId) : true))
        .map((metric) => ({
          ...metric,
          stringifiedParamsForSearch: stringifyMetricParams(metric),
        })),
    [metrics, selectedTagOption],
  )

  const theme = useTheme()
  const tableColumns = [
    {
      title: 'Name',
      field: 'name',
      cellStyle: {
        fontFamily: theme.custom.fonts.monospace,
        fontWeight: theme.custom.fontWeights.monospaceBold,
        wordBreak: 'break-word',
      } as React.CSSProperties,
    },
    {
      title: 'Description',
      field: 'description',
      cellStyle: {
        fontFamily: theme.custom.fonts.monospace,
      },
    },
    {
      title: 'Parameter Type',
      field: 'parameterType',
      render: ({ parameterType }: { parameterType: MetricParameterType }) => metricParameterTypeName[parameterType],
      cellStyle: {
        fontFamily: theme.custom.fonts.monospace,
      },
    },
    {
      title: 'Tags',
      field: 'tags',
      render: ({ tags }: { tags?: TagFull[] }) => tags?.map((tag) => tag.name).join(', '),
      hidden: !isDebugMode(),
      width: !isDebugMode() ? 0 : undefined,
    },
    {
      field: 'stringifiedParamsForSearch',
      hidden: true,
      searchable: true,
      width: 0,
    },
  ]
  const onRowClick = () => {
    window.history.replaceState({}, '', '/metrics')
  }

  return (
    <MaterialTable
      actions={
        onEditMetric
          ? [
              {
                icon: 'edit',
                tooltip: 'Edit Metric',
                onClick: (_event, rowData) => {
                  onEditMetric((rowData as Metric).metricId)
                },
              },
            ]
          : undefined
      }
      columns={tableColumns}
      data={processedMetrics}
      onRowClick={(_event, _rowData, togglePanel) => {
        onRowClick()
        togglePanel && togglePanel()
      }}
      options={{
        ...defaultTableOptions,
        actionsColumnIndex: 4,
      }}
      detailPanel={(rowData) => <MetricDetailPanel metric={rowData} />}
      icons={{
        DetailPanel: forwardRef((props, ref) => <ChevronRight {...props} ref={ref} onClick={onRowClick} />),
      }}
      components={{
        //eslint-disable-next-line @typescript-eslint/naming-convention
        Toolbar: (props) => (
          <div className={classes.metricsTableHeader}>
            <MTableToolbar {...props} />
            {isDebugMode() && (
              <>
                <h4 className={classes.metricsTableTagsFilterLabel}>Filter by tag: </h4>
                <div className={classes.metricsTableTagsFilter}>
                  <TagAutocomplete
                    id='filter-tag-select'
                    value={selectedTagOption}
                    onChange={onChangeSelectedTagOption}
                    options={eligibleTagsForFilter}
                    error={tagsError?.message}
                    loading={tagIsLoading}
                  />
                </div>
              </>
            )}
          </div>
        ),
      }}
    />
  )
}

export default MetricsTable
