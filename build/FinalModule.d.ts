declare class FinalModule {
    name: string;
    deps: string[];
    constructor(name: string, deps: string[]);
    getDepsWithSuffix(suffix: string): string[];
}
export = FinalModule;
