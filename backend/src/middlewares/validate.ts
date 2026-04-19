import type { Request, Response, NextFunction } from "express";
import type { AnyZodObject, z, ZodTypeAny } from "zod";

type Schemas = {
  body?: AnyZodObject;
  /** Supports unions / refinements (e.g. map query: bbox OR center+radius). */
  query?: ZodTypeAny;
};

export function validate(schemas: Schemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body) as unknown;
      if (schemas.query)
        req.query = schemas.query.parse(req.query) as unknown as Request["query"];
      next();
    } catch (e) {
      next(e);
    }
  };
}

export type InferBody<T extends AnyZodObject> = z.infer<T>;
