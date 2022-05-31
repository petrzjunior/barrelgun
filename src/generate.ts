import fg from 'fast-glob';
import Path from 'path';
import {writeFile} from 'fs/promises';

export type LineTemplate = (file: string) => string;
export type FileTemplate = (files: string[], lineTemplate: LineTemplate) => string;

export interface BarrelgunConfigBarrel {
	path: string | string[];
	files: string | string[];
	fileTemplate?: FileTemplate;
	lineTemplate?: LineTemplate;
}

export interface BarrelgunConfig {
	barrels: BarrelgunConfigBarrel[];
}

type ParsedPath = { dir: string, filename: string };

interface ParsedBarrelgunConfigBarrel {
	path: ParsedPath;
	files: string[];
	fileTemplate: FileTemplate;
	lineTemplate: LineTemplate;
}

interface ParsedBarrelgunConfig {
	barrels: ParsedBarrelgunConfigBarrel[];
}

const defaultLineTemplate: LineTemplate = (file) => `export * from '${file}';`;

const defaultFileTemplate: FileTemplate = (files, lineTemplate) =>
	`// Generated by barrelgun. DO NOT EDIT

${files.map(file => lineTemplate(file)).join('\n')}
`;
const findBarrelDirs = async (globs: string | string[]): Promise<ParsedPath[]> => {
	if (typeof globs === 'string') {
		return findBarrelDirs([globs]);
	}
	const dirs = await Promise.all(globs.map(async glob => {
		const {dir, base} = Path.parse(glob);
		if (!(dir?.length > 0)) {
			throw new Error(`'${glob}' is not a valid path`);
		}
		const dirs = await fg(dir, {onlyDirectories: true});
		return dirs.map(dir => ({dir, filename: base}));
	}));
	return dirs.flat();
};


const parseConfig = async (config: BarrelgunConfig): Promise<ParsedBarrelgunConfig> => {
	const barrels = await Promise.all(config.barrels.map(async barrel => {
		const dirs = await findBarrelDirs(barrel.path);
		const files = typeof barrel.files === 'string' ? [barrel.files] : barrel.files;
		return dirs.map(dir => {
			return {
				path: dir,
				files,
				fileTemplate: barrel.fileTemplate ?? defaultFileTemplate,
				lineTemplate: barrel.lineTemplate ?? defaultLineTemplate,
			};
		});
	}));
	return {
		barrels: barrels.flat(),
	};
};

const findFilesToImport = async (base: string, glob: string | string[], barrelFile: string): Promise<string[]> => {
	const files = await fg(glob, {cwd: base});
	return files
		// exclude self
		.filter(file => file != barrelFile)
		// make relative path
		.map(file => {
			const {dir, name} = Path.parse(file);
			return `./${Path.join(dir, name)}`;
		});
};

const sortLines = (lines: string[]): string[] => {
	// TODO: hierarchical sort, dash is sorted before slash
	return lines.sort((a, b) => a.localeCompare(b));
};

const renderTemplate = (files: string[], barrel: ParsedBarrelgunConfigBarrel): string => {
	return barrel.fileTemplate(files, file => barrel.lineTemplate(file));
};

const writeBarrel = async (path: string, content: string): Promise<void> => {
	await writeFile(path, content);
};

const generate = async (config: BarrelgunConfig) => {
	console.log('Scanning filesystem');

	const parsedConfig = await parseConfig(config);

	console.log(`Found ${parsedConfig.barrels.length} barrels to generate`);

	for (const barrel of parsedConfig.barrels) {
		const files = await findFilesToImport(barrel.path.dir, barrel.files, barrel.path.filename);
		const lines = sortLines(files);
		const content = renderTemplate(lines, barrel);
		const barrelPath = Path.format({dir: barrel.path.dir, base: barrel.path.filename});
		console.log(`  Writing barrel ${barrelPath}`);
		await writeBarrel(barrelPath, content);
	}
	console.log('Finished generating barrels');
};

export {generate};
