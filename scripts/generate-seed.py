#!/usr/bin/env python3
"""Write src/data/starters.json and the starter INSERT block used by the migration.

Coordinates were checked against Wikipedia/Wikidata, official park or operator
pages, the Geoscience Australia gazetteer (via published place-name coordinates),
and OpenStreetMap. Visitor pins prefer a lookout, car park, or settlement over
the centroid of a huge park. Re-run from the repo root:

    python3 scripts/generate-seed.py
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# id, name, lat, lng, region, category, note, source_url
ROWS: list[tuple[str, str, float, float, str, str, str, str]] = [
    (
        "detour-001",
        "Robertson Pie Shop",
        -34.58593,
        150.62624,
        "NSW",
        "Quirky",
        "The highway pie that started a hundred optimistic detours. Grab one while it is still hot.",
        "https://www.robertsonpieshop.com.au/",
    ),
    (
        "detour-002",
        "Fitzroy Falls",
        -34.65,
        150.48333,
        "NSW",
        "Mountains",
        "A lookout over the falls in Morton National Park, mist included on a good morning.",
        "https://www.nationalparks.nsw.gov.au/things-to-do/lookouts/fitzroy-falls-lookout",
    ),
    (
        "detour-003",
        "Bombo Headland Quarry",
        -34.652,
        150.862,
        "NSW",
        "Coast",
        "The old quarry headland at Kiama, where the rock is columnar and the sea is the colour of bottle glass.",
        "https://www.visitnsw.com/destinations/south-coast/kiama-area/kiama",
    ),
    (
        "detour-004",
        "Hyams Beach, Jervis Bay",
        -35.10025,
        150.69191,
        "NSW",
        "Coast",
        "A white-sand beach on Jervis Bay. The water really is that clear.",
        "https://www.visitnsw.com/destinations/south-coast/jervis-bay-and-shoalhaven/jervis-bay",
    ),
    (
        "detour-005",
        "Murrays Beach, Booderee",
        -35.125,
        150.75806,
        "JBT",
        "Coast",
        "A quiet beach in Booderee National Park, Jervis Bay Territory, facing Bowen Island. Park pass required.",
        "https://parksaustralia.gov.au/booderee/",
    ),
    (
        "detour-006",
        "Three Sisters, Blue Mountains",
        -33.73271,
        150.31196,
        "NSW",
        "Mountains",
        "The three sandstone sisters, seen from Echo Point. The valley does the talking.",
        "https://www.nationalparks.nsw.gov.au/things-to-do/lookouts/echo-point-lookout",
    ),
    (
        "detour-007",
        "Sydney Opera House",
        -33.85681,
        151.21514,
        "NSW",
        "Culture",
        "The sails, from the forecourt. Go around sunset if the family can agree on a time.",
        "https://www.sydneyoperahouse.com/",
    ),
    (
        "detour-008",
        "Bondi to Coogee Coastal Walk",
        -33.89111,
        151.27417,
        "NSW",
        "Coast",
        "A clifftop walk that starts at Bondi Icebergs and ends at Coogee. Swim stops are the point.",
        "https://www.sydney.com/destinations/sydney/sydney-east/bondi/attractions/bondi-to-coogee-coastal-walk",
    ),
    (
        "detour-009",
        "Stockton Sand Dunes, Port Stephens",
        -32.78657,
        152.0812,
        "NSW",
        "Coast",
        "The huge dunes at Birubi Point, on Worimi country. Tours run out onto the sand from here.",
        "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/worimi-conservation-lands",
    ),
    (
        "detour-010",
        "Sea Cliff Bridge",
        -34.25389,
        150.97389,
        "NSW",
        "Coast",
        "The bridge that curves off the cliff at Clifton. Pull over before someone yells look.",
        "https://www.visitnsw.com/destinations/south-coast/wollongong-area/wollongong",
    ),
    (
        "detour-011",
        "South West Rocks and Trial Bay Gaol",
        -30.87718,
        153.07025,
        "NSW",
        "History",
        "A ruined seaside gaol at Trial Bay, above the beaches of South West Rocks.",
        "https://www.nationalparks.nsw.gov.au/things-to-do/historic-buildings/trial-bay-gaol",
    ),
    (
        "detour-012",
        "Cape Byron Lighthouse",
        -28.63278,
        153.63889,
        "NSW",
        "Coast",
        "The lighthouse on the easternmost point of the Australian mainland. Whales pass in season.",
        "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/cape-byron-state-conservation-area",
    ),
    (
        "detour-013",
        "Mount Kosciuszko",
        -36.45583,
        148.26361,
        "NSW",
        "Mountains",
        "The summit of mainland Australia. The walk leaves from Thredbo, and the weather can turn.",
        "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/kosciuszko-national-park",
    ),
    (
        "detour-014",
        "Mungo National Park",
        -33.74165,
        143.12783,
        "NSW",
        "Outback",
        "The Walls of China on a dry lake in the Willandra Lakes. Stay on the boardwalk; this place is ancient and fragile.",
        "https://www.nationalparks.nsw.gov.au/visit-a-park/parks/mungo-national-park",
    ),
    (
        "detour-015",
        "Broken Hill",
        -31.95,
        141.46667,
        "NSW",
        "Outback",
        "An outback mining city with the line of lode on the skyline. The desert starts at the end of the street.",
        "https://www.brokenhill.nsw.gov.au/",
    ),
    (
        "detour-016",
        "Twelve Apostles",
        -38.66192,
        143.10525,
        "VIC",
        "Coast",
        "Limestone stacks in the Southern Ocean. The lookout is the view; the cliff edge is not a shortcut.",
        "https://www.parks.vic.gov.au/places-to-see/parks/port-campbell-national-park",
    ),
    (
        "detour-017",
        "Loch Ard Gorge",
        -38.64658,
        143.0705,
        "VIC",
        "Coast",
        "The gorge of a famous shipwreck, a short walk from the Apostles. Check whether the beach steps are open.",
        "https://www.parks.vic.gov.au/places-to-see/parks/port-campbell-national-park",
    ),
    (
        "detour-018",
        "Cape Otway Lightstation",
        -38.85656,
        143.51172,
        "VIC",
        "History",
        "A lightstation on the wild Otway coast, still watching Bass Strait.",
        "https://www.parks.vic.gov.au/places-to-see/parks/great-otway-national-park",
    ),
    (
        "detour-019",
        "The Pinnacle, Grampians (Gariwerd)",
        -37.15975,
        142.51522,
        "VIC",
        "Mountains",
        "The rock balcony above Halls Gap. The Wonderland walk is the classic way up.",
        "https://www.parks.vic.gov.au/places-to-see/parks/grampians-national-park",
    ),
    (
        "detour-020",
        "Sovereign Hill, Ballarat",
        -37.57512,
        143.8659,
        "VIC",
        "Museum",
        "A goldrush town that still runs. Candlelight tours if everyone can stay up.",
        "https://www.sovereignhill.com.au/",
    ),
    (
        "detour-021",
        "Phillip Island Penguin Parade",
        -38.50895,
        145.14781,
        "VIC",
        "Wildlife",
        "Little penguins come ashore at dusk at Summerlands. Book it; the parade does not wait for late families.",
        "https://www.penguins.org.au/attractions/penguin-parade/",
    ),
    (
        "detour-022",
        "Wilsons Promontory, Tidal River",
        -39.03056,
        146.32139,
        "VIC",
        "Coast",
        "Tidal River, the beach at the foot of Wilsons Prom. Wildlife has right of way.",
        "https://www.parks.vic.gov.au/places-to-see/parks/wilsons-promontory-national-park",
    ),
    (
        "detour-023",
        "Puffing Billy Railway",
        -37.9075,
        145.35667,
        "VIC",
        "History",
        "Steam trains from Belgrave into the Dandenong Ranges. Sit where the legs can dangle, if the carriage allows.",
        "https://puffingbilly.com.au/",
    ),
    (
        "detour-024",
        "Brighton Bathing Boxes",
        -37.91851,
        144.98716,
        "VIC",
        "Quirky",
        "A row of bright bathing boxes on Dendy Street Beach. They are photographs, not cubbyhouses.",
        "https://www.bayside.vic.gov.au/",
    ),
    (
        "detour-025",
        "Queen Victoria Market",
        -37.80749,
        144.95771,
        "VIC",
        "Culture",
        "Melbourne's market halls. Go hungry, leave with more than you planned.",
        "https://qvm.com.au/",
    ),
    (
        "detour-026",
        "Healesville Sanctuary",
        -37.68428,
        145.53134,
        "VIC",
        "Wildlife",
        "A bush sanctuary in the Yarra Valley. The platypus dusk tour is the quiet show.",
        "https://www.zoo.org.au/healesville/",
    ),
    (
        "detour-027",
        "Mount Buffalo",
        -36.72223,
        146.81973,
        "VIC",
        "Mountains",
        "The old chalet and the gorge lookouts on a hanging plateau above the Ovens Valley.",
        "https://www.parks.vic.gov.au/places-to-see/parks/mount-buffalo-national-park",
    ),
    (
        "detour-028",
        "Beechworth Historic Precinct",
        -36.35949,
        146.68701,
        "VIC",
        "History",
        "A gold-town street of granite buildings, Ned Kelly stories included.",
        "https://www.beechworth.com/",
    ),
    (
        "detour-029",
        "Silo Art Trail, Brim",
        -36.06667,
        142.41667,
        "VIC",
        "Quirky",
        "The painted silos at Brim, first of the Silo Art Trail. Blink and the highway has gone past them.",
        "https://www.siloarttrail.com/",
    ),
    (
        "detour-030",
        "Great Barrier Reef, Agincourt Reef",
        -16.00568,
        145.80859,
        "QLD",
        "Coast",
        "A ribbon reef out from Port Douglas. You only get there by a permitted boat; the pontoon is the visit, not a beach car park.",
        "https://www2.gbrmpa.gov.au/",
    ),
    (
        "detour-031",
        "Mossman Gorge",
        -16.4675,
        145.35194,
        "QLD",
        "Rainforest",
        "A rainforest river on Kuku Yalanji country, with a walk beside the boulders.",
        "https://www.mossmangorge.com.au/",
    ),
    (
        "detour-032",
        "Cape Tribulation",
        -16.08878,
        145.46221,
        "QLD",
        "Rainforest",
        "Where the rainforest meets the reef. The beach is the destination, and cassowaries have right of way.",
        "https://parks.des.qld.gov.au/parks/daintree",
    ),
    (
        "detour-033",
        "Whitehaven Beach",
        -20.27541,
        149.04174,
        "QLD",
        "Coast",
        "The long white beach on Whitsunday Island. It is a boat day, not a driveway.",
        "https://parks.des.qld.gov.au/parks/whitsunday-islands",
    ),
    (
        "detour-034",
        "Lake McKenzie (Boorangoora), K'gari",
        -25.4459,
        153.057,
        "QLD",
        "Coast",
        "A perched lake of white sand on K'gari. Swim, then leave the sand on the beach, not in your towel.",
        "https://parks.des.qld.gov.au/parks/kgari-fraser",
    ),
    (
        "detour-035",
        "Noosa National Park",
        -26.37944,
        153.10102,
        "QLD",
        "Coast",
        "The coastal track at Noosa Heads. Boiling Pot lookout is the postcard stop.",
        "https://parks.des.qld.gov.au/parks/noosa",
    ),
    (
        "detour-036",
        "Australia Zoo",
        -26.83664,
        152.95937,
        "QLD",
        "Wildlife",
        "The big zoo at Beerwah. Crocodiles at feeding time, shade at lunch.",
        "https://www.australiazoo.com.au/",
    ),
    (
        "detour-037",
        "Springbrook National Park, Natural Bridge",
        -28.2307,
        153.2435,
        "QLD",
        "Rainforest",
        "A waterfall that falls through a rock arch. Glow-worms show up after dark if you stay quiet.",
        "https://parks.des.qld.gov.au/parks/springbrook",
    ),
    (
        "detour-038",
        "Lamington National Park, O'Reilly's",
        -28.23089,
        153.13593,
        "QLD",
        "Rainforest",
        "The rainforest balcony at O'Reilly's in Lamington. Birds will try to join breakfast.",
        "https://parks.des.qld.gov.au/parks/lamington",
    ),
    (
        "detour-039",
        "Currumbin Wildlife Sanctuary",
        -28.13583,
        153.4898,
        "QLD",
        "Wildlife",
        "A creek-side wildlife park at Currumbin. The lorikeets have opinions.",
        "https://currumbinsanctuary.com.au/",
    ),
    (
        "detour-040",
        "Magnetic Island Forts Walk",
        -19.1244,
        146.87047,
        "QLD",
        "History",
        "World War II forts on Magnetic Island, with a view back across the water to Townsville.",
        "https://parks.des.qld.gov.au/parks/magnetic-island",
    ),
    (
        "detour-041",
        "Paronella Park",
        -17.65263,
        145.95654,
        "QLD",
        "History",
        "A Spanish-style castle in the rainforest, built for a sweetheart. The hydro still runs.",
        "https://www.paronellapark.com.au/",
    ),
    (
        "detour-042",
        "Undara Lava Tubes",
        -18.20111,
        144.59611,
        "QLD",
        "Outback",
        "Lava tubes you see with a guide and a lamp. The savannah around Undara does the driving.",
        "https://parks.des.qld.gov.au/parks/undara-volcanic",
    ),
    (
        "detour-043",
        "Australian Age of Dinosaurs, Winton",
        -22.47906,
        143.18277,
        "QLD",
        "Museum",
        "A working dinosaur museum on a jump-up outside Winton. Fossils, not a theme park.",
        "https://www.australianageofdinosaurs.com/",
    ),
    (
        "detour-044",
        "Cape York, The Tip (Pajinka)",
        -10.68861,
        142.53167,
        "QLD",
        "Outback",
        "The northern tip of the continent, Pajinka, on Gudang and Yadhaykenu country. Remote, permit country, and a long way from a servo.",
        "https://parks.des.qld.gov.au/parks/apudthama",
    ),
    (
        "detour-045",
        "Wilpena Pound (Ikara)",
        -31.52646,
        138.60615,
        "SA",
        "Outback",
        "The natural amphitheatre of Ikara. This pin is the visitor hub at Wilpena, where the walks begin.",
        "https://www.parks.sa.gov.au/parks/ikara-flinders-ranges-national-park",
    ),
    (
        "detour-046",
        "Brachina Gorge",
        -31.33217,
        138.59031,
        "SA",
        "Outback",
        "A drive through deep time in the Flinders Ranges. The Golden Spike marks the start of the Ediacaran.",
        "https://www.parks.sa.gov.au/parks/ikara-flinders-ranges-national-park",
    ),
    (
        "detour-047",
        "Coober Pedy",
        -29.01111,
        134.75556,
        "SA",
        "Outback",
        "An opal town that lives underground. A dugout is cooler than the street at noon.",
        "https://www.cooberpedy.sa.gov.au/",
    ),
    (
        "detour-048",
        "Farina Historic Township",
        -30.07513,
        138.27601,
        "SA",
        "History",
        "A ghost town on the old Ghan route, looked after by volunteers. The bakery opens in season.",
        "https://www.farinarestoration.com/",
    ),
    (
        "detour-049",
        "Remarkable Rocks, Kangaroo Island",
        -36.04819,
        136.75716,
        "SA",
        "Coast",
        "Granite boulders on a dome above the Southern Ocean, in Flinders Chase.",
        "https://www.parks.sa.gov.au/parks/flinders-chase-national-park",
    ),
    (
        "detour-050",
        "Seal Bay, Kangaroo Island",
        -35.99861,
        137.3625,
        "SA",
        "Wildlife",
        "A boardwalk through a sea-lion colony. Stay on it; they are not posing.",
        "https://www.parks.sa.gov.au/parks/seal-bay-conservation-park",
    ),
    (
        "detour-051",
        "Kuitpo Forest",
        -35.21796,
        138.70033,
        "SA",
        "Mountains",
        "Stringybark forest in the Adelaide Hills. Picnic tables below, koalas if you look up.",
        "https://www.forestrysa.com.au/",
    ),
    (
        "detour-052",
        "Victor Harbor and Granite Island",
        -35.5641,
        138.63023,
        "SA",
        "Coast",
        "The causeway from Victor Harbor lands on Granite Island. Little penguins, big wind.",
        "https://www.parks.sa.gov.au/parks/granite-island-recreation-park",
    ),
    (
        "detour-053",
        "Naracoorte Caves",
        -37.03611,
        140.79764,
        "SA",
        "History",
        "Fossil caves at Naracoorte, a World Heritage ground-sloth kind of place.",
        "https://www.parks.sa.gov.au/parks/naracoorte-caves-national-park",
    ),
    (
        "detour-054",
        "Umpherston Sinkhole (Balumbul)",
        -37.8388,
        140.80835,
        "SA",
        "Quirky",
        "A sinkhole garden in Mount Gambier, also called Balumbul. Stairs down into the ferns.",
        "https://www.mountgambier.sa.gov.au/",
    ),
    (
        "detour-055",
        "Coffin Bay National Park",
        -34.68058,
        135.32136,
        "SA",
        "Coast",
        "Point Avoid lookout, the sealed-road view over the cliffs and Avoid Bay.",
        "https://www.parks.sa.gov.au/parks/coffin-bay-national-park",
    ),
    (
        "detour-056",
        "Adelaide Central Market",
        -34.92972,
        138.5975,
        "SA",
        "Culture",
        "Adelaide's covered market. The jam donut is not a rumour.",
        "https://www.adelaidecentralmarket.com.au/",
    ),
    (
        "detour-057",
        "The Pinnacles, Nambung",
        -30.60583,
        115.1575,
        "WA",
        "Outback",
        "Thousands of limestone pillars in the yellow sand of Nambung National Park. Dawn is the quiet version.",
        "https://exploreparks.dbca.wa.gov.au/park/nambung-national-park",
    ),
    (
        "detour-058",
        "Rottnest Island (Wadjemup)",
        -31.99638,
        115.53997,
        "WA",
        "Coast",
        "Thomson Bay settlement on Wadjemup. Bikes, quokkas, and a ferry from Fremantle.",
        "https://www.rottnestisland.com/",
    ),
    (
        "detour-059",
        "Turquoise Bay, Ningaloo",
        -22.09648,
        113.8894,
        "WA",
        "Coast",
        "A beach in Cape Range where Ningaloo Reef starts under your feet. Read the current signs before you drift.",
        "https://exploreparks.dbca.wa.gov.au/park/cape-range-national-park",
    ),
    (
        "detour-060",
        "Monkey Mia",
        -25.79472,
        113.71722,
        "WA",
        "Wildlife",
        "Dolphins that still visit the shallows. The ranger talk is part of the visit.",
        "https://exploreparks.dbca.wa.gov.au/site/monkey-mia",
    ),
    (
        "detour-061",
        "Kalbarri Skywalk",
        -27.5563,
        114.434,
        "WA",
        "Mountains",
        "Two platforms out over the Murchison gorge. The path is flat; the drop is not.",
        "https://exploreparks.dbca.wa.gov.au/site/kalbarri-skywalk",
    ),
    (
        "detour-062",
        "Wave Rock (Hyden Rock)",
        -32.44389,
        118.89828,
        "WA",
        "Outback",
        "A granite wave north of Hyden. It is exactly as advertised, which is rare.",
        "https://exploreparks.dbca.wa.gov.au/site/wave-rock",
    ),
    (
        "detour-063",
        "Lucky Bay, Cape Le Grand",
        -33.9944,
        122.232,
        "WA",
        "Coast",
        "A bay in Cape Le Grand where kangaroos use the beach. The sand is seriously white.",
        "https://exploreparks.dbca.wa.gov.au/park/cape-le-grand-national-park",
    ),
    (
        "detour-064",
        "Valley of the Giants Tree Top Walk",
        -34.97756,
        116.89354,
        "WA",
        "Rainforest",
        "A steel walk through the red tingle canopy near Walpole. The Ancient Empire boardwalk is the ground-level version.",
        "https://www.treetopwalk.com.au/",
    ),
    (
        "detour-065",
        "Busselton Jetty",
        -33.6369,
        115.3401,
        "WA",
        "Coast",
        "The long jetty at Busselton. Walk it, or let the little train do the middle.",
        "https://www.busseltonjetty.com.au/",
    ),
    (
        "detour-066",
        "Jewel Cave, Augusta",
        -34.2738,
        115.0979,
        "WA",
        "Quirky",
        "A show cave in the Leeuwin-Naturaliste ridge, near Augusta. Stalactites, and a guided descent.",
        "https://www.margaretriver.com/",
    ),
    (
        "detour-067",
        "Karijini National Park, Dales Gorge",
        -22.47881,
        118.56138,
        "WA",
        "Outback",
        "Fern pools and Fortescue Falls in Dales Gorge. The trail has stairs, and a swim at the bottom.",
        "https://exploreparks.dbca.wa.gov.au/park/karijini-national-park",
    ),
    (
        "detour-068",
        "Cable Beach, Broome",
        -17.95223,
        122.20558,
        "WA",
        "Coast",
        "The wide sunset beach at Broome. Camels are optional. The tides are not small.",
        "https://www.broome.wa.gov.au/",
    ),
    (
        "detour-069",
        "Horizontal Falls (Garaanngaddim)",
        -16.38325,
        123.95797,
        "WA",
        "Coast",
        "A tidal waterfall in Talbot Bay. You see it from a boat or a plane, with permission on Dambimangari country. There is no road to the falls.",
        "https://exploreparks.dbca.wa.gov.au/park/lalang-gaddam-marine-park",
    ),
    (
        "detour-070",
        "Bungle Bungle Range, Purnululu",
        -17.48922,
        128.37519,
        "WA",
        "Outback",
        "The beehive domes. Cathedral Gorge leaves from Piccaninny car park. The road in is seasonal and 4WD only.",
        "https://exploreparks.dbca.wa.gov.au/park/purnululu-national-park",
    ),
    (
        "detour-071",
        "Cradle Mountain, Dove Lake",
        -41.65806,
        145.96194,
        "TAS",
        "Mountains",
        "The boatshed view of Cradle Mountain across Dove Lake. The circuit is the family classic.",
        "https://parks.tas.gov.au/explore-our-parks/cradle-mountain",
    ),
    (
        "detour-072",
        "Wineglass Bay Lookout",
        -42.15494,
        148.29357,
        "TAS",
        "Coast",
        "The lookout over the curved bay in Freycinet. The beach is a longer walk down.",
        "https://parks.tas.gov.au/explore-our-parks/freycinet-national-park",
    ),
    (
        "detour-073",
        "Bay of Fires, Binalong Bay",
        -41.24899,
        148.31215,
        "TAS",
        "Coast",
        "Orange lichen rocks at Binalong Bay, the easy end of the Bay of Fires.",
        "https://parks.tas.gov.au/explore-our-parks/bay-of-fires-conservation-area",
    ),
    (
        "detour-074",
        "Port Arthur Historic Site",
        -43.14741,
        147.85052,
        "TAS",
        "History",
        "The convict ruins on the Tasman Peninsula. The harbour is beautiful and the history is not soft.",
        "https://portarthur.org.au/",
    ),
    (
        "detour-075",
        "Salamanca Market",
        -42.88622,
        147.33251,
        "TAS",
        "Culture",
        "Saturday stalls in the sandstone warehouses at Salamanca Place. Go before the fudge stalls win.",
        "https://www.salamancamarket.com.au/",
    ),
    (
        "detour-076",
        "kunanyi / Mount Wellington",
        -42.896,
        147.23731,
        "TAS",
        "Mountains",
        "The summit of kunanyi. The lookout is often in the cloud, which is its own view.",
        "https://parks.tas.gov.au/explore-our-parks/wellington-park",
    ),
    (
        "detour-077",
        "Bruny Island, The Neck",
        -43.26999,
        147.34796,
        "TAS",
        "Coast",
        "The isthmus lookout on Bruny. Penguins on one side, surf on the other.",
        "https://parks.tas.gov.au/explore-our-parks/south-bruny-national-park",
    ),
    (
        "detour-078",
        "Maria Island, Darlington and Painted Cliffs",
        -42.58188,
        148.0652,
        "TAS",
        "Wildlife",
        "The ferry lands at Darlington. Wombats treat the lawns as theirs, and the Painted Cliffs are a low-tide walk.",
        "https://parks.tas.gov.au/explore-our-parks/maria-island-national-park",
    ),
    (
        "detour-079",
        "Tasman Arch",
        -43.03611,
        147.95083,
        "TAS",
        "Coast",
        "A rock arch in the sea cliffs, with the Devil's Kitchen next door.",
        "https://parks.tas.gov.au/explore-our-parks/tasman-national-park",
    ),
    (
        "detour-080",
        "Cataract Gorge, Launceston",
        -41.44611,
        147.11944,
        "TAS",
        "Mountains",
        "A gorge in the middle of Launceston, with a pool, peacocks, and a chairlift if the legs vote no.",
        "https://www.launceston.tas.gov.au/",
    ),
    (
        "detour-081",
        "Stanley, The Nut",
        -40.7637,
        145.30319,
        "TAS",
        "Mountains",
        "The volcanic plug above Stanley. The chairlift is the kind option; the path is the smug one.",
        "https://parks.tas.gov.au/",
    ),
    (
        "detour-082",
        "Russell Falls, Mount Field",
        -42.67703,
        146.71262,
        "TAS",
        "Mountains",
        "A short walk to a waterfall in Mount Field, ferns the whole way.",
        "https://parks.tas.gov.au/explore-our-parks/mount-field-national-park",
    ),
    (
        "detour-083",
        "Uluru Base Walk",
        -25.345,
        131.03611,
        "NT",
        "Outback",
        "The walk around the base of Uluru. The climb is closed. Start early and carry more water than you think.",
        "https://parksaustralia.gov.au/uluru/do/walks/uluru-base-walk/",
    ),
    (
        "detour-084",
        "Kata Tjuta, Valley of the Winds",
        -25.2848,
        130.7259,
        "NT",
        "Outback",
        "A walk in among the domes. The full circuit is a real hike; Karu Lookout is the shorter turn. This pin is the car park.",
        "https://parksaustralia.gov.au/uluru/do/walks/valley-of-the-winds/",
    ),
    (
        "detour-085",
        "Kings Canyon, Watarrka",
        -24.2556,
        131.56988,
        "NT",
        "Outback",
        "The rim walk at Watarrka. Canyon walls, a garden at the bottom, and a long stair.",
        "https://nt.gov.au/parks/find-a-park/watarrka-national-park",
    ),
    (
        "detour-086",
        "Ormiston Gorge",
        -23.6323,
        132.72673,
        "NT",
        "Outback",
        "A waterhole in the West MacDonnells, with ghost gums and a gorge walk.",
        "https://nt.gov.au/parks/find-a-park/tjoritja-west-macdonnell-national-park",
    ),
    (
        "detour-087",
        "Standley Chasm (Angkerle Atwatye)",
        -23.71613,
        133.47015,
        "NT",
        "Outback",
        "A narrow cleft in the range, on private Aboriginal land. Midday is when the light drops in.",
        "https://www.standleychasm.com.au/",
    ),
    (
        "detour-088",
        "Alice Springs Desert Park",
        -23.70801,
        133.83418,
        "NT",
        "Wildlife",
        "Desert habitats in one walkable park on the edge of Alice Springs, nocturnal house included.",
        "https://alicespringsdesertpark.com.au/",
    ),
    (
        "detour-089",
        "Devils Marbles (Karlu Karlu)",
        -20.56667,
        134.26667,
        "NT",
        "Outback",
        "The rounded boulders of Karlu Karlu. Walk the loop and leave every rock where it is.",
        "https://nt.gov.au/parks/find-a-park/karlu-karlu-devils-marbles-conservation-reserve",
    ),
    (
        "detour-090",
        "Nitmiluk Gorge",
        -14.3125,
        132.4742,
        "NT",
        "Outback",
        "The gorge at Nitmiluk, on Jawoyn country. A boat, or a walk above the first gorge.",
        "https://nt.gov.au/parks/find-a-park/nitmiluk-national-park",
    ),
    (
        "detour-091",
        "Litchfield National Park, Florence Falls",
        -13.09872,
        130.78341,
        "NT",
        "Rainforest",
        "A plunge pool at Florence Falls. The stairs down are the price of the swim.",
        "https://nt.gov.au/parks/find-a-park/litchfield-national-park",
    ),
    (
        "detour-092",
        "Ubirr, Kakadu",
        -12.40969,
        132.95617,
        "NT",
        "Culture",
        "Rock art and a floodplain lookout at Ubirr. Sunset is the famous version. The art sites close for part of the day.",
        "https://parksaustralia.gov.au/kakadu/do/walks/ubirr/",
    ),
    (
        "detour-093",
        "Yellow Water (Ngurrungurrudjba), Kakadu",
        -12.89647,
        132.51759,
        "NT",
        "Wildlife",
        "The wetland at Ngurrungurrudjba, near Cooinda. Cruises are how you visit. Crocodiles live here; they are not the entertainment.",
        "https://parksaustralia.gov.au/kakadu/do/tours/yellow-water-cruises/",
    ),
    (
        "detour-094",
        "Mindil Beach, Darwin",
        -12.44526,
        130.82987,
        "NT",
        "Culture",
        "Darwin's sunset beach. The markets take over in the dry season.",
        "https://www.mindil.com.au/",
    ),
    (
        "detour-095",
        "Questacon",
        -35.2985,
        149.13139,
        "ACT",
        "Museum",
        "The national science centre. The buttons are meant to be pressed.",
        "https://www.questacon.edu.au/",
    ),
    (
        "detour-096",
        "Australian War Memorial",
        -35.28096,
        149.14863,
        "ACT",
        "Museum",
        "The memorial at the end of Anzac Parade. Give it more time than you think.",
        "https://www.awm.gov.au/",
    ),
    (
        "detour-097",
        "National Arboretum Canberra",
        -35.29,
        149.07,
        "ACT",
        "Culture",
        "A hundred forests on a Canberra ridge, with a view back to the lake.",
        "https://www.nationalarboretum.act.gov.au/",
    ),
    (
        "detour-098",
        "Tidbinbilla Nature Reserve",
        -35.46306,
        148.91333,
        "ACT",
        "Wildlife",
        "A valley sanctuary on the edge of Namadgi. Start at the visitor centre and pick a short walk.",
        "https://www.parks.act.gov.au/",
    ),
    (
        "detour-099",
        "Mount Ainslie Lookout",
        -35.26979,
        149.15868,
        "ACT",
        "Mountains",
        "The lookout over Canberra from the hill behind the War Memorial. A short uphill from the car park.",
        "https://www.parks.act.gov.au/",
    ),
    (
        "detour-100",
        "Australian National Botanic Gardens",
        -35.27891,
        149.10907,
        "ACT",
        "Culture",
        "The national gardens on the slopes of Black Mountain. Walk the rainforest gully.",
        "https://www.anbg.gov.au/",
    ),
]


MIGRATION_HEAD = r"""-- The Great Raszewski Detour
-- Shared family map. Run this once in the Supabase SQL editor (or as a migration).
-- The service role key is not used by the app and must not be placed in client code.
--
-- Seed safety: seed_family_map copies starter_places a single time per map.
-- A second call does nothing, so visits are kept and removed places stay removed.

create extension if not exists pgcrypto;

create table if not exists public.family_maps (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users (id),
  seeded_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.map_members (
  map_id uuid not null references public.family_maps (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (map_id, user_id)
);

create table if not exists public.starter_places (
  id text primary key,
  name text not null,
  lat double precision not null,
  lng double precision not null,
  region text not null,
  category text not null,
  note text not null,
  source_url text
);

create table if not exists public.places (
  id text not null,
  map_id uuid not null references public.family_maps (id) on delete cascade,
  name text not null,
  lat double precision not null,
  lng double precision not null,
  region text not null,
  category text,
  note text,
  status text not null default 'want' check (status in ('want', 'been')),
  visit_date date,
  visit_memory text,
  next_up boolean not null default false,
  is_starter boolean not null default false,
  source_url text,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (map_id, id)
);

create index if not exists places_map_id_idx on public.places (map_id);

alter table public.places add column if not exists next_up boolean not null default false;

-- Public catalogue of the original 100. No family notes live here.
-- Re-running this migration replaces the catalogue rows, never a family's places.

"""

MIGRATION_TAIL = r"""
create or replace function public.touch_place_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists places_touch_updated_at on public.places;
create trigger places_touch_updated_at
  before update on public.places
  for each row execute procedure public.touch_place_updated_at();

create or replace function public.protect_place_identity()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if new.is_starter and not exists (
      select 1 from public.starter_places where id = new.id
    ) then
      raise exception 'Only the original detours can be marked as starters';
    end if;
    return new;
  end if;

  if new.map_id is distinct from old.map_id or new.id is distinct from old.id then
    raise exception 'A detour keeps its id and its map';
  end if;
  if new.is_starter is distinct from old.is_starter then
    raise exception 'The original list cannot be relabelled';
  end if;
  return new;
end;
$$;

drop trigger if exists places_protect_identity on public.places;
create trigger places_protect_identity
  before insert or update on public.places
  for each row execute procedure public.protect_place_identity();

create or replace function public.is_map_member(target_map uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.map_members
    where map_id = target_map
      and user_id = auth.uid()
  );
$$;

create or replace function public.is_map_owner(target_map uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.map_members
    where map_id = target_map
      and user_id = auth.uid()
      and role = 'owner'
  );
$$;

create or replace function public.create_family_map(map_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Sign in first';
  end if;
  if map_name is null or length(trim(map_name)) = 0 then
    raise exception 'Give the map a name';
  end if;

  insert into public.family_maps (name, created_by)
  values (trim(map_name), auth.uid())
  returning id into new_id;

  insert into public.map_members (map_id, user_id, role)
  values (new_id, auth.uid(), 'owner');

  return new_id;
end;
$$;

create or replace function public.add_map_member(target_map uuid, member_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  member_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Sign in first';
  end if;
  if not public.is_map_owner(target_map) then
    raise exception 'Only the map owner can add family members';
  end if;

  select id
    into member_id
  from auth.users
  where lower(email) = lower(trim(member_email));

  if member_id is null then
    raise exception 'No account with that email yet. Ask them to sign up first.';
  end if;

  insert into public.map_members (map_id, user_id, role)
  values (target_map, member_id, 'member')
  on conflict (map_id, user_id) do nothing;
end;
$$;

-- Copies the 100 starters once. Later calls return 0 and do not touch existing rows,
-- so a repeat cannot reset visits or recreate a place the family removed.
create or replace function public.seed_family_map(target_map uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_count integer := 0;
begin
  if auth.uid() is null then
    raise exception 'Sign in first';
  end if;
  if not public.is_map_member(target_map) then
    raise exception 'You are not on this map';
  end if;

  if exists (
    select 1 from public.family_maps
    where id = target_map and seeded_at is not null
  ) then
    return 0;
  end if;

  insert into public.places (
    id, map_id, name, lat, lng, region, category, note,
    status, is_starter, source_url, created_by
  )
  select
    s.id, target_map, s.name, s.lat, s.lng, s.region, s.category, s.note,
    'want', true, s.source_url, auth.uid()
  from public.starter_places s
  on conflict (map_id, id) do nothing;

  get diagnostics inserted_count = row_count;

  update public.family_maps
    set seeded_at = now()
  where id = target_map
    and seeded_at is null;

  return inserted_count;
end;
$$;

revoke all on function public.is_map_member(uuid) from public;
revoke all on function public.is_map_owner(uuid) from public;
revoke all on function public.create_family_map(text) from public;
revoke all on function public.add_map_member(uuid, text) from public;
revoke all on function public.seed_family_map(uuid) from public;

grant execute on function public.is_map_member(uuid) to authenticated;
grant execute on function public.is_map_owner(uuid) to authenticated;
grant execute on function public.create_family_map(text) to authenticated;
grant execute on function public.add_map_member(uuid, text) to authenticated;
grant execute on function public.seed_family_map(uuid) to authenticated;

alter table public.family_maps enable row level security;
alter table public.map_members enable row level security;
alter table public.places enable row level security;
alter table public.starter_places enable row level security;

drop policy if exists "members read their map" on public.family_maps;
create policy "members read their map"
  on public.family_maps
  for select
  to authenticated
  using (public.is_map_member(id));

drop policy if exists "members read the roster" on public.map_members;
create policy "members read the roster"
  on public.map_members
  for select
  to authenticated
  using (public.is_map_member(map_id));

drop policy if exists "members read places" on public.places;
create policy "members read places"
  on public.places
  for select
  to authenticated
  using (public.is_map_member(map_id));

drop policy if exists "members add places" on public.places;
create policy "members add places"
  on public.places
  for insert
  to authenticated
  with check (public.is_map_member(map_id));

drop policy if exists "members edit places" on public.places;
create policy "members edit places"
  on public.places
  for update
  to authenticated
  using (public.is_map_member(map_id))
  with check (public.is_map_member(map_id));

drop policy if exists "members remove places" on public.places;
create policy "members remove places"
  on public.places
  for delete
  to authenticated
  using (public.is_map_member(map_id));

-- starter_places has no client policies. Only seed_family_map (security definer) reads it.
-- Family notes and visit history live on places, which unrelated accounts cannot select.

grant select on public.family_maps to authenticated;
grant select on public.map_members to authenticated;
grant select, insert, update, delete on public.places to authenticated;

do $$
begin
  alter publication supabase_realtime add table public.places;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
"""


def sql_str(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def main() -> None:
    records = []
    for row in ROWS:
        ident, name, lat, lng, region, category, note, source = row
        records.append(
            {
                "id": ident,
                "name": name,
                "lat": lat,
                "lng": lng,
                "region": region,
                "category": category,
                "note": note,
                "sourceUrl": source,
            }
        )
    out = ROOT / "src" / "data" / "starters.json"
    out.write_text(json.dumps(records, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    values = []
    for record in records:
        values.append(
            "  ("
            + ", ".join(
                [
                    sql_str(record["id"]),
                    sql_str(record["name"]),
                    f"{record['lat']:.5f}",
                    f"{record['lng']:.5f}",
                    sql_str(record["region"]),
                    sql_str(record["category"]),
                    sql_str(record["note"]),
                    sql_str(record["sourceUrl"]),
                ]
            )
            + ")"
        )
    insert = (
        "insert into public.starter_places (id, name, lat, lng, region, category, note, source_url) values\n"
        + ",\n".join(values)
        + "\non conflict (id) do update set\n"
        + "  name = excluded.name,\n"
        + "  lat = excluded.lat,\n"
        + "  lng = excluded.lng,\n"
        + "  region = excluded.region,\n"
        + "  category = excluded.category,\n"
        + "  note = excluded.note,\n"
        + "  source_url = excluded.source_url;\n"
    )
    migration = MIGRATION_HEAD + insert + MIGRATION_TAIL
    (ROOT / "supabase" / "migrations" / "20241114000000_family_map.sql").write_text(
        migration, encoding="utf-8"
    )
    print(f"wrote {len(records)} starters")


if __name__ == "__main__":
    main()
