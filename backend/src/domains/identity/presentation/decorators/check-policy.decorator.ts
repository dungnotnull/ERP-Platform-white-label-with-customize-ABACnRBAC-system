import { SetMetadata } from '@nestjs/common';
import { IPolicyHandler } from '../policies/policy-handler.interface';

export const POLICY_KEY = 'check_policy';

export const CheckPolicy = (policy: IPolicyHandler) =>
  SetMetadata(POLICY_KEY, policy);
