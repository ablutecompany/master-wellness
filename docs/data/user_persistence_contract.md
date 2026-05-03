# Wellness Profile Persistence Contract

## 1. Fonte de Verdade
- **DB/Backend**: Única fonte de verdade persistente para o perfil.
- **Zustand Store**: Cache e hidratação da sessão em curso.
- **Drafts Locais**: Apenas usados em formulários de edição antes de submissão (ex: ProfileModal).

## 2. Mapa de Dados Canónico

| Campo | Fonte canónica | Tabela/modelo | Endpoint de escrita | Endpoint de leitura | Store frontend | Persistência local? |
|-------|----------------|---------------|---------------------|---------------------|----------------|---------------------|
| `id` | Backend (UUID) | `User.id` | N/A | `/auth/me` | `user.id` | Zustand Persist |
| `email` | Backend (Auth) | `User.email` | `/auth/register` | `/auth/me` | `user.email` | Zustand Persist |
| `name` | Backend | `profiles.name` | `PATCH /user/profile` | `/auth/me` | `user.name` | Zustand Persist |
| `avatarUrl` | Backend / Storage | `profiles.avatar_url` | `PATCH /user/profile` | `/auth/me` | `user.avatarUrl` | Zustand Persist |
| `dateOfBirth` | Backend | `profiles.date_of_birth` | `PATCH /user/profile` | `/auth/me` | `user.dateOfBirth` | Zustand Persist |
| `sex` | Backend | `profiles.sex` | `PATCH /user/profile` | `/auth/me` | `user.sex` | Zustand Persist |
| `height` | Backend | `profiles.height` | `PATCH /user/profile` | `/auth/me` | `user.height` | Zustand Persist |
| `weight` | Backend (Derived) | `profiles.weight` / Measurements | `PATCH /user/profile` | `/auth/me` | `user.weight` (SourcedMetric) | Zustand Persist |
| `country` | Backend | `profiles.country` | `PATCH /user/profile` | `/auth/me` | `user.country` | Zustand Persist |
| `timezone` | Backend | `profiles.timezone` | `PATCH /user/profile` | `/auth/me` | `user.timezone` | Zustand Persist |
| `mainGoal` | Backend | `profiles.main_goal` | `PATCH /user/profile` | `/auth/me` | `user.mainGoal` | Zustand Persist |
| `activityLevel`| Backend | `profiles.activity_level`| `PATCH /user/profile` | `/auth/me` | `user.activityLevel`| Zustand Persist |
| `dietaryRestrictions` | Backend | `profiles.dietary_restrictions` | `PATCH /user/profile` | `/auth/me` | `user.dietaryRestrictions` | Zustand Persist |

## 3. Contrato Único do Perfil (Canonical Shape)

Aplica-se às respostas de `GET /auth/me`, `PATCH /user/profile`, e ao formato base guardado na store `UserProfile`.

```typescript
type CanonicalUserProfile = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  dateOfBirth: string | null; // Formato YYYY-MM-DD
  dateOfBirthPrecision: string | null;
  sex: 'female' | 'male' | 'other' | 'prefer_not_to_say' | null;
  height: number | null;
  weight: SourcedMetric<number>;
  country: string | null;
  timezone: string | null;
  mainGoal: string | null;
  goals: string[];
  activityLevel: string | null;
  dietaryRestrictions: string[];
  activeAnalysisId: string | null;
  household: any | null;
}
```

## 4. Regras de Hidratação e Fallback (Frontend)

1. A store NUNCA substitui um perfil completo por um subconjunto parcial. O `updateAuthenticatedProfile` faz um merge seguro local em paralelo com o backend.
2. A normalização de perfil (`normalizeProfile`) usa exclusivamente os campos em top-level `CanonicalUserProfile`. Ignora eventuais formatações legacy ou nested.
3. Se o `GET /auth/me` falhar (timeout/erro 500) a app NÃO apaga o perfil previamente hidratado via Zustand Persist. Um `setFallback` não destrutivo será usado apenas para preencher propriedades essenciais vazias de uma sessão guest ou corrompida.
4. Remoção de Avatar ou Data de Nascimento só é aceite via payload explícito (`{ avatarUrl: null }`).

## 5. Estratégia Transitória Avatar e Dívida Técnica (P0.3)

Atualmente, o Avatar (foto de perfil) é mantido utilizando Base64 Data URLs, com payload suportado até 50MB pelo NestJS. Isto garante persistência funcional da Prova de Conceito sem timeouts, mas acarreta peso extra para a base de dados relacional.

**Regras Atuais:**
1. A app comprime a imagem e faz redimensionamento antes de gravar (limite alvo < 500 KB, teto de segurança 1 MB).
2. Se a gravação falhar, o avatar anterior local nunca é apagado (fallback seguro).

**Dívida Técnica P0.3 (Obrigatório):**
Migrar o armazenamento de Avatares para Supabase Storage (ou AWS S3). O fluxo será:
- Criação de bucket `avatars` no Supabase com policies RLS apropriadas.
- O frontend faz compressão e envio directo (upload) do ficheiro binário para o bucket.
- A app obtém o `publicUrl` ou `signedUrl`.
- A app envia `PATCH /user/profile` apenas com essa URL (ex: `https://.../storage/v1/object/public/avatars/user-id.jpg`).
- Remoção segura do objecto anterior quando existe substituição de foto.
