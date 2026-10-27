/** Explicit conversion for this trainer; not a claim of current Riot client parity. */
export const LOL_UNITS_PER_WORLD=100;
export const TRAINING_PLAYER_RADIUS=.65;
export const HISTORICAL_REFERENCE_SOURCE='https://github.com/Esk0r/LeagueSharp/blob/3dbccd6b85dce14b0428dba8cda00aa7c9cf40b2/Evade/SpellDatabase.cs';
export const HISTORICAL_REFERENCES=Object.freeze([
 {ability:'Ezreal Q',field:'RawRadius',value:60,speed:2000,delayMs:250},
 {ability:'Lux R',field:'RawRadius',value:190,delayMs:1000},
 {ability:'Xerath R',field:'RawRadius',value:130,delayMs:700},
 {ability:'Brand W',field:'RawRadius',value:260,delayMs:850},
 {ability:'Veigar E',field:'RingRadius',value:350,wallRadius:80,delayMs:500},
].map(Object.freeze));
export const toWorld=units=>units/LOL_UNITS_PER_WORLD;
