import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { errorFields, errorMessage } from "./api";
export function useApiForm<T>(
  schema: z.ZodType<T>,
  submit: (value: T) => Promise<unknown>,
  onSuccess?: () => void,
) {
  const mutation = useMutation({
    mutationFn: (data: unknown) => submit(schema.parse(data)),
    onSuccess,
  });
  const fields =
    mutation.error instanceof z.ZodError
      ? Object.fromEntries(
          mutation.error.issues.map((issue) => [
            issue.path.join("."),
            issue.message,
          ]),
        )
      : errorFields(mutation.error);
  return {
    ...mutation,
    fields,
    message:
      mutation.error instanceof z.ZodError
        ? "Verifique os campos indicados."
        : mutation.error
          ? errorMessage(mutation.error)
          : "",
  };
}
export const formValues = (form: HTMLFormElement) =>
  Object.fromEntries(new FormData(form));
