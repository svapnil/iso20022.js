import {
  _addIssue,
  _getStandardProps,
  BaseIssue,
  BaseSchema,
  Default,
  getDefault,
  InferInput,
  InferIssue,
  PartialDataset,
} from 'valibot';
import { InferOptionalOutput } from './types';

/**
 * Optional schema interface.
 */
export interface OptionalSchema<
  TWrapped extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
  TDefault extends Default<TWrapped, undefined>,
> extends BaseSchema<
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
  readonly reference: typeof optionalWithWarning;
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
export function optionalWithWarning<
  const TWrapped extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
>(wrapped: TWrapped): OptionalSchema<TWrapped, undefined>;

/**
 * Creates an optional schema.
 *
 * @param wrapped The wrapped schema.
 * @param default_ The default value.
 *
 * @returns An optional schema.
 */
export function optionalWithWarning<
  const TWrapped extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
  const TDefault extends Default<TWrapped, undefined>,
>(wrapped: TWrapped, default_: TDefault): OptionalSchema<TWrapped, TDefault>;

// @__NO_SIDE_EFFECTS__
export function optionalWithWarning(
  wrapped: BaseSchema<unknown, unknown, BaseIssue<unknown>>,
  default_?: unknown,
): OptionalSchema<BaseSchema<unknown, unknown, BaseIssue<unknown>>, unknown> {
  return {
    kind: 'schema',
    type: 'warning',
    reference: optionalWithWarning,
    expects: `(${wrapped.expects} | undefined)`,
    async: false,
    wrapped,
    default: default_,
    get '~standard'() {
      return _getStandardProps(this);
    },
    '~run'(dataset, config) {
      // @ts-expect-error
      const partialDataset = dataset as PartialDataset<
        unknown,
        BaseIssue<unknown>
      >;
      // If value is `undefined`, override it with default or return dataset
      if (partialDataset.value === undefined) {
        // If default is specified, override value of dataset
        if (this.default !== undefined) {
          partialDataset.value = getDefault(this, dataset, config);
        }
        // If value is still `undefined`, return dataset
        if (partialDataset.value === undefined) {
          _addIssue(this, 'type', dataset, config);
        }

        partialDataset.typed = true;
        return partialDataset;
      }

      // Otherwise, return dataset of wrapped schema
      return this.wrapped['~run'](dataset, config);
    },
  };
}
