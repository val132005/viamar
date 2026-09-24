import type { Usuario } from '../../domain/types'

export function UserAvatar({ user, size = 36 }: { user: Usuario; size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-viamar-600 text-label-md text-white"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {user.iniciales}
    </span>
  )
}
