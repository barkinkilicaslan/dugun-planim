import { Platform } from 'react-native';
import { Contact, ContactField, getPermissionsAsync, requestPermissionsAsync } from 'expo-contacts';

import { candidatesFromRawContacts, type ContactCandidate } from '@/domain/contacts';

/**
 * Rehber erişimi. İzin yalnızca kullanıcı "Rehberden davetli ekle" ekranında açıklamayı okuyup devam ettiğinde
 * istenir. Rehber verisi yalnızca bellekte tutulur; kullanıcı seçmedikçe kaydedilmez, loglanmaz ve gönderilmez.
 */
export type ContactsAccess = 'granted' | 'limited' | 'denied' | 'undetermined' | 'blocked' | 'unavailable';

interface PermissionLike {
  granted: boolean;
  canAskAgain: boolean;
  status: string;
  accessPrivileges?: 'all' | 'limited' | 'none';
}

export function accessFromPermission(permission: PermissionLike): ContactsAccess {
  if (permission.granted) return permission.accessPrivileges === 'limited' ? 'limited' : 'granted';
  if (permission.status === 'undetermined') return 'undetermined';
  return permission.canAskAgain ? 'denied' : 'blocked';
}

export async function getContactsAccess(): Promise<ContactsAccess> {
  if (Platform.OS === 'web') return 'unavailable';
  return accessFromPermission(await getPermissionsAsync());
}

export async function requestContactsAccess(): Promise<ContactsAccess> {
  if (Platform.OS === 'web') return 'unavailable';
  return accessFromPermission(await requestPermissionsAsync());
}

const FIELDS = [
  ContactField.GIVEN_NAME,
  ContactField.FAMILY_NAME,
  ContactField.FULL_NAME,
  ContactField.PHONES,
  ContactField.EMAILS,
] as const;

export async function loadContactCandidates(): Promise<ContactCandidate[]> {
  const raw = await Contact.getAllDetails(FIELDS);
  return candidatesFromRawContacts(
    raw.map((item) => ({
      id: item.id,
      givenName: item.givenName ?? undefined,
      familyName: item.familyName ?? undefined,
      fullName: item.fullName ?? undefined,
      phones: item.phones ?? [],
      emails: item.emails ?? [],
    })),
  );
}

/** iOS 18+ sınırlı erişimde kullanıcının rehberden ek kişi paylaşmasını sağlayan sistem ekranı. */
export async function presentLimitedAccessPicker(): Promise<void> {
  if (Platform.OS !== 'ios') return;
  await Contact.presentAccessPicker();
}
