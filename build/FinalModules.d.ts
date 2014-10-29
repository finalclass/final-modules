/// <reference path="../src/typings/tsd.d.ts" />
import IGulp = require('./IGulp');
declare class FinalModules {
    private modulesPath;
    private modules;
    constructor(modulesPath?: string);
    add(name: string, dependencies?: string[]): void;
    private map<T>(func);
    generateTasks(gulp: IGulp.Gulp): void;
    private static varNameFilter(filePath);
    private static escapeString(text);
    private getWatchTask(gulp, mod);
    private getStylTask(gulp, mod);
    private getMinTask(gulp, mod);
    private getTsTask(gulp, mod);
    private getHtmlTask(gulp, mod);
}
export = FinalModules;
