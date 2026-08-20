/**
 * Arabic for the API's error strings.
 *
 * The backend has no locale layer — every route answers in English, and the
 * same strings feed the staff portal, which stays English. Rather than push a
 * locale through every route and change the response contract, the client maps
 * the English text it already receives onto bilingual copy.
 *
 * Keys are the exact strings the API returns. Anything not in the map falls
 * through to the server's own text, so an unrecognised or newly added error
 * still shows something useful instead of blanking out.
 */
const AR = {
  // ── auth: registration ──────────────────────────────────────────────
  'Invalid registration details.': 'بيانات التسجيل غير صحيحة.',
  'Please enter a valid first name.': 'يرجى إدخال اسم أول صحيح.',
  'Please enter a valid last name.': 'يرجى إدخال اسم عائلة صحيح.',
  'Please enter a valid email address.': 'يرجى إدخال بريد إلكتروني صحيح.',
  'Please enter a valid phone number.': 'يرجى إدخال رقم هاتف صحيح.',
  'An account with this email already exists.': 'يوجد حساب مسجل بهذا البريد الإلكتروني.',
  'An account with this phone number already exists.': 'يوجد حساب مسجل بهذا الرقم.',
  'Account already exists.': 'الحساب موجود بالفعل.',
  'Registration failed. Please try again.': 'فشل إنشاء الحساب. حاول مجدداً.',

  // ── auth: one-time codes ────────────────────────────────────────────
  'Could not send verification code. Please try again.': 'تعذر إرسال رمز التحقق. حاول مجدداً.',
  'Could not resend code. Please try again.': 'تعذر إعادة إرسال الرمز. حاول مجدداً.',
  'Email and purpose required.': 'البريد الإلكتروني والغرض مطلوبان.',
  'Invalid purpose.': 'غرض غير صالح.',
  'Email and code are required.': 'البريد الإلكتروني والرمز مطلوبان.',
  'No code found. Please request a new one.': 'لا يوجد رمز. يرجى طلب رمز جديد.',
  'Code has expired. Please request a new one.': 'انتهت صلاحية الرمز. يرجى طلب رمز جديد.',
  'Too many attempts. Please request a new code.': 'محاولات كثيرة. يرجى طلب رمز جديد.',
  'Verification failed.': 'فشل التحقق.',

  // ── auth: sign in ───────────────────────────────────────────────────
  'Email/phone and password are required.': 'البريد أو الهاتف وكلمة المرور مطلوبان.',
  'Invalid credentials.': 'بيانات الدخول غير صحيحة.',
  'Account suspended.': 'تم إيقاف الحساب.',
  'Account not found.': 'الحساب غير موجود.',
  'Account not found or inactive.': 'الحساب غير موجود أو غير مفعّل.',
  'Login failed.': 'فشل تسجيل الدخول.',

  // ── auth: password reset ────────────────────────────────────────────
  'Email required.': 'البريد الإلكتروني مطلوب.',
  'Invalid email address.': 'بريد إلكتروني غير صحيح.',
  'No account found for this email.': 'لا يوجد حساب بهذا البريد الإلكتروني.',
  'Email, code, and password are required.': 'البريد الإلكتروني والرمز وكلمة المرور مطلوبة.',
  'New password must be at least 8 characters.': 'كلمة المرور الجديدة 8 أحرف على الأقل.',
  'Could not reset password.': 'تعذرت إعادة تعيين كلمة المرور.',

  // ── auth: session & profile ─────────────────────────────────────────
  'Authentication required.': 'يلزم تسجيل الدخول.',
  'Invalid or expired token.': 'انتهت جلستك.',
  'Could not fetch profile.': 'تعذر تحميل الملف الشخصي.',
  'Nothing to update.': 'لا يوجد ما يتم تحديثه.',
  'Name cannot be empty.': 'الاسم لا يمكن أن يكون فارغاً.',
  'Email already in use.': 'البريد الإلكتروني مستخدم بالفعل.',
  'Invalid image. Use a JPEG/PNG/WebP under 3MB.':
    'صورة غير صالحة. استخدم JPEG أو PNG أو WebP بحجم أقل من 3 ميغابايت.',
  'Could not update profile.': 'تعذر تحديث الملف الشخصي.',
  'Could not update account.': 'تعذر تحديث الحساب.',
  'Both passwords required.': 'كلمتا المرور مطلوبتان.',
  'Current password is incorrect.': 'كلمة المرور الحالية غير صحيحة.',
  'Could not change password.': 'تعذر تغيير كلمة المرور.',
  'Could not delete account.': 'تعذر حذف الحساب.',

  // ── bookings ────────────────────────────────────────────────────────
  'name, phone, service, date and time are required.':
    'الاسم والهاتف والخدمة والتاريخ والوقت مطلوبة.',
  'Please enter a valid name.': 'يرجى إدخال اسم صحيح.',
  'Invalid service type.': 'نوع خدمة غير صالح.',
  'Invalid date.': 'تاريخ غير صالح.',
  'Cannot book a date in the past.': 'لا يمكن الحجز في تاريخ سابق.',
  'Invalid time slot.': 'موعد غير صالح.',
  'That time slot has already passed. Please choose a later time.':
    'انقضى هذا الموعد. يرجى اختيار وقت لاحق.',
  'This time slot has already been booked.': 'تم حجز هذا الموعد بالفعل.',
  'Slot already taken.': 'الموعد محجوز بالفعل.',
  'Wallet balance insufficient.': 'رصيد المحفظة غير كافٍ.',
  'Sign in to pay from wallet.': 'سجّل الدخول للدفع من المحفظة.',
  'Booking failed.': 'فشل الحجز.',
  'date is required.': 'التاريخ مطلوب.',
  'A valid date (YYYY-MM-DD) is required.': 'يلزم تاريخ صحيح بصيغة YYYY-MM-DD.',
  'Could not fetch slots.': 'تعذر تحميل المواعيد.',
  'Could not fetch pricing.': 'تعذر تحميل الأسعار.',
  'Could not fetch bookings.': 'تعذر تحميل الحجوزات.',
  'Could not cancel booking.': 'تعذر إلغاء الحجز.',

  // ── loyalty ─────────────────────────────────────────────────────────
  'Customer not found.': 'العميل غير موجود.',
  'Could not fetch loyalty data.': 'تعذر تحميل بيانات الولاء.',
  'Could not fetch history.': 'تعذر تحميل السجل.',

  // ── contact ─────────────────────────────────────────────────────────
  'Name, email and message are required.': 'الاسم والبريد الإلكتروني والرسالة مطلوبة.',
  'Message is too short.': 'الرسالة قصيرة جداً.',
  'Failed to save message.': 'تعذر حفظ الرسالة.',
  'Too many messages sent. Please try again later.': 'تم إرسال رسائل كثيرة. حاول لاحقاً.',

  // ── global ──────────────────────────────────────────────────────────
  'Too many requests. Please try again later.': 'طلبات كثيرة. يرجى المحاولة لاحقاً.',
  'Too many login attempts. Please wait 15 minutes and try again.':
    'محاولات دخول كثيرة. انتظر 15 دقيقة وحاول مجدداً.',
  'Not found.': 'غير موجود.',
  'Something went wrong. Please try again.': 'حدث خطأ ما. يرجى المحاولة مجدداً.',
}

/**
 * Turn an API error string into the caller's language.
 * Falls back to the server's own English when the string isn't mapped.
 */
export function apiError(serverText, lang, fallback = '') {
  if (!serverText) return fallback
  if (lang !== 'ar') return serverText
  return AR[serverText] || serverText
}

/**
 * Errors that end the session. These get a modal with a route back to /login
 * rather than a toast the customer can scroll past.
 */
const SESSION_DEAD = new Set([
  'Authentication required.',
  'Invalid or expired token.',
  'Account not found or inactive.',
])

export const isSessionDead = (serverText) => SESSION_DEAD.has(serverText)

/**
 * Booking conflicts — the chosen slot is gone. The customer has to pick
 * another time, so these block rather than flash past.
 */
const SLOT_CONFLICT = new Set([
  'This time slot has already been booked.',
  'Slot already taken.',
  'That time slot has already passed. Please choose a later time.',
  'Invalid time slot.',
])

export const isSlotConflict = (serverText) => SLOT_CONFLICT.has(serverText)

/**
 * Rate limits. Retrying makes them worse, and the wait can be 15 minutes —
 * long enough that a 3.5-second toast is the wrong instrument.
 */
const RATE_LIMITED = new Set([
  'Too many requests. Please try again later.',
  'Too many login attempts. Please wait 15 minutes and try again.',
  'Too many attempts. Please request a new code.',
  'Too many messages sent. Please try again later.',
])

export const isRateLimited = (serverText) => RATE_LIMITED.has(serverText)
