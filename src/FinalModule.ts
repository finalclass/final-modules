class FinalModule {

  constructor(public name:string, public deps:string[]){}

  public getDepsWithSuffix(suffix:string):string[] {
    return this.deps.map((dep:string):string => dep + suffix);
  }

}

export = FinalModule;
