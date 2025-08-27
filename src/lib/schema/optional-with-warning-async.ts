import {
  BaseSchema,
  BaseIssue,
  BaseSchemaAsync,
  DefaultAsync,
  InferInput,
  InferIssue,
  _getStandardProps,
  getDefault,
  SuccessDataset,
  _addIssue,
} from 'valibot';
import type { optionalWithWarning } from './optional-with-warning';
import type { InferOptionalOutput } from './types';

/**
 * Optional schema async interface.
 */
export interface OptionalSchemaAsync<
  TWrapped extends
    | BaseSchema<unknown, unknown, BaseIssue<unknown>>
    | BaseSchemaAsync<unknown, unknown, BaseIssue<unknown>>,
  TDefault extends DefaultAsync<TWrapped, undefined>,
> extends BaseSchemaAsync<
    InferInput<TWrapped> | undefined,
    InferOptionalOutput<TWrapped, TDefault>,
    InferIssue<TWrapped>
  > {
  /**
   * The schema type.
   */
  readonly type: 'warning';
  /**
   * The schema reference.
   */
  readonly reference:
    | typeof optionalWithWarning
    | typeof optionalWithWarningAsync;
  /**
   * The expected property.
   */
  readonly expects: `(${TWrapped['expects']} | undefined)`;
  /**
   * The wrapped schema.
   */
  readonly wrapped: TWrapped;
  /**
   * The default value.
   */
  readonly default: TDefault;
}

/**
 * Creates an optional schema.
 *
 * @param wrapped The wrapped schema.
 *
 * @returns An optional schema.
 */
export function optionalWithWarningAsync<
  const TWrapped extends
    | BaseSchema<unknown, unknown, BaseIssue<unknown>>
    | BaseSchemaAsync<unknown, unknown, BaseIssue<unknown>>,
>(wrapped: TWrapped): OptionalSchemaAsync<TWrapped, undefined>;

/**
 * Creates an optional schema.
 *
 * @param wrapped The wrapped schema.
 * @param default_ The default value.
 *
 * @returns An optional schema.
 */
export function optionalWithWarningAsync<
  const TWrapped extends
    | BaseSchema<unknown, unknown, BaseIssue<unknown>>
    | BaseSchemaAsync<unknown, unknown, BaseIssue<unknown>>,
  const TDefault extends DefaultAsync<TWrapped, undefined>,
>(
  wrapped: TWrapped,
  default_: TDefault,
): OptionalSchemaAsync<TWrapped, TDefault>;

// @__NO_SIDE_EFFECTS__
export function optionalWithWarningAsync(
  wrapped:
    | BaseSchema<unknown, unknown, BaseIssue<unknown>>
    | BaseSchemaAsync<unknown, unknown, BaseIssue<unknown>>,
  default_?: unknown,
): OptionalSchemaAsync<
  | BaseSchema<unknown, unknown, BaseIssue<unknown>>
  | BaseSchemaAsync<unknown, unknown, BaseIssue<unknown>>,
  unknown
> {
  return {
    kind: 'schema',
    type: 'warning',
    reference: optionalWithWarningAsync,
    expects: `(${wrapped.expects} | undefined)`,
    async: true,
    wrapped,
    default: default_,
    get '~standard'() {
      return _getStandardProps(this);
    },
    async '~run'(dataset, config) {
      // @ts-expect-error
      const partialDataset = dataset as PartialDataset<
        unknown,
        BaseIssue<unknown>
      >;
      // If value is `undefined`, override it with default or return dataset
      if (dataset.value === undefined) {
        // If default is specified, override value of dataset
        if (this.default !== undefined) {
          dataset.value = await getDefault(this, dataset, config);
        }

        // If value is still `undefined`, return dataset
        if (dataset.value === undefined) {
          _addIssue(this, 'type', dataset, config);
          // @ts-expect-error
          dataset.typed = true;
          // @ts-expect-error
          return dataset as PartialDataset<unknown, BaseIssue<unknown>>;
        }
      }

      // Otherwise, return dataset of wrapped schema
      return this.wrapped['~run'](dataset, config);
    },
  };
}
