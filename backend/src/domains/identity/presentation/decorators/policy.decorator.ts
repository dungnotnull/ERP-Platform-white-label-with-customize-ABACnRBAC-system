import { SetMetadata } from '@nestjs/common';

export const POLICY_KEY = 'policy';

export const RequirePolicy = (policyName: string) =>
  SetMetadata(POLICY_KEY, policyName);
