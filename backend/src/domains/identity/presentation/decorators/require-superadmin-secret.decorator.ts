import { SetMetadata } from '@nestjs/common';

export const REQUIRE_SUPERADMIN_SECRET_KEY = 'requireSuperadminSecret';

export const RequireSuperadminSecret = () => SetMetadata(REQUIRE_SUPERADMIN_SECRET_KEY, true);
