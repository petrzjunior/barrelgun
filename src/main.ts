import {Command} from 'commander';
import {BarrelgunShootOptions, shoot} from './shoot';

export type {BarrelgunConfig, BarrelgunConfigBarrel, LineTemplate, FileTemplate} from './generate';

const program = new Command();

program
	.name('barrelgun')
	.description('Barrel generator')
	.version('1.0.0');

program.command('shoot')
	.description('Generate barrels')
	.option('-c', '--config <path>')
	.action(async (options: BarrelgunShootOptions) => await shoot(options));

program.parse();
