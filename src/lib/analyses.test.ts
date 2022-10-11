import Fixtures from 'src/test-helpers/fixtures'

import * as Analyses from './analyses'
import { AnalysisStrategy, Status } from './schemas'

describe('getParticipantCounts', () => {
  it('should work correctly', () => {
    expect(
      Analyses.getParticipantCounts(
        Fixtures.createExperimentFull({
          variations: [
            { variationId: 1, allocatedPercentage: 50, isDefault: true, name: 'variation_name_1' },
            { variationId: 2, allocatedPercentage: 50, isDefault: false, name: 'variation_name_2' },
          ],
        }),
        {
          [AnalysisStrategy.IttPure]: Fixtures.createAnalysis({
            participantStats: {
              total: 100,
              variation_1: 40,
              variation_2: 70,
            },
          }),
          [AnalysisStrategy.MittNoCrossovers]: Fixtures.createAnalysis({
            participantStats: {
              total: 90,
              variation_1: 35,
              variation_2: 55,
            },
          }),
          [AnalysisStrategy.MittNoSpammers]: Fixtures.createAnalysis({
            participantStats: {
              total: 85,
              variation_1: 40,
              variation_2: 45,
            },
          }),
          [AnalysisStrategy.MittNoSpammersNoCrossovers]: Fixtures.createAnalysis({
            participantStats: {
              total: 60,
              variation_1: 25,
              variation_2: 35,
            },
          }),
          [AnalysisStrategy.PpNaive]: Fixtures.createAnalysis({
            participantStats: {
              total: 40,
              variation_1: 15,
              variation_2: 25,
            },
          }),
        },
      ),
    ).toMatchInlineSnapshot(`
      Object {
        "byVariationId": Object {
          "1": Object {
            "assigned": 40,
            "assignedCrossovers": 5,
            "assignedNoSpammersNoCrossovers": 25,
            "assignedSpammers": 0,
            "exposed": 15,
          },
          "2": Object {
            "assigned": 70,
            "assignedCrossovers": 15,
            "assignedNoSpammersNoCrossovers": 35,
            "assignedSpammers": 25,
            "exposed": 25,
          },
        },
        "total": Object {
          "assigned": 100,
          "assignedCrossovers": 10,
          "assignedNoSpammersNoCrossovers": 60,
          "assignedSpammers": 15,
          "exposed": 40,
        },
      }
    `)
  })

  it('should work correctly without any analyses', () => {
    expect(
      Analyses.getParticipantCounts(
        Fixtures.createExperimentFull({
          variations: [
            { variationId: 1, allocatedPercentage: 50, isDefault: true, name: 'variation_name_1' },
            { variationId: 2, allocatedPercentage: 50, isDefault: false, name: 'variation_name_2' },
          ],
        }),
        {},
      ),
    ).toMatchInlineSnapshot(`
      Object {
        "byVariationId": Object {
          "1": Object {
            "assigned": 0,
            "assignedCrossovers": 0,
            "assignedNoSpammersNoCrossovers": 0,
            "assignedSpammers": 0,
            "exposed": 0,
          },
          "2": Object {
            "assigned": 0,
            "assignedCrossovers": 0,
            "assignedNoSpammersNoCrossovers": 0,
            "assignedSpammers": 0,
            "exposed": 0,
          },
        },
        "total": Object {
          "assigned": 0,
          "assignedCrossovers": 0,
          "assignedNoSpammersNoCrossovers": 0,
          "assignedSpammers": 0,
          "exposed": 0,
        },
      }
    `)
  })
})

describe('getExperimentParticipantStats', () => {
  it('should work correctly', () => {
    expect(
      Analyses.getExperimentParticipantStats(
        Fixtures.createExperimentFull({
          variations: [
            { variationId: 1, allocatedPercentage: 50, isDefault: true, name: 'variation_name_1' },
            { variationId: 2, allocatedPercentage: 50, isDefault: false, name: 'variation_name_2' },
          ],
        }),
        {
          [AnalysisStrategy.IttPure]: Fixtures.createAnalysis({
            participantStats: {
              total: 11000,
              variation_1: 4000,
              variation_2: 7000,
            },
          }),
          [AnalysisStrategy.MittNoCrossovers]: Fixtures.createAnalysis({
            participantStats: {
              total: 9000,
              variation_1: 3500,
              variation_2: 5500,
            },
          }),
          [AnalysisStrategy.MittNoSpammers]: Fixtures.createAnalysis({
            participantStats: {
              total: 8500,
              variation_1: 4000,
              variation_2: 4500,
            },
          }),
          [AnalysisStrategy.MittNoSpammersNoCrossovers]: Fixtures.createAnalysis({
            participantStats: {
              total: 6000,
              variation_1: 2500,
              variation_2: 3500,
            },
          }),
          [AnalysisStrategy.PpNaive]: Fixtures.createAnalysis({
            participantStats: {
              total: 4000,
              variation_1: 1300,
              variation_2: 2700,
            },
          }),
        },
      ),
    ).toMatchInlineSnapshot(`
      Object {
        "ratios": Object {
          "byVariationId": Object {
            "1": Object {
              "assignedCrossoversToAssigned": 0.125,
              "assignedCrossoversToTotalAssignedCrossovers": 0.25,
              "assignedNoSpammersNoCrossoversToAssigned": 0.625,
              "assignedSpammersToAssigned": 0,
              "assignedSpammersToTotalAssignedSpammers": 0,
              "assignedToTotalAssigned": 0.36363636363636365,
              "exposedToAssigned": 0.325,
              "exposedToTotalExposed": 0.325,
            },
            "2": Object {
              "assignedCrossoversToAssigned": 0.21428571428571427,
              "assignedCrossoversToTotalAssignedCrossovers": 0.75,
              "assignedNoSpammersNoCrossoversToAssigned": 0.5,
              "assignedSpammersToAssigned": 0.35714285714285715,
              "assignedSpammersToTotalAssignedSpammers": 1,
              "assignedToTotalAssigned": 0.6363636363636364,
              "exposedToAssigned": 0.38571428571428573,
              "exposedToTotalExposed": 0.675,
            },
          },
          "overall": Object {
            "assignedCrossoversToAssigned": 0.18181818181818182,
            "assignedNoSpammersNoCrossoversToAssigned": 0.5454545454545454,
            "assignedSpammersToAssigned": 0.22727272727272727,
            "exposedToAssigned": 0.36363636363636365,
          },
        },
        "variationProportionProbabilities": Object {
          "assignedDistributionMatchingAllocated": 0,
          "assignedNoSpammersNoCrossoversDistributionMatchingAllocated": 0,
          "exposedDistributionMatchingAllocated": 0,
        },
      }
    `)
  })
})

describe('getExperimentParticipantStatHealthIndicators', () => {
  it('should work correctly', () => {
    expect(
      Analyses.getExperimentParticipantHealthIndicators(
        Fixtures.createExperimentFull(),
        Analyses.getExperimentParticipantStats(
          Fixtures.createExperimentFull({
            variations: [
              { variationId: 1, allocatedPercentage: 50, isDefault: true, name: 'variation_name_1' },
              { variationId: 2, allocatedPercentage: 50, isDefault: false, name: 'variation_name_2' },
            ],
          }),
          {
            [AnalysisStrategy.IttPure]: Fixtures.createAnalysis({
              participantStats: {
                total: 11000,
                variation_1: 5700,
                variation_2: 5300,
              },
            }),
            [AnalysisStrategy.MittNoCrossovers]: Fixtures.createAnalysis({
              participantStats: {
                total: 9000,
                variation_1: 3500,
                variation_2: 5500,
              },
            }),
            [AnalysisStrategy.MittNoSpammers]: Fixtures.createAnalysis({
              participantStats: {
                total: 8500,
                variation_1: 425,
                variation_2: 425,
              },
            }),
            [AnalysisStrategy.MittNoSpammersNoCrossovers]: Fixtures.createAnalysis({
              participantStats: {
                total: 6000,
                variation_1: 305,
                variation_2: 295,
              },
            }),
            [AnalysisStrategy.PpNaive]: Fixtures.createAnalysis({
              participantStats: {
                total: 4000,
                variation_1: 1300,
                variation_2: 2700,
              },
            }),
          },
        ),
      ),
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "indication": Object {
            "code": "probable issue",
            "reason": "−∞ < x ≤ 0.001",
            "recommendation": "Contact @experiment-review.",
            "severity": "Error",
          },
          "link": "https://fieldguide.automattic.com/the-experimentation-platform/experiment-health/#assignment-distributions",
          "name": "Assignment distribution",
          "unit": "p-value",
          "value": 0.00013681836098877742,
        },
        Object {
          "indication": Object {
            "code": "probable issue",
            "reason": "−∞ < x ≤ 0.001",
            "recommendation": "Contact @experiment-review.",
            "severity": "Error",
          },
          "link": "https://fieldguide.automattic.com/the-experimentation-platform/experiment-health/#ratios",
          "name": "Assignment distribution without crossovers and spammers",
          "unit": "p-value",
          "value": 0,
        },
        Object {
          "indication": Object {
            "code": "probable issue",
            "reason": "−∞ < x ≤ 0.001",
            "recommendation": "If not in combination with other distribution issues, exposure event being fired is linked to variation causing bias. Choose a different exposure event or use assignment analysis (contact @experiment-review to do so).",
            "severity": "Error",
          },
          "link": "https://fieldguide.automattic.com/the-experimentation-platform/experiment-health/#assignment-distributions",
          "name": "Assignment distribution of exposed participants",
          "unit": "p-value",
          "value": 0,
        },
        Object {
          "indication": Object {
            "code": "very high",
            "reason": "0.05 < x ≤ 1",
            "recommendation": "Contact @experiment-review.",
            "severity": "Error",
          },
          "link": "https://fieldguide.automattic.com/the-experimentation-platform/experiment-health/#ratios",
          "name": "Ratio of crossovers to assigned",
          "unit": "ratio",
          "value": 0.18181818181818182,
        },
        Object {
          "indication": Object {
            "code": "high",
            "reason": "0.1 < x ≤ 0.4",
            "recommendation": "Spammers are filtered out of the displayed metrics, but high numbers may be indicative of problems.",
            "severity": "Warning",
          },
          "link": "https://fieldguide.automattic.com/the-experimentation-platform/experiment-health/#ratios",
          "name": "Ratio of spammers to assigned",
          "unit": "ratio",
          "value": 0.22727272727272727,
        },
      ]
    `)
    expect(
      Analyses.getExperimentParticipantHealthIndicators(
        Fixtures.createExperimentFull(),
        Analyses.getExperimentParticipantStats(
          Fixtures.createExperimentFull({
            variations: [
              { variationId: 1, allocatedPercentage: 50, isDefault: true, name: 'variation_name_1' },
              { variationId: 2, allocatedPercentage: 50, isDefault: false, name: 'variation_name_2' },
            ],
          }),
          {
            [AnalysisStrategy.IttPure]: Fixtures.createAnalysis({
              participantStats: {
                total: 11000,
                variation_1: 5650,
                variation_2: 5350,
              },
            }),
            [AnalysisStrategy.MittNoCrossovers]: Fixtures.createAnalysis({
              participantStats: {
                total: 0,
                variation_1: 0,
                variation_2: 0,
              },
            }),
            [AnalysisStrategy.MittNoSpammers]: Fixtures.createAnalysis({
              participantStats: {
                total: 0,
                variation_1: 0,
                variation_2: 0,
              },
            }),
            [AnalysisStrategy.MittNoSpammersNoCrossovers]: Fixtures.createAnalysis({
              participantStats: {
                total: 11000,
                variation_1: 5600,
                variation_2: 5400,
              },
            }),
            [AnalysisStrategy.PpNaive]: Fixtures.createAnalysis({
              participantStats: {
                total: 11000,
                variation_1: 5550,
                variation_2: 5450,
              },
            }),
          },
        ),
      ),
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "indication": Object {
            "code": "possible issue",
            "reason": "0.001 < x ≤ 0.05",
            "recommendation": "Check daily ratio patterns for anomalies, contact @experiment-review.",
            "severity": "Warning",
          },
          "link": "https://fieldguide.automattic.com/the-experimentation-platform/experiment-health/#assignment-distributions",
          "name": "Assignment distribution",
          "unit": "p-value",
          "value": 0.004231237155615908,
        },
        Object {
          "indication": Object {
            "code": "nominal",
            "reason": "0.05 < x ≤ 1",
            "severity": "Ok",
          },
          "link": "https://fieldguide.automattic.com/the-experimentation-platform/experiment-health/#ratios",
          "name": "Assignment distribution without crossovers and spammers",
          "unit": "p-value",
          "value": 0.056530481922820064,
        },
        Object {
          "indication": Object {
            "code": "nominal",
            "reason": "0.05 < x ≤ 1",
            "severity": "Ok",
          },
          "link": "https://fieldguide.automattic.com/the-experimentation-platform/experiment-health/#assignment-distributions",
          "name": "Assignment distribution of exposed participants",
          "unit": "p-value",
          "value": 0.3403558714936903,
        },
        Object {
          "indication": Object {
            "code": "very high",
            "reason": "0.05 < x ≤ 1",
            "recommendation": "Contact @experiment-review.",
            "severity": "Error",
          },
          "link": "https://fieldguide.automattic.com/the-experimentation-platform/experiment-health/#ratios",
          "name": "Ratio of crossovers to assigned",
          "unit": "ratio",
          "value": 1,
        },
        Object {
          "indication": Object {
            "code": "very high",
            "reason": "0.4 < x ≤ 1",
            "recommendation": "Spammers are filtered out of the displayed metrics, but high numbers may be indicative of problems.",
            "severity": "Error",
          },
          "link": "https://fieldguide.automattic.com/the-experimentation-platform/experiment-health/#ratios",
          "name": "Ratio of spammers to assigned",
          "unit": "ratio",
          "value": 1,
        },
      ]
    `)
  })

  it('should handle bad values gracefully', () => {
    expect(
      Analyses.getExperimentParticipantHealthIndicators(
        Fixtures.createExperimentFull(),
        Analyses.getExperimentParticipantStats(
          Fixtures.createExperimentFull({
            variations: [
              { variationId: 1, allocatedPercentage: 50, isDefault: true, name: 'variation_name_1' },
              { variationId: 2, allocatedPercentage: 50, isDefault: false, name: 'variation_name_2' },
            ],
          }),
          {
            [AnalysisStrategy.IttPure]: Fixtures.createAnalysis({
              participantStats: {
                total: 0,
                variation_1: 0,
                variation_2: 0,
              },
            }),
            [AnalysisStrategy.PpNaive]: Fixtures.createAnalysis({
              participantStats: {
                total: 0,
                variation_1: 0,
                variation_2: 0,
              },
            }),
          },
        ),
      ),
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "indication": Object {
            "code": "nominal",
            "reason": "0.05 < x ≤ 1",
            "severity": "Ok",
          },
          "link": "https://fieldguide.automattic.com/the-experimentation-platform/experiment-health/#assignment-distributions",
          "name": "Assignment distribution",
          "unit": "p-value",
          "value": 1,
        },
        Object {
          "indication": Object {
            "code": "nominal",
            "reason": "0.05 < x ≤ 1",
            "severity": "Ok",
          },
          "link": "https://fieldguide.automattic.com/the-experimentation-platform/experiment-health/#ratios",
          "name": "Assignment distribution without crossovers and spammers",
          "unit": "p-value",
          "value": 1,
        },
        Object {
          "indication": Object {
            "code": "value error",
            "reason": "Unexpected value",
            "recommendation": "Contact @experiment-review.",
            "severity": "Error",
          },
          "link": "https://fieldguide.automattic.com/the-experimentation-platform/experiment-health/#ratios",
          "name": "Ratio of crossovers to assigned",
          "unit": "ratio",
          "value": NaN,
        },
        Object {
          "indication": Object {
            "code": "value error",
            "reason": "Unexpected value",
            "recommendation": "Contact @experiment-review.",
            "severity": "Error",
          },
          "link": "https://fieldguide.automattic.com/the-experimentation-platform/experiment-health/#ratios",
          "name": "Ratio of spammers to assigned",
          "unit": "ratio",
          "value": NaN,
        },
      ]
    `)
  })
})

describe('getExperimentHealthIndicators', () => {
  it('should work correctly', () => {
    expect(
      Analyses.getExperimentHealthIndicators(
        Fixtures.createExperimentFull({
          variations: [
            { variationId: 1, allocatedPercentage: 50, isDefault: true, name: 'variation_name_1' },
            { variationId: 2, allocatedPercentage: 50, isDefault: false, name: 'variation_name_2' },
          ],
        }),
      ),
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "indication": Object {
            "code": "very low",
            "reason": "−∞ < x ≤ 3",
            "recommendation": "Experiments should generally run for at least a week before drawing conclusions.",
            "severity": "Warning",
          },
          "link": "https://fieldguide.automattic.com/the-experimentation-platform/experiment-health/#experiment-run-time",
          "name": "Experiment run time",
          "unit": "days",
          "value": 0,
        },
      ]
    `)
  })

  it('should work for an experiment that ran too long', () => {
    const startDatetime = new Date('2021-04-01T00:00:00Z')
    const endDatetime = new Date('2021-05-21T00:00:00Z')

    expect(
      Analyses.getExperimentHealthIndicators(
        Fixtures.createExperimentFull({
          startDatetime,
          endDatetime,
          status: Status.Completed,
          variations: [
            { variationId: 1, allocatedPercentage: 50, isDefault: true, name: 'variation_name_1' },
            { variationId: 2, allocatedPercentage: 50, isDefault: false, name: 'variation_name_2' },
          ],
        }),
      ),
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "indication": Object {
            "code": "very high",
            "reason": "42 < x ≤ ∞",
            "recommendation": "Experiment has been running for way too long. Stopping it now is highly recommended.",
            "severity": "Warning",
          },
          "link": "https://fieldguide.automattic.com/the-experimentation-platform/experiment-health/#experiment-run-time",
          "name": "Experiment run time",
          "unit": "days",
          "value": 50,
        },
      ]
    `)
  })

  it('should take into consideration runtimeWhitelistedPlatforms', () => {
    const experimentRunTimeDays = 1
    const startDatetime = subDays(new Date(), experimentRunTimeDays)

    expect(
      Analyses.getExperimentHealthIndicators(
        Fixtures.createExperimentFull({
          startDatetime,
          status: Status.Running,
          platform: Analyses.runtimeWhitelistedPlatforms[0],
          variations: [
            { variationId: 1, allocatedPercentage: 50, isDefault: true, name: 'variation_name_1' },
            { variationId: 2, allocatedPercentage: 50, isDefault: false, name: 'variation_name_2' },
          ],
        }),
      ),
    ).toMatchInlineSnapshot(`Array []`)
  })
})

describe('estimateTotalParticipantsInPeriod', () => {
  it('should work correctly', () => {
    const startDatetime = new Date('2021-04-01T00:00:00Z')
    const endDatetime = new Date('2021-04-11T00:00:00Z')
    expect(
      Analyses.estimateTotalParticipantsInPeriod(
        Fixtures.createAnalysis({
          participantStats: {
            total: 100,
          },
        }),
        Fixtures.createExperimentFull({
          startDatetime,
          endDatetime,
          status: Status.Completed,
          variations: [
            { variationId: 1, allocatedPercentage: 50, isDefault: true, name: 'variation_name_1' },
            { variationId: 2, allocatedPercentage: 50, isDefault: false, name: 'variation_name_2' },
          ],
        }),
        30,
      ),
    ).toBe(300)
  })

  it('should work for total allocated percentage less than 100', () => {
    const startDatetime = new Date('2021-04-01T00:00:00Z')
    const endDatetime = new Date('2021-04-11T00:00:00Z')
    expect(
      Analyses.estimateTotalParticipantsInPeriod(
        Fixtures.createAnalysis({
          participantStats: {
            total: 100,
          },
        }),
        Fixtures.createExperimentFull({
          startDatetime,
          endDatetime,
          status: Status.Completed,
          variations: [
            { variationId: 1, allocatedPercentage: 10, isDefault: true, name: 'variation_name_1' },
            { variationId: 2, allocatedPercentage: 40, isDefault: false, name: 'variation_name_2' },
          ],
        }),
        30,
      ),
    ).toBe(600)
  })
})
