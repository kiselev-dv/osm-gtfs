First step is to match stops from GTFS with stops in OSM.

I count stop matched if OSM version has GTFS stop 
code or id in it's tags. There is no particular 
tag which would fit in all situations, 
so this tag is configurable.

Some examples:
* `ref`
* `gtfs:ref`
* `<operator_name>:ref`

After OSM data query is loaded, you can
find OSM tags statisc for tags containing
`ref` or `gtfs` above.