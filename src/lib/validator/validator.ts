import { BaseSchema, InferOutput, safeParse, ValiError, type BaseIssue } from 'valibot';


export function validateWithSummary<TSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>, TInput>(
  schema: TSchema,
  input: TInput,
): {
  
    success: boolean // succeed if only warnings
    data: InferOutput<TSchema>
    summary: {
      NoOfErrors: number,
      NoOfWarnings: number,
    },
    errors: BaseIssue<unknown>[],
    warnings: BaseIssue<unknown>[],
  
} {
  const result = safeParse(schema, input, { abortEarly: false });


  const issues = result.issues || [] as BaseIssue<unknown>[];

  // classify
  const errors: BaseIssue<unknown>[] = [];
  const warnings: BaseIssue<unknown>[] = [];

  for (const issue of issues) {
    if (issue.type === 'warning') {
      warnings.push(issue);
    } else {
      errors.push(issue);
    }
  }

  // log
  if (errors.length) {
    console.error('❌ Errors:  ' + errors.length);
    errors.forEach(e => console.error(`- Field "${e.path?.[e.path.length - 1]?.key}" - ${e.message}`));
  }
  if (warnings.length) {
    console.warn('⚠️ Warnings: ' + warnings.length);
    warnings.forEach(w => console.warn(`- Field "${w.path?.[w.path.length - 1]?.key}" is absent. Confirm expected behavior. \n\t- ${w.message}`));
  }

  if (errors.length) {
    throw new ValiError(errors as [BaseIssue<unknown>, ...BaseIssue<unknown>[]]);
  }

    return {
      success: errors.length === 0, // succeed if only warnings
      data: result.output,
      summary: {
        NoOfErrors: errors.length,
        NoOfWarnings: warnings.length,
      },
      errors,
      warnings,
    };
}
