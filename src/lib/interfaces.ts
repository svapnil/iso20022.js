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
         * Codes and Entry References can look like numbers and get parsed
         * appropriately. We don't want this to happen, as they contain leading
         * zeros or are too long and overflow.
         *
         * Ex. <Cd>0001234<Cd> Should resolve to "0001234"
         */
        if (isLeafNode && ['Cd', 'NtryRef'].includes(tagName)) return undefined;
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
