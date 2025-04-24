import { applyPatch, JsonataOperation, validatePatch, PatchError } from "../json-patch";
import { Operation } from "fast-json-patch";
import * as fastJsonPatch from "fast-json-patch";

describe('JSON patch', () => {
  describe("validatePatch", () => {
    describe("operation is 'jsonata'", () => {
      it("should not call validate from fast-json-patch", async () => {
        // Arrange
        const validateSpy = jest.spyOn(fastJsonPatch, 'validate');
        const operation: JsonataOperation = {
          op: "jsonata",
          path: "/result",
          expression: "a & ' v ' & b"
        };

        // Act
        validatePatch({}, operation);
        
        // Assert
        expect(validateSpy).not.toHaveBeenCalled();
        validateSpy.mockRestore();
      });

      it("should return patch error when invalid jsonata expression", async () => {
        // Arrange
        const badExpression = "invalid @@ expression";
        const operation: JsonataOperation = {
          op: "jsonata",
          path: "/result",
          expression: badExpression
        };

        // Act
        const result = validatePatch({}, operation);
        
        // Assert
        expect(result).toBeInstanceOf(PatchError);
        expect(result?.name).toBe("OPERATION_OP_INVALID");
        expect(result?.message).toContain(badExpression);
      });

      it("should return null on valid jsonata expression", async () => {
        // Arrange
        const operation: JsonataOperation = {
          op: "jsonata",
          path: "/result",
          expression: "a & ' v ' & b"
        };

        // Act
        const result = validatePatch({}, operation);
        
        // Assert
        expect(result).toBeNull();
      });
    });

    describe("operation is not jsonata", () => {
      it("should call validate from fast-json-patch", async () => {
        // Arrange
        const validateSpy = jest.spyOn(fastJsonPatch, 'validate');
        const document = { test: "value" };
        const operation: Operation = {
          op: "replace",
          path: "/test",
          value: "new-value"
        };

        // Act
        validatePatch(document, operation);
        
        // Assert
        expect(validateSpy).toHaveBeenCalledWith([operation], document);
        validateSpy.mockRestore();
      });
    });
  });

  describe("applyPatch", () => {
    describe("operation is 'jsonata'", () => {
      it("should create a jsonata expression and apply it to the document", async () => {
        // Arrange
        const document = { a: "team 1", b: "team 2" };
        const operation: JsonataOperation = {
          op: "jsonata",
          path: "/result",
          expression: "a & ' v ' & b"
        };

        // Act
        const result = await applyPatch(document, operation);
        
        // Assert
        expect(result).toEqual({
          a: "team 1",
          b: "team 2",
          result: "team 1 v team 2"
        });
        expect(document).toEqual({ a: "team 1", b: "team 2" });
      });

      it("should set value to the specified path", async () => {
        // Arrange
        const document = { data: { nested: "value" } };
        const operation: JsonataOperation = {
          op: "jsonata",
          path: "/newData/computed",
          expression: "data.nested & ' processed'"
        };

        // Act
        const result = await applyPatch(document, operation);
        
        // Assert
        expect(result).toEqual({
          data: { nested: "value" },
          newData: {
            computed: "value processed"
          }
        });
      });
    });

    describe("operation is not jsonata", () => {
      it("should call and return the result of applyOperation", async () => {
        // Arrange
        const applyOperationSpy = jest.spyOn(fastJsonPatch, 'applyOperation');
        const document = { test: "value" };
        const operation: Operation = {
          op: "replace",
          path: "/test",
          value: "new-value"
        };

        // Act
        const result = await applyPatch(document, operation);
        
        // Assert
        expect(applyOperationSpy).toHaveBeenCalledWith(document, operation);
        expect(result).toEqual({ test: "new-value" });
        applyOperationSpy.mockRestore();
      });

      it("should handle adding new properties with standard JSON Patch", async () => {
        // Arrange
        const document = { existing: "data" };
        const operation: Operation = {
          op: "add",
          path: "/newProp",
          value: "added-value"
        };

        // Act
        const result = await applyPatch(document, operation);
        
        // Assert
        expect(result).toEqual({
          existing: "data",
          newProp: "added-value"
        });
      });

      it("should handle removing properties with standard JSON Patch", async () => {
        // Arrange
        const document = { 
          keep: "this",
          remove: "that"
        };
        const operation: Operation = {
          op: "remove",
          path: "/remove"
        };

        // Act
        const result = await applyPatch(document, operation);
        
        // Assert
        expect(result).toEqual({ keep: "this" });
      });
    });
  });
});
