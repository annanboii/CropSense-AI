export interface CropAgronomicProfile {
  name: string;
  scientificName: string;
  category: string;
  optimalTempRange: { min: number; max: number; unit: string };
  waterRequirementMmPerDay: { min: number; max: number };
  growthDurationDays: { min: number; max: number };
  soilPhRange: { min: number; max: number };
  preferredSoils: string[];
  keyGrowthStages: { stage: string; description: string; criticalAction: string }[];
  commonDiseases: { name: string; type: string; riskTrigger: string; prevention: string }[];
  harvestingSigns: string[];
  tips: string;
}

export const CROP_OPTIONS = [
  "Tomato",
  "Wheat",
  "Rice",
  "Maize",
  "Potato",
  "Cucumber",
  "Chili",
] as const;

export type StandardCropType = (typeof CROP_OPTIONS)[number];

export const CROP_PROFILES: Record<StandardCropType, CropAgronomicProfile> = {
  Tomato: {
    name: "Tomato",
    scientificName: "Solanum lycopersicum",
    category: "Solanaceous Fruit Vegetable",
    optimalTempRange: { min: 21, max: 29, unit: "°C" },
    waterRequirementMmPerDay: { min: 4.0, max: 6.5 },
    growthDurationDays: { min: 70, max: 110 },
    soilPhRange: { min: 6.0, max: 6.8 },
    preferredSoils: ["Loam", "Sandy Loam", "Silt Loam"],
    keyGrowthStages: [
      {
        stage: "Germination & Seedling",
        description: "Days 1–14: Radical emergence and first true leaf development.",
        criticalAction: "Maintain consistent moisture; avoid temperature below 15°C.",
      },
      {
        stage: "Vegetative & Trellising",
        description: "Days 15–40: Rapid root and vine canopy expansion.",
        criticalAction: "Side-dress balanced NPK; prune basal suckers for ventilation.",
      },
      {
        stage: "Flowering & Fruit Set",
        description: "Days 41–65: Blossom formation and pollination.",
        criticalAction: "Maintain calcium supply and steady drip water to avoid blossom end rot.",
      },
      {
        stage: "Fruit Development & Ripening",
        description: "Days 66–100: Fruit expansion and pigment synthesis (lycopene).",
        criticalAction: "Avoid overhead watering; protect lower foliage against Early Blight.",
      },
    ],
    commonDiseases: [
      {
        name: "Early Blight (Alternaria solani)",
        type: "Fungal",
        riskTrigger: "Warm temperatures (24–29°C) with persistent leaf wetness or humidity > 75%.",
        prevention: "Drip irrigation only, remove lower infected foliage, apply copper bio-fungicide.",
      },
      {
        name: "Late Blight (Phytophthora infestans)",
        type: "Oomycete",
        riskTrigger: "Cool, wet foggy weather (12–22°C) with continuous high humidity (>85%).",
        prevention: "Apply systemic protective treatments, eliminate standing canopy moisture.",
      },
      {
        name: "Blossom End Rot",
        type: "Physiological",
        riskTrigger: "Irregular watering cycles impairing calcium transport to expanding fruit tips.",
        prevention: "Even drip irrigation schedules and maintain soil moisture buffer.",
      },
    ],
    harvestingSigns: [
      "Breaker stage to full red uniform coloration",
      "Firm flesh with characteristic sweet-acid aroma",
      "Calyx separates cleanly with gentle twist",
    ],
    tips: "Tomatoes are sensitive to water fluctuations. Drip fertigation in early morning stabilizes calcium uptake and protects leaves from fungal splash.",
  },
  Wheat: {
    name: "Wheat",
    scientificName: "Triticum aestivum",
    category: "Cereal Grain",
    optimalTempRange: { min: 12, max: 24, unit: "°C" },
    waterRequirementMmPerDay: { min: 3.0, max: 5.5 },
    growthDurationDays: { min: 110, max: 160 },
    soilPhRange: { min: 6.0, max: 7.5 },
    preferredSoils: ["Loam", "Clay Loam", "Silt Loam"],
    keyGrowthStages: [
      {
        stage: "Germination & Emergence",
        description: "Days 1–12: Coleoptile emergence and root establishment.",
        criticalAction: "Ensure seedbed moisture and uniform planting depth (2.5–4 cm).",
      },
      {
        stage: "Tillering & Stem Elongation",
        description: "Days 13–60: Lateral shoot production and jointing stage (Zadoks 30–39).",
        criticalAction: "Apply primary split nitrogen dose; scout for weed competition.",
      },
      {
        stage: "Booting & Heading (Flowering)",
        description: "Days 61–90: Flag leaf emergence and ear extrusion (anthesis).",
        criticalAction: "Critical water demand window; monitor for Fusarium head blight.",
      },
      {
        stage: "Grain Filling & Ripening",
        description: "Days 91–140: Milky, dough, and hard grain maturity phases.",
        criticalAction: "Cease irrigation 10–14 days prior to target combine harvest.",
      },
    ],
    commonDiseases: [
      {
        name: "Stripe / Yellow Rust (Puccinia striiformis)",
        type: "Fungal",
        riskTrigger: "Cool nights (7–12°C) with morning dew followed by mild days (15–20°C).",
        prevention: "Plant resistant cultivars, apply triazole fungicide prior to flag leaf colonization.",
      },
      {
        name: "Fusarium Head Blight (Scab)",
        type: "Fungal",
        riskTrigger: "Warm, humid rain events during wheat flowering / anthesis window.",
        prevention: "Avoid planting immediately after corn residue; apply targeted triazole spray at flowering.",
      },
    ],
    harvestingSigns: [
      "Grain moisture drops below 14% for safe storage",
      "Stems and heads turn golden bronze with brittle chaff",
      "Kernels cannot be easily indented with thumbnail",
    ],
    tips: "Protecting the flag leaf (top leaf) during heading is crucial as it supplies over 60% of grain-filling carbohydrates.",
  },
  Rice: {
    name: "Rice",
    scientificName: "Oryza sativa",
    category: "Cereal Grain / Wetland Crop",
    optimalTempRange: { min: 22, max: 32, unit: "°C" },
    waterRequirementMmPerDay: { min: 6.0, max: 10.0 },
    growthDurationDays: { min: 105, max: 150 },
    soilPhRange: { min: 5.5, max: 6.8 },
    preferredSoils: ["Clay", "Clay Loam", "Silt Loam"],
    keyGrowthStages: [
      {
        stage: "Seedling & Transplanting",
        description: "Days 1–25: Nursery growth and field transplantation (2–3 leaves).",
        criticalAction: "Maintain shallow 2–3 cm water layer to facilitate root anchoring.",
      },
      {
        stage: "Tillering & Panicle Initiation",
        description: "Days 26–65: Active tillering and panicle primordium differentiation.",
        criticalAction: "Mid-season drainage (alternate wetting and drying) for soil aeration.",
      },
      {
        stage: "Booting & Heading / Flowering",
        description: "Days 66–95: Panicle emergence from sheath and pollination.",
        criticalAction: "Maintain continuous 5–7 cm water depth to protect against thermal shock.",
      },
      {
        stage: "Milk, Dough & Maturation",
        description: "Days 96–135: Starch accumulation and hull drying.",
        criticalAction: "Drain field 10–14 days before harvest to firm soil for machinery.",
      },
    ],
    commonDiseases: [
      {
        name: "Rice Blast (Magnaporthe oryzae)",
        type: "Fungal",
        riskTrigger: "Overcast skies, frequent rainfall, high humidity (>90%) with high nitrogen fertilization.",
        prevention: "Balanced split nitrogen application, avoid excessive seeding density, apply tricyclazole.",
      },
      {
        name: "Sheath Blight (Rhizoctonia solani)",
        type: "Fungal",
        riskTrigger: "Warm (28–32°C) dense canopies with high water level contact.",
        prevention: "Maintain wider hill spacing, drain water periodically, apply validamycin.",
      },
    ],
    harvestingSigns: [
      "80–85% of panicle grains have turned golden yellow",
      "Grain moisture reaches 20–22% (sun-dry to 14% post-harvest)",
      "Upper leaves begin to senesce while straw remains slightly pliable",
    ],
    tips: "Alternate Wetting and Drying (AWD) reduces water usage by up to 30% without lowering grain yield while improving root aeration.",
  },
  Maize: {
    name: "Maize (Corn)",
    scientificName: "Zea mays",
    category: "Cereal Grain / Coarse Grain",
    optimalTempRange: { min: 18, max: 32, unit: "°C" },
    waterRequirementMmPerDay: { min: 4.5, max: 7.5 },
    growthDurationDays: { min: 80, max: 130 },
    soilPhRange: { min: 5.8, max: 7.0 },
    preferredSoils: ["Loam", "Sandy Loam", "Silt Loam", "Clay Loam"],
    keyGrowthStages: [
      {
        stage: "Emergence & Early Vegetative (VE–V6)",
        description: "Days 1–25: Emergence and establishment of nodal root system.",
        criticalAction: "Scout for cutworms and wireworms; ensure adequate starter phosphate.",
      },
      {
        stage: "Rapid Canopy Expansion (V7–V14)",
        description: "Days 26–55: High nutrient demand, rapid stalk elongation.",
        criticalAction: "Side-dress remaining nitrogen dose; check soil moisture status.",
      },
      {
        stage: "Tasseling & Silking (VT–R1)",
        description: "Days 56–70: Pollen shed from tassel and silk receptivity.",
        criticalAction: "Most critical water stress period; ensure irrigation to maximize ear kernel set.",
      },
      {
        stage: "Grain Fill & Dent Maturity (R2–R6)",
        description: "Days 71–110: Blister, milk, dough, and black layer physiological maturity.",
        criticalAction: "Monitor ear rot and stalk strength; prepare harvest combine.",
      },
    ],
    commonDiseases: [
      {
        name: "Northern Corn Leaf Blight (Exserohilum turcicum)",
        type: "Fungal",
        riskTrigger: "Moderate temperatures (18–27°C) accompanied by extended dew periods (>8 hours).",
        prevention: "Plant resistant hybrids (Ht genes), crop residue rotation, apply strobilurin fungicide.",
      },
      {
        name: "Common Smut (Ustilago maydis)",
        type: "Fungal",
        riskTrigger: "Hail or mechanical injury during vegetative growth followed by humid spells.",
        prevention: "Avoid mechanical stem damage during cultivation, maintain balanced soil fertility.",
      },
    ],
    harvestingSigns: [
      "Black layer formation at the base of the kernel indicates physiological maturity",
      "Husks turn dry, bleached parchment yellow",
      "Grain moisture ranges between 15–20% for commercial harvest",
    ],
    tips: "Water stress during the 2 weeks before and 2 weeks after silking reduces yield more severely than at any other developmental stage.",
  },
  Potato: {
    name: "Potato",
    scientificName: "Solanum tuberosum",
    category: "Tuber Crop",
    optimalTempRange: { min: 15, max: 24, unit: "°C" },
    waterRequirementMmPerDay: { min: 3.5, max: 6.0 },
    growthDurationDays: { min: 90, max: 140 },
    soilPhRange: { min: 5.0, max: 6.5 },
    preferredSoils: ["Sandy Loam", "Silt Loam", "Loam"],
    keyGrowthStages: [
      {
        stage: "Sprout Development & Emergence",
        description: "Days 1–25: Sprouts emerge from seed tuber eyes and establish roots.",
        criticalAction: "Plant in well-drained, aerated loose soil to prevent seed piece rot.",
      },
      {
        stage: "Vegetative Growth & Hilling",
        description: "Days 26–50: Stem and leaf canopy formation.",
        criticalAction: "Hill soil around stems to expand tuber initiation zone and avoid greening.",
      },
      {
        stage: "Tuber Initiation & Bulking",
        description: "Days 51–100: Stolons swell into tubers; rapid dry matter accumulation.",
        criticalAction: "Maintain consistent soil moisture; fluctuations cause tuber hollow heart or knobs.",
      },
      {
        stage: "Canopy Senescence & Skin Set",
        description: "Days 101–130: Vines yellow and dry; tuber periderm thickens.",
        criticalAction: "Terminate irrigation 2 weeks before harvest (or vine kill) to set skin.",
      },
    ],
    commonDiseases: [
      {
        name: "Late Blight (Phytophthora infestans)",
        type: "Oomycete",
        riskTrigger: "Cool, damp weather (10–20°C) with persistent fog or rain (>90% RH).",
        prevention: "Regular preventive fungicide program, eliminate cull piles, avoid overhead watering.",
      },
      {
        name: "Common Scab (Streptomyces scabies)",
        type: "Bacterial",
        riskTrigger: "Dry, warm alkaline soil (pH > 6.5) during tuber initiation phase.",
        prevention: "Maintain soil pH below 5.5–6.0 and keep soil moist during early tuberization.",
      },
    ],
    harvestingSigns: [
      "Vines have died down naturally or been desiccated for 10–14 days",
      "Tuber skins cannot be easily rubbed off with firm thumb pressure",
      "Soil moisture is slightly dry to prevent soil clods adhering to tubers",
    ],
    tips: "Potatoes require loose, well-drained friable soil. Heavy waterlogging causes lenticel proliferation and bacterial soft rot in stored tubers.",
  },
  Cucumber: {
    name: "Cucumber",
    scientificName: "Cucumis sativus",
    category: "Cucurbitaceous Fruit Vegetable",
    optimalTempRange: { min: 22, max: 30, unit: "°C" },
    waterRequirementMmPerDay: { min: 4.0, max: 7.0 },
    growthDurationDays: { min: 50, max: 75 },
    soilPhRange: { min: 6.0, max: 6.8 },
    preferredSoils: ["Sandy Loam", "Loam", "Silt Loam"],
    keyGrowthStages: [
      {
        stage: "Germination & Seedling",
        description: "Days 1–10: Fast cotyledon expansion and initial taproot growth.",
        criticalAction: "Maintain warm soil (>20°C); cold soil induces seedling damping-off.",
      },
      {
        stage: "Vining & Trellis Attachment",
        description: "Days 11–30: Rapid lateral vine elongation and tendril climbing.",
        criticalAction: "Train vines vertically on trellises to increase sunlight and airflow.",
      },
      {
        stage: "Flowering & Fruit Setting",
        description: "Days 31–45: Staminate (male) and pistillate (female) bloom emergence.",
        criticalAction: "Encourage bee pollination or use parthenocarpic greenhouse varieties.",
      },
      {
        stage: "Continuous Harvest Phase",
        description: "Days 46–75: Multiple harvest pickings every 2–3 days.",
        criticalAction: "Frequent small irrigation doses; pick fruits regularly to sustain new blooms.",
      },
    ],
    commonDiseases: [
      {
        name: "Powdery Mildew (Podosphaera xanthii)",
        type: "Fungal",
        riskTrigger: "Warm, dry shaded foliage with high ambient relative humidity.",
        prevention: "Vertical trellising for canopy light penetration, apply potassium bicarbonate or sulfur.",
      },
      {
        name: "Downy Mildew (Pseudoperonospora cubensis)",
        type: "Oomycete",
        riskTrigger: "Warm, humid nights with morning fog or heavy dew.",
        prevention: "Plant resistant varieties, ensure rapid leaf drying, apply targeted copper sprays.",
      },
    ],
    harvestingSigns: [
      "Uniform green color, firm crisp texture, before yellowing begins",
      "Harvest early morning when fruit turgor pressure is peak",
      "Cut with sharp shears leaving 1 cm of stem intact",
    ],
    tips: "Trellising cucumbers increases marketable yield by over 40%, cuts down disease incidence, and produces straight, uniformly colored fruit.",
  },
  Chili: {
    name: "Chili / Hot Pepper",
    scientificName: "Capsicum annuum / Capsicum chinense",
    category: "Solanaceous Spice & Vegetable",
    optimalTempRange: { min: 21, max: 32, unit: "°C" },
    waterRequirementMmPerDay: { min: 3.5, max: 5.8 },
    growthDurationDays: { min: 75, max: 120 },
    soilPhRange: { min: 6.0, max: 7.0 },
    preferredSoils: ["Loam", "Sandy Loam", "Clay Loam"],
    keyGrowthStages: [
      {
        stage: "Seedling & Establishment",
        description: "Days 1–25: Slow initial vegetative growth and root exploration.",
        criticalAction: "Keep warm (>22°C); protect from thrips and flea beetles.",
      },
      {
        stage: "Branching & Canopy Growth",
        description: "Days 26–55: Dichotomous stem branching and node formation.",
        criticalAction: "Apply organic mulch to retain soil moisture and moderate root temperature.",
      },
      {
        stage: "Flowering & Pod Formation",
        description: "Days 56–80: Star-shaped white flowers setting small green pods.",
        criticalAction: "Avoid night temperatures > 24°C or < 15°C to avoid blossom drop.",
      },
      {
        stage: "Pod Maturation & Color Break",
        description: "Days 81–120: Capsaicin accumulation and color transition (Green -> Red/Yellow).",
        criticalAction: "Moderate irrigation; slight water deficit can enhance capsaicin pungency.",
      },
    ],
    commonDiseases: [
      {
        name: "Anthracnose Fruit Rot (Colletotrichum spp.)",
        type: "Fungal",
        riskTrigger: "Warm temperatures (27–30°C) with frequent rain splashes on ripening pods.",
        prevention: "Plastic mulch barrier, drip irrigation, protective azoxystrobin spray.",
      },
      {
        name: "Chili Leaf Curl Virus",
        type: "Viral (Vector: Whitefly)",
        riskTrigger: "High whitefly vector populations during hot dry spells.",
        prevention: "Install yellow sticky traps, apply neem oil / bio-insecticides against whiteflies.",
      },
    ],
    harvestingSigns: [
      "Harvest green when crisp and glossy, or full red for maximum heat/capsaicin",
      "Stems snap cleanly from branch when bent upwards",
      "Firm, thick pod walls without soft water-soaked spots",
    ],
    tips: "Chili peppers thrive in well-aerated warm soils. Over-irrigation causes Phytophthora root rot and flower shedding.",
  },
};

export function getCropAgronomicProfile(cropName: string): CropAgronomicProfile | null {
  if (!cropName) return null;
  const lower = cropName.toLowerCase();
  for (const option of CROP_OPTIONS) {
    if (lower.includes(option.toLowerCase())) {
      return CROP_PROFILES[option];
    }
  }
  return null;
}
