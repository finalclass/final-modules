declare module "dependency-resolver" {
  class DependencyResolver {
    private services;
    constructor();
    add(name: string): void;
    private addAndGet(serviceName);
    setDependency(serviceName: string, dependencyName: string): void;
    resolve(serviceName: string): string[];
    private recursiveResolve(service, resolved, unresolved);
  }

  export = DependencyResolver;
}