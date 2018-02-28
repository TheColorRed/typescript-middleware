import * as fs from 'fs'
import * as glob from 'glob'
import * as cp from 'child_process'
import * as path from 'path'
import { MinifyOptions } from 'uglify-js'
import { NextFunction, Request, Response, RequestHandler } from 'express';

const uglify = require('uglify-es')
declare namespace typeScriptMiddleware {
  export function tsm(options: TypeScriptOptions | string): RequestHandler
}
declare function typeScriptMiddleware(options: TypeScriptOptions | string): any

export interface TypeScriptProject {
  /**
   * The tsconfig.json file to use
   *
   * @type {string}
   * @memberof TypeScriptProject
   */
  config: string
  /**
   * Whether or not to enable minification. Defaults to true.
   *
   * @type {boolean}
   * @memberof TypeScriptProject
   */
  shouldUglify?: boolean
  /**
   * uglfiy-es settings.
   *
   * @see https://www.npmjs.com/package/uglify-es#minify-options
   * @type {MinifyOptions}
   * @memberof TypeScriptProject
   */
  uglify?: MinifyOptions
}

export interface TypeScriptOptions {
  /**
   * An array of projects to watch
   *
   * @type {TypeScriptProject[]}
   * @memberof TypeScriptOptions
   */
  projects?: TypeScriptProject[]
  /**
   * A single project to watch
   *
   * @type {(TypeScriptProject | string)}
   * @memberof TypeScriptOptions
   */
  project?: TypeScriptProject | string
  /**
   * An alternative tsc compiler to run
   *
   * @type {string}
   * @memberof TypeScriptOptions
   */
  tsc?: string
}

/**
 * The primary middleware function
 *
 * @export
 * @param {(TypeScriptOptions | string)} options Options to pass or a path to the tsconfig.json
 * @returns
 */
export declare function tsm(options: TypeScriptOptions | string): RequestHandler

module.exports = function (options: TypeScriptOptions | string): RequestHandler {
  return function (req: Request, res: Response, next: NextFunction) {
    if (path.parse(req.path).ext.match(/(\.min)?\.js$/)) {
      let projects: TypeScriptProject[] = []
      if (typeof options == 'string') {
        projects.push({ config: options })
      } else {
        options.projects && (projects = options.projects)
        options.project && typeof options.project != 'string' && projects.push(options.project)
        options.project && typeof options.project == 'string' && projects.push({ config: options.project })
      }
      projects.forEach(async project => {
        let tsc = typeof options == 'string' ? undefined : options.tsc
        // TODO: Only compile files or files from projects that were requested
        await compileProject(project, tsc)
      })
    }
    next()
  }
}

async function minify(project: TypeScriptProject) {
  return new Promise(resolve => {
    let cfg = JSON.parse(fs.readFileSync(project.config).toString())
    if (cfg.compilerOptions.outDir) {
      let g = path.join(path.resolve(path.parse(project.config).dir, cfg.compilerOptions.outDir), '**/*.js')
      glob(g, (err, files) => {
        files.forEach(file => {
          let code = fs.readFileSync(file).toString()
          let result = uglify.minify(code, project.uglify)
          fs.writeFileSync(file, result.code)
        })
      })
      return resolve(true)
    } else if (cfg.compilerOptions.outFile) {
      let file = path.resolve(path.parse(project.config).dir, cfg.compilerOptions.outFile)
      let result = uglify.minify(fs.readFileSync(file).toString(), project.uglify)
      fs.writeFileSync(file, result.code)
      return resolve(true)
    }
    return resolve(false)
  })
}

async function compileProject(project: TypeScriptProject, tscPath?: string) {
  let cfgDir = path.parse(project.config).dir
  let cfg = JSON.parse(fs.readFileSync(project.config).toString())
  let check = cfg.compilerOptions.outDir || cfg.compilerOptions.outFile || null
  let tsDate = await getMtime(cfgDir, 'ts')
  let jsDate = await getMtime(path.resolve(cfgDir, check), 'js')
  if (!jsDate || (tsDate && jsDate && tsDate > jsDate)) {
    try {
      cp.execSync(`${getTscPath(tscPath)} -p "${project.config}"`)
      if (project.shouldUglify !== false) {
        await minify(project)
      }
    } catch (e) {
      console.error(e.stdout.toString())
      console.error(e.stderr.toString())
    }
  }
  return
}

async function getMtime(dirPath: string, type: string) {
  return new Promise<Date | null>(resolve => {
    try {
      let stat = fs.statSync(dirPath)
      if (stat.isFile()) {
        return resolve(stat.mtime)
      } else if (stat.isDirectory()) {
        let lastMod: Date = new Date(1970, 0)
        glob(path.join(dirPath, '**/*.' + type), (err, files) => {
          files.forEach(file => {
            let stat = fs.statSync(file)
            if (stat.isFile() && stat.mtime > lastMod) {
              lastMod = stat.mtime
            }
          })
          return resolve(lastMod)
        })
      }
    } catch (e) {
      return resolve(null)
    }
  })
}

function getTscPath(tscPath?: string): string {
  return tscPath ? tscPath : path.join(__dirname, './node_modules/.bin/tsc')
}