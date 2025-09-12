
export interface GenericISO20022Message {
  /** serialize to XML string */
  serialize(): string;
  /** export to a json object that can then be serialized */
  toJSON(): any;
}

export interface GenericISO20022MessageFactory<T extends GenericISO20022Message> {
  fromXML(xml: string): T;
  fromJSON(json: any): T;
}