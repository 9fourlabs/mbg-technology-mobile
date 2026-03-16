import type { InformationalTemplate } from "../types";
import mbgJson from "../../../configs/tenants/mbg.json";
import acmeDental from "../../../configs/tenants/acme-dental.json";
import bigWorms from "../../../configs/tenants/big-worms-pet-shop.json";

const jsonTenants: Record<string, InformationalTemplate> = {
  mbg: mbgJson as InformationalTemplate,
  "acme-dental": acmeDental as InformationalTemplate,
  "big-worms-pet-shop": bigWorms as InformationalTemplate,
};

export function getInformationalTemplate(tenant: string): InformationalTemplate {
  const fromJson = jsonTenants[tenant];
  if (fromJson) return fromJson;
  return jsonTenants.mbg;
}

