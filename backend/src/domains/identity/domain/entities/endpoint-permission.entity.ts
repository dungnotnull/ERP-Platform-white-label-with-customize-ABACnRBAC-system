import { Entity } from '@/shared/domain/entity.base';

export interface EndpointPermissionProps {
  method: string;
  pathPattern: string;
  module: string;
  permission: string;
  bitIndex: number;
  pathRegex?: string;
  isActive?: boolean;
  description?: string;
}

export class EndpointPermissionEntity extends Entity<EndpointPermissionProps> {
  get method(): string {
    return this.props.method;
  }

  get pathPattern(): string {
    return this.props.pathPattern;
  }

  get module(): string {
    return this.props.module;
  }

  get permission(): string {
    return this.props.permission;
  }

  get bitIndex(): number {
    return this.props.bitIndex;
  }

  get pathRegex(): string | undefined {
    return this.props.pathRegex;
  }

  get isActive(): boolean {
    return this.props.isActive ?? true;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  constructor(id: string, props: EndpointPermissionProps) {
    super(id, props);
  }

  public update(props: Partial<Omit<EndpointPermissionProps, 'bitIndex'>>): void {
    if (props.method !== undefined) {
      this.props.method = props.method;
    }
    if (props.pathPattern !== undefined) {
      this.props.pathPattern = props.pathPattern;
    }
    if (props.module !== undefined) {
      this.props.module = props.module;
    }
    if (props.permission !== undefined) {
      this.props.permission = props.permission;
    }
    if (props.pathRegex !== undefined) {
      this.props.pathRegex = props.pathRegex;
    }
    if (props.isActive !== undefined) {
      this.props.isActive = props.isActive;
    }
    if (props.description !== undefined) {
      this.props.description = props.description;
    }
  }
}
