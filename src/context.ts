import { PropertyDefinition } from "./fields/types.js";

/**
 * Encapsulates all mutable state for a single transpile() call.
 *
 * This replaces the module-level mutable variables (iterator, chain,
 * currentProperty, lastCurrentProperty, field, inMenuContext) that
 * made the old transpiler hard to test and reason about.
 */
export class TranspileContext {
  /** The component's properties map (immutable during a transpile run) */
  readonly properties: { [key: string]: PropertyDefinition };

  /** Stack of loop variable names (e.g. ["item_i", "item_c"]) */
  private iteratorStack: string[] = [];

  /** Stack of the currently active PropertyDefinition at each loop depth */
  private chainStack: PropertyDefinition[] = [];

  /** The PropertyDefinition currently in scope */
  currentProperty: PropertyDefinition | null = null;

  /** Saved currentProperty for restoration after if/unless blocks */
  lastCurrentProperty: PropertyDefinition | null = null;

  /** The current field name within a loop context */
  field: string | undefined = undefined;

  /** When inside a {{#field menu}} block, holds the HubL menu variable name */
  menuContext: string | undefined = undefined;

  constructor(properties: { [key: string]: PropertyDefinition }) {
    this.properties = properties;
  }

  // ─── Iterator Stack ─────────────────────────────────────────────────────────

  /** Push a loop variable name onto the iterator stack */
  pushIterator(name: string): void {
    this.iteratorStack.push(name);
  }

  /** Pop and return the top loop variable from the iterator stack */
  popIterator(): string | undefined {
    return this.iteratorStack.pop();
  }

  /** Get the current (top) loop variable, or undefined if not in a loop */
  currentIterator(): string | undefined {
    return this.iteratorStack.length > 0
      ? this.iteratorStack[this.iteratorStack.length - 1]
      : undefined;
  }

  /** Get the iterator stack depth (number of nested loops) */
  get iteratorDepth(): number {
    return this.iteratorStack.length;
  }

  // ─── Chain Stack ────────────────────────────────────────────────────────────

  /** Push a property onto the chain stack (entering a loop over this property) */
  pushChain(prop: PropertyDefinition): void {
    this.chainStack.push(prop);
  }

  /** Pop and return the top property from the chain stack */
  popChain(): PropertyDefinition | undefined {
    return this.chainStack.pop();
  }

  /** Get the current (top) property from the chain stack */
  currentChain(): PropertyDefinition | undefined {
    return this.chainStack.length > 0
      ? this.chainStack[this.chainStack.length - 1]
      : undefined;
  }

  // ─── Property Lookup ────────────────────────────────────────────────────────

  /**
   * Search for a property definition by walking a dot-separated path.
   * Handles "properties", "this", array items, and object children.
   */
  searchForField(variableList: string[]): PropertyDefinition | undefined {
    let searchSpace:
      | { [key: string]: PropertyDefinition }
      | PropertyDefinition = this.properties;
    let foundProperty: PropertyDefinition | undefined;

    for (let i = 0; i < variableList.length; i++) {
      const part = variableList[i];

      if (part === "properties") {
        searchSpace = this.properties;
        continue;
      }
      if (part === "this") {
        searchSpace = this.currentChain();
        continue;
      }
      if (searchSpace) {
        if (searchSpace[part]) {
          searchSpace = searchSpace[part];
        } else if ((searchSpace as PropertyDefinition).type === "array") {
          searchSpace = (searchSpace as PropertyDefinition).items?.properties?.[part];
        } else if ((searchSpace as PropertyDefinition).type === "object") {
          searchSpace = (searchSpace as PropertyDefinition).properties?.[part];
        }
        // else: stay on current searchSpace
      }
    }

    foundProperty = searchSpace as PropertyDefinition;
    return foundProperty;
  }

  /**
   * Find a child property within a parent, handling object/array/link/button types.
   */
  findPart(
    part: string,
    parent: PropertyDefinition | undefined
  ): PropertyDefinition | undefined {
    if (!parent) {
      return this.properties[part];
    }

    if (parent.type === "object" || parent.type === "array") {
      if (parent.properties) {
        return parent.properties[part];
      } else if (parent.items?.properties) {
        return parent.items.properties[part];
      }
    } else if (
      parent.type === "link" ||
      parent.type === "button" ||
      parent.type === "breadcrumb" ||
      parent.type === "image"
    ) {
      return parent;
    } else if (parent.type === "video_embed") {
      return undefined;
    } else {
      return this.properties[part];
    }

    return undefined;
  }

  /**
   * Walk a path to find the parent property definition.
   * Saves/restores lastCurrentProperty as a side effect.
   */
  findParent(parts: string[]): PropertyDefinition | undefined {
    let parent: any;
    this.lastCurrentProperty = this.currentProperty;

    for (const part of parts) {
      if (part === "properties") {
        parent = this.properties;
      } else if (part === "this") {
        parent = this.currentProperty;
      } else {
        parent = this.findPart(part, parent);
      }
    }

    return parent;
  }
}
