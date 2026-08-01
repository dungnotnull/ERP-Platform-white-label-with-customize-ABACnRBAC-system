/** @deprecated Replaced by ABAC system. Do not use in new code. */
import { SetMetadata } from '@nestjs/common';

export const SKIP_ENDPOINT_PERMISSION_KEY = 'skipEndpointPermission';

export const SkipEndpointPermission = () =>
  SetMetadata(SKIP_ENDPOINT_PERMISSION_KEY, true);
