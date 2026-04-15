/**
 * Location data for known Supabase properties.
 *
 * The Supabase `description` table doesn't store coordinates, so we maintain
 * an in-code lookup keyed by eg_property_id. Each entry carries:
 *   - the property's lat/lng (approximate — city/neighborhood level)
 *   - the arrival airport (nearest major airport serving the city)
 *
 * The fixed origin for every trip is JFK (New York).
 */

export type Airport = {
  iata: string;
  name: string;
  lat: number;
  lng: number;
};

export type PropertyLocation = {
  eg_property_id: string;
  lat: number;
  lng: number;
  airport: Airport;
};

/** Fixed origin airport — all trips start here. */
export const ORIGIN_AIRPORT: Airport = {
  iata: "JFK",
  name: "John F. Kennedy International, New York",
  lat: 40.6413,
  lng: -73.7781,
};

/** Lookup from eg_property_id → coordinates + arrival airport. */
export const PROPERTY_LOCATIONS: Record<string, PropertyLocation> = {
  // Pompei, Italy — Naples airport
  "110f01b8ae518a0ee41047bce5c22572988a435e10ead72dc1af793bba8ce0b0": {
    eg_property_id:
      "110f01b8ae518a0ee41047bce5c22572988a435e10ead72dc1af793bba8ce0b0",
    lat: 40.7492,
    lng: 14.4989,
    airport: { iata: "NAP", name: "Naples International", lat: 40.886, lng: 14.2908 },
  },
  // Broomfield, Colorado — DEN
  db38b19b897dbece3e34919c662b3fd66d23b615395d11fb69264dd3a9b17723: {
    eg_property_id:
      "db38b19b897dbece3e34919c662b3fd66d23b615395d11fb69264dd3a9b17723",
    lat: 39.9205,
    lng: -105.0867,
    airport: { iata: "DEN", name: "Denver International", lat: 39.8561, lng: -104.6737 },
  },
  // Freudenstadt, Germany — STR (Stuttgart)
  "5f5a0cd8662f0ddf297f2d27358f680daab5d3ac22fd45a4e1c3c3ec2c101a12": {
    eg_property_id:
      "5f5a0cd8662f0ddf297f2d27358f680daab5d3ac22fd45a4e1c3c3ec2c101a12",
    lat: 48.4632,
    lng: 8.4104,
    airport: { iata: "STR", name: "Stuttgart Airport", lat: 48.6899, lng: 9.2219 },
  },
  // San Isidro de El General, Costa Rica — SJO
  "3b984f3ba8df55b2609a1e33fd694cf8407842e1d833c9b4d993b07fc83a2820": {
    eg_property_id:
      "3b984f3ba8df55b2609a1e33fd694cf8407842e1d833c9b4d993b07fc83a2820",
    lat: 9.3776,
    lng: -83.7032,
    airport: { iata: "SJO", name: "San José International", lat: 9.9939, lng: -84.2088 },
  },
  // Bochum, Germany — DUS (Düsseldorf)
  "9a0043fd4258a1286db1e253ca591662b3aac849da12d0d4f67e08b8f59be65f": {
    eg_property_id:
      "9a0043fd4258a1286db1e253ca591662b3aac849da12d0d4f67e08b8f59be65f",
    lat: 51.4818,
    lng: 7.2162,
    airport: { iata: "DUS", name: "Düsseldorf Airport", lat: 51.2895, lng: 6.7668 },
  },
  // Bangkok, Thailand — BKK
  e52d67a758ce4ad0229aacc97e5dfe89984c384c51a70208f9e0cc65c9cd4676: {
    eg_property_id:
      "e52d67a758ce4ad0229aacc97e5dfe89984c384c51a70208f9e0cc65c9cd4676",
    lat: 13.7588,
    lng: 100.4976,
    airport: { iata: "BKK", name: "Suvarnabhumi (Bangkok)", lat: 13.69, lng: 100.7501 },
  },
  // Frisco, Texas — DFW
  ff26cdda236b233f7c481f0e896814075ac6bed335e162e0ff01d5491343f838: {
    eg_property_id:
      "ff26cdda236b233f7c481f0e896814075ac6bed335e162e0ff01d5491343f838",
    lat: 33.1507,
    lng: -96.8236,
    airport: { iata: "DFW", name: "Dallas/Fort Worth International", lat: 32.8968, lng: -97.038 },
  },
  // Monterey, California — MRY
  fa014137b3ea9af6a90c0a86a1d099e46f7e56d6eb33db1ad1ec4bdac68c3caa: {
    eg_property_id:
      "fa014137b3ea9af6a90c0a86a1d099e46f7e56d6eb33db1ad1ec4bdac68c3caa",
    lat: 36.6177,
    lng: -121.9013,
    airport: { iata: "MRY", name: "Monterey Regional", lat: 36.587, lng: -121.842 },
  },
  // Rome, Italy — FCO
  "823fb2499b4e37d99acb65e7198e75965d6496fd1c579f976205c0e6179206df": {
    eg_property_id:
      "823fb2499b4e37d99acb65e7198e75965d6496fd1c579f976205c0e6179206df",
    lat: 41.9028,
    lng: 12.4964,
    airport: { iata: "FCO", name: "Rome Fiumicino", lat: 41.8003, lng: 12.2389 },
  },
  // Mbombela, South Africa — MQP (Kruger Mpumalanga)
  a036cbe1d9fbf9cba088075d1b4d966ee871df55aa4a58ba0da23c116c499052: {
    eg_property_id:
      "a036cbe1d9fbf9cba088075d1b4d966ee871df55aa4a58ba0da23c116c499052",
    lat: -25.4653,
    lng: 30.9785,
    airport: { iata: "MQP", name: "Kruger Mpumalanga International", lat: -25.3832, lng: 31.1056 },
  },
  // Bell Gardens, California — LAX
  "3216b1b7885bffdb336265a8de7322ba0cd477cfb3d4f99d19acf488f76a1941": {
    eg_property_id:
      "3216b1b7885bffdb336265a8de7322ba0cd477cfb3d4f99d19acf488f76a1941",
    lat: 33.9653,
    lng: -118.1515,
    airport: { iata: "LAX", name: "Los Angeles International", lat: 33.9416, lng: -118.4085 },
  },
  // New Smyrna Beach, Florida — DAB
  f2d8d9557208d58577e9df7ff34e42bf86fb5b10fdfae0c3040d14c374a2a2b9: {
    eg_property_id:
      "f2d8d9557208d58577e9df7ff34e42bf86fb5b10fdfae0c3040d14c374a2a2b9",
    lat: 29.0258,
    lng: -80.927,
    airport: { iata: "DAB", name: "Daytona Beach International", lat: 29.1799, lng: -81.0581 },
  },
  // Ocala, Florida — MCO (Orlando)
  "7d027ef72c02eaa17af3c993fd5dba50d17b41a6280389a46c13c7e2c32a5b06": {
    eg_property_id:
      "7d027ef72c02eaa17af3c993fd5dba50d17b41a6280389a46c13c7e2c32a5b06",
    lat: 29.1872,
    lng: -82.1401,
    airport: { iata: "MCO", name: "Orlando International", lat: 28.4312, lng: -81.308 },
  },
};

export function getPropertyLocation(egPropertyId: string): PropertyLocation | null {
  return PROPERTY_LOCATIONS[egPropertyId] ?? null;
}
