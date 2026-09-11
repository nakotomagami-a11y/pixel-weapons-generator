/**
 * Runtime metadata for the "build it yourself" dropdowns — a display label
 * per option, for every field {@link WeaponParts} exposes. Pure data (no
 * canvas/RNG deps) so it's safe to import from UI code. Kept separate from
 * `types.ts` because TypeScript union types vanish at runtime; a UI needs an
 * actual array to map over.
 */
import type { IconClass, BladeProfile, BladeGuard, BladePommel, BladeModification, AxeHead, SpearHead, StaffHead, StaffShaft, TridentType, ShieldShape, ShieldBlazon, ShieldEmblem } from "./types";
export interface PartOption<T extends string> {
    value: T;
    label: string;
}
export declare const BLADE_PROFILE_OPTIONS: PartOption<BladeProfile>[];
export declare const BLADE_GUARD_OPTIONS: PartOption<BladeGuard>[];
export declare const BLADE_POMMEL_OPTIONS: PartOption<BladePommel>[];
/** Knight-only for now — see `BladeParts.modification`'s doc comment. */
export declare const BLADE_MODIFICATION_OPTIONS: PartOption<BladeModification>[];
export declare const AXE_HEAD_OPTIONS: PartOption<AxeHead>[];
export declare const SPEAR_HEAD_OPTIONS: PartOption<SpearHead>[];
export declare const STAFF_HEAD_OPTIONS: PartOption<StaffHead>[];
export declare const STAFF_SHAFT_OPTIONS: PartOption<StaffShaft>[];
export declare const TRIDENT_TYPE_OPTIONS: PartOption<TridentType>[];
export declare const SHIELD_SHAPE_OPTIONS: PartOption<ShieldShape>[];
export declare const SHIELD_BLAZON_OPTIONS: PartOption<ShieldBlazon>[];
export declare const SHIELD_EMBLEM_OPTIONS: PartOption<ShieldEmblem>[];
/**
 * One overridable field on a weapon class: its `key` inside that class's
 * {@link WeaponParts} sub-object (e.g. `blades.profile`), a display `label`,
 * and the selectable `options`. Leaving a field unset (undefined) keeps it
 * seed-random — that is the "Auto (random)" choice a UI should offer.
 */
export interface PartField {
    key: string;
    label: string;
    options: PartOption<string>[];
}
/**
 * The complete, data-driven description of the "build it yourself" UI: for
 * every {@link IconClass}, the ordered list of dropdowns to show. A consumer
 * can render the whole part-picker by iterating this — no hardcoded mapping of
 * which fields belong to which weapon. Keys match {@link WeaponParts} exactly,
 * so `{ [field.key]: selectedValue }` is a valid parts sub-object.
 */
export declare const WEAPON_PART_SCHEMA: Record<IconClass, PartField[]>;
