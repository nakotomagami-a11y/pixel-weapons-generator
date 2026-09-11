export const BLADE_PROFILE_OPTIONS = [
    { value: "knight", label: "Knight" },
    { value: "broad", label: "Broadsword" },
    { value: "cleaver", label: "Cleaver" },
    { value: "rapier", label: "Rapier" },
    { value: "flamberge", label: "Flamberge" },
    { value: "leaf", label: "Leaf Blade" },
    { value: "bowie", label: "Bowie" },
    { value: "katana", label: "Katana" },
    { value: "dagger", label: "Dagger" },
    { value: "barbed", label: "Barbed" },
];
export const BLADE_GUARD_OPTIONS = [
    { value: "bar", label: "Bar" },
    { value: "swept", label: "Swept" },
    { value: "wings", label: "Wings" },
    { value: "disc", label: "Disc" },
    { value: "none", label: "None" },
];
export const BLADE_POMMEL_OPTIONS = [
    { value: "round", label: "Round" },
    { value: "gem", label: "Gem" },
    { value: "faceted", label: "Faceted Gem" },
    { value: "wheel", label: "Wheel" },
    { value: "ring", label: "Ring" },
    { value: "trefoil", label: "Trefoil" },
    { value: "acorn", label: "Acorn" },
    { value: "scentstopper", label: "Scent-Stopper" },
    { value: "spike", label: "Spike" },
    { value: "flanged", label: "Flanged" },
    { value: "crown", label: "Crown" },
    { value: "birdhead", label: "Bird-Head" },
    { value: "none", label: "None" },
];
/** Knight-only for now — see `BladeParts.modification`'s doc comment. */
export const BLADE_MODIFICATION_OPTIONS = [
    { value: "none", label: "None" },
    { value: "serrated", label: "Serrated Edge" },
    { value: "notched", label: "Notched Edge" },
    { value: "diamond", label: "Diamond Etched" },
    { value: "riveted", label: "Riveted Spine" },
    { value: "wavy", label: "Wavy Blade" },
    { value: "fireTempered", label: "Fire-Tempered" },
];
export const AXE_HEAD_OPTIONS = [
    { value: "fan", label: "Fan" },
    { value: "bearded", label: "Bearded" },
    { value: "broad", label: "Broad" },
    { value: "double", label: "Double Bit" },
    { value: "crescent", label: "Crescent" },
    { value: "halberd", label: "Halberd" },
];
export const SPEAR_HEAD_OPTIONS = [
    { value: "leaf", label: "Leaf" },
    { value: "pike", label: "Pike" },
    { value: "broadleaf", label: "Broad Leaf" },
    { value: "winged", label: "Winged" },
    { value: "glaive", label: "Glaive" },
    { value: "harpoon", label: "Harpoon" },
    { value: "needle", label: "Needle" },
    { value: "partisan", label: "Partisan" },
    { value: "forked", label: "Forked" },
];
export const STAFF_HEAD_OPTIONS = [
    { value: "bare", label: "Bare Gem" },
    { value: "claws", label: "Claws" },
    { value: "crescent", label: "Crescent" },
    { value: "halo", label: "Halo" },
    { value: "wings", label: "Wings" },
    { value: "cluster", label: "Crystal Cluster" },
    { value: "collar", label: "Collar" },
    { value: "loop", label: "Loop" },
];
export const STAFF_SHAFT_OPTIONS = [
    { value: "straight", label: "Straight" },
    { value: "twisted", label: "Twisted" },
    { value: "wrapped", label: "Wrapped" },
    { value: "segmented", label: "Segmented" },
];
export const TRIDENT_TYPE_OPTIONS = [
    { value: "trident", label: "Trident" },
    { value: "pitchfork", label: "Pitchfork" },
];
export const SHIELD_SHAPE_OPTIONS = [
    { value: "heater", label: "Heater" },
    { value: "kite", label: "Kite" },
    { value: "tower", label: "Tower" },
    { value: "round", label: "Round" },
    { value: "crest", label: "Crest" },
    { value: "teardrop", label: "Teardrop" },
    { value: "lozenge", label: "Lozenge" },
    { value: "hexagon", label: "Hexagon" },
    { value: "scallop", label: "Scallop" },
];
export const SHIELD_BLAZON_OPTIONS = [
    { value: "planked", label: "Planked" },
    { value: "marble", label: "Marble" },
    { value: "hammered", label: "Hammered" },
    { value: "bone", label: "Bone" },
    { value: "scaled", label: "Scaled" },
    { value: "leather", label: "Leather" },
    { value: "weave", label: "Weave" },
    { value: "verdigris", label: "Verdigris" },
    { value: "crystal", label: "Crystal" },
    { value: "half-vertical", label: "Half — Vertical" },
    { value: "half-horizontal", label: "Half — Horizontal" },
    { value: "half-diagonal", label: "Half — Diagonal" },
    { value: "quarters", label: "Quarters" },
    { value: "stripes-vertical", label: "Stripes — Vertical" },
    { value: "stripes-horizontal", label: "Stripes — Horizontal" },
    { value: "stripes-diagonal", label: "Stripes — Diagonal" },
    { value: "checker", label: "Checkerboard" },
    { value: "diamonds", label: "Diamonds" },
];
export const SHIELD_EMBLEM_OPTIONS = [
    { value: "boss", label: "Boss" },
    { value: "gem", label: "Gem" },
    { value: "cross", label: "Cross" },
    { value: "star", label: "Star" },
    { value: "chevron", label: "Chevron" },
    { value: "none", label: "None" },
];
/**
 * The complete, data-driven description of the "build it yourself" UI: for
 * every {@link IconClass}, the ordered list of dropdowns to show. A consumer
 * can render the whole part-picker by iterating this — no hardcoded mapping of
 * which fields belong to which weapon. Keys match {@link WeaponParts} exactly,
 * so `{ [field.key]: selectedValue }` is a valid parts sub-object.
 */
export const WEAPON_PART_SCHEMA = {
    blades: [
        { key: "profile", label: "Profile", options: BLADE_PROFILE_OPTIONS },
        { key: "guard", label: "Guard", options: BLADE_GUARD_OPTIONS },
        { key: "pommel", label: "Pommel", options: BLADE_POMMEL_OPTIONS },
        { key: "modification", label: "Blade Detail", options: BLADE_MODIFICATION_OPTIONS },
    ],
    spears: [{ key: "head", label: "Head", options: SPEAR_HEAD_OPTIONS }],
    axes: [{ key: "head", label: "Head", options: AXE_HEAD_OPTIONS }],
    staffs: [
        { key: "head", label: "Head", options: STAFF_HEAD_OPTIONS },
        { key: "shaft", label: "Shaft", options: STAFF_SHAFT_OPTIONS },
    ],
    tridents: [{ key: "type", label: "Type", options: TRIDENT_TYPE_OPTIONS }],
    shields: [
        { key: "shape", label: "Shape", options: SHIELD_SHAPE_OPTIONS },
        { key: "blazon", label: "Blazon", options: SHIELD_BLAZON_OPTIONS },
        { key: "emblem", label: "Emblem", options: SHIELD_EMBLEM_OPTIONS },
    ],
};
