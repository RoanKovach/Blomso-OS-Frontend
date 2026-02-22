// Simple yield impact estimation based on soil metric deviations
export const calculateYieldImpact = (comparisons, targetsDict, crop) => {
  if (!targetsDict || Object.keys(targetsDict).length === 0) {
    return { impact: 0, message: "No crop targets available" };
  }

  let totalPenalty = 0;
  let impactFactors = [];

  comparisons.forEach(comp => {
    const target = targetsDict[comp.metric];
    if (!target) return;

    const current = parseFloat(comp.current);
    const { min, max } = target;

    let penalty = 0;
    let status = '';

    if (current < min) {
      penalty = Math.min(((min - current) / min) * 100, 25); // Max 25% penalty per metric
      status = `${comp.metricInfo.label} deficiency`;
    } else if (current > max) {
      penalty = Math.min(((current - max) / max) * 50, 15); // Max 15% penalty for excess
      status = `${comp.metricInfo.label} excess`;
    }

    if (penalty > 0) {
      totalPenalty += penalty;
      impactFactors.push({ metric: comp.metricInfo.label, penalty: Math.round(penalty), status });
    }
  });

  // Cap total penalty at 40%
  totalPenalty = Math.min(totalPenalty, 40);

  let message = '';
  if (totalPenalty === 0) {
    message = `Optimal soil conditions for ${crop}`;
  } else if (totalPenalty <= 10) {
    message = `Minor yield impact (~${Math.round(totalPenalty)}%)`;
  } else if (totalPenalty <= 25) {
    message = `Moderate yield impact (~${Math.round(totalPenalty)}%)`;
  } else {
    message = `Significant yield impact (~${Math.round(totalPenalty)}%)`;
  }

  return {
    impact: Math.round(totalPenalty),
    message,
    factors: impactFactors
  };
};