/// <reference types="uglify-js" />
import { MinifyOptions } from 'uglify-js';
export interface TypeScriptProject {
    config: string;
    shouldUglify?: boolean;
    uglify?: MinifyOptions;
}
export interface TypeScriptOptions {
    projects?: TypeScriptProject[];
    project?: TypeScriptProject | string;
    tsc?: string;
}
