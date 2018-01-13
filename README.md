
<p align="center">
  <img src="https://user-images.githubusercontent.com/3836517/32965280-1a2b63ce-cbe7-11e7-8ee1-ba47313503c5.png" width="500px" alt="SQB Logo"/>
</p>

<br>
  
[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Build Status][travis-image]][travis-url]
[![Test Coverage][coveralls-image]][coveralls-url]

[![Dependencies][dependencies-image]][dependencies-url]
[![DevDependencies][devdependencies-image]][devdependencies-url]
[![Package Quality][quality-image]][quality-url]


## What is SQB

SQB is an extensible, multi-dialect SQL query builder and Database connection wrapper for NodeJS. SQB can be used as a pure sql query builder or database connection wrapper.

Take a look at [DOCUMENTATION](https://panates.github.io/sqb/) for details

You can report bugs and discuss features on the [GitHub issues](https://github.com/panates/sqb/issues) page

Thanks to all of the great [contributions](https://github.com/panates/sqb/graphs/contributors) to the project.

***Note:*** *SQB IS IN ALPHA STATE AND NOT STABLE YET. PRODUCTION USE IS NOT RECOMMENDED.* 

## Main goals

- Single code base for any sql based database
- Powerful and simplified query coding scheme
- Fast applications with low memory requirements
- Let applications work with large data tables efficiently
- Support latest JavaScript language standards
- Lightweight and extensible framework


## Installation

```bash
$ npm install sqb --save
```

## Node Compatibility

  - node >= 4.x
  
## Change log

2018-01-13 | 1.0.1-alpha.1 : Bulk updates
- Serialization logic has been re-designed.
- Operations logic has been re-designed
- Test has been re-organized and 100% covered
- Documentation has been updated
  
### License
SQB is available under [MIT](LICENSE) license.

[npm-image]: https://img.shields.io/npm/v/sqb.svg
[npm-url]: https://npmjs.org/package/sqb
[travis-image]: https://img.shields.io/travis/panates/sqb/master.svg
[travis-url]: https://travis-ci.org/panates/sqb
[coveralls-image]: https://img.shields.io/coveralls/panates/sqb/master.svg
[coveralls-url]: https://coveralls.io/r/panates/sqb
[downloads-image]: https://img.shields.io/npm/dm/sqb.svg
[downloads-url]: https://npmjs.org/package/sqb
[gitter-image]: https://badges.gitter.im/panates/sqb.svg
[gitter-url]: https://gitter.im/panates/sqb?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge
[dependencies-image]: https://david-dm.org/panates/sqb/status.svg
[dependencies-url]:https://david-dm.org/panates/sqb
[devdependencies-image]: https://david-dm.org/panates/sqb/dev-status.svg
[devdependencies-url]:https://david-dm.org/panates/sqb?type=dev
[quality-image]: http://npm.packagequality.com/shield/sqb.png
[quality-url]: http://packagequality.com/#?package=sqb