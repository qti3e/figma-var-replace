// figma.variables.
//    getLocalVariableCollectionsAsync(): Promise<VariableCollection[]>
//      .variableIds: string[]
//
//    getLocalVariablesAsync(type?: VariableResolvedDataType): Promise<Variable[]>
//
// figma.loadAllPagesAsync(): Promise<void>
//
// figma.root.findAllWithCriteria<T extends NodeType[]>(criteria: FindAllCriteria<T>):
//                                Array<{ type: T[number] } & (PageNode | SceneNode)>
//
// node.boundVariables -> { []}
//
// node.setBoundVariable(field, otherVar)

figma.showUI(__html__, {
  width: 500,
  height: 500,
});

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'page-state') {
    await postState();
  } else if (msg.type === 'replace') {
    if (msg.from === msg.to) return;

    const [fromVariable, toVariable] = await Promise.all([
      figma.variables.getVariableByIdAsync(msg.from),
      figma.variables.getVariableByIdAsync(msg.to),
    ]);

    figma.notify(`Change ${fromVariable.name} to ${toVariable.name}?`, {
      button: {
        text: 'Confirm',
        action() {
          replace(msg.from, msg.to).then(() => {
            figma.closePlugin();
          });
        },
      },
    });
  }
};

async function postState() {
  const [variableCollections, allColorVariables] = await Promise.all([
    figma.variables.getLocalVariableCollectionsAsync(),
    figma.variables.getLocalVariablesAsync('COLOR'),
  ]);

  const result: PageLoadState = {};

  for (const collection of variableCollections) {
    result[collection.id] = {
      name: collection.name,
      variables: [],
    };
  }

  for (const variable of allColorVariables) {
    if (variable.resolvedType !== 'COLOR') continue;

    result[variable.variableCollectionId].variables.push({
      id: variable.id,
      name: variable.name,
    });
  }

  for (const key in result) {
    if (result[key].variables.length === 0) {
      delete result[key];
    }
  }

  figma.ui.postMessage({
    type: 'page-state',
    message: result,
  });
}

async function replace(fromId: string, toId: string) {
  if (fromId === toId) return;

  const [_, fromVariable, toVariable] = await Promise.all([
    figma.loadAllPagesAsync(),
    figma.variables.getVariableByIdAsync(fromId),
    figma.variables.getVariableByIdAsync(toId),
  ]);

  if (fromVariable.resolvedType !== toVariable.resolvedType) {
  }

  const nodes = figma.root
    .findAllWithCriteria({
      types: [
        'TEXT',
        'HIGHLIGHT',
        'BOOLEAN_OPERATION',
        'FRAME',
        'COMPONENT',
        'COMPONENT_SET',
        'STAR',
        'RECTANGLE',
        'POLYGON',
        'ELLIPSE',
        'INSTANCE',
        'VECTOR',
        'LINE',
        'TABLE',
        'WASHI_TAPE',
        'SECTION',
        'STICKY',
        'STAMP',
        'SHAPE_WITH_TEXT',
        'CONNECTOR',
      ],
    })
    .filter((node) => {
      return node.boundVariables;
    });

  for (const node of nodes) {
    if (node.type !== 'CONNECTOR') {
      if (Array.isArray(node.fills)) {
        node.fills = modifyReadonlyArray(node.fills, (paint) =>
          replaceVariableInPaint(paint, fromVariable, toVariable)
        );
      }
    }

    if (node.type !== 'TABLE' && node.type !== 'SECTION' && node.type !== 'STICKY') {
      if (Array.isArray(node.strokes)) {
        node.strokes = modifyReadonlyArray(node.strokes, (paint) =>
          replaceVariableInPaint(paint, fromVariable, toVariable)
        );
      }
    }
  }
}

function replaceVariableInPaint(paint: Paint, from: Variable, to: Variable): Paint {
  if (paint.type === 'SOLID') {
    if (paint.boundVariables.color?.id !== from.id) return paint;
    return figma.variables.setBoundVariableForPaint(paint, 'color', to);
  } else if (
    paint.type === 'GRADIENT_ANGULAR' ||
    paint.type === 'GRADIENT_DIAMOND' ||
    paint.type === 'GRADIENT_LINEAR' ||
    paint.type === 'GRADIENT_RADIAL'
  ) {
    const gradientStops = modifyReadonlyArray(paint.gradientStops, (stop) => {
      if (stop.boundVariables.color?.id !== from.id) {
        return stop;
      }

      return {
        ...stop,
        boundVariables: {
          color: figma.variables.createVariableAlias(to),
        },
      };
    });

    if (gradientStops === paint.gradientStops) return paint;

    return {
      ...paint,
      gradientStops,
    };
  }

  return paint;
}

/// Map every item of a read only variable to a new value and returns a new read only array.
///
/// Returns the same array if none of the values changed.
function modifyReadonlyArray<T>(array: ReadonlyArray<T>, f: (v: T) => T): ReadonlyArray<T> {
  let result = null;

  for (let i = 0; i < array.length; ++i) {
    const oldValue = array[i];
    const newValue = f(oldValue);

    if (result === null) {
      if (!Object.is(oldValue, newValue)) {
        result = array.slice(0, i);
        result.push(newValue);
      }
    } else {
      result.push(newValue);
    }
  }

  return result ?? array;
}
