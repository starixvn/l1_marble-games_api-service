import * as jsonata from "jsonata";
import { applyOperation, BaseOperation, Operation, validate } from "fast-json-patch";
import { set } from "jsonpointer";

export interface JsonataOperation extends BaseOperation {
  op: 'jsonata';
  expression: string;
}

export class PatchError extends Error {
  constructor(message: string, public name: string) {
    super(message);
  }
}

export function validatePatch(document: any, patch: any) {
  if (isJsonataOperation(patch)) {
    return validateJsonataOperation(patch as JsonataOperation);
  }
  return validate([patch], document);
}

export async function applyPatch(document: any, patch: Operation | JsonataOperation) {
  if (isJsonataOperation(patch)) {
    return applyJsonataOperation(patch as JsonataOperation, document);
  }
  return applyOperation(document, patch as Operation).newDocument;
}

function validateJsonataOperation(operation: JsonataOperation) {
    try {
      jsonata(operation.expression);
      return null;
  } catch {
    return new PatchError(
      `Invalid JSONata expression ${operation.expression}`,
      "OPERATION_OP_INVALID"
    );
  }
}

function isJsonataOperation(operation: any) {
  return operation?.op === "jsonata";
}

async function applyJsonataOperation(operation: JsonataOperation, document: any) {
  const jsonataExpression = jsonata(operation.expression);
  const result = deepClone(document);
  const evaluated = await jsonataExpression.evaluate(document);
  set(result, operation.path, evaluated)
  return result;
}

export function deepClone(obj: any) {
  return JSON.parse(JSON.stringify(obj));
}
