# jsonymize
Anonymize JSON values, easily.

## Installation
```bash
npm install -g babel jsonymize
```

## Usage
jsonymize reads data from standard input, anonymizes, then writes to
standard output. By default all fields are anonymized, however, specific field
names can be passed as arguments as shown below.

Choose fields to anonymize:
```bash
$ cat input.json
{"name": "Cameron Hunter", "age": 30, "email": "hello@cameronhunter.co.uk"}
$ cat input.json | jsonymize email age
{"name":"Cameron Hunter","age":58,"email":"erib@jinvuaj.net"}
```

Field names can be "fully qualified" using dot-notation:
```bash
$ cat input.json
{"user":{"name": "Cameron Hunter", "age": 30, "email": "hello@cameronhunter.co.uk"}}
$ cat input.json | jsonymize user.name *.age
{"user":{"name":"Alejandro Mann","age":35,"email":"hello@cameronhunter.co.uk"}}
```

## Advanced Configuration
A configuration file can be passed to jsonymize, providing advanced control
over the data generators, as well as allowing configurations to be shared.

Example configuration file:
```json
{
  "aliases": {
    "userAge": "user.age"
  },
  "fields": ["name", "cell", "userAge"],
  "extensions": [
    "../extensions/nickname-extension.js"
  ],
  "generators": {
    "name": "nickname",
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
{"name": "Cameron Hunter", "age": 30, "cell": "(939) 555-0113"}
$ cat input.json | jsonymize -c ~/configuration.json
{"name":"Terry 'Hulk' Hogan","age":30,"cell":"(636) 555-3226"}
```

[ChanceJS](https://github.com/victorquinn/chancejs) is used to generate all
randomized data. A full list of supported generators and their options is
available on their [website](http://chancejs.com).
