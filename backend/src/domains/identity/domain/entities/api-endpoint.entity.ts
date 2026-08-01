import { Entity } from '@/shared/domain/entity.base';

export interface ApiEndpointProps {
  method: string;
  pathPattern: string;
  label?: string;
}

export class ApiEndpointEntity extends Entity<ApiEndpointProps> {
  get method(): string {
    return this.props.method;
  }

  get pathPattern(): string {
    return this.props.pathPattern;
  }

  get label(): string | undefined {
    return this.props.label;
  }

  constructor(id: string, props: ApiEndpointProps) {
    super(id, props);
  }
}
