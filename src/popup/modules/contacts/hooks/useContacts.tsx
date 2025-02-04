import { useMemo } from 'react'

import { useSlidingPanel } from '@app/popup/modules/shared'
import { RawContact } from '@app/models'

import { AddContact } from '../components/AddContact'
import { EditContact } from '../components/EditContact'

export function useContacts() {
    const panel = useSlidingPanel()

    return useMemo(() => ({
        add(contact?: RawContact): void {
            panel.open({
                render: () => <AddContact contact={contact} onResult={panel.close} />,
            })
        },
        edit(contact: RawContact): void {
            panel.open({
                render: () => <EditContact contact={contact} onResult={panel.close} />,
            })
        },
    }), [panel])
}
