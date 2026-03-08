# Data schema examples

## * NOTE ON ACS POPULATION RACE DATA:
- field "B02001_008E": "Two+ Race Population" counts ALL mixed race population, do not add 009 and 010 to it

## census data (ACS)
```json
[
    [
        "GEO_ID",
        "NAME",
        "B01003_001E",
        "B01001_002E",
        "B01001_026E",
        "B02001_002E",
        "B02001_003E",
        "B02001_004E",
        "B02001_005E",
        "B02001_006E",
        "B02001_007E",
        "B02001_008E",
        "B02001_009E",
        "B02001_010E",
        "B06011_001E",
        "B01002_001E",
        "B17001_002E",
        "B25064_001E",
        "B28008_002E",
        "state",
        "county",
        "tract"
    ],
    [
        "1400000US17005951200",
        "Census Tract 9512; Bond County; Illinois",
        "2767",
        "1388",
        "1379",
        "2568",
        "45",
        "6",
        "0",
        "0",
        "0",
        "148",
        "46",
        "102",
        "35395",
        "49.3",
        "337",
        "801",
        "2556",
        "17",
        "005",
        "951200"
    ],
]
```

## counties from TIGER
```json
"features": [
    {
        "attributes": {
            "MTFCC": "G4020",
            "OID": "27590358777104",
            "GEOID": "17133",
            "STATE": "17",
            "COUNTY": "133",
            "COUNTYNS": "01784865",
            "BASENAME": "Monroe",
            "NAME": "Monroe County",
            "LSADC": "06",
            "FUNCSTAT": "A",
            "COUNTYCC": "H1",
            "AREALAND": "997924024",
            "AREAWATER": "33756313",
            "OBJECTID": 59,
            "CENTLAT": "+38.2784841",
            "CENTLON": "-090.1772243",
            "INTPTLAT": "+38.2779831",
            "INTPTLON": "-090.1790777"
        },
        "geometry": {
            "rings": [
                [
                    [
                        -89.984583999779446,
                        38.308417000302214
                    ],
                    [
                        -89.984295999899359,
                        38.308414000269835
                    ],
                    [
                        -89.975100000234733,
                        38.308368000227816
                    ],
                    [
                        -89.972001000252419,
                        38.308362999700442
                    ],
                                    ]
            ]
        }
    },
]
```

## census tracts from TIGER
```json
"features": [
    {
        "attributes": {
            "MTFCC": "G5020",
            "OID": "20790539604458",
            "GEOID": "29189221201",
            "STATE": "29",
            "COUNTY": "189",
            "TRACT": "221201",
            "BASENAME": "2212.01",
            "NAME": "Census Tract 2212.01",
            "LSADC": "CT",
            "FUNCSTAT": "S",
            "AREALAND": "12989024",
            "AREAWATER": "139584",
            "CENTLAT": "+38.5336093",
            "CENTLON": "-090.4152352",
            "INTPTLAT": "+38.5344935",
            "INTPTLON": "-090.4173867",
            "OBJECTID": 492
        },
        "geometry": {
            "rings": [
                [
                    [
                        -90.435748000280199,
                        38.516000000109862
                    ],
                    [
                        -90.435438999585386,
                        38.518969000299883
                    ],
                    [
                        -90.435156999553087,
                        38.52168999978182
                    ],
                    [
                        -90.435139000009727,
                        38.5220549999
                    ],
                ]
            ]
        }
    },
]
```