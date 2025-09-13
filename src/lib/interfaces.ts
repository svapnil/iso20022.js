import { XMLBuilder, XMLParser } from 'fast-xml-parser';

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
  /** tells what messages are supported */
  supportedMessages(): ISO20022MessageTypeName[];
}

export interface GenericISO20022MessageFactory<
  T extends GenericISO20022Message,
> {
  fromXML(xml: string): T;
  fromJSON(json: string): T;
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
