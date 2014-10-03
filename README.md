# jsonymize
Anonymize JSON values, easily.

## Installation
```bash
npm install -g jsonymize
```

## Usage
jsonymize reads data from standard input, anonymizes, then writes to
standard output. By default all fields are anonymized, however, specific field
names can be passed as arguments as shown below.

Anonymize all fields:
```bash
$ cat input.json
{"name": "Cameron Hunter", "age": 30, "email": "hello@cameronhunter.co.uk"}
$ cat input.json | jsonymize
{"name":"Andrew Jacobs","age":32,"email":"lal@gecbagano.net"}
```

Choose fields to anonymize:
```bash
$ cat input.json
{"name": "Cameron Hunter", "age": 30, "email": "hello@cameronhunter.co.uk"}
$ cat input.json | jsonymize email age
{"name":"Cameron Hunter","age":58,"email":"erib@jinvuaj.net"}
```

Anonymize all fields, except certain ones:
```bash
$ cat input.json
{"name": "Cameron Hunter", "age": 30, "email": "hello@cameronhunter.co.uk"}
$ cat input.json | jsonymize -i email -i age
{"name":"Eva Haynes","age":30,"email":"hello@cameronhunter.co.uk"}
```

Field names can be "fully qualified" using dot-notation:
```bash
$ cat input.json
{"user":{"name": "Cameron Hunter", "age": 30, "email": "hello@cameronhunter.co.uk"}}
$ cat input.json | jsonymize user.name user.age
{"user":{"name":"Alejandro Mann","age":35,"email":"hello@cameronhunter.co.uk"}}
```

## Advanced Configuration
A configuration file can be passed to jsonymize, providing advanced overrides
and allowing configurations to be shared.

Example configuration file:
```json
{
  "fields": ["name", "email"],
  "ignore": ["id", "message.timestamp"],
  "overrides": {
    "cell": "phone",
    "text": {
      "generator": "sentence",
      "params": {
        "words": 10
      }
    }
  }
}
```

```bash
$ cat input.json
{"name": "Cameron Hunter", "age": 30, "email": "hello@cameronhunter.co.uk"}
$ cat input.json | jsonymize -c ~/configuration.json
{"name":"Alejandro Mann","age":30,"email":"mefulluv@bi.edu"}
```

[ChanceJS](https://github.com/victorquinn/chancejs) is used to generate all
randomized data. A full list of supported generators and their options is
available on their [website](http://chancejs.com).
