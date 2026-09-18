# Nutrition Rating Methodology

## 1. Purpose and scope

Codify displays an **Estimated Nutrition Rating** on eligible food and
non-alcoholic drink products, to give users a quick, independently-computed
signal of overall nutritional quality alongside — and clearly separate from —
their Philippine FDA registration or notification status.

This document explains, in reproducible detail, how that rating is
calculated, what it does and does not mean, and its limitations. It exists so
that a thesis panel, a future maintainer, or a curious user can verify any
displayed rating by hand from the same inputs Codify uses.

This methodology applies only to:

- packaged food products, and
- non-alcoholic drink products.

It is never applied to cosmetics, medicines, or other non-food/non-drink
products. Those categories have no "Estimated Nutrition Rating" card at all
in the app, by design (see §9).

## 2. Why the Health Star Rating (HSR) method was selected

Codify adopts the **Australian/New Zealand Health Star Rating (HSR) system**
as its nutrient profiling method. HSR was chosen because it is:

- **A complete, published, peer-reviewed nutrient profiling algorithm.**
  Unlike an ad hoc points system, HSR specifies exact nutrients, exact unit
  conversions, exact category rules, and exact thresholds, all of which are
  publicly documented by its government stewards. This is what makes an
  estimate reproducible rather than arbitrary.
- **Designed for exactly this use case.** HSR was built to let a consumer
  compare packaged foods at the point of purchase from nutrition-label data
  alone — the same constraint Codify operates under (a photographed or
  scanned label, not a laboratory analysis).
- **Widely used in nutrition-science literature**, which makes it easier for
  a thesis reader to cross-check Codify's implementation against an
  established reference rather than a novel, unverifiable formula.

## 3. Origin: this is an Australian/New Zealand system, adapted for research use

The Health Star Rating system originated in **Australia and New Zealand**,
developed jointly by the Australian, State, and Territory governments in
partnership with the New Zealand Ministry of Health, food industry, and
public health groups, and administered under Food Standards Australia New
Zealand (FSANZ) food-labelling law.

**The Philippines has not officially adopted HSR.** Codify does not claim
Philippine regulatory endorsement of this method, and does not use the
official HSR logo or imply that Codify is a licensed user of the official
Australian/New Zealand HSR mark. Codify's rating is presented as an
**independent, HSR-based estimate** — plain text and ordinary star icons
only.

## 4. Why an international method is acceptable as an adapted research methodology

Using a published international nutrient profiling model, rather than
inventing a new one, is standard and defensible research practice for a
thesis of this kind, for three reasons:

1. **External validity.** HSR's thresholds were derived from and validated
   against a large nutrient profiling scoring criterion originally developed
   for food-marketing-to-children regulation, then further refined by an
   Australian/New Zealand technical working group. Re-deriving an equivalent
   model from scratch, without comparable data or review, would be far less
   defensible than adapting an existing, published one.
2. **Transparency and reproducibility.** Because HSR's formula and thresholds
   are public, every number Codify shows can be checked against the source
   document — which is precisely the property a locally-invented "0–100
   health score" lacked (see §10 for why that was replaced).
3. **Precedent for adaptation.** Nutrient profiling models are routinely
   adapted for use outside their country of origin in academic and applied
   nutrition research (the WHO Western Pacific model itself, discussed in
   §12, is one such adaptation of nutrient-profiling principles for a
   different regulatory context). Codify's contribution is the same kind of
   adaptation: applying a published algorithm to Philippine retail products,
   while being explicit that the algorithm itself is not a Philippine
   government standard.

## 5. Philippine FDA registration vs. nutrition rating: two separate concepts

Codify keeps these concepts strictly separate, in both data model and UI:

| Concept | What it means | Where it comes from |
|---|---|---|
| **FDA status** (Approved / Caution / FDA Advisory / Unverified) | Whether a product's Philippine FDA food registration or cosmetic/drug notification could be matched and verified against the FDA's public portal | Philippine FDA registration/notification records |
| **Estimated Nutrition Rating** | An independent estimate of nutritional quality, from 0.5 to 5 stars | Codify's own HSR-based calculation from the product's nutrition-label values |

A product can be **FDA-registered and approved** while still receiving a
**low nutrition rating** (e.g. a registered, approved sugary drink), and vice
versa. Neither status is derived from, or changes, the other. The nutrition
rating never affects the `status`/`fdaStatusLabel`/`registrationNumber`
fields, and FDA verification never affects the nutrition rating.

## 6. Nutrients and units used

All calculations use these nutrients, standardized to **per 100 g** (foods)
or **per 100 mL** (beverages), per the HSR Implementation Guide:

| Nutrient | Unit used in calculation | Notes |
|---|---|---|
| Energy | kilojoules (kJ) | Converted from kilocalories using **1 kcal = 4.184 kJ** when the label states kcal, since Philippine labels commonly print kcal |
| Saturated fat | grams (g) | Not used for the non-dairy beverage category (see §8) |
| Total sugars | grams (g) | |
| Sodium | milligrams (mg) | Not used for the non-dairy beverage category (see §8) |
| Protein | grams (g) | Modifying nutrient; optional |
| Dietary fibre | grams (g) | Modifying nutrient; optional; not applicable to beverages |
| Fruit/vegetable/nut/legume (FVNL) content | percentage (%) | Modifying factor; optional, requires a verified percentage and a fruit/vegetable or nuts/legumes flag |

## 7. Normalization formula

Nutrition Facts labels state values per serving. HSR requires values per 100
g or 100 mL, so every per-serving value is standardized as:

```
value_per_100 = value_per_serving × (100 / serving_quantity)
```

where `serving_quantity` is the verified serving size in grams (for foods) or
millilitres (for beverages), exactly as printed on the label.

**Worked example — energy, in kJ, from kcal:**

```
energy_kJ_per_serving = calories_per_serving × 4.184
energy_kJ_per_100 = energy_kJ_per_serving × (100 / serving_quantity)
```

A serving quantity that is missing, zero, negative, or not a real number
makes normalization impossible; the product is then reported as **Not
enough verified data** (§11), never estimated from a guessed serving size.

## 8. Baseline points and modifying points

HSR scores a product in two stages.

### 8.1 Baseline points ("risk" nutrients)

Each of energy, saturated fat, total sugars, and sodium (per 100 g/mL) is
looked up against a published, ascending threshold table for its HSR
category. The number of points awarded equals the number of thresholds the
standardized value exceeds — i.e., a higher value always scores the same
number of points or more than a lower value (monotonic, no rounding
ambiguity). Baseline points are the sum across all applicable nutrients.

The **non-dairy beverage** category (most drinks) uses only **energy and
total sugars** — beverages are not assessed on saturated fat or sodium,
consistent with the official guide. All other categories use all four
baseline nutrients.

### 8.2 Modifying points ("protective" nutrients)

Protein, dietary fibre, and FVNL percentage can each *reduce* the score,
again via their own published threshold tables:

- **Protein points**: awarded from verified protein content, for every
  category except non-dairy beverages.
- **Fibre points**: awarded from verified dietary fibre content, for every
  category except non-dairy and dairy beverages.
- **FVNL points**: awarded from a verified fruit/vegetable/nut/legume
  percentage, when the product is flagged as containing fruit/vegetable or
  nuts/legumes.

**Official anti-gaming rule:** if a product's baseline points total **13 or
more**, it is **not** permitted to score protein points **unless** it also
scores **5 or more FVNL points**. This prevents energy-dense, high-sodium,
high-sugar products with incidentally high protein (for example, some
processed meats) from being rewarded for that protein. Codify implements
this rule exactly; when it is the reason no protein points were awarded, the
"Why this rating?" panel says so explicitly rather than presenting it as
missing data.

### 8.3 Final score and star conversion

```
final_points = baseline_points − protein_points − fibre_points − fvnl_points
```

`final_points` is then converted to a star rating from **0.5 to 5 stars**, in
half-star steps, via a published lookup table that differs **by category**
(the same final point total maps to a different star rating for, say, a
beverage than for a general food). Codify stores the category alongside
every rating specifically so this conversion is never ambiguous.

## 9. Category rules

Codify's calculator implements every category defined by the HSR
Implementation Guide, so any eligible product — not just packaged snacks —
can be assessed correctly:

| Category | Applies to | Baseline nutrients | Notes |
|---|---|---|---|
| Non-dairy beverage (Category 1) | Most drinks (soft drinks, juices, sports drinks, tea, etc.) | Energy, total sugars | Cannot reach 5 or 4.5 stars through the general formula — those ratings are reserved for the automatic cases below |
| Dairy beverage (Category 1D) | Milk-based drinks | Energy, saturated fat, total sugars, sodium | |
| General food (Category 2) | Most packaged foods | Energy, saturated fat, total sugars, sodium | The default category for solid/semi-solid foods |
| Dairy food (Category 2D) | Yoghurt and similar dairy foods | Energy, saturated fat, total sugars, sodium | Own star-conversion table |
| Oils, spreads, and dressings (Category 3) | Cooking oils, margarine-type spreads, mayonnaise, dressings | Energy, saturated fat, total sugars, sodium | Own saturated-fat and sugar threshold tables; own star-conversion table |
| Cheese (Category 3D) | Cheese and processed cheese products | Energy, saturated fat, total sugars, sodium | Own star-conversion table |
| Plain water | Bottled/distilled drinking water with no added ingredients | — | **Automatic 5 stars**, per the official rule that plain water is not run through the general formula |
| Unsweetened flavoured water | Flavoured water with no added sugar | — | **Automatic 4.5 stars** |

Products that are not food or non-alcoholic drinks (cosmetics, medicines,
supplements presented as capsules/tablets, etc.) receive **no category and
no rating at all** — the rating card does not render for them, and no
database row is created.

## 10. Missing-data policy

The previous implementation multiplied a computed half-star value by 20 and
displayed it as, for example, "10/100". A thesis panelist correctly
identified that this number is not a percentage and must not be presented as
one — 10/100 does not mean "10% healthy," it is simply 0.5 stars rescaled
into a 0–100 range that resembles a percentage without being one. This
implementation replaces that presentation entirely (see §14) and formalizes
three explicit result tiers instead:

1. **Complete HSR-based estimate** — every baseline nutrient is verified,
   and every applicable modifying component (protein, fibre, FVNL) is either
   verified or is genuinely not applicable to the product's category.
2. **Conservative HSR-based estimate** — every required baseline nutrient is
   verified, but at least one applicable modifying component was not
   verified. That component contributes **zero** points — Codify never
   guesses a beneficial value — and the UI shows:

   > "Conservative estimate: unknown beneficial components received no
   > modifying points, so the complete rating may be higher."

3. **Not enough verified data** — a required baseline nutrient, the serving
   quantity, the serving unit, or the calculation category is missing,
   zero, negative, or otherwise unusable. No star rating is shown at all; a
   specific reason is shown instead (e.g. "A verified sodium value per
   serving is required.").

This distinction directly reflects the official HSR calculator's own
published warning that consumer labels may not always contain enough
information for a complete, official rating — Codify treats that as a
first-class state rather than silently producing a number regardless.

Because a conservative estimate is, by construction, a **lower bound** (no
missing component can ever subtract more than zero points from what a
complete calculation would subtract), Codify's conservative wording is
itself a form of the "lower-bound" presentation the official calculator's
guidance points toward — the displayed rating is never higher than the true
complete rating would be, only potentially lower.

## 11. Worked example: Super Delights Brownie Bites 14 g

This is the example a thesis panelist specifically raised. Label values (per
14 g serving, as printed):

- Calories: 60 kcal
- Saturated fat: 1 g
- Total sugars: 6 g
- Sodium: 40 mg
- Category: General food (Category 2) — a baked snack, not a beverage, dairy
  food, cheese, or oil/spread

**Step 1 — normalize to per 100 g** (multiplier = 100 / 14 = 7.142857...):

| Nutrient | Per serving | Per 100 g |
|---|---|---|
| Energy | 60 kcal → 60 × 4.184 = 251.04 kJ | 251.04 × 7.142857 ≈ **1793.14 kJ** |
| Saturated fat | 1 g | 1 × 7.142857 ≈ **7.14 g** |
| Total sugars | 6 g | 6 × 7.142857 ≈ **42.86 g** |
| Sodium | 40 mg | 40 × 7.142857 ≈ **285.71 mg** |

**Step 2 — baseline points** (General food thresholds):

| Nutrient | Value | Points |
|---|---|---|
| Energy | 1793.14 kJ | 5 |
| Saturated fat | 7.14 g | 7 |
| Total sugars | 42.86 g | 10 |
| Sodium | 285.71 mg | 3 |
| **Baseline total** | | **25** |

**Step 3 — modifying points:** the label states protein and dietary fibre
only as "Less than 1g" — not an exact verified value — and no fruit,
vegetable, nut, or legume content is declared. Per §10, all three modifying
components are therefore **not verified**, and each contributes **0**
points. (Separately, because baseline points ≥ 13 and FVNL points are below
5, protein points would be withheld by the official anti-gaming rule in
§8.2 even if a protein value had been supplied — the outcome is the same
either way.)

**Step 4 — final score and rating:**

```
final_points = 25 − 0 − 0 − 0 = 25
```

25 final points, for the General food category, maps to **0.5 stars** (the
lowest band).

**Result shown in Codify:**

- Title: **Estimated Nutrition Rating**
- Main result: **0.5/5 stars**
- Method label: **HSR-based estimate**
- Confidence: **Conservative estimate** (protein, fibre, and FVNL were not
  verified)

This is the same underlying number the earlier implementation produced
(0.5 stars, previously shown as the misleading "10/100"). The calculation
was already correct; only the presentation was wrong, and only the
presentation has changed for this product. See §16 for the full list of
products affected by this change.

## 12. Interpretation and comparison limitations

- **A star rating is a summary, not a complete nutrition assessment.** It
  does not account for vitamins, minerals, additives, or ingredient
  quality beyond the nutrients in §6.
- **Compare like with like.** A rating is only meaningful when comparing
  products within the same category — compare a soft drink with another
  soft drink, not with a snack food, since each category uses its own
  threshold and star-conversion tables. Codify shows this reminder directly
  in the "Why this rating?" panel.
- **A conservative estimate is a floor, not a final answer.** If Codify
  shows "Conservative," a more complete label (with verified protein, fibre,
  or fruit/vegetable content) could justify a higher rating — never a lower
  one.
- **This is not a safety or allergen determination.** A high star rating
  does not mean a product is safe for a given individual (e.g. someone with
  an allergy or medical condition); that information is shown separately in
  Codify's allergen and safety sections.

## 13. Philippine applicability limitation

The HSR thresholds were developed and calibrated using Australian and New
Zealand food-supply data and dietary patterns. The Philippines has its own
distinct food supply, dietary patterns, and nutrient reference values (the
Philippine Dietary Reference Intakes, maintained by DOST-FNRI). Applying HSR
thresholds to Philippine retail products is therefore an **adaptation**, not
a validated Philippine-specific tool, and the resulting star rating should
be read as an internationally-modeled estimate rather than a locally
calibrated one. This limitation is disclosed here, and the app never
describes the rating as a Philippine government or DOST-FNRI standard.

## 14. What changed, and why

| Before | After |
|---|---|
| A single ambiguous `healthScore` integer (0–100), computed by multiplying an HSR star rating by 20 | A structured `NutritionRating` record: category, verified inputs, standardized values, point breakdown, confidence tier, and an unambiguous star rating |
| Displayed as "Nutrition Score: 10/100," which reads as a percentage | Displayed as "Estimated Nutrition Rating: 0.5/5 stars (HSR-based estimate)," with ordinary star icons — never described as a percentage |
| An administrator could type any number 0–100 directly into an admin field | An administrator enters verified nutrition-label values and a category; the backend always computes the rating server-side — there is no field to submit a score or rating directly |
| Only Category 1 (non-dairy beverage) and Category 2 (general food) were implemented, with no modifying points | All HSR categories are implemented (Category 1, 1D, 2, 2D, 3, 3D, plus the plain-water and unsweetened-flavoured-water special cases), including protein, fibre, and FVNL modifying points and the baseline≥13 protein rule |
| No distinction between "fully verified" and "some data unknown" | Three explicit tiers: Complete, Conservative, and Not enough verified data |
| Half-star ratings were only ever produced as a derived 0–100 integer | Stored as an integer half-step from 1 (0.5 star) to 10 (5 stars) — precise, and not shaped like a 0–100 score |

## 15. References

Primary references (official HSR sources):

1. Australian Government, *Health Star Rating System Implementation Guide*,
   Version 9 (December 2025).
   `https://www.healthstarrating.gov.au/sites/default/files/2025-12/Health%20Star%20Rating%20System%20Implementation%20Guide%20v9.pdf`
   Located via the Health Star Rating System's official industry guide
   listing (`https://www.healthstarrating.gov.au/industry/health-star-rating-system-implementation-guide`)
   on 18 September 2026. This is the authoritative source for the category
   definitions, baseline/modifying point tables, the baseline≥13 protein
   rule, and the star-conversion tables implemented in
   `backend/src/lib/nutrition-score.ts`. The exact numeric tables were
   cross-verified against an independent, openly-licensed reproduction of
   the same official algorithm (`https://github.com/muhashi/health-star-rating`,
   reviewed 18 September 2026), and the baseline≥13 protein rule was
   independently confirmed against the Health Star Rating System's own
   published summary of that rule.
2. Health Star Rating System, "How ratings are calculated."
   `https://www.healthstarrating.gov.au/about/how-ratings-are-calculated`
   Accessed 18 September 2026. Source for the baseline-points-vs-modifying-
   points framing (§8) and the general description of the 0.5–5 star scale.
3. Food Standards Australia New Zealand, "Health Star Rating System."
   `https://www.foodstandards.gov.au/consumer/labelling/Health-Star-Rating-System`
   Accessed 18 September 2026. Source for the consumer-facing description of
   risk-increasing vs. risk-decreasing nutrients (§6, §8) and confirmation
   that HSR is a joint Australia/New Zealand government system (§3).
4. Health Star Rating System, official calculator.
   `https://www.healthstarrating.gov.au/calculator`
   Cited per the project brief for its published warning that consumer
   labels may not always contain enough information to produce a complete
   official rating — the direct basis for this document's missing-data
   policy (§10).

Supporting context only (not the source of the rating formula):

5. World Health Organization Regional Office for the Western Pacific,
   *WHO Nutrient Profile Model for the Western Pacific Region* (2016).
   `https://www.who.int/publications/i/item/9789290617853`
   Cited as regional public-health context for nutrient profiling in general,
   and as an example of an internationally-published nutrient profiling
   model being adapted for a specific region (§4). It is not used as a
   source of thresholds or formulas anywhere in this implementation.
6. Philippine Department of Science and Technology – Food and Nutrition
   Research Institute (DOST-FNRI), nutrition-label and Philippine Dietary
   Reference Intakes (PDRI) resource.
   `https://helponline.fnri.dost.gov.ph/help/nutrition_label`
   Cited as the relevant Philippine nutrition-reference context (§13). Codify
   does not use PDRI values as HSR thresholds, and does not claim DOST-FNRI
   endorsement of this rating.

## 16. Products recalculated during this audit

See the end-of-task report for the full list of products whose rating
presentation changed, and the list of products currently reported as "Not
enough verified data." `backend/scripts/nutrition-rating-audit.mjs`
(`npm run nutrition:audit` from `backend/`) regenerates this list on demand
against the live database, for future re-audits.
