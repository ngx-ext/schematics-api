import * as ts from '@schematics/angular/third_party/github.com/Microsoft/TypeScript/lib/typescript';
import {
    addBootstrapToModule,
    addDeclarationToModule,
    addEntryComponentToModule,
    addExportToModule,
    addImportToModule,
    addProviderToModule,
    addRouteDeclarationToModule,
    addSymbolToNgModuleMetadata,
    getRouterModuleDeclaration,
    insertImport,
    isImported,
} from '@schematics/angular/utility/ast-utils';
import { Tree } from '@angular-devkit/schematics';
import { getProjectRootModulePath, getSourceFile } from './functions';
import { applyToUpdateRecorder, Change } from '@schematics/angular/utility/change';
import { normalize } from '@angular-devkit/core';

export class RootModule {
    public readonly path: string;
    public readonly source: ts.SourceFile;
    public readonly importPath: string;
    public readonly tree: Tree;
    protected allChanges: Array<Change> = [];
    protected static _instance: RootModule;

    public static getInstance(tree: Tree, importPath: string): RootModule {
        if (!this._instance) {
            this._instance = new RootModule(tree, importPath);
        }
        return this._instance;
    }

    private constructor(tree: Tree, importPath: string) {
        this.tree = tree;
        this.importPath = normalize(importPath);
        this.path = normalize('./' + getProjectRootModulePath(tree));
        this.source = getSourceFile(tree, this.path);
    }

    public getAllChanges(): ReadonlyArray<Change> {
        return this.allChanges;
    }

    /**
     * Allows to overwrite the changes
     * @example leaving only insertions:
     * const root = RootModule.getInstance(tree, '@my/lib');
     * root.addExport(...); root.addImport(...); etc
     * root.setAllChanges(root.getAllChanges()
     *      .filter(change => change instanceof InsertChange));
     * root.applyAllChanges();
     */
    public setAllChanges(allChanges: Array<Change>): void {
        this.allChanges = allChanges;
    }

    public applyAllChanges(): Tree {
        const recorder = this.tree.beginUpdate(this.path);
        applyToUpdateRecorder(recorder, this.allChanges);
        this.tree.commitUpdate(recorder);
        return this.tree;
    }

    /**
     * Clears list of changes, doesn't revert them if already applied
     */
    public discardAllChanges(): void {
        this.allChanges = [];
    }

    /**
     * Add Import statement (`import { symbolName } from fileName`) if the import doesn't exist already.
     * @param symbolName (item to import)
     * @param fileName (path to the file)
     * @param isDefault (if true, import follows style for importing default exports)
     * @return Change
     */
    public insertImport(symbolName: string, fileName: string, isDefault?: boolean): Change {
        const change = insertImport(this.source, this.path, symbolName, fileName, isDefault);
        this.allChanges.push(change);
        return change;
    }

    /**
     * Custom function to insert a declaration (component, pipe, directive)
     * into NgModule declarations. It also imports the component.
     */
    public addDeclaration(classifiedName: string, importPathAppend?: string): Array<Change> {
        const changes = addDeclarationToModule(
            this.source, this.path, classifiedName, this.getImportPath(importPathAppend));
        this.allChanges = this.allChanges.concat(changes);
        return changes;
    }

    /**
     * Custom function to insert an NgModule into NgModule imports. It also imports the module.
     */
    public addImport(classifiedName: string, importPathAppend?: string): Array<Change> {
        const changes = addImportToModule(
            this.source, this.path, classifiedName, this.getImportPath(importPathAppend));
        this.allChanges = this.allChanges.concat(changes);
        return changes;
    }

    /**
     * Custom function to insert a provider into NgModule. It also imports it.
     */
    public addProvider(classifiedName: string, importPathAppend?: string): Array<Change> {
        const changes = addProviderToModule(
            this.source, this.path, classifiedName, this.getImportPath(importPathAppend));
        this.allChanges = this.allChanges.concat(changes);
        return changes;
    }

    /**
     * Custom function to insert an export into NgModule. It also imports it.
     */
    public addExport(classifiedName: string, importPathAppend?: string): Array<Change> {
        const changes = addExportToModule(
            this.source, this.path, classifiedName, this.getImportPath(importPathAppend));
        this.allChanges = this.allChanges.concat(changes);
        return changes;
    }

    /**
     * Custom function to insert an export into NgModule. It also imports it.
     */
    public addBootstrap(classifiedName: string, importPathAppend?: string): Array<Change> {
        const changes = addBootstrapToModule(
            this.source, this.path, classifiedName, this.getImportPath(importPathAppend));
        this.allChanges = this.allChanges.concat(changes);
        return changes;
    }

    /**
     * Custom function to insert an entryComponent into NgModule. It also imports it.
     * @deprecated - Since Angular 9.0.0 with Ivy, entryComponents is no longer necessary.
     */
    public addEntryComponent(classifiedName: string, importPathAppend?: string): Array<Change> {
        const changes = addEntryComponentToModule(
            this.source, this.path, classifiedName, this.getImportPath(importPathAppend));
        this.allChanges = this.allChanges.concat(changes);
        return changes;
    }

    /**
     * Determine if an import already exists.
     */
    public isImported(classifiedName: string, importPathAppend?: string): boolean {
        return isImported(this.source, classifiedName, this.getImportPath(importPathAppend));
    }

    /**
     * Returns the RouterModule declaration from NgModule metadata, if any.
     */
    public getRouterModuleDeclaration(): ts.Expression | undefined {
        return getRouterModuleDeclaration(this.source);
    }

    /**
     * Adds a new route declaration to a router module (i.e. has a RouterModule declaration)
     */
    public addRouteDeclarationToModule(fileToAdd: string, routeLiteral: string): Change {
        const change = addRouteDeclarationToModule(this.source, fileToAdd, routeLiteral);
        this.allChanges.push(change);
        return change;
    }

    public getDecoratorMetadata(metadataField: string, symbolName: string, importPath?: string): Array<Change> {
        const changes = addSymbolToNgModuleMetadata(
            this.source, this.path, metadataField, symbolName, importPath);
        this.allChanges = this.allChanges.concat(changes);
        return changes;
    }

    public addSymbolToNgModuleMetadata(metadataField: string, symbolName: string,
                                       importPathAppend?: string): Array<Change> {
        const changes = addSymbolToNgModuleMetadata(
            this.source, this.path, metadataField, symbolName, this.getImportPath(importPathAppend));
        this.allChanges = this.allChanges.concat(changes);
        return changes;
    }

    protected getImportPath(append?: string) {
        if (append) {
            return normalize(this.importPath + append);
        }
        return this.importPath;
    }
}
