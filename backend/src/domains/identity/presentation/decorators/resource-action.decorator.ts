import { SetMetadata } from '@nestjs/common';

export const RESOURCE_ACTION_KEY = 'resource_action';

export interface ResourceActionMetadata {
  resource: string;
  action: string;
}

export const ResourceAction = (resource: string, action: string) =>
  SetMetadata(RESOURCE_ACTION_KEY, { resource, action });
