import {
  BanditArm,
  BanditExperimentType,
  BanditParams,
  Context,
  FormOutcomeType,
  PriorType,
} from '@/app/experiments/create/experiment-form/experiment-form-types';

type RewardType = 'binary' | 'real-valued';

export const getCanonicalRewardType = (outcomeType?: FormOutcomeType): RewardType =>
  outcomeType === 'binary' ? 'binary' : 'real-valued';

const maybeConvertArm = (arm: BanditArm, priorType: PriorType, index: number): BanditArm => {
  const baseArm = {
    arm_name: arm.arm_name,
    arm_description: arm.arm_description,
  };

  if (priorType === 'beta') {
    return {
      ...baseArm,
      alpha_prior: arm.alpha_prior ?? 1,
      beta_prior: arm.beta_prior ?? 1,
      mean_prior: undefined,
      stddev_prior: undefined,
    };
  }

  return {
    ...baseArm,
    mean_prior: arm.mean_prior ?? (index === 0 ? 0 : 1),
    stddev_prior: arm.stddev_prior ?? 1,
    alpha_prior: undefined,
    beta_prior: undefined,
  };
};

const maybeConvertArms = (arms: BanditArm[] | undefined, priorType: PriorType): BanditArm[] => {
  return (arms ?? []).map((arm, index) => maybeConvertArm(arm, priorType, index));
};

const getDefaultBanditArms = (priorType: PriorType): BanditArm[] => {
  if (priorType === 'beta') {
    return [
      { arm_name: 'Control', arm_description: 'Control', alpha_prior: 1, beta_prior: 1 },
      { arm_name: 'Treatment', arm_description: 'Treatment', alpha_prior: 2, beta_prior: 1 },
    ];
  }
  return [
    { arm_name: 'Control', arm_description: 'Control', mean_prior: 0, stddev_prior: 1 },
    { arm_name: 'Treatment', arm_description: 'Treatment', mean_prior: 1, stddev_prior: 1 },
  ];
};

const getDefaultContexts = (): Context[] => [{ name: 'Context', description: '', type: 'real-valued' }];

export const toMabBanditParams = (outcomeType: FormOutcomeType, arms: BanditArm[]): BanditParams => {
  if (outcomeType === 'binary') {
    return {
      experimentType: 'mab_online',
      outcomeType: 'binary',
      priorType: 'beta',
      arms: maybeConvertArms(arms, 'beta'),
    };
  }
  return {
    experimentType: 'mab_online',
    outcomeType: 'real',
    priorType: 'normal',
    arms: maybeConvertArms(arms, 'normal'),
  };
};

export const toCmabBanditParams = (
  outcomeType: FormOutcomeType,
  arms: BanditArm[],
  contexts?: Context[],
): BanditParams => ({
  experimentType: 'cmab_online',
  outcomeType,
  priorType: 'normal',
  arms: maybeConvertArms(arms, 'normal'),
  contexts: contexts && contexts.length > 0 ? contexts : getDefaultContexts(),
});

export const createDefaultBanditParams = (experimentType: BanditExperimentType): BanditParams => {
  if (experimentType === 'mab_online') {
    return toMabBanditParams('binary', getDefaultBanditArms('beta'));
  }
  return toCmabBanditParams('real', getDefaultBanditArms('normal'), getDefaultContexts());
};

export const toBanditParamsForExperimentType = (
  experimentType: BanditExperimentType,
  current?: BanditParams,
): BanditParams => {
  if (current === undefined) {
    return createDefaultBanditParams(experimentType);
  }
  switch (experimentType) {
    case 'mab_online':
      return toMabBanditParams(current.outcomeType, current.arms);
    case 'cmab_online':
      return toCmabBanditParams(current.outcomeType, getDefaultBanditArms('normal'), getDefaultContexts());
  }
};
