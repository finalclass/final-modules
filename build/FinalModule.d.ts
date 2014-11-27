declare class FinalModule {
    name: string;
    deps: string[];
    constructor(name: string, deps: string[]);
    getDeps(prefix: string, suffix: string): string[];
}
export = FinalModule;
