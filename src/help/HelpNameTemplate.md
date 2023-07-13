For matched stops, it might be usefull to edit
names accordingly to a common pattern.

You can use a template to edit stop names:

Use `$name`, `$code`, `$id`, `$description` to substitute corresponding GTFS values.

You can apply regexp replace patterns to substituted values:
`$name.re('<search_expression>', '<replace_expression>')`

For instance if you want to remove text in brackets from `$name`
use `$name.re('(.*)', '')`