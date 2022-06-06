# Profile

This schema defines the type for a profile of a user, team, or organization.

**$id:**[**https://open-metadata.org/schema/type/profile.json**](https://open-metadata.org/schema/type/profile.json)

Type: `object`

This schema does not accept additional properties.

## Properties

* **images**
  * $ref: [#/definitions/imageList](profile.md#imagelist)

## Type definitions in this schema

### imageList

* Links to a list of images of varying resolutions/sizes.
* Type: `object`
* This schema does not accept additional properties.
* **Properties**
  * **image**
    * Type: `string`
    * String format must be a "uri"
  * **image24**
    * Type: `string`
    * String format must be a "uri"
  * **image32**
    * Type: `string`
    * String format must be a "uri"
  * **image48**
    * Type: `string`
    * String format must be a "uri"
  * **image72**
    * Type: `string`
    * String format must be a "uri"
  * **image192**
    * Type: `string`
    * String format must be a "uri"
  * **image512**
    * Type: `string`
    * String format must be a "uri"

_This document was updated on: Wednesday, March 9, 2022_