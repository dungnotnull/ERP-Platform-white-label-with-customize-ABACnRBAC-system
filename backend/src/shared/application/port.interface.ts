export interface IRepositoryPort {
  findById(id: string): Promise<unknown | null>;
  save(entity: unknown): Promise<unknown>;
}

export interface IServicePort {
  // Marker interface for cross-domain service ports
}
