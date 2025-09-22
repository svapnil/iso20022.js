/**
 * Base error class for all ISO 20022 related errors in the library.
 * Extends the native Error class with proper stack trace capture.
 */
export class Iso20022JsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    
    // Maintains proper stack trace for where the error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error thrown when XML parsing or validation fails.
 * This error indicates that the provided XML is malformed or does not conform to expected structure.
 */
export class InvalidXmlError extends Iso20022JsError {
  constructor(message: string) {
    super(message);
  }
}

/**
 * Error thrown when XML namespace validation fails.
 * This error indicates that the XML document contains invalid or missing required ISO 20022 namespaces.
 */
export class InvalidXmlNamespaceError extends Iso20022JsError {
  constructor(message: string) {
    super(message);
  }
}

export class InvalidStructureError extends Iso20022JsError {
  constructor(message: string) {
    super(message);
  }
}