import { ProjectType } from '@schematics/angular/utility/workspace-models';

export interface AngularJson {
    cli: any;
    version: number,
    newProjectRoot: string,
    projects: {
        [key: string]: AngularProject;
    },
    defaultProject: string;
}

export interface AngularProject {
    projectType: ProjectType;
    schematics: any;
    root: string;
    sourceRoot: string;
    prefix: string;
    architect: {
        [key: string]: Partial<AngularProjectArchitect>;
        "e2e": {
            "configurations": {
                "production": {
                    "devServerTarget": "wheel4rent:serve:production"
                }
            }
        }
    }
}

export interface AngularProjectArchitect {
    builder: string;
    options: Partial<{
        browserTarget: string;
        outputPath: string;
        index: string;
        main: string;
        polyfills: string;
        tsConfig: string | Array<string>;
        aot: boolean;
        protractorConfig: string;
        devServerTarget: string;
        assets: Array<string>;
        styles: Array<string>;
        scripts: Array<string>;
        include: Array<string>;
        exclude: Array<string>;
    }>,
    configurations: {
        [key: string]: Partial<AngularProjectArchitectConfiguration>;
    }
}

export interface AngularProjectArchitectConfiguration {
    browserTarget: string;
    devServerTarget: string;
    fileReplacements: Array<FileReplacement>;
    optimization: boolean;
    outputHashing: string;
    sourceMap: boolean;
    namedChunks: boolean;
    extractLicenses: boolean;
    vendorChunk: boolean;
    buildOptimizer: boolean;
    budgets: Array<Partial<Budget>>;
    serviceWorker: boolean;
    ngswConfigPath: string;
}

export interface FileReplacement {
    replace: string;
    with: string;
}

export interface Budget {
    type: string;
    maximumWarning: string;
    maximumError: string;
}
