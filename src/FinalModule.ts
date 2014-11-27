class FinalModule {

  constructor(public name:string, public deps:string[]){}

  public getDeps(prefix:string, suffix:string):string[] {
    return this.deps.map((dep:string):string => prefix + dep + suffix);
  }

}

export = FinalModule;
