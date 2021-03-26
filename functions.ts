import { WorkspaceProject, WorkspaceSchema, WorkspaceTargets } from '@schematics/angular/utility/workspace-models';
import * as ts from '@schematics/angular/third_party/github.com/Microsoft/TypeScript/lib/typescript';
import { getAppModulePath } from '@schematics/angular/utility/ng-ast-utils';
import { SchematicsException, Tree } from '@angular-devkit/schematics';
import { virtualFs } from '@angular-devkit/core';
import { Host } from '@schematics/angular/utility/change';

/** Resolves the architect options for the build target of the given project. */
export function getProjectTargetOptions<BuildTarget extends keyof WorkspaceTargets>(
    project: WorkspaceProject,
    buildTarget: BuildTarget,
): WorkspaceTargets[BuildTarget]['options'] {
    if (
        project.architect &&
        project.architect[buildTarget] &&
        project.architect[buildTarget].options
    ) {
        return project.architect[buildTarget].options;
    }

    throw new SchematicsException(
        `Cannot determine project target configuration for: ${buildTarget}.`
    );
}

export function getWorkspace(host: Tree): WorkspaceSchema {
    const workspaceConfig = host.read('/angular.json');
    if (!workspaceConfig) {
        throw new SchematicsException(
            'Could not find Angular workspace configuration'
        );
    }
    return JSON.parse(workspaceConfig.toString());
}

/** Looks for the main TypeScript file in the given project and returns its path. */
export function getProjectMainFile(project: WorkspaceProject): string {
    const buildOptions = getProjectTargetOptions(project, 'build');

    if (!buildOptions.main) {
        throw new SchematicsException(
            `Could not find the project main file inside of the ` +
            `workspace config (${project.sourceRoot})`
        );
    }

    return buildOptions.main;
}

export function getProjectRootModulePath(tree: Tree) {
    const workspace = getWorkspace(tree);
    const project = workspace.projects[workspace.defaultProject];
    return getAppModulePath(tree, getProjectMainFile(project));
}

/** Reads file given path and returns TypeScript source file. */
export function getSourceFile(host: Tree, path: string): ts.SourceFile {
    const buffer = host.read(path);
    if (!buffer) {
        throw new SchematicsException(`Could not find file for path: ${path}`);
    }
    return ts.createSourceFile(
        path,
        buffer.toString(),
        ts.ScriptTarget.Latest,
        true
    );
}

export function createHost(tree: Tree): Host {
    return {
        async read(path: string): Promise<string> {
            const data = tree.read(path);
            if (!data) {
                throw new SchematicsException('File not found.');
            }
            return virtualFs.fileBufferToString(data);
        },
        async write(path: string, data: string): Promise<void> {
            return tree.overwrite(path, data);
        },
    };
}
