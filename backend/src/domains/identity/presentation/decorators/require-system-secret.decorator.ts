import { SetMetadata } from '@nestjs/common';

export const REQUIRE_SYSTEM_SECRET_KEY = 'requireSystemSecret';

export const RequireSystemSecret = () => SetMetadata(REQUIRE_SYSTEM_SECRET_KEY, true);
