// Issues ("conditions") each e-waste item can have, with how much they lower
// recyclability and raise the hazard score, plus disposal suggestions.
// Shared by the scan result screen and the facility item-request form.

export type IssueOption = {
  name: string;
  deduction: number;
  hazard: number;
};

export type ItemData = {
  issues: IssueOption[];
  disposalSuggestions: string[];
};

export const NONE_ISSUE = { name: "None", deduction: 0, hazard: 0 };

export const ITEM_DATA: Record<string, ItemData> = {
  laptop: {
    issues: [
      NONE_ISSUE,
      { name: "Battery glued", deduction: 20, hazard: 10 },
      { name: "Screen cracked", deduction: 10, hazard: 5 },
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Mixed plastic case", deduction: 15, hazard: 5 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Remove battery if detachable.",
      "Check PCB for corrosion.",
      "Separate plastics and metals.",
    ],
  },

  smartphone: {
    issues: [
      NONE_ISSUE,
      { name: "Battery glued", deduction: 20, hazard: 10 },
      { name: "Screen cracked", deduction: 10, hazard: 5 },
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Mixed plastic case", deduction: 15, hazard: 5 },
      { name: "Rare earth magnets unrecoverable", deduction: 10, hazard: 5 },
      { name: "Hazardous substances", deduction: 20, hazard: 20 },
    ],
    disposalSuggestions: [
      "Remove SIM and memory card.",
      "Check battery for swelling.",
      "Backup personal files before recycling.",
      "Factory reset device before disposal.",
    ],
  },

  printer: {
    issues: [
      NONE_ISSUE,
      { name: "Toner residue", deduction: 20, hazard: 10 },
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Mixed plastics", deduction: 15, hazard: 5 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Remove toner or ink cartridges.",
      "Separate plastic casing.",
      "Prepare PCB parts for proper e-waste handling.",
    ],
  },

  camera: {
    issues: [
      NONE_ISSUE,
      { name: "Lens cracked", deduction: 10, hazard: 5 },
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Battery glued", deduction: 20, hazard: 10 },
      { name: "Mixed plastics", deduction: 15, hazard: 5 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Detach battery pack.",
      "Inspect lens for cracks.",
      "Separate plastics from metals.",
    ],
  },

  battery: {
    issues: [
      NONE_ISSUE,
      { name: "Non-removable", deduction: 30, hazard: 15 },
      { name: "Damaged", deduction: 40, hazard: 30 },
      { name: "Hazardous chemicals", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Check for swelling or leaks.",
      "Store in a fireproof container.",
      "Do not dispose in regular trash.",
    ],
  },

  speaker: {
    issues: [
      NONE_ISSUE,
      { name: "Mixed plastics", deduction: 15, hazard: 5 },
      { name: "Magnet unrecoverable", deduction: 10, hazard: 5 },
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Remove magnets if possible.",
      "Separate plastic casing.",
      "Inspect PCB for damage.",
    ],
  },

  microwave: {
    issues: [
      NONE_ISSUE,
      { name: "Magnetron damaged", deduction: 25, hazard: 15 },
      { name: "Mixed plastic casing", deduction: 15, hazard: 5 },
      { name: "PCB corroded", deduction: 20, hazard: 10 },
      { name: "Glass plate broken", deduction: 10, hazard: 5 },
      { name: "Hazardous capacitors", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Discharge capacitors safely.",
      "Remove glass plate.",
      "Handle magnetron with care.",
    ],
  },

  oven: {
    issues: [
      NONE_ISSUE,
      { name: "Heating element damaged", deduction: 20, hazard: 10 },
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Mixed plastics", deduction: 15, hazard: 5 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Detach heating element.",
      "Separate metal housing.",
      "Inspect PCB for corrosion.",
    ],
  },

  toaster: {
    issues: [
      NONE_ISSUE,
      { name: "Heating coil damaged", deduction: 20, hazard: 10 },
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Mixed plastics", deduction: 15, hazard: 5 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Remove heating coils.",
      "Separate plastics and metals.",
      "Check wiring for burns.",
    ],
  },

  refrigerator: {
    issues: [
      NONE_ISSUE,
      { name: "Compressor damaged", deduction: 30, hazard: 15 },
      { name: "Insulation foam", deduction: 20, hazard: 10 },
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Hazardous refrigerants", deduction: 25, hazard: 30 },
    ],
    disposalSuggestions: [
      "Remove compressor unit only if safe.",
      "Handle refrigerants properly.",
      "Separate insulation foam.",
    ],
  },

  "air conditioner": {
    issues: [
      NONE_ISSUE,
      { name: "Compressor damaged", deduction: 30, hazard: 15 },
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Mixed plastics", deduction: 15, hazard: 5 },
      { name: "Hazardous refrigerants", deduction: 30, hazard: 30 },
    ],
    disposalSuggestions: [
      "Remove compressor safely.",
      "Check PCB for damage.",
      "Handle refrigerant gases carefully.",
    ],
  },

  boiler: {
    issues: [
      NONE_ISSUE,
      { name: "Heating element corroded", deduction: 25, hazard: 10 },
      { name: "Mixed metals", deduction: 15, hazard: 5 },
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Hazardous substances", deduction: 35, hazard: 20 },
    ],
    disposalSuggestions: [
      "Inspect heating element.",
      "Separate mixed metals.",
      "Prepare PCB for proper e-waste handling.",
    ],
  },

  calculator: {
    issues: [
      NONE_ISSUE,
      { name: "PCB corroded", deduction: 20, hazard: 10 },
      { name: "Plastic case", deduction: 15, hazard: 5 },
      { name: "Hazardous substances", deduction: 25, hazard: 15 },
    ],
    disposalSuggestions: [
      "Remove small battery.",
      "Separate plastic casing.",
      "Inspect PCB for corrosion.",
    ],
  },

  "bar phone": {
    issues: [
      NONE_ISSUE,
      { name: "Battery glued", deduction: 20, hazard: 10 },
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Mixed plastics", deduction: 15, hazard: 5 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Remove battery if possible.",
      "Inspect PCB for damage.",
      "Separate plastics.",
    ],
  },

  "blood pressure monitor": {
    issues: [
      NONE_ISSUE,
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Plastic case", deduction: 15, hazard: 5 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Remove battery pack.",
      "Check for mercury in older models.",
      "Separate casing and PCB.",
    ],
  },

  "ceiling fan": {
    issues: [
      NONE_ISSUE,
      { name: "Motor corroded", deduction: 25, hazard: 10 },
      { name: "Mixed plastics", deduction: 15, hazard: 5 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Detach motor unit.",
      "Separate blades and casing.",
      "Inspect wiring.",
    ],
  },

  "christmas lights": {
    issues: [
      NONE_ISSUE,
      { name: "Wires damaged", deduction: 20, hazard: 10 },
      { name: "Mixed plastics", deduction: 15, hazard: 5 },
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Remove damaged wires.",
      "Separate plastic coatings.",
      "Prepare PCB for proper e-waste handling.",
    ],
  },

  "clothes iron": {
    issues: [
      NONE_ISSUE,
      { name: "Heating plate damaged", deduction: 20, hazard: 10 },
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Mixed plastics", deduction: 15, hazard: 5 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Inspect heating plate.",
      "Separate plastic housing.",
      "Check PCB for corrosion.",
    ],
  },

  "coffee machine": {
    issues: [
      NONE_ISSUE,
      { name: "Heating element corroded", deduction: 20, hazard: 10 },
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Mixed plastics", deduction: 15, hazard: 5 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Remove heating element.",
      "Separate plastics and metals.",
      "Inspect wiring for burns.",
    ],
  },

  "compact fluorescent lamps": {
    issues: [
      NONE_ISSUE,
      { name: "Glass broken", deduction: 20, hazard: 10 },
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Hazardous mercury", deduction: 55, hazard: 40 },
    ],
    disposalSuggestions: [
      "Handle glass carefully.",
      "Isolate mercury components.",
      "Keep broken parts sealed before disposal.",
    ],
  },

  "computer keyboard": {
    issues: [
      NONE_ISSUE,
      { name: "Mixed plastics", deduction: 20, hazard: 10 },
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Keys damaged", deduction: 10, hazard: 5 },
      { name: "Hazardous coatings", deduction: 20, hazard: 15 },
    ],
    disposalSuggestions: [
      "Remove keycaps.",
      "Separate plastic housing.",
      "Inspect PCB membrane.",
    ],
  },

  keyboard: {
    issues: [
      NONE_ISSUE,
      { name: "Mixed plastics", deduction: 20, hazard: 10 },
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Keys damaged", deduction: 10, hazard: 5 },
      { name: "Hazardous coatings", deduction: 20, hazard: 15 },
    ],
    disposalSuggestions: [
      "Remove keycaps.",
      "Separate plastic housing.",
      "Inspect PCB membrane.",
    ],
  },

  "computer mouse": {
    issues: [
      NONE_ISSUE,
      { name: "Mixed plastics", deduction: 20, hazard: 10 },
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Remove batteries if wireless.",
      "Separate plastics from electronics.",
      "Inspect PCB for corrosion.",
    ],
  },

  mouse: {
    issues: [
      NONE_ISSUE,
      { name: "Mixed plastics", deduction: 20, hazard: 10 },
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Remove batteries if wireless.",
      "Separate plastics from electronics.",
      "Inspect PCB for corrosion.",
    ],
  },

  drone: {
    issues: [
      NONE_ISSUE,
      { name: "Battery glued", deduction: 30, hazard: 15 },
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Mixed plastics", deduction: 15, hazard: 5 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Remove battery pack.",
      "Separate plastics and metals.",
      "Inspect PCB for corrosion.",
    ],
  },

  "dvd player": {
    issues: [
      NONE_ISSUE,
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Mixed plastics", deduction: 15, hazard: 5 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Remove disc tray.",
      "Separate casing plastics.",
      "Prepare PCB for proper e-waste handling.",
    ],
  },

  earphones: {
    issues: [
      NONE_ISSUE,
      { name: "Mixed plastics", deduction: 20, hazard: 10 },
      { name: "Wires damaged", deduction: 15, hazard: 5 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Remove wires or battery if wireless.",
      "Separate plastics.",
      "Inspect for damage.",
    ],
  },

  headphones: {
    issues: [
      NONE_ISSUE,
      { name: "Mixed plastics", deduction: 20, hazard: 10 },
      { name: "Wires damaged", deduction: 15, hazard: 5 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Remove wires or battery if wireless.",
      "Separate plastics from metals.",
      "Inspect for hazardous coatings.",
    ],
  },

  "flash drive": {
    issues: [
      NONE_ISSUE,
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Plastic case damaged", deduction: 15, hazard: 5 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Separate plastic casing.",
      "Inspect PCB for corrosion.",
      "Keep small electronic parts together before disposal.",
    ],
  },

  usb: {
    issues: [
      NONE_ISSUE,
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Plastic case damaged", deduction: 15, hazard: 5 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Separate plastic casing.",
      "Inspect PCB for corrosion.",
      "Keep small electronic parts together before disposal.",
    ],
  },

  "game console": {
    issues: [
      NONE_ISSUE,
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Plastic case damaged", deduction: 15, hazard: 5 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Separate outer casing.",
      "Inspect PCB for corrosion.",
      "Remove detachable accessories before disposal.",
    ],
  },

  "hair dryer": {
    issues: [
      NONE_ISSUE,
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Plastic case damaged", deduction: 15, hazard: 5 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Check wiring for burns.",
      "Separate plastic casing.",
      "Inspect internal electronic parts.",
    ],
  },

  "hard drive": {
    issues: [
      NONE_ISSUE,
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Rare earth magnets unrecoverable", deduction: 10, hazard: 5 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Remove magnets if possible.",
      "Separate casing and PCB.",
      "Prepare PCB for proper e-waste handling.",
    ],
  },

  hdd: {
    issues: [
      NONE_ISSUE,
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Rare earth magnets unrecoverable", deduction: 10, hazard: 5 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Check for important files before disposal.",
      "Backup or securely erase stored data.",
      "Remove magnets if possible.",
      "Separate casing and PCB.",
    ],
  },

  "laptop charger": {
    issues: [
      NONE_ISSUE,
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Wires damaged", deduction: 15, hazard: 5 },
      { name: "Hazardous capacitors", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Remove damaged wires.",
      "Separate casing and PCB.",
      "Handle capacitors carefully.",
    ],
  },

  "phone charger": {
    issues: [
      NONE_ISSUE,
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Wires damaged", deduction: 15, hazard: 5 },
      { name: "Hazardous capacitors", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Remove damaged wires.",
      "Separate casing and PCB.",
      "Handle capacitors carefully.",
    ],
  },

  monitor: {
    issues: [
      NONE_ISSUE,
      { name: "Screen cracked", deduction: 20, hazard: 10 },
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Mixed plastics", deduction: 15, hazard: 5 },
      { name: "Hazardous flame retardants", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Handle cracked screen carefully.",
      "Separate plastics and metals.",
      "Prepare PCB for proper e-waste handling.",
    ],
  },

  motherboard: {
    issues: [
      NONE_ISSUE,
      { name: "PCB corroded", deduction: 30, hazard: 15 },
      { name: "Mixed plastics", deduction: 15, hazard: 5 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Inspect PCB for corrosion.",
      "Separate plastics and metals.",
      "Keep board protected before disposal.",
    ],
  },

  "power bank": {
    issues: [
      NONE_ISSUE,
      { name: "Battery glued", deduction: 30, hazard: 15 },
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Check battery for swelling or leaks.",
      "Store in a fireproof container.",
      "Avoid charging or using the item before disposal.",
    ],
  },

  projector: {
    issues: [
      NONE_ISSUE,
      { name: "Lamp broken", deduction: 25, hazard: 15 },
      { name: "PCB corroded", deduction: 20, hazard: 10 },
      { name: "Mixed plastics", deduction: 15, hazard: 5 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Handle lamp carefully because of possible mercury risk.",
      "Separate plastics and metals.",
      "Prepare PCB for proper e-waste handling.",
    ],
  },

  radio: {
    issues: [
      NONE_ISSUE,
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Mixed plastics", deduction: 15, hazard: 5 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Separate casing and PCB.",
      "Inspect wiring for damage.",
      "Prepare PCB for proper e-waste handling.",
    ],
  },

  "remote control": {
    issues: [
      NONE_ISSUE,
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Mixed plastics", deduction: 15, hazard: 5 },
      { name: "Battery damaged", deduction: 20, hazard: 15 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Remove battery if present.",
      "Separate plastics and metals.",
      "Prepare PCB for proper e-waste handling.",
    ],
  },

  router: {
    issues: [
      NONE_ISSUE,
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Mixed plastics", deduction: 15, hazard: 5 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Remove detachable antennas.",
      "Separate casing and PCB.",
      "Remove attached batteries if present.",
    ],
  },

  "wifi router": {
    issues: [
      NONE_ISSUE,
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Mixed plastics", deduction: 15, hazard: 5 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Remove detachable antennas.",
      "Separate casing and PCB.",
      "Prepare PCB for proper e-waste handling.",
    ],
  },

  scanner: {
    issues: [
      NONE_ISSUE,
      { name: "Glass cracked", deduction: 20, hazard: 10 },
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Mixed plastics", deduction: 15, hazard: 5 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Handle cracked glass carefully.",
      "Separate plastics and metals.",
      "Prepare PCB for proper e-waste handling.",
    ],
  },

  smartwatch: {
    issues: [
      NONE_ISSUE,
      { name: "Battery glued", deduction: 30, hazard: 15 },
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Mixed plastics", deduction: 15, hazard: 5 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Remove battery if possible.",
      "Separate casing and PCB.",
      "Keep small electronic parts together before disposal.",
    ],
  },

  tablet: {
    issues: [
      NONE_ISSUE,
      { name: "Battery glued", deduction: 30, hazard: 15 },
      { name: "Screen cracked", deduction: 20, hazard: 10 },
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Mixed plastics", deduction: 15, hazard: 5 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Remove battery if detachable.",
      "Handle cracked screen carefully.",
      "Separate plastics and metals.",
    ],
  },

  television: {
    issues: [
      NONE_ISSUE,
      { name: "Screen cracked", deduction: 25, hazard: 15 },
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Mixed plastics", deduction: 15, hazard: 5 },
      { name: "Hazardous flame retardants", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Handle cracked screen carefully.",
      "Separate casing and PCB.",
      "Keep hazardous components isolated before disposal.",
    ],
  },

  "vacuum cleaner": {
    issues: [
      NONE_ISSUE,
      { name: "Motor damaged", deduction: 25, hazard: 10 },
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Mixed plastics", deduction: 15, hazard: 5 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Remove dust bag or container.",
      "Separate plastics and metals.",
      "Prepare PCB for proper e-waste handling.",
    ],
  },

  "washing machine": {
    issues: [
      NONE_ISSUE,
      { name: "Motor corroded", deduction: 25, hazard: 10 },
      { name: "PCB damaged", deduction: 25, hazard: 10 },
      { name: "Mixed plastics", deduction: 15, hazard: 5 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Remove drum and motor.",
      "Separate plastics and metals.",
      "Prepare PCB for proper e-waste handling.",
    ],
  },

  webcam: {
    issues: [
      NONE_ISSUE,
      { name: "Lens cracked", deduction: 15, hazard: 5 },
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Mixed plastics", deduction: 15, hazard: 5 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Handle cracked lens carefully.",
      "Separate casing and PCB.",
      "Prepare PCB for proper e-waste handling.",
    ],
  },

  cpu: {
    issues: [
      NONE_ISSUE,
      { name: "PCB corroded", deduction: 30, hazard: 15 },
      { name: "Mixed plastics", deduction: 15, hazard: 5 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Inspect PCB for corrosion.",
      "Separate heatsink and casing.",
      "Prepare PCB for proper e-waste handling.",
    ],
  },

  "circuit board": {
    issues: [
      NONE_ISSUE,
      { name: "PCB corroded", deduction: 30, hazard: 15 },
      { name: "Hazardous substances", deduction: 40, hazard: 25 },
    ],
    disposalSuggestions: [
      "Inspect for corrosion.",
      "Separate metals from plastics.",
      "Keep board protected before disposal.",
    ],
  },

  pcb: {
    issues: [
      NONE_ISSUE,
      { name: "Corroded", deduction: 30, hazard: 15 },
      { name: "Hazardous substances", deduction: 40, hazard: 25 },
    ],
    disposalSuggestions: [
      "Inspect for corrosion.",
      "Handle with gloves if damaged.",
      "Send directly to accredited e-waste facility.",
    ],
  },

  modem: {
    issues: [
      NONE_ISSUE,
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Mixed plastics", deduction: 15, hazard: 5 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Remove casing.",
      "Separate PCB and wiring.",
      "Prepare PCB for proper e-waste handling.",
    ],
  },

  fan: {
    issues: [
      NONE_ISSUE,
      { name: "Motor corroded", deduction: 25, hazard: 10 },
      { name: "Mixed plastics", deduction: 15, hazard: 5 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Remove blades and motor.",
      "Separate plastics and metals.",
      "Prepare PCB for proper e-waste handling.",
    ],
  },

  "electric kettle": {
    issues: [
      NONE_ISSUE,
      { name: "Heating element damaged", deduction: 25, hazard: 10 },
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Mixed plastics", deduction: 15, hazard: 5 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Remove heating element.",
      "Separate plastics and metals.",
      "Prepare PCB for proper e-waste handling.",
    ],
  },

  "rice cooker": {
    issues: [
      NONE_ISSUE,
      { name: "Heating element damaged", deduction: 25, hazard: 10 },
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Mixed plastics", deduction: 15, hazard: 5 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Remove heating element carefully.",
      "Separate plastics and metals.",
      "Prepare PCB for proper e-waste handling.",
    ],
  },

  blender: {
    issues: [
      NONE_ISSUE,
      { name: "Motor damaged", deduction: 25, hazard: 10 },
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Mixed plastics", deduction: 15, hazard: 5 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Remove blades and motor.",
      "Separate plastics and metals.",
      "Prepare PCB for proper e-waste handling.",
    ],
  },

  "cctv camera": {
    issues: [
      NONE_ISSUE,
      { name: "Lens cracked", deduction: 15, hazard: 5 },
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Mixed plastics", deduction: 15, hazard: 5 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Handle cracked lens carefully.",
      "Separate casing and PCB.",
      "Prepare PCB for proper e-waste handling.",
    ],
  },

  cable: {
    issues: [
      NONE_ISSUE,
      { name: "Insulation damaged", deduction: 20, hazard: 10 },
      { name: "Mixed plastics", deduction: 15, hazard: 5 },
      { name: "Hazardous coatings", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Remove damaged insulation.",
      "Separate copper wiring.",
      "Bundle cables for proper recycling.",
    ],
  },

  "extension cord": {
    issues: [
      NONE_ISSUE,
      { name: "Wires damaged", deduction: 20, hazard: 10 },
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Mixed plastics", deduction: 15, hazard: 5 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Remove damaged wires.",
      "Separate casing and PCB.",
      "Prepare PCB for proper e-waste handling.",
    ],
  },

  gpu: {
    issues: [
      NONE_ISSUE,
      { name: "PCB corroded", deduction: 30, hazard: 15 },
      { name: "Mixed plastics", deduction: 15, hazard: 5 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Inspect PCB for corrosion.",
      "Separate heatsink and casing.",
      "Prepare PCB for proper e-waste handling.",
    ],
  },

  ram: {
    issues: [
      NONE_ISSUE,
      { name: "PCB corroded", deduction: 30, hazard: 15 },
      { name: "Hazardous substances", deduction: 40, hazard: 25 },
    ],
    disposalSuggestions: [
      "Inspect contacts for oxidation.",
      "Separate metals from packaging.",
      "Send to electronic recycling facility.",
    ],
  },

  ssd: {
    issues: [
      NONE_ISSUE,
      { name: "PCB corroded", deduction: 30, hazard: 15 },
      { name: "Hazardous substances", deduction: 40, hazard: 25 },
    ],
    disposalSuggestions: [
      "Inspect PCB for corrosion.",
      "Separate casing and PCB.",
      "Keep the board protected before disposal.",
    ],
  },

  ups: {
    issues: [
      NONE_ISSUE,
      { name: "Battery glued", deduction: 30, hazard: 15 },
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Hazardous capacitors", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Check battery for swelling or leaks.",
      "Discharge capacitors safely.",
      "Keep away from heat before disposal.",
    ],
  },

  "electric drill": {
    issues: [
      NONE_ISSUE,
      { name: "Motor damaged", deduction: 25, hazard: 10 },
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Mixed plastics", deduction: 15, hazard: 5 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Remove drill bit and motor.",
      "Separate plastics and metals.",
      "Prepare PCB for proper e-waste handling.",
    ],
  },

  "electric shaver": {
    issues: [
      NONE_ISSUE,
      { name: "Blades damaged", deduction: 20, hazard: 10 },
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Mixed plastics", deduction: 15, hazard: 5 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Remove blades carefully.",
      "Separate casing and PCB.",
      "Prepare PCB for proper e-waste handling.",
    ],
  },

  torchlight: {
    issues: [
      NONE_ISSUE,
      { name: "Battery glued", deduction: 30, hazard: 15 },
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Lens cracked", deduction: 15, hazard: 5 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Remove battery if possible.",
      "Handle cracked lens carefully.",
      "Prepare PCB for proper e-waste handling.",
    ],
  },

  "alarm clock": {
    issues: [
      NONE_ISSUE,
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Mixed plastics", deduction: 15, hazard: 5 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Remove battery if present.",
      "Separate casing and PCB.",
      "Prepare PCB for proper e-waste handling.",
    ],
  },

  "mp3 player": {
    issues: [
      NONE_ISSUE,
      { name: "Battery glued", deduction: 30, hazard: 15 },
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Screen cracked", deduction: 15, hazard: 5 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Remove battery if detachable.",
      "Handle cracked screen carefully.",
      "Prepare PCB for proper e-waste handling.",
    ],
  },

  "landline telephone": {
    issues: [
      NONE_ISSUE,
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Mixed plastics", deduction: 15, hazard: 5 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Remove cords and handset.",
      "Separate casing and PCB.",
      "Prepare PCB for proper e-waste handling.",
    ],
  },

  "video camera": {
    issues: [
      NONE_ISSUE,
      { name: "Lens cracked", deduction: 20, hazard: 10 },
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Battery glued", deduction: 30, hazard: 15 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Handle cracked lens carefully.",
      "Remove battery if possible.",
      "Prepare PCB for proper e-waste handling.",
    ],
  },

  "walkie talkie": {
    issues: [
      NONE_ISSUE,
      { name: "Battery glued", deduction: 30, hazard: 15 },
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Mixed plastics", deduction: 15, hazard: 5 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Remove battery if detachable.",
      "Separate casing and PCB.",
      "Prepare PCB for proper e-waste handling.",
    ],
  },

  "electric toothbrush": {
    issues: [
      NONE_ISSUE,
      { name: "Battery glued", deduction: 30, hazard: 15 },
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Mixed plastics", deduction: 15, hazard: 5 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Remove battery if possible.",
      "Separate casing and PCB.",
      "Prepare PCB for proper e-waste handling.",
    ],
  },

  "stylus pen": {
    issues: [
      NONE_ISSUE,
      { name: "PCB corroded", deduction: 20, hazard: 10 },
      { name: "Mixed plastics", deduction: 15, hazard: 5 },
      { name: "Hazardous substances", deduction: 25, hazard: 15 },
    ],
    disposalSuggestions: [
      "Remove battery if electronic.",
      "Separate casing and PCB.",
      "Prepare PCB for proper e-waste handling.",
    ],
  },

  "digital clock": {
    issues: [
      NONE_ISSUE,
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Mixed plastics", deduction: 15, hazard: 5 },
      { name: "Battery damaged", deduction: 20, hazard: 15 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Remove battery if present.",
      "Separate casing and PCB.",
      "Prepare PCB for proper e-waste handling.",
    ],
  },

  "9v battery": {
    issues: [
      NONE_ISSUE,
      { name: "Damaged casing", deduction: 25, hazard: 15 },
      { name: "Corroded terminals", deduction: 20, hazard: 10 },
      { name: "Hazardous chemicals", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Check for leakage or corrosion.",
      "Cover terminals before storage.",
      "Send to an accredited battery recycler.",
    ],
  },

  "internal hdd": {
    issues: [
      NONE_ISSUE,
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Rare earth magnets unrecoverable", deduction: 10, hazard: 5 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Verify that no important files remain.",
      "Securely erase or destroy data if sensitive.",
      "Separate aluminum casing from PCB.",
      "Recover magnets where possible.",
    ],
  },

  "network switch": {
    issues: [
      NONE_ISSUE,
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Mixed plastics", deduction: 15, hazard: 5 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Remove power adapter if included.",
      "Separate casing and PCB.",
      "Inspect ports for corrosion.",
    ],
  },

  "tv remote control": {
    issues: [
      NONE_ISSUE,
      { name: "Battery damaged", deduction: 20, hazard: 15 },
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Mixed plastics", deduction: 15, hazard: 5 },
      { name: "Hazardous substances", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Remove batteries immediately.",
      "Check battery compartment for corrosion.",
      "Separate casing and PCB.",
    ],
  },

  "usb flash drive": {
    issues: [
      NONE_ISSUE,
      { name: "PCB corroded", deduction: 25, hazard: 10 },
      { name: "Plastic casing damaged", deduction: 15, hazard: 5 },
      { name: "Hazardous substances (lead solder)", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Check for important files before disposal.",
      "Securely erase stored data.",
      "Separate casing and PCB if dismantled.",
      "Send to accredited e-waste recycler.",
    ],
  },

  unknown: {
    issues: [
      NONE_ISSUE,
      { name: "Unknown material composition", deduction: 30, hazard: 15 },
      { name: "Non-removable battery if present", deduction: 20, hazard: 15 },
      { name: "Mixed plastics/metals", deduction: 15, hazard: 5 },
      { name: "Hazardous substances potential", deduction: 30, hazard: 20 },
    ],
    disposalSuggestions: [
      "Inspect for removable battery or power source.",
      "Check for burned surfaces, corrosion, or leaks.",
      "Separate plastics, metals, and electronics if possible.",
    ],
  },
};

const normalizeItemName = (value: any) => {
  return String(value || "")
    .toLowerCase()
    .replace(/[_-]/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

// Finds the data for a scan label or item name. Exact name first, then the
// first entry whose name appears inside it ("flash drive usb" -> "flash drive").
export const getItemData = (item: string): ItemData => {
  const normalizedLabel = normalizeItemName(item || "");

  if (ITEM_DATA[normalizedLabel]) {
    return ITEM_DATA[normalizedLabel];
  }

  const matchedKey = Object.keys(ITEM_DATA).find((key) =>
    normalizedLabel.includes(key),
  );

  return matchedKey ? ITEM_DATA[matchedKey] : ITEM_DATA.unknown;
};

// Condition names for an item, without the "None" option.
export const getItemConditions = (item: string): string[] =>
  getItemData(item)
    .issues.map((issue) => issue.name)
    .filter((name) => name !== NONE_ISSUE.name);
