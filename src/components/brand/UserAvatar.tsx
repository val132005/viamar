import type { Usuario } from '../../domain/types'

export function UserAvatar({ user, size = 36 }: { user: Usuario; size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full bg-viamar-700 text-white text-label-md shrink-0"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {user.iniciales}
    </span>
  )
}
