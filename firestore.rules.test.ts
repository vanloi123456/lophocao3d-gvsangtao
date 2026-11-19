/**
 * Phase 0 Security TDD Specification for Firestore Security Rules.
 * Verifies the "Dirty Dozen" adversarial payloads are rejected (PERMISSION_DENIED)
 * while valid teacher writes and public student reads are permitted.
 *
 * Designed for execution with @firebase/rules-unit-testing against the Firestore emulator.
 */

export interface SecurityTestCase {
  id: number;
  name: string;
  actor: 'unauthenticated' | 'student' | 'unverified_admin' | 'teacher_owner' | 'admin';
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  payload?: Record<string, unknown>;
  expected: 'ALLOW' | 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TESTS: SecurityTestCase[] = [
  {
    id: 1,
    name: 'Unauthenticated user cannot create a frame',
    actor: 'unauthenticated',
    operation: 'create',
    path: '/classrooms/main-classroom/frames/hack-1',
    payload: { title: 'Injected' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Authenticated student (non-owner) cannot delete a frame',
    actor: 'student',
    operation: 'delete',
    path: '/classrooms/main-classroom/frames/img-frame-1',
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Unverified admin email spoofing cannot update a frame',
    actor: 'unverified_admin',
    operation: 'update',
    path: '/classrooms/main-classroom/frames/img-frame-1',
    payload: { title: 'Spoofed' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Shadow/ghost field rejected on frame create',
    actor: 'teacher_owner',
    operation: 'create',
    path: '/classrooms/main-classroom/frames/ghost-1',
    payload: {
      classroomId: 'main-classroom',
      ownerId: 'teacher-uid',
      isPublic: true,
      zone: 'gallery',
      type: 'image',
      title: 'Frame',
      position: [0, 2, 0],
      rotation: [0, 0, 0],
      size: [2.6, 1.8],
      slotIndex: 1,
      ghostField: true,
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Shadow/ghost field rejected on frame update',
    actor: 'teacher_owner',
    operation: 'update',
    path: '/classrooms/main-classroom/frames/img-frame-1',
    payload: { title: 'Updated', ghostKey: 'evil' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Identity spoofing rejected when creating classroom with another ownerId',
    actor: 'student',
    operation: 'create',
    path: '/classrooms/spoofed-room',
    payload: {
      version: '1.0.0',
      name: 'Fake Room',
      theme: 'pastel_blue',
      ownerId: 'victim-uid',
      isPublic: true,
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Immutable ownerId/classroomId/createdAt cannot be modified on update',
    actor: 'teacher_owner',
    operation: 'update',
    path: '/classrooms/main-classroom/frames/img-frame-1',
    payload: { ownerId: 'someone-else' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Client-forged backdated createdAt rejected on create',
    actor: 'teacher_owner',
    operation: 'create',
    path: '/classrooms/main-classroom/frames/time-1',
    payload: {
      classroomId: 'main-classroom',
      ownerId: 'teacher-uid',
      isPublic: true,
      zone: 'gallery',
      type: 'image',
      title: 'Backdated',
      position: [0, 2, 0],
      rotation: [0, 0, 0],
      size: [2.6, 1.8],
      slotIndex: 1,
      createdAt: '2020-01-01T00:00:00Z',
      updatedAt: '2020-01-01T00:00:00Z',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Invalid document ID rejected (ID poisoning)',
    actor: 'teacher_owner',
    operation: 'create',
    path: '/classrooms/main-classroom/frames/bad$id!@#',
    payload: { title: 'Bad ID' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Oversized title (> 160 chars) rejected on update (Value poisoning)',
    actor: 'teacher_owner',
    operation: 'update',
    path: '/classrooms/main-classroom/frames/img-frame-1',
    payload: { title: 'A'.repeat(200) },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Invalid position array length/type rejected',
    actor: 'teacher_owner',
    operation: 'create',
    path: '/classrooms/main-classroom/frames/arr-1',
    payload: {
      classroomId: 'main-classroom',
      ownerId: 'teacher-uid',
      isPublic: true,
      zone: 'gallery',
      type: 'image',
      title: 'Bad Array',
      position: [0, 1, 2, 3],
      rotation: [0, 0, 0],
      size: [2.6, 1.8],
      slotIndex: 1,
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Non-admin cannot self-escalate by writing to /admins/{uid}',
    actor: 'student',
    operation: 'create',
    path: '/admins/student-uid',
    payload: { role: 'admin' },
    expected: 'PERMISSION_DENIED',
  },
];
