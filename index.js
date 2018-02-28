"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const glob = require("glob");
const cp = require("child_process");
const path = require("path");
const uglify = require('uglify-es');
module.exports = function (options) {
    return function (req, res, next) {
        if (path.parse(req.path).ext.match(/(\.min)?\.js$/)) {
            let projects = [];
            if (typeof options == 'string') {
                projects.push({ config: options });
            }
            else {
                options.projects && (projects = options.projects);
                options.project && typeof options.project != 'string' && projects.push(options.project);
                options.project && typeof options.project == 'string' && projects.push({ config: options.project });
            }
            projects.forEach(async (project) => {
                let tsc = typeof options == 'string' ? undefined : options.tsc;
                // TODO: Only compile files or files from projects that were requested
                await compileProject(project, tsc);
            });
        }
        next();
    };
};
async function minify(project) {
    return new Promise(resolve => {
        let cfg = JSON.parse(fs.readFileSync(project.config).toString());
        if (cfg.compilerOptions.outDir) {
            let g = path.join(path.resolve(path.parse(project.config).dir, cfg.compilerOptions.outDir), '**/*.js');
            glob(g, (err, files) => {
                files.forEach(file => {
                    let code = fs.readFileSync(file).toString();
                    let result = uglify.minify(code, project.uglify);
                    fs.writeFileSync(file, result.code);
                });
            });
            return resolve(true);
        }
        else if (cfg.compilerOptions.outFile) {
            let file = path.resolve(path.parse(project.config).dir, cfg.compilerOptions.outFile);
            let result = uglify.minify(fs.readFileSync(file).toString(), project.uglify);
            fs.writeFileSync(file, result.code);
            return resolve(true);
        }
        return resolve(false);
    });
}
async function compileProject(project, tscPath) {
    let cfgDir = path.parse(project.config).dir;
    let cfg = JSON.parse(fs.readFileSync(project.config).toString());
    let check = cfg.compilerOptions.outDir || cfg.compilerOptions.outFile || null;
    let tsDate = await getMtime(cfgDir, 'ts');
    let jsDate = await getMtime(path.resolve(cfgDir, check), 'js');
    if (!jsDate || (tsDate && jsDate && tsDate > jsDate)) {
        try {
            cp.execSync(`${getTscPath(tscPath)} -p "${project.config}"`);
            if (project.shouldUglify !== false) {
                await minify(project);
            }
        }
        catch (e) {
            console.error(e.stdout.toString());
            console.error(e.stderr.toString());
        }
    }
    return;
}
async function getMtime(dirPath, type) {
    return new Promise(resolve => {
        try {
            let stat = fs.statSync(dirPath);
            if (stat.isFile()) {
                return resolve(stat.mtime);
            }
            else if (stat.isDirectory()) {
                let lastMod = new Date(1970, 0);
                glob(path.join(dirPath, '**/*.' + type), (err, files) => {
                    files.forEach(file => {
                        let stat = fs.statSync(file);
                        if (stat.isFile() && stat.mtime > lastMod) {
                            lastMod = stat.mtime;
                        }
                    });
                    return resolve(lastMod);
                });
            }
        }
        catch (e) {
            return resolve(null);
        }
    });
}
function getTscPath(tscPath) {
    return tscPath ? tscPath : path.join(__dirname, './node_modules/.bin/tsc');
}
