import { CloudEventV1, CloudEventV1Attributes } from "./v1";
import { CloudEventV03, CloudEventV03Attributes } from "./v03";

import Spec1 from "./bindings/http/v1/spec_1.js";
import Spec03 from "./bindings/http/v03/spec_0_3.js";
import Formatter from "./formats/json/formatter.js";
import { isBinary } from "./bindings/http/validation/fun.js";

const { SPEC_V1, SPEC_V03 } = require("./bindings/http/constants");

export type CE = CloudEventV1 | CloudEventV1Attributes | CloudEventV03 | CloudEventV03Attributes

/**
 * A CloudEvent describes event data in common formats to provide
 * interoperability across services, platforms and systems.
 * @see https://github.com/cloudevents/spec/blob/v1.0/spec.md
 */
export class CloudEvent {
  spec: any;
  formatter: any;
  extensions: {};

  /**
   * Creates a new CloudEvent instance
   * @param {object} event CloudEvent properties as a simple object
   * @param {string} event.source Identifies the context in which an event happened as a URI reference
   * @param {string} event.type Describes the type of event related to the originating occurrence
   * @param {string} [event.id] A unique ID for this event - if not supplied, will be autogenerated
   * @param {string} [event.time] A timestamp for this event. May also be provided as a Date
   * @param {string} [event.subject] Describes the subject of the event in the context of the event producer
   * @param {string} [event.dataContentType] The mime content type for the event data
   * @param {string} [event.dataSchema] The URI of the schema that the event data adheres to (v1.0 events)
   * @param {string} [event.schemaURL]  The URI of the schema that the event data adheres to (v0.3 events)
   * @param {string} [event.dataContentEncoding] The content encoding for the event data (v0.3 events)
   * @param {string} [event.specversion] The CloudEvent specification version for this event - default: 1.0
   * @param {*} [event.data] The event payload
   */
  constructor(event: CE) {
    if (!event || !event.type || !event.source) {
      throw new TypeError("event type and source are required");
    }

    switch (event.specversion) {
      case SPEC_V1:
        this.spec = new Spec1();
        break;
      case SPEC_V03:
        this.spec = new Spec03();
        break;
      case undefined:
        this.spec = new Spec1();
        break;
      default:
        throw new TypeError(`unknown specification version ${event.specversion}`);
    }
    this.source = event.source;
    this.type = event.type;
    this.dataContentType = event.dataContentType;
    this.data = event.data;
    this.subject = event.subject;

    if (event.dataSchema) {
      this.dataSchema = event.dataSchema;
    }

    // TODO: Deprecated in 1.0
    if (event.dataContentEncoding) {
      this.dataContentEncoding = event.dataContentEncoding;
    }

    // TODO: Deprecated in 1.0
    if (event.schemaURL) {
      this.schemaURL = event.schemaURL;
    }

    if (event.id) {
      this.id = event.id;
    }

    if (event.time) {
      this.time = event.time;
    }
    this.formatter = new Formatter();
    this.extensions = {};
  }

  /**
   * Gets or sets the event id. Source + id must be unique for each distinct event.
   * @see https://github.com/cloudevents/spec/blob/master/spec.md#id
   * @type {string}
  */
  get id() {
    return this.spec.id;
  }

  set id(id) {
    this.spec.id = id;
  }

  /**
   * Gets or sets the origination source of this event as a URI.
   * @type {string}
   * @see https://github.com/cloudevents/spec/blob/master/spec.md#source-1
   */
  get source() {
    return this.spec.source;
  }

  set source(source) {
    this.spec.source = source;
  }

  /**
   * Gets the CloudEvent specification version
   * @type {string}
   * @see https://github.com/cloudevents/spec/blob/master/spec.md#specversion
   */
  get specversion() {
    return this.spec.specversion;
  }

  /**
   * Gets or sets the event type
   * @type {string}
   * @see https://github.com/cloudevents/spec/blob/master/spec.md#type
   */
  get type() {
    return this.spec.type;
  }

  set type(type) {
    this.spec.type = type;
  }

  /**
   * Gets or sets the content type of the data value for this event
   * @type {string}
   * @see https://github.com/cloudevents/spec/blob/master/spec.md#datacontenttype
   */
  get dataContentType() {
    return this.spec.dataContentType;
  }

  set dataContentType(contenttype) {
    this.spec.dataContentType = contenttype;
  }

  /**
   * Gets or sets the event's data schema
   * @type {string}
   * @see https://github.com/cloudevents/spec/blob/v1.0/spec.md#dataschema
   */
  get dataSchema() {
    if (this.spec instanceof Spec1) {
      return this.spec.dataSchema;
    }
    throw new TypeError("cannot get dataSchema from version 0.3 event");
  }

  set dataSchema(dataschema) {
    if (this.spec instanceof Spec1) {
      this.spec.dataSchema = dataschema;
    } else {
      throw new TypeError("cannot set dataSchema on version 0.3 event");
    }
  }

  /**
   * Gets or sets the event's data content encoding
   * @type {string}
   * @see https://github.com/cloudevents/spec/blob/v0.3/spec.md#datacontentencoding
   */
  get dataContentEncoding() {
    if (this.spec instanceof Spec03) {
      return this.spec.dataContentEncoding;
    }
    throw new TypeError("cannot get dataContentEncoding from version 1.0 event");
  }

  set dataContentEncoding(dataContentEncoding) {
    if (this.spec instanceof Spec03) {
      this.spec.dataContentEncoding = dataContentEncoding;
    } else {
      throw new TypeError("cannot set dataContentEncoding on version 1.0 event");
    }
  }

  /**
   * Gets or sets the event subject
   * @type {string}
   * @see https://github.com/cloudevents/spec/blob/v1.0/spec.md#subject
   */
  get subject() {
    return this.spec.subject;
  }

  set subject(subject) {
    this.spec.subject = subject;
  }

  /**
   * Gets or sets the timestamp for this event as an ISO formatted date string
   * @type {string}
   * @see https://github.com/cloudevents/spec/blob/master/spec.md#time
   */
  get time() {
    return this.spec.time;
  }

  set time(time) {
    this.spec.time = new Date(time).toISOString();
  }

  /**
   * DEPRECATED: Gets or sets the schema URL for this event. Throws {TypeError}
   * if this is a version 1.0 event.
   * @type {string}
   * @see https://github.com/cloudevents/spec/blob/v0.3/spec.md#schemaurl
   */
  get schemaURL() {
    if (this.spec instanceof Spec03) {
      return this.spec.schemaURL;
    }
    throw new TypeError("cannot get schemaURL from version 1.0 event");
  }

  // TODO: Deprecated in 1.0
  set schemaURL(schemaurl) {
    if (schemaurl && (this.spec instanceof Spec03)) {
      this.spec.schemaURL = schemaurl;
    } else if (schemaurl) {
      throw new TypeError("cannot set schemaURL on version 1.0 event");
    }
  }


  /**
   * Gets or sets the data for this event
   * @see https://github.com/cloudevents/spec/blob/master/spec.md#event-data
   * @type {*}
   */
  get data() {
    return this.spec.data;
  }

  set data(data) {
    this.spec.data = data;
  }

  /**
   * Formats the CloudEvent as JSON. Validates the event according
   * to the CloudEvent specification and throws an exception if
   * it's invalid.
   * @returns {JSON} the CloudEvent in JSON form
   * @throws {ValidationError} if this event cannot be validated against the specification
   */
  format() {
    this.spec.check();
    const payload = {
      data: undefined,
      data_base64: undefined,
      ...this.spec.payload
    };

    // Handle when is binary, creating the data_base64
    if (isBinary(payload.data)) {
      // TODO: The call to this.spec.data formats the binary data
      // I think having a side effect like this is an anti-pattern.
      // FIXIT
      payload.data_base64 = this.spec.data;
      delete payload.data;
    } else {
      delete payload.data_base64;
    }
    return this.formatter.format(payload);
  }

  /**
   * Formats the CloudEvent as JSON. No specification validation is performed.
   * @returns {string} the CloudEvent as a JSON string
   */
  toString() {
    return this.formatter.toString(this.spec.payload);
  }

  /**
   * Adds an extension attribute to this CloudEvent
   * @see https://github.com/cloudevents/spec/blob/master/spec.md#extension-context-attributes
   * @param {string} key the name of the extension attribute
   * @param {*} value the value of the extension attribute
   * @returns {void}
   */
  addExtension(key: string, value: any) {
    this.spec.addExtension(key, value);
    this.extensions = { [key]: value, ...this.extensions };
  }

  /**
   * Gets the extension attributes, if any, associated with this event
   * @see https://github.com/cloudevents/spec/blob/master/spec.md#extension-context-attributes
   * @returns {Object} the extensions attributes - if none exist will will be {}
   */
  getExtensions() {
    return this.extensions;
  }
}