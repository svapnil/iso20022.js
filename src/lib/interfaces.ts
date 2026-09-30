import { XMLBuilder, XMLParser } from 'fast-xml-parser';

/**
 * ISO 20022 identifiers (ABA routing numbers, clearing-system member ids,
 * account numbers, references) are often numeric-looking with leading zeros,
 * and amounts are plain decimals. Never let the XML parser reinterpret them:
 * "021000021" must stay a string, and neither hex nor E-notation occur.
 */
export const ISO20022_NUMBER_PARSE_OPTIONS = { hex: false, leadingZeros: false, eNotation: false } as const;
import { get } from 'http';

export type ISO20022MessageTypeName = `${string}.${string}`;
export const ISO20022Messages: {[msg: string]: ISO20022MessageTypeName} = {
  CAMT_003: "CAMT.003",
  CAMT_004: "CAMT.004",
  CAMT_005: "CAMT.005",
  CAMT_006: "CAMT.006",
  CAMT_053: "CAMT.053",
  
  PAIN_001: "PAIN.001",
  PAIN_002: "PAIN.002",
};

export interface GenericISO20022Message {
  /** serialize to XML string */
  serialize(): string;
  /** export to a json object that can then be serialized */
  toJSON(): any;
  readonly data: any;
}

export interface GenericISO20022MessageFactory<
T extends GenericISO20022Message,
> {
  /** tells what messages are supported */
  supportedMessages(): ISO20022MessageTypeName[];
  fromXML(xml: string): T;
  fromJSON(json: string): T;
  new(data: any): T;
}

const ISO20022Implementations: Map<ISO20022MessageTypeName, GenericISO20022MessageFactory<GenericISO20022Message>> = new Map();
export function registerISO20022Implementation(cl: GenericISO20022MessageFactory<GenericISO20022Message>) {
  cl.supportedMessages().forEach((msg) => {
    ISO20022Implementations.set(msg, cl);
  });
}
export function getISO20022Implementation(type: ISO20022MessageTypeName): GenericISO20022MessageFactory<GenericISO20022Message> | undefined {
  return ISO20022Implementations.get(type);
}
/**
 * Leaf elements whose content is genuinely numeric or boolean by schema, and
 * which the parsers consume as JS numbers / booleans. Only these are handed to
 * fast-xml-parser's value parsing; every other leaf is kept as the raw string.
 *
 * - Amounts: `Amt` (`#text` beside a `Ccy` attribute), the bare-decimal
 *   `TtlNetNtryAmt` / `Sum`, and the camt.006 `IntrBkSttlmAmt` / `InstdAmt` /
 *   `AmtWthCcy` shapes.
 * - Counters and sequence numbers: `NbOfNtries`, `ElctrncSeqNb`, `LglSeqNb`.
 * - Indicators read with `=== true`: `RvslInd`.
 */
export const PARSED_VALUE_TAGS: ReadonlySet<string> = new Set([
  'Amt',
  'TtlNetNtryAmt',
  'Sum',
  'IntrBkSttlmAmt',
  'InstdAmt',
  'AmtWthCcy',
  'NbOfNtries',
  'ElctrncSeqNb',
  'LglSeqNb',
  'RvslInd',
]);

export class XML {
  /**
   * Creates and configures the XML Parser
   *
   * @returns {XMLParser} A configured instance of XMLParser
   */
  static getParser(): XMLParser {
    return new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      numberParseOptions: ISO20022_NUMBER_PARSE_OPTIONS,
      tagValueProcessor: (
        tagName,
        tagValue,
        _jPath,
        _hasAttributes,
        isLeafNode,
      ) => {
        /**
         * ISO 20022 text fields are text, however numeric they look. An
         * all-digit `<EndToEndId>`, a `<Ustrd>` that is just an invoice number,
         * a `<Nm>` of "true", a `<MsgId>` like "10.50" — fast-xml-parser would
         * turn each of these into a number or boolean (dropping a leading "+",
         * collapsing "10.50" to 10.5, or losing a "false" remittance line
         * entirely), and the typed API would then lie about the runtime shape.
         *
         * Returning `undefined` keeps the raw string. Only the leaves in
         * PARSED_VALUE_TAGS — amounts, counters, sequence numbers and the
         * reversal indicator, which the parsers consume as numbers/booleans —
         * go through value parsing; ISO20022_NUMBER_PARSE_OPTIONS still keeps
         * leading zeros, hex and E-notation out of those.
         *
         * Ex. <Cd>0001234<Cd> resolves to "0001234", <EndToEndId>1004</EndToEndId>
         * to "1004", and <Amt Ccy="EUR">120.00</Amt> to 120.
         */
        if (isLeafNode && !PARSED_VALUE_TAGS.has(tagName)) return undefined;
        return tagValue;
      },
    });
  }

  static getBuilder(): XMLBuilder {
    return new XMLBuilder({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      format: true,
    });
  }
}
