/// <reference types="uglify-js" />
/// <reference types="express" />
import { MinifyOptions } from 'uglify-js';
import { RequestHandler } from 'express';
export interface TypeScriptProject {
    /**
     * The tsconfig.json file to use
     *
     * @type {string}
     * @memberof TypeScriptProject
     */
    config: string;
    /**
     * Whether or not to enable minification. Defaults to true.
     *
     * @type {boolean}
     * @memberof TypeScriptProject
     */
    shouldUglify?: boolean;
    /**
     * uglfiy-es settings.
     *
     * @see https://www.npmjs.com/package/uglify-es#minify-options
     * @type {MinifyOptions}
     * @memberof TypeScriptProject
     */
    uglify?: MinifyOptions;
}
export interface TypeScriptOptions {
    /**
     * An array of projects to watch
     *
     * @type {TypeScriptProject[]}
     * @memberof TypeScriptOptions
     */
    projects?: TypeScriptProject[];
    /**
     * A single project to watch
     *
     * @type {(TypeScriptProject | string)}
     * @memberof TypeScriptOptions
     */
    project?: TypeScriptProject | string;
    /**
     * An alternative tsc compiler to run
     *
     * @type {string}
     * @memberof TypeScriptOptions
     */
    tsc?: string;
}
/**
 * The primary middleware function
 *
 * @export
 * @param {(TypeScriptOptions | string)} options Options to pass or a path to the tsconfig.json
 * @returns
 */
export declare function tsm(options: TypeScriptOptions | string): RequestHandler;
