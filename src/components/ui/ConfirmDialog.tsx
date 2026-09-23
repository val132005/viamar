import { useUiStore } from '../../stores/uiStore'
import { Button } from './Button'
import { Modal } from './Modal'

export function ConfirmDialog() {
  const confirm = useUiStore((s) => s.confirm)
  const close = useUiStore((s) => s.closeConfirm)
  return (
    <Modal
      open={Boolean(confirm)}
      title={confirm?.title ?? ''}
      onClose={() => close(false)}
      footer={
        <>
          <Button variant="outlined" onClick={() => close(false)}>
            Cancelar
          </Button>
          <Button variant={confirm?.danger ? 'danger' : 'primary'} onClick={() => close(true)}>
            {confirm?.confirmLabel ?? 'Confirmar'}
          </Button>
        </>
      }
    >
      <p className="text-body-md">{confirm?.message}</p>
    </Modal>
  )
}
