import { generateCompanySupplyTransitBlueprint } from "./companySupplyTransit.js";

// Each blueprint is a reusable generator returning { seed, placements }.
// Future types (residential neighborhood, gas station, airport, city block, ...)
// are added here and picked by the Playground's "Random Blueprint" action.
export const BLUEPRINTS = [
  {
    id: "company-supply-transit",
    name: "Company Supply & Transit",
    generate: generateCompanySupplyTransitBlueprint,
  },
];
