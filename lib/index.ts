// ---------------------------------------------------------------------------------------------------------------------
// tsconfig-files | https://github.com/eth-p/node-tsconfig-files | Copyright (C) 2019 eth-p
// ---------------------------------------------------------------------------------------------------------------------
import * as Filesystem from "fs-extra";
import * as Micromatch from "micromatch";
import * as Path from "path";

import findUp = require("find-up");
import flat = require("array.prototype.flat");
import {readdirp, readdirpSync} from "fs-readdirp";

// ---------------------------------------------------------------------------------------------------------------------

/**
 * Finds the files from a tsconfig.json file.
 *
 * @param cwd The directory to search for the tsconfig file.
 *
 * @returns An array of matched files.
 * @throws Error When tsconfig.json doesn't exist.
 */
export async function getFilesFromTsconfig(cwd: string): Promise<string[]> {
	let tsconfig = await findUp.sync('tsconfig.json', {cwd});
	if (tsconfig == null) throw new Error('Could not find tsconfig.json');
	return await getFilesFromTsconfigJson(await Filesystem.readJSON(tsconfig), cwd);
}

/**
 * Synchronously finds the files from a tsconfig.json file.
 *
 * @param cwd The directory to search for the tsconfig file.
 *
 * @returns An array of matched files.
 * @throws Error When tsconfig.json doesn't exist.
 */
export function getFilesFromTsconfigSync(cwd: string): string[] {
	let tsconfig = findUp.sync('tsconfig.json', {cwd});
	if (tsconfig == null) throw new Error('Could not find tsconfig.json');
	return getFilesFromTsconfigJsonSync(Filesystem.readJSONSync(tsconfig), cwd);
}

/**
 * Finds the files from the contents of a tsconfig.json file.
 *
 * @param json The tsconfig.json object.
 * @param cwd The directory to search for the tsconfig file.
 *
 * @returns An array of matched files.
 * @throws Error When tsconfig.json doesn't exist.
 */
export async function getFilesFromTsconfigJson(json: any, cwd: string): Promise<string[]> {
	let {include, exclude} = generatePatterns(json);
	let includeFns = include.map(compilePattern);
	let excludeFns = exclude.map(compilePattern);

	return new Promise((resolve, reject) => {
		readdirp(cwd, (path, stats) => {
			if (stats.isDirectory()) return false;

			let rel = Path.relative(cwd, path);
			if (excludeFns.some(fn => fn(rel))) return false;
			if (!includeFns.some(fn => fn(rel))) return false;
			return rel;
		}, (err, files) => {
			if (err) return reject(err);
			resolve(files);
		});
	});
}

/**
 * }
 * Synchronously finds the files from the contents of a tsconfig.json file.
 *
 * @param json The tsconfig.json object.
 * @param cwd The directory to search for the tsconfig file.
 *
 * @returns An array of matched files.
 * @throws Error When tsconfig.json doesn't exist.
 */
export function getFilesFromTsconfigJsonSync(json: any, cwd: string): string[] {
	let {include, exclude} = generatePatterns(json);
	let includeFns = include.map(compilePattern);
	let excludeFns = exclude.map(compilePattern);

	return readdirpSync(cwd, (path, stats) => {
		if (stats.isDirectory()) return false;

		let rel = Path.relative(cwd, path);
		if (excludeFns.some(fn => fn(rel))) return false;
		if (!includeFns.some(fn => fn(rel))) return false;
		return rel;
	});
}

// ---------------------------------------------------------------------------------------------------------------------

/**
 * Normalizes glob patterns.
 * This simply converts backslashes to slashes.
 *
 * @param patterns The patterns to normalize.
 * @returns The normalized patterns.
 *
 * @internal
 */
function normalizePatterns(patterns: string[] | undefined): string[] {
	if (patterns === undefined) return patterns;
	return patterns.map(f => f.replace('\\', '/'));
}

/**
 * Escapes glob patterns.
 *
 * @param patterns The patterns to escape.
 * @returns The escaped patterns.
 */
function escapePatterns(patterns: string[] | undefined): string[] {
	if (patterns === undefined) return patterns;
	return patterns.map(f => f.replace(/([*?])/, '\\$1'));
}

/**
 * Determines the applicable file extensions from tsconfig.json.
 *
 * @param json The tsconfig.json contents.
 * @returns An array of file extensions.
 */
function getExts(json: any): string[] {
	let exts = ['.d.ts', '.ts', '.tsx'];

	// Allow .js and .jsx if allowJs is set to true.
	if (json.compilerOptions != null && json.compilerOptions.allowJs) {
		exts.push('.js', '.jsx');
	}

	return exts;
}

/**
 * Generates micromatch patterns from the tsconfig.json files/include/exclude fields.
 *
 * @param json The tsconfig.json contents.
 * @returns The patterns.
 */
function generatePatterns(json: any): { include: string[], exclude: string[] } {
	let exts = getExts(json);
	let files = escapePatterns(normalizePatterns(json.files)) || [];
	let include = generateGlobs(normalizePatterns(json.include), exts) || [];
	let exclude = generateGlobs(normalizePatterns(json.exclude), ['']) || [];

	if (files === undefined && include === undefined) {
		return {
			include: generateGlobs(['**/*'], exts),
			exclude: exclude
		}
	}

	return {
		include: files.concat(include),
		exclude: exclude
	};
}

/**
 * Generates micromatch patterns from a tsconfig.json glob.
 *
 * @param globs The globs.
 * @param exts The applicable file extensions.
 *
 * @returns The compiled matchers.
 */
function generateGlobs(globs: string[] | undefined, exts: string[]): undefined | string[] {
	if (globs === undefined) return undefined;
	return flat(globs.map(f => {
		if (f.endsWith('*')) return f;
		let normalF = f.endsWith('/') ? f.substring(0, f.length - 1) : f;
		return [normalF].concat(exts.map(e => `${normalF}/**/*${e}`));
	}));
}

/**
 * Compiles a micromatch pattern.
 *
 * @param pattern The pattern to compile.
 *
 * @returns The compiled matcher.
 */
function compilePattern(pattern: string): ((string) => boolean) {
	return Micromatch.matcher(pattern, {nobrace: true, nonegate: true, noext: true, dot: true});
}
