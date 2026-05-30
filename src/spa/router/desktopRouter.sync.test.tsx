import { readFile } from 'node:fs/promises';
import path from 'node:path';

import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const KNOWN_DIVERGENCES: Record<string, string> = {
  '/desktop-onboarding': '/onboarding',
};

interface RouteShape {
  children?: RouteNodeShape[];
  hasChildren: boolean;
  hasErrorElement: boolean;
  index: boolean;
  kind: 'route';
  path?: string;
}

interface SpreadShape {
  kind: 'spread';
  source: string;
}

type RouteNodeShape = RouteShape | SpreadShape;

const getPropertyName = (name: ts.PropertyName) => {
  if (ts.isIdentifier(name) || ts.isStringLiteralLike(name)) return name.text;
  return undefined;
};

const normalizePath = (path?: string) => (path ? (KNOWN_DIVERGENCES[path] ?? path) : undefined);

const extractRouteNodes = (
  array: ts.ArrayLiteralExpression,
  sourceFile: ts.SourceFile,
): RouteNodeShape[] => {
  const nodes: RouteNodeShape[] = [];

  for (const element of array.elements) {
    if (ts.isSpreadElement(element)) {
      nodes.push({ kind: 'spread', source: element.expression.getText(sourceFile) });
      continue;
    }

    if (ts.isObjectLiteralExpression(element)) {
      let path: string | undefined;
      let index = false;
      let hasErrorElement = false;
      let children: RouteNodeShape[] | undefined;

      for (const property of element.properties) {
        if (!ts.isPropertyAssignment(property)) continue;

        const propertyName = getPropertyName(property.name);
        if (!propertyName) continue;

        if (propertyName === 'children' && ts.isArrayLiteralExpression(property.initializer)) {
          children = extractRouteNodes(property.initializer, sourceFile);
        }

        if (propertyName === 'errorElement') {
          hasErrorElement = true;
        }

        if (propertyName === 'index') {
          index = property.initializer.kind === ts.SyntaxKind.TrueKeyword;
        }

        if (propertyName === 'path' && ts.isStringLiteralLike(property.initializer)) {
          path = normalizePath(property.initializer.text);
        }
      }

      nodes.push({
        children,
        hasChildren: Boolean(children?.length),
        hasErrorElement,
        index,
        kind: 'route',
        path,
      });
    }
  }

  return nodes;
};

const extractDesktopRouteTree = (sourceText: string, filePath: string): RouteNodeShape[] => {
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );

  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;

    for (const declaration of statement.declarationList.declarations) {
      if (
        ts.isIdentifier(declaration.name) &&
        declaration.name.text === 'desktopRoutes' &&
        declaration.initializer &&
        ts.isArrayLiteralExpression(declaration.initializer)
      ) {
        return extractRouteNodes(declaration.initializer, sourceFile);
      }
    }
  }

  throw new Error(`Unable to find desktopRoutes in ${filePath}`);
};

const normalizeRouteTree = (nodes: RouteNodeShape[]): RouteNodeShape[] => {
  const seenAbsolutePaths = new Set<string>();
  const normalizedNodes: RouteNodeShape[] = [];

  for (const node of nodes) {
    if (node.kind === 'spread') {
      normalizedNodes.push(node);
      continue;
    }

    const normalizedChildren = node.children ? normalizeRouteTree(node.children) : undefined;
    const normalizedNode: RouteShape = {
      ...node,
      children: normalizedChildren,
      hasChildren: Boolean(normalizedChildren?.length),
    };

    if (!normalizedNode.path?.startsWith('/')) {
      normalizedNodes.push(normalizedNode);
      continue;
    }

    if (seenAbsolutePaths.has(normalizedNode.path)) continue;

    seenAbsolutePaths.add(normalizedNode.path);
    normalizedNodes.push(normalizedNode);
  }

  return normalizedNodes;
};

describe('desktopRouter config sync', () => {
  it('desktop (sync) route tree must match the async route tree shape', async () => {
    const [asyncSource, syncSource] = await Promise.all([
      readFile(path.join(process.cwd(), 'src/spa/router/desktopRouter.config.tsx'), 'utf8'),
      readFile(path.join(process.cwd(), 'src/spa/router/desktopRouter.config.desktop.tsx'), 'utf8'),
    ]);

    const asyncTree = normalizeRouteTree(
      extractDesktopRouteTree(
        asyncSource,
        path.join(process.cwd(), 'src/spa/router/desktopRouter.config.tsx'),
      ),
    );
    const syncTree = normalizeRouteTree(
      extractDesktopRouteTree(
        syncSource,
        path.join(process.cwd(), 'src/spa/router/desktopRouter.config.desktop.tsx'),
      ),
    );

    expect(syncTree).toEqual(asyncTree);
  });
});
