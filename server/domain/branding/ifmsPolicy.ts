import {
  brandPolicyIfms,
  validateIfmsBrandPolicy,
  type IfmsBrandValidationInput,
  type IfmsBrandValidationResult,
} from "@shared/domain/branding/ifmsPolicyCore";

export { brandPolicyIfms };
export type { IfmsBrandValidationInput, IfmsBrandValidationResult };

export function validateBrandPolicyIfms(
  input: IfmsBrandValidationInput,
): IfmsBrandValidationResult {
  return validateIfmsBrandPolicy(input);
}
