# Security Specification — Lớp Học Ảo 3D (Firestore Rules TDD)

## 1. Data Invariants

1. **Public Read-Only Classroom Viewing**: Any student or visitor (any browser, any computer) can read (`get` / `list`) a classroom or its frames **only** if `resource.data.isPublic == true`, or if they are the verified classroom owner or verified admin.
2. **Teacher-Only Mutations**: Only a verified Google-authenticated user (`request.auth != null && request.auth.token.email_verified == true`) who is the classroom's `ownerId` or a verified admin (`daovanloi.tankhanhtrung3@gmail.com` or listed in `/admins/{uid}`) may create, update, or delete classrooms or frames.
3. **Master Gate Enforcement**: Every write (`create`, `update`, `delete`) to `/classrooms/{classroomId}/frames/{frameId}` MUST verify via `exists()`/`get()` that the parent `/classrooms/{classroomId}` exists and that the caller is its owner or a verified admin.
4. **Immutable Ownership & Timestamps**: `ownerId`, `classroomId`, and `createdAt` can never be mutated after creation. `createdAt == request.time` on create; `updatedAt == request.time` on create and update.
5. **Strict Schema & Bounds (Anti-Update-Gap & Anti-DoW)**: Every string field has explicit `.size()` bounds matching `firebase-blueprint.json`; every array (`position`, `rotation`, `size`) enforces exact length and numeric element validation; unknown ("ghost") keys are strictly rejected via `hasOnly()`.
6. **Zero Privilege Escalation**: Non-admin users cannot create, read, update, or delete `/admins/{adminId}`.

## 2. The "Dirty Dozen" Adversarial Payloads (Must All Return PERMISSION_DENIED)

1. **Unauthenticated Frame Create**: Anonymous/unauthenticated user attempts to `create` a frame in `/classrooms/main-classroom/frames/hack1`.
2. **Non-Owner Student Frame Delete**: Authenticated student (not owner, not admin) attempts to `delete` `/classrooms/main-classroom/frames/img-frame-1`.
3. **Unverified Email Spoofing**: Authenticated user with `email: 'daovanloi.tankhanhtrung3@gmail.com'` but `email_verified: false` attempts to `update` a frame.
4. **Shadow/Ghost Field Injection on Create**: Verified teacher attempts to `create` a frame containing an undeclared key `isAdmin: true`.
5. **Shadow/Ghost Field Injection on Update**: Verified teacher attempts to `update` a frame adding a ghost key `hiddenFlag: "x"`.
6. **Identity Spoofing on Create**: Authenticated teacher attempts to `create` a classroom setting `ownerId: "victim-uid"` instead of their own `request.auth.uid`.
7. **Immutable Field Tampering**: Verified teacher attempts to `update` a frame and change `createdAt` or `ownerId` or `classroomId`.
8. **Client Timestamp Forgery**: Verified teacher attempts to `create` a frame with a backdated `createdAt` instead of `serverTimestamp()` (`request.time`).
9. **ID Poisoning Attack**: Verified teacher attempts to `create` a frame with a 200-character or special-character document ID (`"../evil$id"`).
10. **Value Poisoning (Oversized String / Wrong Type)**: Verified teacher attempts to `update` `title` to a 500-character string (> 160 maxLength) or a boolean `true`.
11. **Array Bounds Poisoning**: Verified teacher attempts to `create` a frame with `position: [0, 1, 2, 3, 4]` (size != 3) or `position: ["a", "b", "c"]`.
12. **Self-Escalation to `/admins`**: Authenticated non-admin student attempts to `create` `/admins/{theirUid}` with `{ role: "admin", createdAt: request.time }`.
