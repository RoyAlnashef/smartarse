export { buildResetPasswordEmail } from "@/lib/email/supabase/reset-password"
export { buildConfirmSignupEmail } from "@/lib/email/supabase/confirm-signup"
export { buildMagicLinkEmail } from "@/lib/email/supabase/magic-link"
export { buildInviteUserEmail } from "@/lib/email/supabase/invite-user"
export { buildChangeEmailEmail } from "@/lib/email/supabase/change-email"

import { buildChangeEmailEmail } from "@/lib/email/supabase/change-email"
import { buildConfirmSignupEmail } from "@/lib/email/supabase/confirm-signup"
import { buildInviteUserEmail } from "@/lib/email/supabase/invite-user"
import { buildMagicLinkEmail } from "@/lib/email/supabase/magic-link"
import { buildResetPasswordEmail } from "@/lib/email/supabase/reset-password"

export const supabaseAuthEmailTemplates = [
  { id: "reset-password", label: "Reset password", ...buildResetPasswordEmail() },
  { id: "confirm-signup", label: "Confirm signup", ...buildConfirmSignupEmail() },
  { id: "magic-link", label: "Magic link", ...buildMagicLinkEmail() },
  { id: "invite-user", label: "Invite user", ...buildInviteUserEmail() },
  { id: "change-email", label: "Change email", ...buildChangeEmailEmail() },
] as const
